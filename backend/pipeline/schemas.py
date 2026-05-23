"""Pydantic models shared across the verification pipeline.

These mirror the FSUI credit-application form and the supporting ID document, plus
the structured outputs emitted by the research/cross-check/synthesis agents.

All fields are Optional because a real form may leave boxes blank, and the
extraction model must be free to return null rather than hallucinate a value.
"""

from __future__ import annotations

from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field


# --------------------------------------------------------------------------- #
# Document extraction models
# --------------------------------------------------------------------------- #
class BusinessType(str, Enum):
    s_corp = "S-Corp"
    llc = "LLC"
    proprietorship = "Proprietorship"
    partnership = "Partnership"
    c_corp = "C-Corp"
    non_profit = "Non-profit"
    government = "Government"
    c3_501 = "501C3"
    muni = "Muni"
    federal = "Federal"
    unknown = "Unknown"


class Owner(BaseModel):
    name: Optional[str] = None
    home_address: Optional[str] = None
    city_state_zip: Optional[str] = None
    telephone: Optional[str] = None
    ssn: Optional[str] = None
    dob: Optional[str] = None
    drivers_license: Optional[str] = None
    percent_ownership: Optional[str] = None


class BankingReference(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    telephone_and_contact: Optional[str] = None
    account_number: Optional[str] = None


class TradeReference(BaseModel):
    company_name: Optional[str] = None
    telephone_and_contact: Optional[str] = None


class ApplicationData(BaseModel):
    """Fields extracted from the FSUI credit-application PDF."""

    company_name: Optional[str] = None
    dba: Optional[str] = None
    state_of_incorporation: Optional[str] = None
    fed_tax_id: Optional[str] = None
    dnb_number: Optional[str] = None
    business_address: Optional[str] = None
    city_state_zip: Optional[str] = None
    telephone_fax: Optional[str] = None
    cell_phone: Optional[str] = None
    website: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    business_type: BusinessType = BusinessType.unknown
    equipment_location: Optional[str] = None
    time_in_business: Optional[str] = None
    date_incorporated: Optional[str] = None
    state_filed: Optional[str] = None

    owners: List[Owner] = Field(default_factory=list)
    banking_references: List[BankingReference] = Field(default_factory=list)
    trade_references: List[TradeReference] = Field(default_factory=list)

    vendor_name: Optional[str] = None
    amount_to_be_financed: Optional[str] = None
    equipment_description: Optional[str] = None
    finance_terms: Optional[str] = None
    signature_title: Optional[str] = None
    signature_date: Optional[str] = None


class IdData(BaseModel):
    """Fields and authenticity signals extracted from the supporting ID image."""

    document_type: Optional[str] = None  # e.g. "Driver License", "Passport"
    issuing_authority: Optional[str] = None  # state / country
    full_name: Optional[str] = None
    address: Optional[str] = None
    dob: Optional[str] = None
    id_number: Optional[str] = None
    issue_date: Optional[str] = None
    expiry_date: Optional[str] = None
    sex: Optional[str] = None

    # Authenticity assessment from the VLM (NOT a definitive forensic verdict).
    tampering_signals: List[str] = Field(
        default_factory=list,
        description="Observable anomalies suggesting manipulation (font mismatch, "
        "misaligned text, missing security features, edited photo, etc.).",
    )
    authenticity_notes: Optional[str] = Field(
        default=None,
        description="VLM's qualitative read on whether the ID looks genuine, with reasoning.",
    )


# --------------------------------------------------------------------------- #
# Agent output models
# --------------------------------------------------------------------------- #
class Citation(BaseModel):
    claim: str = Field(description="The specific factual claim this source supports.")
    url: Optional[str] = Field(default=None, description="Source URL backing the claim.")
    snippet: Optional[str] = Field(default=None, description="Relevant quote/summary from the source.")


class ResearchFindings(BaseModel):
    """Output of Agent A (deep internet research on the company + owner)."""

    company_exists: Optional[bool] = Field(
        default=None,
        description="True/False if evidence is conclusive; null if inconclusive. "
        "Distinguish 'no evidence found' from 'evidence of fabrication'.",
    )
    existence_assessment: str = Field(
        description="Narrative explaining the existence conclusion and confidence."
    )
    business_niche: Optional[str] = None
    date_established: Optional[str] = None
    owners_found: List[str] = Field(default_factory=list)
    website: Optional[str] = None
    maps_url: Optional[str] = Field(
        default=None,
        description="Google Maps link for the business name + given location.",
    )
    registry_record: Optional[str] = Field(
        default=None,
        description="What the state Secretary of State / registry shows, if reachable.",
    )
    online_presence: Optional[str] = Field(
        default=None, description="Summary of website, LinkedIn, maps, reviews, news."
    )
    discrepancies: List[str] = Field(default_factory=list)
    search_trail: List[str] = Field(
        default_factory=list,
        description="Queries tried and how the search was reformulated (ReAct trail).",
    )
    citations: List[Citation] = Field(default_factory=list)


class CrossCheckResult(BaseModel):
    """Output of Agent B (PDF <-> ID consistency checks)."""

    check: str = Field(description="What was compared, e.g. 'Owner name: PDF vs ID'.")
    consistent: Optional[bool] = None
    detail: str = Field(description="Explanation of the match/mismatch.")
    severity: str = Field(description="info | low | medium | high")


class CrossCheckFindings(BaseModel):
    checks: List[CrossCheckResult] = Field(default_factory=list)
    id_authenticity_summary: Optional[str] = None


class Finding(BaseModel):
    title: str
    detail: str
    category: str = Field(description="existence | identity | consistency | id_authenticity | other")
    confidence: str = Field(description="low | medium | high")
    citations: List[Citation] = Field(default_factory=list)


class RedFlag(BaseModel):
    title: str
    detail: str
    severity: str = Field(description="low | medium | high")


class VerificationReport(BaseModel):
    """Output of Agent C — detailed evidence report. No overall approve/reject verdict."""

    summary: str = Field(description="Neutral executive summary of what was verified and what is uncertain.")
    findings: List[Finding] = Field(default_factory=list)
    consistency_checks: List[CrossCheckResult] = Field(default_factory=list)
    red_flags: List[RedFlag] = Field(default_factory=list)
    open_questions: List[str] = Field(
        default_factory=list,
        description="Items a human underwriter should manually verify.",
    )


# --------------------------------------------------------------------------- #
# Streaming event model (sent to the frontend over SSE)
# --------------------------------------------------------------------------- #
class AgentEvent(BaseModel):
    type: str = Field(
        description="stage | agent_start | reasoning | tool_call | tool_result | "
        "finding | error | extraction | report | done"
    )
    agent: Optional[str] = Field(default=None, description="A | B | C | extractor | system")
    message: Optional[str] = None
    data: Optional[dict] = None
