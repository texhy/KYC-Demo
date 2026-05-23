"""Prompt templates for the KYC verification pipeline."""

from prompts.templates import (
    PDF_EXTRACTION_PROMPT,
    ID_EXTRACTION_PROMPT,
    AGENT_A_INSTRUCTIONS,
    AGENT_B_INSTRUCTIONS,
    AGENT_C_INSTRUCTIONS,
    build_agent_a_input,
    build_agent_b_input,
    build_agent_c_input,
)

__all__ = [
    "PDF_EXTRACTION_PROMPT",
    "ID_EXTRACTION_PROMPT",
    "AGENT_A_INSTRUCTIONS",
    "AGENT_B_INSTRUCTIONS",
    "AGENT_C_INSTRUCTIONS",
    "build_agent_a_input",
    "build_agent_b_input",
    "build_agent_c_input",
]
