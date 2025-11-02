# Working Project Explainable Layers

Minimal full-stack research platform studying how different explanation styles influence human perception of AI-powered credit decisions.

## Project Overview

- **Goal:** Evaluate trust, fairness, and usefulness of layered explanations around a credit-risk model trained on the German Credit dataset.
- **Architecture:**
  - Frontend &mdash; Next.js 14 (TypeScript, TailwindCSS)
  - Backend &mdash; FastAPI (Python 3.11) with Supabase/PostgreSQL
  - Storage &mdash; Cloudflare R2 for datasets, models, and EDA outputs
  - Deployment &mdash; Netlify (frontend) and Railway (backend)
- **Key Features:**
  - Participant experiment flow (registration, pre/post questionnaires, persona-based explanation cycles)
  - Real EDA visualizations and model performance metrics pulled from Cloudflare R2
  - Supabase persistence for sessions, questionnaire responses, predictions, and feedback

## Repository Structure

```
backend/   FastAPI application, Supabase service layer, scripts (EDA, training)
frontend/  Next.js application delivering research experience and dashboards
PROJECT_OVERVIEW.md  Single source of truth for architecture, progress, and next steps
```

Refer to the per-service guides for local setup and deployment workflows:

- [`frontend/README.md`](frontend/README.md)
- [`backend/README.md`](backend/README.md)

## Quick Start

1. **Install prerequisites**
   - Node.js 18+ and npm (frontend)
   - Python 3.11 with Poetry or pip (backend)

2. **Configure environment variables**
   - Frontend: copy `frontend/.env.template` → `frontend/.env.local`
   - Backend: copy `backend/.env.template` → `backend/.env`

3. **Run services locally**
   ```bash
   # Frontend
   cd frontend
   npm install
   npm run dev

   # Backend (in a separate shell)
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

4. **Access the app**
   - Backend API: http://localhost:8000
   - Frontend UI: http://localhost:3000

## Documentation & Status Tracking

All project planning, architecture notes, and task progress live in [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md). Update this file whenever features change to keep the research narrative accurate.
