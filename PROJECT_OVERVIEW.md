# PROJECT_OVERVIEW.md

> 🎉 **PROJECT STATUS: PRODUCTION READY - CLEANED & OPTIMIZED**  
> ✅ 4 Explanation Layers | ✅ Clean Codebase | ✅ Single Schema File  
> 📅 Last Updated: November 30, 2025

---

## 1. Architecture Summary

**Frontend:** Next.js 14 + TypeScript + TailwindCSS  
**Backend:** FastAPI + Python 3.11  
**Database:** Supabase (PostgreSQL)  
**Storage:** Cloudflare R2  
**Deployment:** Railway (backend) + Netlify (frontend)

**Production URLs:**
- Frontend: https://novaxai.netlify.app
- Backend: https://workingprojectexplainablelayers-production.up.railway.app

---

## 2. Current Explanation Layers (4 Total)

| Layer | Name | Component | Description |
|-------|------|-----------|-------------|
| 1 | Baseline SHAP Explanation | `Layer1Baseline.tsx` | Simple SHAP values table with global model context |
| 2 | Interactive Dashboard | `Layer2Dashboard.tsx` | Visual dashboard with charts, AI summary, grouped features |
| 3 | Narrative Explanation | `Layer2ShortText.tsx` | LLM-generated natural language explanation with chatbot |
| 4 | Counterfactual Analysis | `CounterfactualExplorer.tsx` | What-if scenarios showing how to change the decision |

**Supporting Components:**
- `GlobalModelExplanation.tsx` - Collapsible global model context (used by all layers)
- `LocalDecisionSummary.tsx` - Per-applicant decision summary

---

## 3. Project Structure

```
/frontend
├── app/
│   ├── experiment/          # Experiment flow pages
│   │   ├── start/           # Registration
│   │   ├── pre/             # Pre-questionnaire
│   │   ├── personas/        # Persona selection & layers
│   │   └── complete/        # Post-questionnaire
│   ├── admin/               # Admin panel
│   ├── dataset/             # EDA display
│   ├── model/               # Model metrics
│   └── results/             # Research dashboard
├── components/
│   ├── layers/              # Explanation layer components (6 files)
│   ├── ui/                  # Shared UI components
│   ├── CreditHistoryWarning.tsx
│   ├── CreditHistoryDisclaimer.tsx
│   ├── ExplanationChatbot.tsx
│   └── Navigation.tsx
└── lib/
    ├── featureDescriptions.ts
    └── personas.ts

/backend
├── app/
│   ├── api/
│   │   ├── experiment_clean.py  # Main experiment endpoints
│   │   ├── explanations.py      # LLM narrative & chat endpoints
│   │   └── admin.py             # Admin & global explanation endpoints
│   └── services/
│       ├── xgboost_service.py           # XGBoost predictions + SHAP
│       ├── logistic_service.py          # Logistic regression service
│       ├── supabase_service.py          # Database operations
│       ├── notebook_preprocessing.py    # Data preprocessing
│       ├── global_explanation_generator.py  # SHAP visualizations
│       └── global_analysis_service.py   # Global model analysis
└── migrations/
    └── FINAL_SCHEMA.sql     # Single consolidated schema file
```

---

## 4. Database Schema

**Single schema file:** `backend/migrations/FINAL_SCHEMA.sql`

**Tables:**
1. `sessions` - Participant info and session tracking
2. `pre_experiment_responses` - Pre-experiment questionnaire
3. `predictions` - AI decisions with SHAP values
4. `layer_ratings` - Per-layer ratings (4 layers × 3 personas = 12 per participant)
5. `post_questionnaires` - Post-experiment questionnaire

**Data Flow:**
1. Participant starts → `sessions`
2. Pre-questionnaire → `pre_experiment_responses`
3. For each persona (3 total):
   - Generate prediction → `predictions`
   - Rate each layer (4 total) → `layer_ratings`
4. Post-questionnaire → `post_questionnaires`

---

## 5. Experiment Design

**3 Personas:**
- Maria (67, retired): €4,000 home renovation
- Jonas (27, employee): €12,000 business start-up
- Sofia (44, single parent): €20,000 debt consolidation

**4 Explanation Layers per persona:**
1. Baseline SHAP Explanation
2. Interactive Dashboard
3. Narrative Explanation
4. Counterfactual Analysis

**Rating Metrics (1-5 scale):**
- Trust
- Understanding
- Usefulness
- Mental Effort

**Total per participant:** 3 personas × 4 layers = 12 layer ratings

---

## 6. API Endpoints

### Experiment Flow
- `POST /api/v1/experiment/create_session` - Start session
- `POST /api/v1/experiment/pre_response` - Pre-questionnaire
- `POST /api/v1/experiment/predict_persona` - Get AI prediction
- `POST /api/v1/experiment/rate-layer` - Submit layer rating
- `POST /api/v1/experiment/post-questionnaire` - Post-questionnaire

### Explanations
- `POST /api/v1/explanations/level2/narrative` - LLM narrative
- `POST /api/v1/explanations/insights-summary` - AI summary
- `POST /api/v1/explanations/chat` - Chatbot interaction

### Admin
- `GET /api/v1/admin/global-explanation` - Global model context
- `GET /api/v1/admin/global-analysis` - Global analysis data
- `POST /api/v1/admin/generate-global-explanation` - Generate SHAP plots

---

## 7. Cleanup Summary (Nov 30, 2025)

**Deleted Unused Layer Components:**
- ❌ `Layer0AllFeatures.tsx` - Old all-features table
- ❌ `Layer1Minimal.tsx` - Old minimal SHAP view
- ❌ `Layer5Counterfactual.tsx` - Duplicate counterfactual
- ❌ `DecisionInsights.tsx` - Old insights component

**Deleted Migration Files (consolidated into FINAL_SCHEMA.sql):**
- ❌ `000_drop_all_tables.sql`
- ❌ `003_create_layer_ratings_table.sql`
- ❌ `004_create_post_questionnaires_table.sql`
- ❌ `010_update_layer_names_constraint.sql`
- ❌ `011_update_layer_names_v2.sql`
- ❌ `012_fix_layer_constraints.sql`
- ❌ `013_remove_layer_name_constraint.sql`
- ❌ `014_fix_layer_ratings_schema.sql`
- ❌ `999_full_schema.sql`

**Current Clean State:**
- ✅ 6 layer components (4 active + 2 supporting)
- ✅ 1 consolidated schema file
- ✅ All backend services in use
- ✅ No duplicate or legacy code

---

## 8. Local Development

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:3000
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# Runs on http://localhost:8000
```

### Environment Variables

**Backend (Railway):**
- `SUPABASE_URL`, `SUPABASE_KEY`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`, `R2_ENDPOINT_URL`
- `OPENAI_API_KEY`
- `FRONTEND_URL`

**Frontend (Netlify):**
- `NEXT_PUBLIC_API_URL`

---

## 9. Research Ready ✅

The project is production-ready for Master's thesis data collection:

- ✅ Clean, minimal codebase
- ✅ 4 explanation layers implemented
- ✅ Pre/post questionnaires
- ✅ Layer rating system
- ✅ Real-time results dashboard
- ✅ All data stored in Supabase

---

*Last Updated: November 30, 2025*
