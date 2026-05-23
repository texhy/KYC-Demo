"""In-memory job store for the demo (no persistence)."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from typing import Optional

from pipeline.schemas import VerificationReport
from pipeline.streaming import EventBus


@dataclass
class Job:
    id: str
    pdf_bytes: bytes
    id_bytes: bytes
    id_mime: str
    pdf_filename: str
    bus: EventBus = field(default_factory=EventBus)
    status: str = "pending"  # pending | running | done | error
    report: Optional[VerificationReport] = None
    error: Optional[str] = None


_jobs: dict[str, Job] = {}


def create_job(pdf_bytes: bytes, id_bytes: bytes, id_mime: str, pdf_filename: str) -> Job:
    job_id = uuid.uuid4().hex
    job = Job(
        id=job_id,
        pdf_bytes=pdf_bytes,
        id_bytes=id_bytes,
        id_mime=id_mime,
        pdf_filename=pdf_filename,
    )
    _jobs[job_id] = job
    return job


def get_job(job_id: str) -> Optional[Job]:
    return _jobs.get(job_id)
