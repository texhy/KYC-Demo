"""Document extraction: credit-application PDF and supporting ID image.

Both use the OpenAI Responses API with Structured Outputs (`responses.parse`) so the
model returns a typed pydantic object instead of free-form text.
"""

from __future__ import annotations

import base64

from openai import AsyncOpenAI

from pipeline.config import EXTRACTION_MODEL, OPENAI_API_KEY
from pipeline.logging_setup import get_logger
from pipeline.schemas import ApplicationData, IdData
from prompts import ID_EXTRACTION_PROMPT, PDF_EXTRACTION_PROMPT

_client = AsyncOpenAI(api_key=OPENAI_API_KEY)
log = get_logger("extract")


async def extract_application(pdf_bytes: bytes, filename: str = "application.pdf") -> ApplicationData:
    """Extract structured fields from the credit-application PDF."""
    log.info("PDF extraction starting (%s, %d bytes) with model=%s", filename, len(pdf_bytes), EXTRACTION_MODEL)
    b64 = base64.b64encode(pdf_bytes).decode("utf-8")
    response = await _client.responses.parse(
        model=EXTRACTION_MODEL,
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": PDF_EXTRACTION_PROMPT},
                    {
                        "type": "input_file",
                        "filename": filename,
                        "file_data": f"data:application/pdf;base64,{b64}",
                    },
                ],
            }
        ],
        text_format=ApplicationData,
    )
    log.info("PDF extraction done: company=%r owners=%d",
             response.output_parsed.company_name, len(response.output_parsed.owners))
    return response.output_parsed


async def extract_id(image_bytes: bytes, mime_type: str = "image/jpeg") -> IdData:
    """Extract fields + authenticity signals from the supporting ID image."""
    log.info("ID extraction starting (%s, %d bytes) with model=%s", mime_type, len(image_bytes), EXTRACTION_MODEL)
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    response = await _client.responses.parse(
        model=EXTRACTION_MODEL,
        input=[
            {
                "role": "user",
                "content": [
                    {"type": "input_text", "text": ID_EXTRACTION_PROMPT},
                    {
                        "type": "input_image",
                        "image_url": f"data:{mime_type};base64,{b64}",
                    },
                ],
            }
        ],
        text_format=IdData,
    )
    log.info("ID extraction done: name=%r signals=%d",
             response.output_parsed.full_name, len(response.output_parsed.tampering_signals))
    return response.output_parsed
