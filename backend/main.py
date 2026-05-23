"""FastAPI app: accept the two documents, run the pipeline, stream progress over SSE."""

from __future__ import annotations

import asyncio
import json

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse

from pipeline.agents import run_pipeline
from pipeline.config import FRONTEND_ORIGIN
from pipeline.jobs import create_job, get_job
from pipeline.logging_setup import get_logger

log = get_logger("api")

app = FastAPI(title="KYC Business-Loan Verification Demo")

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
    log.info("POST /api/verify -> job %s (pdf=%s, doc=%s)", job.id, pdf.filename, supporting_doc.filename)
    return {"job_id": job.id}


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
    except Exception as exc:  # surface the failure to the client, then close
        job.status = "error"
        job.error = str(exc)
        log.exception("Pipeline failed for job %s: %s", job_id, exc)
        await job.bus.emit("error", agent="system", message=str(exc))
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
