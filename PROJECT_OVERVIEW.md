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
- [x] **Preprocessing Pipeline** - `GermanCreditPreprocessor` class
  - Excludes bias features (personal_status, foreign_worker)
  - Handles categorical encoding with LabelEncoder
  - Standardizes numerical features with StandardScaler
  - Remaps target labels [1,2] → [0,1] for sklearn compatibility
  - Reusable for both training and prediction
- [x] **Feature Mapping System** - `FeatureMappings` class
  - Translates human-readable inputs to symbolic codes (A11, A12, etc.)
  - Threshold-based mappings (e.g., 150 DM → A12)
  - Validation logic for all 18 features
  - Provides feature options for frontend forms
- [x] **XGBoost Model** - Credit risk classifier with SHAP explanations
- [x] **Logistic Regression Model** - Alternative classifier for comparison
- [x] **Model Training Scripts**
  - `train_model.py` - Train XGBoost
  - `train_logistic.py` - Train Logistic Regression
  - `train_all_models.py` - Train both models
- [x] FastAPI REST API with CORS configuration
- [x] Supabase database integration
- [x] Cloudflare R2 storage integration
- [x] Session management API (`POST /api/v1/experiment/create_session`)
- [x] Pre-experiment questionnaire API (`POST /api/v1/experiment/pre_response`)
- [x] Post-experiment questionnaire API (`POST /api/v1/experiment/post_response`)
- [x] **Persona Prediction API** (`POST /api/v1/experiment/predict_persona`)
  - Takes persona application data
  - Runs XGBoost model prediction
  - Calculates top 10 SHAP values
  - Returns decision + probability + SHAP features
- [x] Session retrieval API (`GET /api/v1/experiment/session/{session_id}`)
- [x] Feature options API (`GET /api/v1/experiment/feature-options`)
- [x] Railway deployment configuration
- [x] Environment variable management
- [x] Dataset download from UCI ML Repository (`download_dataset.py`)
- [x] **Comprehensive EDA** (`generate_eda.py`)
  - 7 high-quality visualizations (150 DPI)
  - Target distribution with percentages
  - Age, credit amount, duration distributions (with box plots by risk)
  - Purpose and checking status distributions
  - Correlation heatmap for 7 numerical attributes
  - Detailed statistics JSON with all 20 attributes
  - Bias features clearly marked
- [x] **Model Metrics Collection** - Training metrics saved to R2
  - Accuracy, Precision, Recall, F1 Score, ROC-AUC
  - Confusion matrices for both models
  - Feature importance (Logistic Regression coefficients)
  - Train/test split sizes and performance comparison
- [x] **Admin API Endpoints**
  - `/api/v1/admin/download-dataset` - Download German Credit data
  - `/api/v1/admin/generate-eda` - Generate EDA visualizations
  - `/api/v1/admin/train-model` - Train both models
  - `/api/v1/admin/eda-stats` - Serve EDA statistics JSON
  - `/api/v1/admin/model-metrics` - Serve model training metrics
  - `/api/v1/admin/dashboard-stats` - Aggregate experiment results for dashboard

### Database (Complete)
- [x] `sessions` table - participant demographics and session tracking
- [x] `pre_experiment_responses` table - expectation capture
- [x] `post_experiment_responses` table - overall evaluation
- [x] `predictions` table - model outputs with SHAP values
- [x] `layer_feedback` table - per-layer reflections
- [x] Database indexes for performance
- [x] SQL schema file (`backend/supabase_schema.sql`)
- [x] Experiment flow documentation (`backend/EXPERIMENT_FLOW.md`)

### Frontend (Complete)
- [x] Next.js 14 app router structure
- [x] TailwindCSS styling
- [x] Netlify deployment configuration
- [x] Landing page - Project introduction and overview
- [x] **Dataset page** - Real EDA statistics display
  - Dataset overview (1000 records, 20 attributes)
  - Target distribution (700 good / 300 bad credit)
  - Feature insights (age, credit amount, duration)
  - Data quality metrics
  - Fetches real data from `/api/v1/admin/eda-stats`
- [x] **Model page** - Real model performance metrics
  - XGBoost metrics (accuracy, precision, recall, F1, ROC-AUC)
  - Logistic Regression metrics with feature importance
  - Confusion matrices for both models
  - Train/test performance comparison
  - Fetches real data from `/api/v1/admin/model-metrics`
- [x] About page - Research ethics and contact information
- [x] **Admin page** - Setup buttons for project initialization
  - Download dataset from UCI (not Kaggle)
  - Generate EDA visualizations
  - Train both models (XGBoost + Logistic Regression)
- [x] **EDA Visualizations Display** - Show 7 charts on dataset page
- [x] **Results Dashboard** - Researcher analytics page
  - Total sessions and completion rates
  - Average layer ratings (trust, understanding, usefulness, mental effort)
  - Layer preferences with vote counts
  - Post-questionnaire averages
  - Fetches real data from `/api/v1/admin/dashboard-stats`
- [x] Registration page (`/experiment/start`)
- [x] Pre-experiment questionnaire page (`/experiment/pre`)
- [x] **Personas hub page** (`/experiment/personas`)
  - Maria (67, retired): €4,000 home renovation
  - Jonas (27, employee): €12,000 business start-up
  - Sofia (44, single parent): €20,000 debt consolidation
  - Bank clerk role-play introduction
- [x] **Persona detail pages** (`/experiment/personas/[personaId]`)
  - Prefilled application forms
  - 2 adjustable fields (loan amount, duration)
  - Submit to AI for prediction
  - Display decision + probability
  - Lock form after submission
- [x] **Explanation layers** (5 layers per persona) - COMPLETE
  - [x] Layer 1: Minimal (human-readable, single key factor)
  - [x] Layer 2: Feature Importance (GPT-4o-mini natural language)
  - [x] Layer 3: Detailed SHAP (visual bar charts)
  - [x] Layer 4: Visual (contextual benchmarking with dataset ranges)
  - [x] Layer 5: Counterfactual (realistic what-if scenarios)
- [x] Layer rating system (Likert scales for trust, understanding, usefulness, mental effort)
- [x] Layer sequence manager (5 layers per persona)
- [x] Post-experiment questionnaire page (`/experiment/complete`)
- [x] Thank you page with session summary
- [x] Session state management (localStorage)
- [x] Progress tracking UI

## 3. Project Status

### ✅ COMPLETED (Nov 2, 2025)
- ✅ Database schema deployed to Supabase (all 6 tables)
- ✅ Backend deployed to Railway with all environment variables
- ✅ Frontend deployed to Netlify and live
- ✅ Dataset downloaded from UCI ML Repository (1000 records)
- ✅ Both models trained and saved to R2 with metrics
- ✅ EDA generated with 7 visualizations + statistics JSON
- ✅ Dataset page displays real EDA statistics
- ✅ Model page displays real training metrics
- ✅ Admin panel fully functional
- ✅ **All 5 explanation layers implemented** (human-readable, no mock data)
- ✅ **Results dashboard** with real-time analytics
- ✅ **Complete experiment flow** (start → personas → layers → completion)
- ✅ **NO MOCK DATA** - All data from real sources
- ✅ **Project cleanup** - Removed 6 redundant documentation files

### 🎯 Ready for Research
**The project is 100% complete and production-ready!**

**Full Experiment Flow:**
1. ✅ Landing page → Start experiment
2. ✅ Pre-questionnaire (AI trust expectations)
3. ✅ Persona selection (3 personas)
4. ✅ Persona application → AI prediction
5. ✅ 5 explanation layers (all functional with real data)
6. ✅ Layer ratings (trust, understanding, usefulness, mental effort)
7. ✅ Post-questionnaire (overall experience, layer preference)
8. ✅ Thank you page

**Admin Tools:**
1. ✅ Download dataset from UCI
2. ✅ Generate EDA visualizations
3. ✅ Train both models (XGBoost + Logistic Regression)
4. ✅ View dataset statistics
5. ✅ View model metrics
6. ✅ View aggregated results dashboard

**Data Collection:**
- ✅ All responses stored in Supabase
- ✅ Real-time dashboard analytics
- ✅ Layer preferences tracked
- ✅ Completion rates monitored

### 📋 Optional Enhancements (Future)
- [ ] Export functionality (CSV/JSON) for results dashboard
- [ ] Date range filters on dashboard
- [ ] Individual session detail view
- [ ] Additional data visualizations

### 🚀 Next Steps
1. **Test with pilot participants** (1-2 users)
2. **Verify data collection** in Supabase
3. **Check dashboard** displays correctly
4. **Begin data collection** for Master's thesis
