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

### Current Status
- ✅ Database schema deployed to Supabase (all 6 tables exist)
- ✅ Backend code complete with admin API endpoints
- ✅ Frontend informational pages complete (landing, dataset, model, about)
- ✅ Navigation component added to all pages
- ✅ Admin panel with buttons to download data and train model
- ✅ Netlify deployment successful and live
- ✅ No mock data in codebase (all real data from Kaggle/model)
- ⏳ Railway backend deployment pending

### Immediate Actions
- [ ] Verify Netlify deployment successful (wait for rebuild)
- [ ] Deploy backend to Railway with environment variables
- [ ] Test API endpoints at Railway URL
- [ ] Download dataset: `python3 backend/scripts/download_dataset.py`
- [ ] Train model: `python3 backend/scripts/train_model.py`

### Frontend Development (Next Phase)
- [ ] Registration page (`/experiment/start`)
- [ ] Pre-experiment questionnaire (`/experiment/pre`)
- [ ] Persona input pages (3 personas)
- [ ] Layer explanation pages (4 layers × 3 personas)
- [ ] Post-experiment questionnaire (`/experiment/post`)
- [ ] Thank you page (`/experiment/complete`)
- [ ] Session state management with localStorage
- [ ] Progress indicator UI

### Testing & Launch
- [ ] End-to-end test: complete experimental flow
- [ ] Verify all 18 data points collected per participant
- [ ] Test with 3-5 pilot participants
- [ ] Final integration test with production URLs
