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
- [ ] Results page - Researcher dashboard
- [x] Registration page (`/experiment/start`)
- [x] Pre-experiment questionnaire page (`/experiment/pre`)
- [x] **Personas hub page** (`/experiment/personas`) - NEW!
  - Maria (67, retired): €4,000 home renovation
  - Jonas (27, employee): €12,000 business start-up
  - Sofia (44, single parent): €20,000 debt consolidation
  - Bank clerk role-play introduction
- [x] **Persona detail pages** (`/experiment/personas/[personaId]`) - NEW!
  - Prefilled application forms
  - 2 adjustable fields (loan amount, duration)
  - Submit to AI for prediction
  - Display decision + probability
  - Lock form after submission
- [ ] **Explanation layers** (5 layers per persona) - IN PROGRESS
  - [ ] Layer 1: Minimal (single key driver)
  - [ ] Layer 2: Short text (GPT-4 generated)
  - [ ] Layer 3: Visual SHAP bars
  - [ ] Layer 4: Contextual thresholds
  - [ ] Layer 5: Counterfactual what-if
- [ ] Layer rating system (Likert scales)
- [ ] Layer sequence manager (randomization + progress)
- [ ] Post-experiment questionnaire page (`/experiment/post`)
- [ ] Thank you page (`/experiment/complete`)
- [x] Session state management (localStorage)
- [ ] Progress tracking UI

## 3. Next Steps / Tasks

### Current Status (Nov 1, 2025)
- ✅ Database schema deployed to Supabase (all 6 tables exist)
- ✅ Backend deployed to Railway with all environment variables
- ✅ Frontend deployed to Netlify and live
- ✅ Dataset downloaded from UCI ML Repository (1000 records)
- ✅ Both models trained and saved to R2 with metrics
- ✅ EDA generated with 7 visualizations + statistics JSON
- ✅ Dataset page displays real EDA statistics
- ✅ Model page displays real training metrics
- ✅ Admin panel fully functional
- ✅ **NO MOCK DATA** - All data from real sources

### Priority 1: Visual Enhancements (Completed)
- [x] **Add EDA image display to dataset page**
  - Create API endpoint to serve images from R2
  - Display all 7 visualizations on dataset page
  - Target distribution, age/amount/duration charts, confusion matrices
- [x] **Add model performance visualizations**
  - ROC curves for both models
  - Feature importance bar charts
  - Training history plots (if available)

- ### Priority 2: Experiment Flow Implementation
- [x] Registration page (`/experiment/start`)
  - Collect participant demographics
  - Generate unique session ID
  - Store in Supabase
- [x] Pre-experiment questionnaire (`/experiment/pre`)
  - AI trust and expectations questions
  - Save to `pre_experiment_responses` table
- [ ] Persona cycle implementation
  - 3 personas × 4 explanation layers = 12 iterations
  - Dynamic form for credit application input
  - Real-time prediction with SHAP values
  - Layer-specific explanation rendering
  - Feedback collection after each layer
- [ ] Persona selection hub (`/experiment/personas`) with session validation
- [ ] Persona walkthrough page showing application data and model decision
- [ ] Layer feedback form UI (trust, clarity, next steps)
- [ ] Post-experiment questionnaire (`/experiment/post`)
  - Overall experience and insights
  - Save to `post_experiment_responses` table
- [ ] Thank you page with session summary

### Priority 3: Research Dashboard
- [ ] Results page for researchers
  - Session statistics and completion rates
  - Aggregated questionnaire responses
  - Layer feedback analysis
  - Export functionality (CSV/JSON)
  - Uses shared preprocessing pipeline
  - Saves both models to R2

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
