"""Async event bus that bridges pipeline progress to an SSE stream.

Each job owns one EventBus. The pipeline pushes AgentEvents; the SSE endpoint
consumes them. A sentinel (None) signals the stream is finished.
"""

from __future__ import annotations

import asyncio
from typing import AsyncIterator, Optional

from pipeline.logging_setup import get_logger
from pipeline.schemas import AgentEvent

log = get_logger("events")


class EventBus:
    def __init__(self) -> None:
        self._queue: asyncio.Queue[Optional[AgentEvent]] = asyncio.Queue()
        self._closed = False
        # Full ordered log of every event emitted, kept so a finished run can be
        # persisted and later replayed in the saved-evaluation view.
        self.history: list[AgentEvent] = []

    async def emit(
        self,
        type: str,
        agent: Optional[str] = None,
        message: Optional[str] = None,
        data: Optional[dict] = None,
    ) -> None:
        if self._closed:
            return
        log.info("EMIT [%-5s] (%s) %s", type, agent or "-", message or "")
        event = AgentEvent(type=type, agent=agent, message=message, data=data)
        self.history.append(event)
        await self._queue.put(event)

    async def close(self) -> None:
        if not self._closed:
            self._closed = True
            await self._queue.put(None)

    async def stream(self) -> AsyncIterator[AgentEvent]:
        while True:
            event = await self._queue.get()
            if event is None:
                break
            yield event
