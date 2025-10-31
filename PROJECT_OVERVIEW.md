# PROJECT_OVERVIEW.md

## 1. Architecture Summary
**Frontend:** Next.js 14 + TypeScript + TailwindCSS  
**Backend:** FastAPI + Python 3.13  
**Database:** Supabase (PostgreSQL)  
**Storage:** Cloudflare R2  
**Deployment:** Railway (backend) + Netlify (frontend)

**Experimental Design:**
- 3 Personas (Elderly Woman, Young Entrepreneur, Middle-Aged Employee)
- 4 Explanation Layers per persona (Basic SHAP, Textual, Contextualized, Hybrid)
- Pre/Post experiment questionnaires
- Layer-specific feedback collection

## 2. Implemented Features

### Backend (Complete)
- [x] XGBoost credit risk model with SHAP explanations
- [x] FastAPI REST API with CORS configuration
- [x] Supabase database integration
- [x] Cloudflare R2 storage integration
- [x] Session management API (`POST /api/v1/experiment/create_session`)
- [x] Pre-experiment questionnaire API (`POST /api/v1/experiment/pre_response`)
- [x] Post-experiment questionnaire API (`POST /api/v1/experiment/post_response`)
- [x] Layer feedback API (`POST /api/v1/experiment/layer_feedback`)
- [x] Prediction API with persona support (`POST /api/v1/experiment/predict`)
- [x] Session retrieval API (`GET /api/v1/experiment/session/{session_id}`)
- [x] Railway deployment configuration
- [x] Environment variable management

### Database (Complete)
- [x] `sessions` table - participant demographics and session tracking
- [x] `pre_experiment_responses` table - expectation capture
- [x] `post_experiment_responses` table - overall evaluation
- [x] `predictions` table - model outputs with SHAP values
- [x] `layer_feedback` table - per-layer reflections
- [x] Database indexes for performance
- [x] SQL schema file (`backend/supabase_schema.sql`)
- [x] Experiment flow documentation (`backend/EXPERIMENT_FLOW.md`)

### Frontend (In Progress)
- [x] Next.js 14 app router structure
- [x] TailwindCSS styling
- [x] Netlify deployment configuration
- [x] Landing page - Project introduction and overview
- [x] Dataset page - Data transparency and ethics
- [x] Model page - AI system explanation with SHAP
- [x] About page - Research ethics and contact information
- [ ] Results page - Researcher dashboard
- [ ] Registration page (`/experiment/start`)
- [ ] Pre-experiment questionnaire page (`/experiment/pre`)
- [ ] Persona cycle implementation (3 personas × 4 layers)
- [ ] Post-experiment questionnaire page (`/experiment/post`)
- [ ] Thank you page (`/experiment/complete`)
- [ ] Session state management (localStorage)
- [ ] Progress tracking UI

## 3. Next Steps / Tasks

### Immediate (Backend Deployment)
- [ ] Run SQL schema in Supabase dashboard
- [ ] Configure all environment variables in Railway:
  - [ ] SUPABASE_URL and SUPABASE_KEY
  - [ ] R2 credentials (ACCOUNT_ID, ACCESS_KEY_ID, SECRET_ACCESS_KEY)
  - [ ] KAGGLE credentials
  - [ ] FRONTEND_URL (Netlify URL)
- [ ] Test backend API endpoints
- [ ] Verify database connections

### Frontend Development
- [ ] Create `/experiment/start` - Registration page
  - [ ] Demographic form (name, age, profession, finance experience, AI familiarity)
  - [ ] Call `POST /api/v1/experiment/create_session`
  - [ ] Store session_id in localStorage
- [ ] Create `/experiment/pre` - Pre-experiment questionnaire
  - [ ] 3 open-text questions about AI expectations
  - [ ] Call `POST /api/v1/experiment/pre_response`
- [ ] Create `/experiment/persona/[id]` - Persona input pages
  - [ ] Display persona description
  - [ ] Credit application form
  - [ ] Call `POST /api/v1/experiment/predict`
- [ ] Create `/experiment/persona/[id]/layer/[layerId]` - Layer explanation pages
  - [ ] Display explanation for current layer
  - [ ] 5 reflection questions per layer
  - [ ] Call `POST /api/v1/experiment/layer_feedback`
  - [ ] Navigate through layers 1-4
- [ ] Create `/experiment/post` - Post-experiment questionnaire
  - [ ] 5 open-text questions about overall experience
  - [ ] Call `POST /api/v1/experiment/post_response`
- [ ] Create `/experiment/complete` - Thank you page
- [ ] Implement session state management (localStorage)
- [ ] Add progress indicator UI
- [ ] Add validation for all forms

### Testing & Deployment
- [ ] End-to-end test: complete experimental flow
- [ ] Test all 3 personas × 4 layers = 12 feedback submissions
- [ ] Verify all data stored correctly in Supabase
- [ ] Deploy frontend to Netlify
- [ ] Update CORS settings in backend for production
- [ ] Final integration test with production URLs
