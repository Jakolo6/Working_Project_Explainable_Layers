# PROJECT_OVERVIEW.md

**Explainable AI in Financial Services** - Research platform for studying XAI explanation layers in credit risk assessment.

---

## 1. Architecture Summary

**Frontend:** Next.js 14 + TypeScript + TailwindCSS (deployed on Netlify)

**Backend:** FastAPI + Python 3.11 (deployed on Railway)

**Database:** Supabase (PostgreSQL)

**Storage:** Cloudflare R2 (model + dataset)

**ML Model:** XGBoost classifier with SHAP explanations

**Dataset:** UCI German Credit dataset (via Kaggle)

---

## 2. Implemented Features

### Backend
- [x] FastAPI application structure with modular design
- [x] Configuration management with Pydantic settings
- [x] XGBoost model training service (excluding sensitive features)
- [x] SHAP explanation service with 5 layer types
- [x] Cloudflare R2 integration for model/dataset storage
- [x] Supabase integration for storing sessions and responses
- [x] Kaggle dataset download script
- [x] Model training script
- [x] API endpoints:
  - `POST /api/v1/experiment/predict` - Prediction with explanation
  - `POST /api/v1/experiment/response` - Participant feedback storage
- [x] CORS configuration for frontend communication
- [x] Environment variable templates

### Frontend
- [x] Next.js 14 app structure with App Router
- [x] TypeScript configuration
- [x] TailwindCSS styling setup
- [x] Home page with experiment link
- [x] `/experiment` page with:
  - Credit application input form
  - Real-time API integration
  - AI decision display
  - SHAP explanation visualization
  - Four rating sliders (trust, understanding, usefulness, mental effort)
  - Feedback submission
- [x] Environment variable template
- [x] Responsive design

### Documentation
- [x] Backend README with setup instructions
- [x] Frontend README with deployment guide
- [x] Supabase table schemas
- [x] Environment variable templates
- [x] PROJECT_OVERVIEW.md (this file)

---

## 3. Next Steps / Tasks

### Phase 1 Completion
- [ ] Test backend locally with model training
- [ ] Test frontend locally with backend integration
- [ ] Verify Supabase data storage
- [ ] Deploy backend to Railway
- [ ] Deploy frontend to Netlify
- [ ] End-to-end testing of experiment flow

### Future Phases (Not Yet Started)
- [ ] Implement layer-specific explanation formatting:
  - Visual bar charts for `visual_bar` layer
  - Natural language generation for `textual_narrative` layer
  - Counterfactual scenarios for `counterfactual` layer
- [ ] Add landing page
- [ ] Add dataset overview page
- [ ] Add model explanation page
- [ ] Add admin dashboard for viewing responses
- [ ] Add data export functionality
- [ ] Implement participant authentication/tracking
- [ ] A/B testing infrastructure
- [ ] Enhanced visualizations for SHAP values

---

## Current Project State

**Status:** Phase 1 technical foundation complete - ready for local testing

**What works:**
- Complete backend API with ML model and SHAP integration
- Complete frontend experiment interface
- Data storage in Supabase
- Model/dataset storage in R2

**What needs testing:**
1. Dataset download from Kaggle
2. Model training pipeline
3. API prediction endpoint
4. Frontend-backend communication
5. Supabase data persistence

**Next immediate action:** Run `pip install -r requirements.txt` in backend, then `npm install` in frontend, configure `.env` files, and test the full pipeline locally.
