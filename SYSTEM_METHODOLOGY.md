# Complete System Methodology Document

> **XAI Financial Services Research Platform**  
> A Master's Thesis Research Application for Studying Explainable AI in Credit Decisions  
> Nova School of Business and Economics × zeb Consulting

---

## Table of Contents

1. [Application Overview](#1-application-overview)
2. [Data Pipeline](#2-data-pipeline)
3. [Machine Learning Models](#3-machine-learning-models)
4. [Explainability Pipeline](#4-explainability-pipeline)
5. [Frontend Architecture](#5-frontend-architecture)
6. [Backend Architecture](#6-backend-architecture)
7. [Storage & Infrastructure](#7-storage--infrastructure)
8. [Full System Flow](#8-full-system-flow)
9. [Potential Issues & Improvements](#9-potential-issues--improvements)

---

## 1. Application Overview

### 1.1 Purpose

This web application is a research platform designed to study how different explanation styles (XAI layers) influence human perception, understanding, and trust in AI-based credit-risk decisions. The system presents bank clerks with credit applications, generates AI predictions using a trained XGBoost model, and displays multiple explanation formats to measure which approaches are most effective.

### 1.2 Problem Addressed

As AI systems become prevalent in financial services, there is a critical need to understand:
- How to communicate AI decisions effectively to professionals
- Which explanation formats build appropriate trust without over-reliance
- How different levels of technical detail affect understanding
- Whether visual, numerical, or narrative explanations are most effective

### 1.3 User Interaction

**End Users (Research Participants)**:
- Navigate through an onboarding flow explaining the study
- Review three predefined credit applicant personas (Maria, Jonas, Sofia)
- Submit credit applications and receive AI predictions
- View four different explanation layers sequentially:
  - **Layer 0**: Complete SHAP feature table (all ~23 features)
  - **Layer 1**: Analytical dashboard with waterfall plot
  - **Layer 2**: Narrative LLM explanation with interactive chatbot
  - **Layer 3**: Counterfactual analysis ("what-if" scenarios)
- Rate each explanation on trust, understanding, usefulness, and mental effort
- Complete pre- and post-experiment questionnaires

**Administrators**:
- Access the admin panel at `/admin`
- Retrain the XGBoost model with updated parameters
- Generate global explanation packages (SHAP plots, narratives)
- Monitor asset status in R2 storage
- View experiment results and participant responses

---

## 2. Data Pipeline

### 2.1 Dataset Source

The system uses the **German Credit Dataset** from the UCI Machine Learning Repository, originally collected in 1994. This dataset contains 1,000 loan applications with 20 attributes and a binary classification target (good/bad credit risk).

### 2.2 Data Storage in R2

The cleaned dataset is stored in Cloudflare R2 object storage at:
```
xai-financial-data/data/german_credit_clean.csv
```

The R2 bucket also stores:
- Trained model files (`models/xgboost_model.pkl`, `models/logistic_model.pkl`)
- Model metrics (`models/metrics.json`)
- Global explanation assets (`global_explanation/`)
- EDA visualizations (`eda/`)

### 2.3 Data Preprocessing

The raw German Credit data uses coded attribute values (A11, A12, etc.). The preprocessing pipeline (`convert_data.py`) transforms these into human-readable format:

**Categorical Mappings**:
- `checking_status`: A11→no_checking, A12→lt_0_dm, A13→0_to_200_dm, A14→ge_200_dm
- `credit_history`: A30→no_credits, A31→all_paid, A32→existing_paid, A33→delayed_past, A34→critical
- `savings_status`: A61→lt_100_dm, A62→100_to_500_dm, A63→500_to_1000_dm, A64→ge_1000_dm, A65→unknown
- `employment`: A71→unemployed, A72→lt_1_year, A73→1_to_4_years, A74→4_to_7_years, A75→ge_7_years
- Similar mappings for: purpose, housing, property_magnitude, other_debtors, other_payment_plans, job, own_telephone

### 2.4 Fairness-Excluded Features

Two features are explicitly excluded from model training to prevent discriminatory patterns:
- `personal_status_sex` - Gender and marital status
- `foreign_worker` - Immigration status

These are dropped during preprocessing and never used in predictions.

### 2.5 Feature Engineering

Five engineered features are computed to capture financial risk patterns:

| Feature | Formula | Interpretation |
|---------|---------|----------------|
| `monthly_burden` | credit_amount ÷ duration | Monthly payment amount in DM |
| `stability_score` | age × employment_years | Combined life/job stability |
| `risk_ratio` | credit_amount ÷ (age × 100) | Loan size relative to earning capacity |
| `credit_to_income_proxy` | credit_amount ÷ age | Debt burden relative to life stage |
| `duration_risk` | duration × credit_amount | Total financial exposure |

Employment duration is mapped to numeric years:
- unemployed → 0
- lt_1_year → 0.5
- 1_to_4_years → 2.5
- 4_to_7_years → 5.5
- ge_7_years → 10

### 2.6 Categorical Encoding

**For XGBoost**: One-hot encoding without dropping first category (XGBoost handles collinearity well)

**For Logistic Regression**: One-hot encoding with `drop='first'` to avoid multicollinearity, plus StandardScaler for numerical features

### 2.7 Class Imbalance Handling (Upsampling)

The dataset has imbalanced classes (70% good credit, 30% bad credit). The training pipeline applies **random upsampling** on the minority class (bad credit) to achieve 50/50 balance:

```python
X_train_min_up, y_train_min_up = resample(
    X_train_min, y_train_min,
    n_samples=len(y_train_maj),
    random_state=42,
    replace=True
)
```

This is applied only to the training set; the test set remains unbalanced to reflect real-world distribution.

---

## 3. Machine Learning Models

### 3.1 Models Trained

The system trains two models for comparison:

**Primary Model: XGBoost Classifier**
- Used for all predictions and SHAP explanations
- Gradient boosting ensemble with 500 trees
- Optimized for AUC-ROC performance

**Secondary Model: Logistic Regression**
- Provides interpretable baseline
- Uses L2 regularization (C=0.1)
- Trained for comparison metrics only

### 3.2 XGBoost Hyperparameters

```python
XGBClassifier(
    n_estimators=500,
    learning_rate=0.03,
    max_depth=6,
    min_child_weight=3,
    subsample=0.8,
    colsample_bytree=0.8,
    colsample_bylevel=0.8,
    gamma=0.1,
    reg_alpha=0.1,
    reg_lambda=1.0,
    scale_pos_weight=1.5,
    random_state=42,
    eval_metric='auc',
    early_stopping_rounds=50
)
```

### 3.3 Logistic Regression Hyperparameters

```python
LogisticRegression(
    max_iter=2000,
    solver='saga',
    penalty='l2',
    C=0.1,
    random_state=42
)
```

### 3.4 Training Pipeline Steps

1. **Load Data**: Read `german_credit_clean.csv` from R2 or local storage
2. **Remove Bias Features**: Drop `personal_status_sex` and `foreign_worker`
3. **Engineer Features**: Compute monthly_burden, stability_score, risk_ratio, etc.
4. **Train-Test Split**: 80/20 stratified split (random_state=42)
5. **Upsample Training Set**: Balance minority class via random oversampling
6. **Create Pipelines**: Build sklearn Pipelines with preprocessing + model
7. **Train Models**: Fit XGBoost with early stopping, fit Logistic Regression
8. **Evaluate**: Compute accuracy, precision, recall, F1, AUC-ROC on test set
9. **Generate Artifacts**: ROC curves, confusion matrices, feature importance
10. **Save to R2**: Upload model files, metrics JSON, and visualizations

### 3.5 Model Performance (Typical Results)

| Metric | XGBoost | Logistic Regression |
|--------|---------|---------------------|
| Accuracy | 75.5% | 73.0% |
| Precision | 59.0% | 55.0% |
| Recall | 60.0% | 58.0% |
| F1 Score | 59.5% | 56.5% |
| ROC-AUC | 0.7745 | 0.7520 |

### 3.6 Model Persistence

Models are saved as sklearn Pipeline objects using joblib:
- `models/xgboost_model.pkl` - Complete pipeline with preprocessing
- `models/logistic_model.pkl` - Complete pipeline with preprocessing
- `models/metrics.json` - Performance metrics and hyperparameters
- `models/training_code.json` - Documentation of training process

### 3.7 Operational Predictions

When a prediction is requested:
1. Backend loads model from R2 (cached after first load)
2. User input is validated against feature schema
3. Engineered features are computed
4. Model pipeline transforms and predicts
5. Probabilities for both classes are returned
6. Decision threshold: probability_bad > 0.5 → rejected

### 3.8 Sanity Checks

The system includes sanity check endpoints that test:
- **Safe applicant**: High savings, long employment, low amount → should be approved
- **Risky applicant**: No checking, unemployed, high amount → should be rejected
- **Borderline applicant**: Mixed signals → tests model discrimination

### 3.9 No Mock Data Policy

The system explicitly prohibits mock or placeholder data:
- All predictions use the real trained model
- All SHAP values are computed from actual model internals
- If any component fails, an error is returned (no fallback to fake data)
- This ensures research validity and reproducibility

---

## 4. Explainability Pipeline

### 4.1 SHAP Value Computation

**Local (Per-Prediction) SHAP**:
- Computed using `shap.TreeExplainer` on the XGBoost model
- Values represent contribution to log-odds of bad credit (Class 1)
- Positive SHAP = increases default risk = bad for applicant (red in UI)
- Negative SHAP = decreases default risk = good for applicant (green in UI)

**Global SHAP**:
- Computed on a sample of 200 records from the training data
- Used for feature importance charts and summary plots
- Stored in R2 as pre-generated images and JSON

### 4.2 Categorical Feature Grouping

One-hot encoded features are grouped back to their original categorical feature:

```python
# Before grouping: ~60 one-hot columns
checking_status_negative_balance: +0.57
checking_status_no_checking: +0.52
checking_status_lt_200_dm: -0.01

# After grouping: 23 original features
Checking Account Status: Negative Balance (< 0 DM) → SHAP: +1.08
```

The grouping logic:
1. Identifies one-hot columns by prefix matching (e.g., `checking_status_*`)
2. Sums SHAP values for all columns belonging to the same base feature
3. Retrieves the actual selected category value from user input
4. Maps to human-readable display names

### 4.3 Explanation Layers

**Layer 0: Complete SHAP Analysis**
- Shows ALL ~23 grouped features in a comprehensive table
- Columns: Rank, Feature Name, Value, SHAP Value, Impact, Visual Bar
- Summary statistics: total features, risk-increasing count, risk-decreasing count
- Educational legend explaining SHAP interpretation
- Credit History disclaimer banner

**Layer 1: Analytical Dashboard**
- CSS-based waterfall plot showing top 10 features
- Cumulative SHAP visualization from base value
- Technical SHAP values with precise numbers
- Feature contribution table with tooltips

**Layer 2: Narrative LLM Explanation**
- Natural language summary generated by OpenAI GPT-4o-mini
- Combines global model context with local SHAP values
- Interactive chatbot for follow-up questions
- Template-based fallback if OpenAI unavailable

**Layer 3: Counterfactual Analysis**
- Shows "what-if" scenarios to reverse the decision
- Identifies features with highest negative impact
- Suggests realistic changes (e.g., "increase savings to 500-1000 DM")
- Multiple scenarios with varying numbers of changes

### 4.4 Global Explanation Package

Generated via `POST /api/v1/admin/generate-global-explanation`:

| Asset | Description |
|-------|-------------|
| `feature_importance.png` | Bar chart of mean |SHAP| values |
| `shap_summary.png` | Dot plot showing feature effects |
| `dependence_*.png` | Dependence plots for top features |
| `distributions.png` | Feature distribution histograms |
| `manifest.json` | Metadata and file listing |
| `narrative.md` | Plain-language model description |
| `dataset_summary.json` | Feature importance and disclaimers |

### 4.5 Global Text Analysis Report

Generated via `POST /api/v1/admin/generate-global-analysis`:
- Comprehensive text report (`global_xgboost_analysis.txt`)
- Model statistics (trees, depth, AUC, accuracy)
- Ranked feature importance
- Direction of effects for each feature
- Dependence insights with nonlinearity detection
- Risk patterns and thresholds
- Key insights summary

### 4.6 Credit History Bias Disclaimer

The 1994 German Credit dataset contains a counterintuitive pattern:
- "Critical" credit history → 17% default rate (lowest)
- "All paid" credit history → 57% default rate (highest)

This is due to **historical selection bias**: banks were more cautious with risky-looking applicants, approving only the most creditworthy among them.

The system handles this by:
1. **CreditHistoryDisclaimer** component displayed above all SHAP tables
2. **CreditHistoryWarning** component for inline tooltips
3. Special highlighting (amber background) for Credit History feature
4. Explicit warning in feature tooltips
5. Disclaimer in global explanation narrative

---

## 5. Frontend Architecture

### 5.1 Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **Icons**: Lucide React
- **State Management**: React hooks (useState, useEffect)
- **Storage**: localStorage for session persistence

### 5.2 Page Structure

```
/frontend/app/
├── page.tsx                    # Landing page
├── about/page.tsx              # Research information
├── dataset/page.tsx            # Dataset documentation
├── model/page.tsx              # Model documentation
├── admin/page.tsx              # Admin panel
├── results/page.tsx            # Results dashboard
└── experiment/
    ├── page.tsx                # Experiment hub
    ├── start/page.tsx          # Session creation
    ├── pre/page.tsx            # Pre-experiment questionnaire
    ├── personas/
    │   ├── page.tsx            # Persona selection hub
    │   └── [personaId]/
    │       ├── page.tsx        # Persona detail/application
    │       └── layers/
    │           └── page.tsx    # Explanation layers
    └── complete/page.tsx       # Post-experiment questionnaire
```

### 5.3 Component Architecture

**Layer Components** (`/frontend/components/layers/`):
- `Layer0AllFeatures.tsx` - Complete feature table
- `Layer1Minimal.tsx` - Analytical dashboard
- `Layer2ShortText.tsx` - Narrative with chatbot
- `Layer5Counterfactual.tsx` - What-if scenarios
- `GlobalModelExplanation.tsx` - Global model info
- `LocalDecisionSummary.tsx` - Decision summary card

**Shared Components** (`/frontend/components/`):
- `CreditHistoryDisclaimer.tsx` - Persistent warning banner
- `CreditHistoryWarning.tsx` - Inline warning component
- `ExplanationChatbot.tsx` - Interactive Q&A chatbot
- `Navigation.tsx` - Site navigation
- `ui/Tooltip.tsx` - Hover tooltips

### 5.4 SHAP Table Display

The grouped SHAP table shows:
1. **Rank** - Position by absolute SHAP value
2. **Feature Name** - Human-readable with tooltip
3. **Value** - Actual applicant value (formatted)
4. **SHAP Value** - Numeric contribution with sign
5. **Impact** - "Supported approval" or "Raised concerns"
6. **Strength Bar** - Visual representation of magnitude

Color coding:
- **Red** (positive SHAP): Increases default risk
- **Green** (negative SHAP): Decreases default risk

### 5.5 User Flow

1. **Landing Page** → Learn about the study
2. **Start Experiment** → Create session with demographics
3. **Pre-Questionnaire** → Capture initial expectations
4. **Persona Hub** → Select from three personas
5. **Persona Detail** → Review application, submit for prediction
6. **Layers** → View 4 explanation layers, rate each
7. **Repeat** → Complete all three personas
8. **Post-Questionnaire** → Final feedback
9. **Complete** → Thank you page

### 5.6 Persona System

Three predefined personas with realistic credit scenarios:

| Persona | Age | Loan | Purpose | Risk Profile |
|---------|-----|------|---------|--------------|
| Maria (Elderly Woman) | 67 | €4,000 | Home renovation | Low risk |
| Jonas (Young Entrepreneur) | 27 | €12,000 | Business startup | Medium risk |
| Sofia (Single Parent) | 44 | €20,000 | Debt consolidation | Higher risk |

---

## 6. Backend Architecture

### 6.1 Technology Stack

- **Framework**: FastAPI (Python 3.11)
- **ML Libraries**: XGBoost, scikit-learn, SHAP
- **Database**: Supabase (PostgreSQL)
- **Storage**: Cloudflare R2 (S3-compatible)
- **LLM**: OpenAI GPT-4o-mini (optional)

### 6.2 API Router Structure

```
/backend/app/api/
├── experiment_clean.py    # Experiment flow endpoints
├── admin.py               # Admin management endpoints
└── explanations.py        # Explanation generation endpoints
```

### 6.3 Experiment Endpoints (`/api/v1/experiment/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/feature-schema` | GET | Get form field definitions |
| `/session` | POST | Create new experiment session |
| `/predict` | POST | Make prediction with explanation |
| `/predict_persona` | POST | Predict for predefined persona |
| `/rate-layer` | POST | Submit layer rating |
| `/pre-experiment` | POST | Submit pre-questionnaire |
| `/post-experiment` | POST | Submit post-questionnaire |

### 6.4 Admin Endpoints (`/api/v1/admin/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/asset-status` | GET | Check R2 asset availability |
| `/health` | GET | R2 connection health check |
| `/model-metrics` | GET | Get training metrics |
| `/retrain-model` | POST | Retrain and upload model |
| `/generate-global-explanation` | POST | Generate SHAP visualizations |
| `/generate-global-analysis` | POST | Generate text analysis report |
| `/global-explanation` | GET | Get global explanation data |
| `/global-explanation-image/{filename}` | GET | Serve explanation images |
| `/global-analysis` | GET | Get text analysis report |
| `/eda-stats` | GET | Get EDA statistics |
| `/eda-image/{filename}` | GET | Serve EDA images |

### 6.5 Explanation Endpoints (`/api/v1/explanations/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/level2/narrative` | POST | Generate LLM narrative |
| `/level3/counterfactuals` | POST | Generate what-if scenarios |
| `/chat` | POST | Interactive chatbot Q&A |

### 6.6 Service Layer

**XGBoostService** (`xgboost_service.py`):
- Loads model from R2
- Makes predictions
- Computes SHAP values
- Groups one-hot features
- Returns human-readable explanations

**LogisticService** (`logistic_service.py`):
- Loads logistic model from R2
- Provides coefficient-based explanations
- Used for comparison metrics

**GlobalExplanationGenerator** (`global_explanation_generator.py`):
- Loads model and data
- Computes global SHAP values
- Generates matplotlib visualizations
- Creates narrative markdown
- Uploads all assets to R2

**GlobalAnalysisService** (`global_analysis_service.py`):
- Generates comprehensive text report
- Computes feature importance rankings
- Analyzes dependence patterns
- Detects nonlinear relationships

**SupabaseService** (`supabase_service.py`):
- Creates experiment sessions
- Stores predictions and ratings
- Manages questionnaire responses
- Retrieves dashboard statistics

---

## 7. Storage & Infrastructure

### 7.1 R2 Bucket Structure

```
xai-financial-data/
├── data/
│   └── german_credit_clean.csv
├── models/
│   ├── xgboost_model.pkl
│   ├── logistic_model.pkl
│   ├── metrics.json
│   └── training_code.json
├── global_explanation/
│   ├── manifest.json
│   ├── feature_importance.png
│   ├── shap_summary.png
│   ├── distributions.png
│   ├── dependence_*.png
│   ├── narrative.md
│   ├── dataset_summary.json
│   └── global_xgboost_analysis.txt
└── eda/
    ├── statistics.json
    └── *.png
```

### 7.2 Asset Availability Checking

The admin panel checks asset status via `HEAD` requests to R2:
- Model availability
- Global explanation package
- Performance statistics
- Last modified timestamps

### 7.3 Asset Update Flow

1. Admin triggers retrain via UI
2. Backend trains models locally
3. Models uploaded to R2 via boto3
4. Metrics JSON updated
5. Global explanation regenerated
6. Frontend fetches fresh assets

### 7.4 Deployment Configuration

**Backend (Railway)**:
- Python 3.11 runtime
- Environment variables for R2, Supabase, OpenAI
- Auto-deploy on git push
- Health check endpoint at `/health`

**Frontend (Netlify)**:
- Next.js static export
- Environment variable: `NEXT_PUBLIC_API_URL`
- Auto-deploy on git push
- SPA routing via `_redirects`

### 7.5 Environment Variables

**Railway (Backend)**:
```
SUPABASE_URL, SUPABASE_KEY
R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY
R2_BUCKET_NAME, R2_ENDPOINT_URL
OPENAI_API_KEY (optional)
FRONTEND_URL, CORS_ALLOWED_ORIGINS
```

**Netlify (Frontend)**:
```
NEXT_PUBLIC_API_URL
```

---

## 8. Full System Flow

### 8.1 End-to-End Prediction Flow

```
┌─────────────────┐
│  User submits   │
│  application    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend sends  │
│ POST /predict   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Backend loads   │
│ model from R2   │
│ (cached)        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Engineer        │
│ features        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Model predicts  │
│ probabilities   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Compute SHAP    │
│ values          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Group one-hot   │
│ features        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return JSON     │
│ response        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend stores │
│ in localStorage │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Navigate to     │
│ /layers         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Render Layer 0  │
│ (All Features)  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ User rates      │
│ explanation     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /rate-layer│
│ to Supabase     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Repeat for      │
│ Layers 1, 2, 3  │
└─────────────────┘
```

### 8.2 Global Explanation Generation Flow

```
┌─────────────────┐
│ Admin clicks    │
│ "Generate"      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /generate- │
│ global-         │
│ explanation     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Load model &    │
│ data from R2    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Sample 200      │
│ records         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Compute SHAP    │
│ for sample      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Generate        │
│ matplotlib      │
│ plots           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create          │
│ narrative.md    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Upload all to   │
│ R2 bucket       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return success  │
│ + log           │
└─────────────────┘
```

### 8.3 Chatbot Interaction Flow

```
┌─────────────────┐
│ User types      │
│ question        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Frontend builds │
│ system context  │
│ (global + local)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ POST /chat      │
│ with messages   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Backend calls   │
│ OpenAI API      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return AI       │
│ response        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Display in      │
│ chat UI         │
└─────────────────┘
```

---

## 9. Potential Issues & Improvements

### 9.1 Code Inconsistencies

- **Layer numbering**: Layers are numbered 0-3 internally but displayed as 1-4 to users
- **Feature name variations**: Some components use different display name mappings
- **SHAP semantics**: Comments clarify that positive SHAP = bad for applicant, but this could be confusing

### 9.2 Dead Code

- `Layer3Visual.tsx` and `Layer4Detailed.tsx` exist but are not used in the current layer flow
- Some unused imports in layer components
- Legacy Axx attribute mappings in comments

### 9.3 Redundant Components

- Both `CreditHistoryDisclaimer` and `CreditHistoryWarning` exist with overlapping functionality
- Multiple feature display name mappings across components

### 9.4 Missing Error Handling

- R2 connection failures could be handled more gracefully
- OpenAI API failures should have better user feedback
- Session expiration is not explicitly handled

### 9.5 Outdated Frontend Logic

- Some components still reference old attribute codes in comments
- Feature description fallbacks could be improved
- Tooltip content could be more consistent

### 9.6 Security Considerations

- CORS is set to allow all origins (`"*"`) for development
- API keys are in environment variables (good) but no rate limiting
- No authentication on admin endpoints
- Session IDs are UUIDs but not cryptographically verified

### 9.7 Technical Debt

- Model loading is cached but cache invalidation is manual
- No automated testing suite
- Database schema migrations are manual
- No CI/CD pipeline for testing

### 9.8 Opportunities to Simplify

- Consolidate feature display name mappings into single source
- Create shared SHAP table component used by all layers
- Implement proper state management (e.g., Zustand) instead of localStorage
- Add TypeScript strict mode for better type safety
- Create shared API client with error handling

### 9.9 Future Enhancements

- A/B testing different explanation orderings
- Eye-tracking integration for attention analysis
- Multi-language support
- Mobile-responsive improvements
- Real-time collaboration features
- Export functionality for research data

---

## Document Information

- **Generated**: November 30, 2025
- **Version**: 1.0
- **Author**: System Analysis
- **Purpose**: Master's Thesis Methodology Chapter Reference

This document provides a complete technical reference for the XAI Financial Services research platform. All information is derived from actual codebase analysis with no mock or placeholder content.
