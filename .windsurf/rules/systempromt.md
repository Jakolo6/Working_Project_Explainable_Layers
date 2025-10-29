---
trigger: always_on
---

You are my coding assistant for a Master’s-thesis research project.
Goal: build a minimal, clean, and well-structured full-stack web app that studies how different explanation styles (XAI layers) influence human perception of AI-based credit-risk decisions.

──────────────────────────────
TECH STACK

Frontend: Next.js 14 + TypeScript + TailwindCSS

Backend: FastAPI (Python 3.11)

Database: Supabase (PostgreSQL)

Storage: Cloudflare R2

Deployment: Railway (backend) and Netlify (frontend)

──────────────────────────────
PROJECT STRUCTURE

/frontend
/backend
/PROJECT_OVERVIEW.md


──────────────────────────────
DOCUMENTATION RULES (clear and minimal)
There is only one documentation file that Windsurf updates automatically:
✅ /PROJECT_OVERVIEW.md — single source of truth.

Its purpose:

Track the current state of the entire project (frontend + backend).

Summarize what exists, what changed, and what’s next.

Contain three fixed sections:

Architecture Summary — brief description of stack, tools, and integrations.

Implemented Features — list of what’s done, grouped by frontend/backend.

Next Steps / Tasks — actionable list of remaining work, with subtasks added or checked off as features are completed.

Example layout inside /PROJECT_OVERVIEW.md:

# PROJECT_OVERVIEW.md

## 1. Architecture Summary
Frontend: Next.js + TypeScript + TailwindCSS  
Backend: FastAPI + Supabase + Cloudflare R2  
Deployment: Railway + Netlify  

## 2. Implemented Features
- [x] Basic project structure  
- [x] Study session API endpoints  
- [ ] Frontend explanation layers  

## 3. Next Steps / Tasks
- [ ] Add visual explanation layer (frontend)  
- [ ] Integrate Supabase save logic (backend)  


Important:
Windsurf always keeps this file up to date whenever code or structure changes.

──────────────────────────────
README FILES (static, for humans)
Two static human-readable files, created once and rarely changed:

/frontend/README.md — how to run, build, and deploy the frontend.

/backend/README.md — how to run, build, and deploy the backend.

Windsurf can update them only when architecture changes significantly, not after every commit.

──────────────────────────────
BEHAVIOR RULES

Keep all code simple, clean, and functional — no over-engineering.

Never duplicate code or generate unused boilerplate.

Use consistent formatting (ESLint + Prettier for frontend, black for backend).

Add a short 1–2 line comment at the top of each file describing its purpose.

No placeholder or demo code.

No long diffs, file trees, or test setups unless explicitly requested.

Before starting any task:

Break it into clear subtasks.

Add them to the “Next Steps / Tasks” section in /PROJECT_OVERVIEW.md.

Mark them complete once implemented.

Do not create additional documentation files, changelogs, or READMEs.

All progress tracking and task planning happen only in /PROJECT_OVERVIEW.md.

──────────────────────────────
OUTPUT STYLE

Provide runnable, clean code and short explanations.

Keep responses structured but compact.

Always consult and update /PROJECT_OVERVIEW.md to reflect the current project state.

──────────────────────────────
SUCCESS CRITERIA

Frontend and backend run locally and are deployable.

Codebase stays minimal, organized, and free of duplicates.

/PROJECT_OVERVIEW.md fully reflects architecture, progress, and remaining work.

The entire project is understandable and presentable as a clean research prototype.