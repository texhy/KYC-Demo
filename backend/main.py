"""FastAPI app: accept the two documents, run the pipeline, stream progress over SSE,
and persist each run to Postgres so it can be revisited later."""

from __future__ import annotations

import asyncio
import json
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, Query, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from pipeline.agents import run_pipeline
from pipeline.config import FRONTEND_ORIGIN
from pipeline.db import (
    create_evaluation,
    finalize_evaluation,
    get_evaluation,
    get_evaluation_file,
    init_db,
    list_evaluations,
)
from pipeline.jobs import create_job, get_job
from pipeline.logging_setup import get_logger

log = get_logger("api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="KYC Business-Loan Verification Demo", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health() -> dict:
    return {"status": "ok"}


@app.post("/api/verify")
async def verify(
    pdf: UploadFile = File(...),
    supporting_doc: UploadFile = File(...),
) -> dict:
    if pdf.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="First file must be a PDF.")
    if not (supporting_doc.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Supporting document must be an image.")

    pdf_bytes = await pdf.read()
    id_bytes = await supporting_doc.read()
    job = create_job(
        pdf_bytes=pdf_bytes,
        id_bytes=id_bytes,
        id_mime=supporting_doc.content_type or "image/jpeg",
        pdf_filename=pdf.filename or "application.pdf",
    )
    await create_evaluation(
        job.id,
        pdf.filename or "application.pdf",
        pdf_data=pdf_bytes,
        id_data=id_bytes,
        id_mime=supporting_doc.content_type or "image/jpeg",
    )
    log.info("POST /api/verify -> job %s (pdf=%s, doc=%s)", job.id, pdf.filename, supporting_doc.filename)
    return {"job_id": job.id}


def _find_event_data(history: list, event_type: str) -> dict | None:
    """Return the `data` payload of the last event of a given type, if any."""
    for event in reversed(history):
        if event.type == event_type and event.data:
            return event.data
    return None


async def _persist_result(job_id: str, history: list) -> None:
    """Pull summary fields + structured payloads out of the event log and save them."""
    extraction = _find_event_data(history, "extraction") or {}
    application = extraction.get("application") or {}
    id_data = extraction.get("id")
    report = _find_event_data(history, "report")
    research = _find_event_data(history, "research")
    events = [e.model_dump() for e in history]

    await finalize_evaluation(
        job_id,
        status="done",
        company_name=application.get("company_name"),
        loan_amount=application.get("amount_to_be_financed"),
        incorporation_state=application.get("state_of_incorporation"),
        report_json=report,
        application_json=application or None,
        id_json=id_data,
        research_json=research,
        events_json=events,
    )


async def _drive_pipeline(job_id: str) -> None:
    job = get_job(job_id)
    if job is None:
        return
    job.status = "running"
    log.info("Pipeline task starting for job %s", job_id)
    try:
        job.report = await run_pipeline(
            job.pdf_bytes, job.id_bytes, job.id_mime, job.pdf_filename, job.bus
        )
        job.status = "done"
        await _persist_result(job_id, job.bus.history)
    except Exception as exc:  # surface the failure to the client, then close
        job.status = "error"
        job.error = str(exc)
        log.exception("Pipeline failed for job %s: %s", job_id, exc)
        await job.bus.emit("error", agent="system", message=str(exc))
        await finalize_evaluation(
            job_id,
            status="error",
            error=str(exc),
            events_json=[e.model_dump() for e in job.bus.history],
        )
    finally:
        await job.bus.emit("done", agent="system", message="Pipeline finished")
        await job.bus.close()


@app.get("/api/verify/{job_id}/stream")
async def stream(job_id: str) -> EventSourceResponse:
    job = get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")

    log.info("SSE client connected to job %s (status=%s)", job_id, job.status)
    # Kick off the pipeline once, when the client connects to the stream.
    if job.status == "pending":
        asyncio.create_task(_drive_pipeline(job_id))

    async def event_generator():
        async for event in job.bus.stream():
            yield {"event": "message", "data": json.dumps(event.model_dump())}

    return EventSourceResponse(event_generator())


@app.get("/api/evaluations")
async def evaluations(
    search: str = Query(""),
    status: str = Query(""),
    limit: int = Query(10, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> dict:
    items, total = await list_evaluations(search=search, status=status, limit=limit, offset=offset)
    return {"items": items, "total": total, "limit": limit, "offset": offset}


@app.get("/api/evaluations/{eval_id}")
async def evaluation_detail(eval_id: str) -> dict:
    record = await get_evaluation(eval_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Evaluation not found.")
    return record


@app.get("/api/evaluations/{eval_id}/file/{which}")
async def evaluation_file(eval_id: str, which: str) -> Response:
    if which not in ("pdf", "id"):
        raise HTTPException(status_code=404, detail="Unknown file.")
    result = await get_evaluation_file(eval_id, which)
    if result is None:
        raise HTTPException(status_code=404, detail="File not found.")
    data, mime, filename = result
    return Response(
        content=data,
        media_type=mime,
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
