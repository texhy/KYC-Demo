"""Central config: env loading + model names."""

import os

from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")

EXTRACTION_MODEL = os.getenv("EXTRACTION_MODEL", "gpt-4o")
DEEP_RESEARCH_MODEL = os.getenv("DEEP_RESEARCH_MODEL", "o3-deep-research")
CROSSCHECK_MODEL = os.getenv("CROSSCHECK_MODEL", "o4-mini")
SYNTHESIS_MODEL = os.getenv("SYNTHESIS_MODEL", "o3")

# Valyu DeepResearch (Agent A). If VALYU_API_KEY is empty, Agent A falls back to the
# OpenAI web-search agent.
VALYU_API_KEY = os.getenv("VALYU_API_KEY", "")
VALYU_DR_MODE = os.getenv("VALYU_DR_MODE", "fast")  # fast | standard | heavy | max

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:3000")

# Postgres persistence for past evaluations. Uses the asyncpg driver.
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://dcf:dcf@localhost:5432/dcf"
)
