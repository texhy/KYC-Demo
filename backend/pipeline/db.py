"""Postgres persistence for evaluations.

Each verification run is saved as one `Evaluation` row so users can browse the
Applications list and reopen a past run (timeline + report) long after the SSE
stream has closed. The full streamed event log is stored in `events_json` so the
saved view can re-render exactly like the live one.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Optional

from sqlalchemy import JSON, DateTime, LargeBinary, String, Text, func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from pipeline.config import DATABASE_URL
from pipeline.logging_setup import get_logger

log = get_logger("db")

engine = create_async_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


class Evaluation(Base):
    __tablename__ = "evaluations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(16), default="running")  # running | done | error

    company_name: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    loan_amount: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    incorporation_state: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    pdf_filename: Mapped[Optional[str]] = mapped_column(String(512), nullable=True)
    error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Original uploaded files, kept so they can be viewed when revisiting a run.
    pdf_data: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    id_data: Mapped[Optional[bytes]] = mapped_column(LargeBinary, nullable=True)
    id_mime: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)

    report_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    application_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    id_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    research_json: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    events_json: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    def summary(self) -> dict[str, Any]:
        """Lightweight shape for the Applications list."""
        return {
            "id": self.id,
            "status": self.status,
            "company_name": self.company_name,
            "loan_amount": self.loan_amount,
            "incorporation_state": self.incorporation_state,
            "pdf_filename": self.pdf_filename,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "error": self.error,
            "has_pdf": self.pdf_data is not None,
            "has_id": self.id_data is not None,
            "id_mime": self.id_mime,
        }

    def record(self) -> dict[str, Any]:
        """Full shape for the saved-evaluation detail view."""
        return {
            **self.summary(),
            "report": self.report_json,
            "application": self.application_json,
            "id": self.id_json,
            "research": self.research_json,
            "events": self.events_json or [],
        }


async def init_db() -> None:
    """Create tables if they don't exist (no Alembic for the demo)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    log.info("Database initialized (%s)", DATABASE_URL.split("@")[-1])


async def create_evaluation(
    eval_id: str,
    pdf_filename: str,
    pdf_data: Optional[bytes] = None,
    id_data: Optional[bytes] = None,
    id_mime: Optional[str] = None,
) -> None:
    async with SessionLocal() as session:
        session.add(
            Evaluation(
                id=eval_id,
                status="running",
                pdf_filename=pdf_filename,
                pdf_data=pdf_data,
                id_data=id_data,
                id_mime=id_mime,
            )
        )
        await session.commit()


async def get_evaluation_file(eval_id: str, which: str) -> Optional[tuple[bytes, str, str]]:
    """Return (data, mime, filename) for the stored 'pdf' or 'id' file, if present."""
    async with SessionLocal() as session:
        row = await session.get(Evaluation, eval_id)
        if row is None:
            return None
        if which == "pdf" and row.pdf_data is not None:
            return row.pdf_data, "application/pdf", row.pdf_filename or "application.pdf"
        if which == "id" and row.id_data is not None:
            return row.id_data, row.id_mime or "image/jpeg", "supporting-document"
        return None


async def finalize_evaluation(
    eval_id: str,
    *,
    status: str,
    company_name: Optional[str] = None,
    loan_amount: Optional[str] = None,
    incorporation_state: Optional[str] = None,
    report_json: Optional[dict] = None,
    application_json: Optional[dict] = None,
    id_json: Optional[dict] = None,
    research_json: Optional[dict] = None,
    events_json: Optional[list] = None,
    error: Optional[str] = None,
) -> None:
    async with SessionLocal() as session:
        row = await session.get(Evaluation, eval_id)
        if row is None:
            row = Evaluation(id=eval_id)
            session.add(row)
        row.status = status
        row.completed_at = _utcnow()
        if company_name is not None:
            row.company_name = company_name
        if loan_amount is not None:
            row.loan_amount = loan_amount
        if incorporation_state is not None:
            row.incorporation_state = incorporation_state
        if report_json is not None:
            row.report_json = report_json
        if application_json is not None:
            row.application_json = application_json
        if id_json is not None:
            row.id_json = id_json
        if research_json is not None:
            row.research_json = research_json
        if events_json is not None:
            row.events_json = events_json
        if error is not None:
            row.error = error
        await session.commit()


async def list_evaluations(
    search: str = "", status: str = "", limit: int = 10, offset: int = 0
) -> tuple[list[dict], int]:
    async with SessionLocal() as session:
        stmt = select(Evaluation)
        count_stmt = select(func.count()).select_from(Evaluation)
        if search:
            like = f"%{search}%"
            stmt = stmt.where(Evaluation.company_name.ilike(like))
            count_stmt = count_stmt.where(Evaluation.company_name.ilike(like))
        if status:
            stmt = stmt.where(Evaluation.status == status)
            count_stmt = count_stmt.where(Evaluation.status == status)

        total = (await session.execute(count_stmt)).scalar_one()
        stmt = stmt.order_by(Evaluation.created_at.desc()).limit(limit).offset(offset)
        rows = (await session.execute(stmt)).scalars().all()
        return [r.summary() for r in rows], total


async def get_evaluation(eval_id: str) -> Optional[dict]:
    async with SessionLocal() as session:
        row = await session.get(Evaluation, eval_id)
        return row.record() if row else None
