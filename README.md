# KYC Demo

A KYC (Know Your Customer) pipeline with a FastAPI backend and a Next.js frontend.
Upload a credit application, and the backend runs an AI agent pipeline (extraction →
deep research → cross-check → synthesis) to produce a KYC assessment.

## Prerequisites

- Python 3.10+
- Node.js 18+
- An OpenAI API key (and optionally a Valyu API key)

## Setup

Clone the repo:

```bash
git clone https://github.com/texhy/KYC-Demo.git
cd KYC-Demo
```

### Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env               # then edit .env and add your OPENAI_API_KEY
uvicorn main:app --reload --port 8000
```

The backend runs at http://localhost:8000.

### Frontend

In a second terminal:

```bash
cd frontend
npm install

cp .env.local.example .env.local   # default points at http://localhost:8000
npm run dev
```

The frontend runs at http://localhost:3000.

## Configuration

All configuration lives in environment files (never committed):

- `backend/.env` — `OPENAI_API_KEY` (required), optional model overrides and
  `VALYU_API_KEY`. See `backend/.env.example` for the full list.
- `frontend/.env.local` — `NEXT_PUBLIC_API_URL`, the backend URL.

## Usage

1. Start both backend and frontend.
2. Open http://localhost:3000.
3. Upload a credit application PDF and run the pipeline.
