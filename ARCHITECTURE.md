# System Architecture

This document provides a detailed technical overview of the Explainable AI Credit Decision System architecture.

---

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER INTERFACE                              │
│                     (Next.js 14 + TypeScript)                        │
│                                                                       │
│  Landing → Consent → Persona Selection → Layer Evaluation → Results │
│                                                                       │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                         REST API (HTTPS)
                                │
┌───────────────────────────────┴─────────────────────────────────────┐
│                        API GATEWAY                                   │
│                    (FastAPI + Uvicorn)                               │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Experiment   │  │ Explanations │  │    Admin     │             │
│  │  Endpoints   │  │  Endpoints   │  │  Endpoints   │             │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │
│         │                  │                  │                      │
│         └──────────────────┴──────────────────┘                      │
│                            │                                         │
└────────────────────────────┼─────────────────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
┌─────────┴────────┐  ┌──────┴───────┐  ┌──────┴────────┐
│   ML SERVICES    │  │   DATABASE   │  │  EXTERNAL API │
│                  │  │              │  │               │
│  ┌────────────┐  │  │  Supabase    │  │  OpenAI       │
│  │  XGBoost   │  │  │  PostgreSQL  │  │  GPT-4o-mini  │
│  │  Predictor │  │  │              │  │               │
│  └─────┬──────┘  │  │  ┌────────┐  │  │  Narrative    │
│        │         │  │  │Sessions│  │  │  Generation   │
│  ┌─────┴──────┐  │  │  │Ratings │  │  │               │
│  │   SHAP     │  │  │  │Quests  │  │  └───────────────┘
│  │ Explainer  │  │  │  └────────┘  │
│  └────────────┘  │  │              │
│                  │  │  RLS Policies│
│  ┌────────────┐  │  │  & Indexes   │
│  │ Context    │  │  │              │
│  │ Builder    │  │  └──────────────┘
│  └────────────┘  │
│                  │
│  ┌────────────┐  │
│  │ R2 Storage │  │
│  │ (Models)   │  │
│  └────────────┘  │
└──────────────────┘
```

---

## 🔄 Data Flow

### **1. Experiment Session Flow**

```
User → Landing Page
  ↓
Consent & Baseline Questionnaire
  ↓ POST /api/v1/experiment/session
Backend: Create session_id, store consent
  ↓
Persona Selection (Maria or Jonas)
  ↓ POST /api/v1/experiment/predict_persona
Backend: 
  - Load XGBoost model from R2
  - Generate prediction
  - Compute SHAP values
  - Store in database
  - Return prediction + SHAP features
  ↓
Layer 1: Baseline SHAP Table
  - Display all SHAP features
  - User rates (Understanding, Communicability, Mental Ease)
  - Track time spent
  ↓ POST /api/v1/experiment/rate-layer
Backend: Store layer rating
  ↓
Layer 2: Interactive Dashboard
  - Fetch dashboard summary from OpenAI
  - Display risk tug-of-war
  - Progressive disclosure with feature cards
  - User rates
  ↓ POST /api/v1/experiment/rate-layer
Backend: Store layer rating
  ↓
Layer 3: Narrative Explanation
  - Fetch narrative from OpenAI
  - Display professional explanation
  - User rates
  ↓ POST /api/v1/experiment/rate-layer
Backend: Store layer rating
  ↓
Layer 4: Counterfactual Analysis
  - Display what-if scenarios
  - Interactive feature adjustment
  - User rates
  ↓ POST /api/v1/experiment/rate-layer
Backend: Store layer rating
  ↓
Post-Persona Questionnaire
  ↓ POST /api/v1/experiment/post-questionnaire
Backend: Store questionnaire responses
  ↓
[Repeat for second persona]
  ↓
Thank You & Completion
```

### **2. Prediction & Explanation Flow**

```
Application Data (20 features)
  ↓
XGBoost Model
  ├─→ Prediction (approved/rejected)
  ├─→ Probability (0-1)
  └─→ Interest Rate (5-12%)
  ↓
SHAP TreeExplainer
  ├─→ SHAP values (per feature)
  ├─→ Base value
  └─→ Feature contributions
  ↓
Context Builder
  ├─→ Global benchmarks (median, ranges, percentiles)
  ├─→ Categorical success rates
  ├─→ Actionable suggestions
  └─→ Fairness statement
  ↓
Explanation Generation
  ├─→ Layer 1: Raw SHAP table
  ├─→ Layer 2: Dashboard summary (OpenAI, <50 words)
  ├─→ Layer 3: Narrative (OpenAI, 150-200 words)
  └─→ Layer 4: Counterfactuals (heuristic-based)
```

---

## 🗄️ Database Schema

### **Tables**

#### **1. sessions**
Stores consent and baseline questionnaire data.

```sql
CREATE TABLE sessions (
    session_id TEXT PRIMARY KEY,
    consent_given BOOLEAN NOT NULL,
    participant_background TEXT,
    credit_experience TEXT,
    ai_familiarity INTEGER,
    preferred_explanation_style TEXT,
    background_notes TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);
```

#### **2. predictions**
Stores AI predictions for each persona.

```sql
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES sessions(session_id) ON DELETE CASCADE,
    persona_id TEXT NOT NULL,
    decision TEXT NOT NULL,
    probability DECIMAL(5,4) NOT NULL,
    shap_values JSONB NOT NULL,
    input_features JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **3. layer_ratings**
Stores ratings for each explanation layer (24 per session: 2 personas × 4 layers × 3 ratings).

```sql
CREATE TABLE layer_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES sessions(session_id) ON DELETE CASCADE,
    persona_id TEXT NOT NULL,
    layer_number INTEGER NOT NULL CHECK (layer_number >= 1 AND layer_number <= 4),
    layer_name TEXT NOT NULL,
    
    -- 3 Likert scale ratings (1-5)
    understanding_rating INTEGER NOT NULL CHECK (understanding_rating >= 1 AND understanding_rating <= 5),
    communicability_rating INTEGER NOT NULL CHECK (communicability_rating >= 1 AND communicability_rating <= 5),
    cognitive_load_rating INTEGER NOT NULL CHECK (cognitive_load_rating >= 1 AND cognitive_load_rating <= 5),
    
    comment TEXT DEFAULT '',
    time_spent_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **4. post_questionnaires**
Stores post-persona questionnaire responses (2 per session).

```sql
CREATE TABLE post_questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT REFERENCES sessions(session_id) ON DELETE CASCADE,
    persona_id TEXT NOT NULL,
    most_helpful_layer TEXT,
    most_trusted_layer TEXT,
    best_for_customer TEXT,
    overall_intuitiveness INTEGER CHECK (overall_intuitiveness >= 1 AND overall_intuitiveness <= 5),
    ai_usefulness INTEGER CHECK (ai_usefulness >= 1 AND ai_usefulness <= 5),
    improvement_suggestions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Views**

#### **experiment_complete_data**
Aggregated view joining sessions with ratings and questionnaires.

```sql
CREATE VIEW experiment_complete_data AS
SELECT 
    s.session_id,
    s.consent_given,
    s.participant_background,
    s.credit_experience,
    s.ai_familiarity,
    s.preferred_explanation_style,
    s.completed,
    
    -- Layer ratings aggregated (3 dimensions)
    COUNT(DISTINCT lr.id) AS total_layer_ratings,
    ROUND(AVG(lr.understanding_rating)::numeric, 2) AS avg_understanding,
    ROUND(AVG(lr.communicability_rating)::numeric, 2) AS avg_communicability,
    ROUND(AVG(lr.cognitive_load_rating)::numeric, 2) AS avg_cognitive_load,
    SUM(lr.time_spent_seconds) AS total_time_spent_seconds,
    
    -- Post questionnaire
    pq.most_helpful_layer,
    pq.most_trusted_layer,
    pq.best_for_customer,
    pq.overall_intuitiveness,
    pq.ai_usefulness
    
FROM sessions s
LEFT JOIN layer_ratings lr ON s.session_id = lr.session_id
LEFT JOIN post_questionnaires pq ON s.session_id = pq.session_id
WHERE s.consent_given = TRUE
GROUP BY s.session_id, [other columns];
```

#### **layer_performance_analysis**
Per-layer statistics with mean and standard deviation.

```sql
CREATE VIEW layer_performance_analysis AS
SELECT 
    lr.layer_number,
    lr.layer_name,
    lr.persona_id,
    COUNT(*) AS total_ratings,
    
    ROUND(AVG(lr.understanding_rating)::numeric, 2) AS avg_understanding,
    ROUND(STDDEV(lr.understanding_rating)::numeric, 2) AS stddev_understanding,
    
    ROUND(AVG(lr.communicability_rating)::numeric, 2) AS avg_communicability,
    ROUND(STDDEV(lr.communicability_rating)::numeric, 2) AS stddev_communicability,
    
    ROUND(AVG(lr.cognitive_load_rating)::numeric, 2) AS avg_cognitive_load,
    ROUND(STDDEV(lr.cognitive_load_rating)::numeric, 2) AS stddev_cognitive_load,
    
    ROUND(AVG(lr.time_spent_seconds)::numeric, 1) AS avg_time_seconds
    
FROM layer_ratings lr
GROUP BY lr.layer_number, lr.layer_name, lr.persona_id
ORDER BY lr.layer_number, lr.persona_id;
```

---

## 🔌 API Endpoints

### **Experiment Endpoints** (`/api/v1/experiment`)

#### **POST /session**
Create new experiment session with consent and baseline data.

**Request:**
```json
{
  "consent_given": true,
  "participant_background": "banking",
  "credit_experience": "expert",
  "ai_familiarity": 4,
  "preferred_explanation_style": "visual",
  "background_notes": "10 years in credit analysis"
}
```

**Response:**
```json
{
  "session_id": "uuid-string",
  "message": "Session created successfully"
}
```

#### **POST /predict_persona**
Generate prediction and SHAP explanation for a persona.

**Request:**
```json
{
  "session_id": "uuid-string",
  "persona_id": "elderly-woman",
  "application_data": {
    "age": 32,
    "checking_account_status": "0 to 200 DM",
    "credit_amount": 4800,
    // ... 20 features total
  }
}
```

**Response:**
```json
{
  "decision": "approved",
  "probability": 0.53,
  "interest_rate": 8.29,
  "shap_features": [
    {
      "feature": "Monthly Payment Burden",
      "value": "€200.00",
      "shap_value": -0.6437,
      "impact": "negative"
    },
    // ... all features
  ]
}
```

#### **POST /rate-layer**
Submit rating for an explanation layer.

**Request:**
```json
{
  "session_id": "uuid-string",
  "persona_id": "elderly-woman",
  "layer_number": 2,
  "layer_name": "Interactive Dashboard",
  "understanding_rating": 4,
  "communicability_rating": 5,
  "cognitive_load_rating": 4,
  "comment": "Very clear visualization",
  "time_spent_seconds": 120
}
```

**Response:**
```json
{
  "success": true,
  "message": "Layer rating stored successfully"
}
```

#### **POST /post-questionnaire**
Submit post-persona questionnaire.

**Request:**
```json
{
  "session_id": "uuid-string",
  "persona_id": "elderly-woman",
  "most_helpful_layer": "layer_2",
  "most_trusted_layer": "layer_3",
  "best_for_customer": "layer_3",
  "overall_intuitiveness": 4,
  "ai_usefulness": 5,
  "improvement_suggestions": "Add more examples"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Questionnaire stored successfully"
}
```

### **Explanation Endpoints** (`/api/v1/explanations`)

#### **POST /level2/dashboard**
Generate concise dashboard summary (<50 words).

**Request:**
```json
{
  "decision": "approved",
  "probability": 0.53,
  "shap_features": [/* top 5 features */]
}
```

**Response:**
```json
{
  "narrative": "**Decision: APPROVED** (53% confidence)\n\n**Key Drivers:**\n• High monthly burden\n\n**Strengths:**\n• Owns property\n\n**Net:** Strengths outweigh risks.",
  "is_llm_generated": true
}
```

#### **POST /level2/narrative**
Generate full narrative explanation (150-200 words).

**Request:**
```json
{
  "decision": "approved",
  "probability": 0.53,
  "shap_features": [/* all features */],
  "all_features": [/* all features */]
}
```

**Response:**
```json
{
  "narrative": "This application is APPROVED with 53% confidence...",
  "is_llm_generated": true
}
```

#### **POST /level3/counterfactuals**
Generate counterfactual scenarios.

**Request:**
```json
{
  "decision": "rejected",
  "probability": 0.47,
  "shap_features": [/* all features */],
  "target": "approved"
}
```

**Response:**
```json
{
  "original": {
    "decision": "rejected",
    "probability": 0.47
  },
  "counterfactuals": [
    {
      "features": {
        "credit_amount": "3500",
        "duration_months": "18"
      },
      "deltas": {
        "credit_amount": {
          "original": "6200",
          "changed": "3500"
        }
      },
      "prediction": "approved",
      "probability": 0.68
    }
  ]
}
```

### **Admin Endpoints** (`/api/v1/admin`)

#### **GET /dashboard-stats**
Get aggregated statistics for results dashboard.

**Response:**
```json
{
  "total_sessions": 25,
  "completed_sessions": 20,
  "total_ratings": 480,
  "avg_understanding": 3.8,
  "avg_communicability": 4.1,
  "avg_cognitive_load": 3.9,
  "layer_stats": {
    "layer_1": {
      "count": 40,
      "understanding": 3.5,
      "communicability": 3.2,
      "cognitive_load": 3.1
    }
    // ... other layers
  },
  "persona_stats": {
    "elderly-woman": {
      "count": 20,
      "understanding": 3.9,
      "communicability": 4.2,
      "cognitive_load": 4.0
    }
    // ... other personas
  }
}
```

---

## 🧠 ML Model Details

### **XGBoost Configuration**

```python
XGBClassifier(
    n_estimators=100,
    max_depth=6,
    learning_rate=0.1,
    subsample=0.8,
    colsample_bytree=0.8,
    random_state=42,
    eval_metric='logloss'
)
```

### **Features (20 total)**

**Numeric (7):**
- Age
- Credit Amount
- Loan Duration (months)
- Installment Rate (% of income)
- Years at Residence
- Existing Credits
- Number of Dependents

**Categorical (13):**
- Checking Account Status
- Savings Account Status
- Credit History
- Loan Purpose
- Employment Duration
- Housing Status
- Property Ownership
- Job Type
- Other Debtors/Guarantors
- Other Payment Plans
- Telephone Registration
- Personal Status & Sex (excluded from model)
- Foreign Worker (excluded from model)

### **Engineered Features (10):**
- Monthly Payment Burden
- Financial Stability Score
- Duration Risk Score
- Credit Risk Ratio
- Credit to Income Ratio

### **SHAP Explanation**

```python
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)
base_value = explainer.expected_value
```

**SHAP Output:**
- Base value: Model's average prediction
- SHAP values: Per-feature contribution to prediction
- Sum of SHAP values + base value = final prediction

---

## 🎨 Frontend Architecture

### **Component Hierarchy**

```
App (layout.tsx)
├── Landing Page (page.tsx)
├── Consent Flow (/consent)
│   └── ConsentClient.tsx
├── Experiment Flow (/experiment)
│   └── Personas (/personas/[personaId])
│       ├── PersonaClient.tsx
│       └── Layers (/layers)
│           ├── LayersClient.tsx
│           ├── Layer1Baseline.tsx
│           ├── Layer2Dashboard.tsx
│           │   ├── RiskTugOfWar.tsx
│           │   ├── FeatureRowAccordion.tsx
│           │   ├── GlobalDistributionLine.tsx
│           │   ├── CategoricalComparison.tsx
│           │   └── RiskLadder.tsx
│           ├── Layer3Narrative.tsx
│           └── Layer4Counterfactual.tsx
└── Results Dashboard (/results)
    └── ResultsClient.tsx
```

### **State Management**

- **Local State:** React `useState` for component-specific state
- **Form State:** Controlled components with validation
- **API State:** Async/await with error handling
- **Session State:** Session ID stored in component state, passed down

### **Styling Approach**

- **TailwindCSS:** Utility-first CSS framework
- **Responsive:** Mobile-first design with breakpoints
- **Animations:** Framer Motion for smooth transitions
- **Color Scheme:**
  - Risk (red): `red-50` to `red-700`
  - Support (green): `green-50` to `green-700`
  - Neutral: `gray-50` to `gray-900`
  - Accent: `blue-50` to `blue-700`

---

## 🔒 Security & Privacy

### **Database Security**

**Row Level Security (RLS) Policies:**
```sql
-- Public read access for results dashboard
CREATE POLICY "Allow public read access" ON sessions
FOR SELECT USING (true);

-- Authenticated users can insert
CREATE POLICY "Allow authenticated insert" ON sessions
FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

### **API Security**

- **CORS:** Configured for frontend domain only
- **Rate Limiting:** [To be implemented]
- **Input Validation:** Pydantic models for all requests
- **SQL Injection:** Prevented by Supabase client
- **XSS:** React automatically escapes content

### **Data Privacy**

- **No PII:** No names, emails, or identifying information
- **Anonymous Sessions:** UUID-based session IDs
- **Consent Required:** Explicit consent before data collection
- **Right to Withdraw:** Participants can exit at any time
- **Data Retention:** [Specify retention policy]

---

## 🚀 Deployment

### **Backend (Railway)**

```yaml
# railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "uvicorn app.main:app --host 0.0.0.0 --port $PORT",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### **Frontend (Netlify)**

```toml
# netlify.toml
[build]
  command = "npm run build"
  publish = "out"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### **Environment Variables**

**Production:**
- All secrets stored in Railway/Netlify environment variables
- Never committed to repository
- Rotated regularly

---

## 📊 Performance Considerations

### **Backend**

- **Model Loading:** Models cached in memory after first load
- **SHAP Computation:** ~100-200ms per prediction
- **Database Queries:** Indexed on session_id and persona_id
- **API Response Time:** Target <500ms for predictions

### **Frontend**

- **Code Splitting:** Next.js automatic code splitting
- **Image Optimization:** Next.js Image component
- **Lazy Loading:** Components loaded on demand
- **Bundle Size:** Target <500KB initial load

---

## 🧪 Testing Strategy

### **Backend Tests**

```bash
pytest backend/tests/
```

- Unit tests for services
- Integration tests for API endpoints
- Model validation tests
- SHAP explanation tests

### **Frontend Tests**

```bash
npm run test
```

- Component unit tests (Jest + React Testing Library)
- Integration tests for user flows
- Accessibility tests (axe-core)

---

## 📈 Monitoring & Logging

### **Backend Logging**

```python
import logging

logger = logging.getLogger(__name__)
logger.info(f"Prediction generated: {decision}")
logger.error(f"Error in SHAP computation: {e}")
```

### **Frontend Logging**

```typescript
console.log('[INFO] Layer rating submitted')
console.error('[ERROR] API call failed:', error)
```

### **Metrics to Track**

- API response times
- Error rates
- Session completion rates
- Layer rating distributions
- Time spent per layer
- Database query performance

---

## 🔄 Future Enhancements

### **Potential Improvements**

1. **Real-time Collaboration:** Multiple researchers viewing results simultaneously
2. **A/B Testing:** Compare different explanation strategies
3. **Mobile App:** Native mobile experience
4. **Advanced Analytics:** Machine learning on rating patterns
5. **Multilingual Support:** Translations for international studies
6. **Accessibility:** Enhanced screen reader support
7. **Export Functionality:** Download results as CSV/Excel
8. **Advanced Counterfactuals:** DICE-ML integration

---

**Last Updated:** December 2025
