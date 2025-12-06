# 🗄️ Database Schema Documentation

**Last Updated:** 2025-12-06  
**Database:** Supabase PostgreSQL

---

## 📊 **Table Overview**

| Table | Purpose | Records Type |
|-------|---------|--------------|
| `sessions` | Core session data + demographics | Transactional |
| `predictions` | ML predictions + SHAP values | Transactional |
| `layer_ratings` | User ratings per layer | Transactional |
| `post_questionnaires` | Post-experiment feedback | Transactional |
| `experiment_complete_data` | Aggregated experiment data | View |
| `layer_performance_analysis` | Layer performance metrics | View |

---

## 🔑 **Core Tables**

### 1️⃣ **`sessions`** - Participant Sessions

**Purpose:** Stores participant demographic data and session metadata.

#### **Columns:**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key (auto-generated) |
| `session_id` | text | NO | Unique session identifier |
| `consent_given` | boolean | NO | Whether participant gave consent |
| `completed` | boolean | NO | Whether session is completed |
| `current_step` | text | YES | Current step in experiment flow |
| `created_at` | timestamptz | NO | Session creation timestamp |
| `updated_at` | timestamptz | NO | Last update timestamp |
| `completed_at` | timestamptz | YES | Session completion timestamp |
| **Demographics** | | | |
| `age` | integer | YES | Participant age |
| `gender` | text | YES | Gender (male/female/non_binary/prefer_not_to_say) |
| `financial_relationship` | text | YES | Financial experience level |
| **Preferences** | | | |
| `preferred_explanation_style` | text | YES | Preferred explanation style |
| `ai_trust_instinct` | text | YES | AI trust stance |
| `ai_fairness_stance` | text | YES | AI fairness perception |

#### **Indexes:**
- Primary key on `id`
- Unique constraint on `session_id`

#### **Sample Data:**
```json
{
  "session_id": "6047629f-9c86-4212-86a3-b009ba163a9f",
  "consent_given": true,
  "age": 18,
  "gender": "non_binary",
  "financial_relationship": "novice",
  "preferred_explanation_style": "technical",
  "ai_trust_instinct": "automation_bias",
  "ai_fairness_stance": "skeptic",
  "completed": true,
  "created_at": "2025-12-06T22:19:55.395309Z",
  "completed_at": "2025-12-06T22:23:09.3683Z"
}
```

---

### 2️⃣ **`predictions`** - ML Model Predictions

**Purpose:** Stores credit risk predictions with SHAP explanations.

#### **Columns:**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key (auto-generated) |
| `session_id` | text | NO | Foreign key to sessions |
| `persona_id` | text | YES | Persona identifier (elderly-woman/young-entrepreneur) |
| `decision` | text | NO | Model decision (approved/rejected) |
| `probability` | numeric | NO | Approval probability (0-1) |
| `shap_values` | jsonb | YES | SHAP feature importance values |
| `input_features` | jsonb | YES | Application input features |
| `created_at` | timestamptz | NO | Prediction timestamp |

#### **Sample Data:**
```json
{
  "session_id": "6047629f-9c86-4212-86a3-b009ba163a9f",
  "persona_id": "elderly-woman",
  "decision": "approved",
  "probability": 0.8234,
  "shap_values": {
    "Credit Amount": -0.234,
    "Loan Duration (months)": 0.156,
    "Age (years)": 0.089
  },
  "input_features": {
    "credit_amount": 5000,
    "duration": 24,
    "age": 65
  }
}
```

---

### 3️⃣ **`layer_ratings`** - Layer Ratings

**Purpose:** Stores user ratings for each explanation layer.

#### **Columns:**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key (auto-generated) |
| `session_id` | text | NO | Foreign key to sessions |
| `persona_id` | text | NO | Persona identifier |
| `layer_number` | integer | NO | Layer number (0-5) |
| `layer_name` | text | NO | Layer name |
| `understanding_rating` | integer | NO | Understanding rating (1-5) |
| `communicability_rating` | integer | NO | Communicability rating (1-5) |
| `cognitive_load_rating` | integer | NO | Cognitive load rating (1-5) |
| `comment` | text | YES | Optional comment |
| `time_spent_seconds` | integer | NO | Time spent on layer |
| `created_at` | timestamptz | NO | Rating timestamp |

#### **Layer Mapping:**
- **Layer 0:** All Features (comprehensive table)
- **Layer 1:** Minimal (top 3 features)
- **Layer 2:** Dashboard (visual summary)
- **Layer 3:** Narrative (LLM explanation)
- **Layer 4:** Counterfactual (what-if scenarios)
- **Layer 5:** Interactive Chat (Q&A)

---

### 4️⃣ **`post_questionnaires`** - Post-Experiment Feedback

**Purpose:** Stores participant feedback after completing all layers.

#### **Columns:**

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key (auto-generated) |
| `session_id` | text | NO | Foreign key to sessions |
| `persona_id` | text | NO | Persona identifier |
| `most_helpful_layer` | text | YES | Most helpful layer |
| `most_trusted_layer` | text | YES | Most trusted layer |
| `best_for_customer` | text | YES | Best layer for customers |
| `overall_intuitiveness` | integer | YES | Overall intuitiveness (1-5) |
| `ai_usefulness` | integer | YES | AI usefulness rating (1-5) |
| `improvement_suggestions` | text | YES | Improvement suggestions |
| `created_at` | timestamptz | NO | Questionnaire timestamp |

---

## 📈 **Views (Aggregated Data)**

### 5️⃣ **`experiment_complete_data`** - Complete Session Data

**Purpose:** Aggregated view combining session, ratings, and questionnaire data.

#### **Columns:**
- All `sessions` columns
- Aggregated metrics:
  - `total_layer_ratings` (count)
  - `avg_understanding` (average)
  - `avg_communicability` (average)
  - `avg_cognitive_load` (average)
  - `total_time_spent_seconds` (sum)
- Post-questionnaire fields (from last completed questionnaire)

---

### 6️⃣ **`layer_performance_analysis`** - Layer Performance Metrics

**Purpose:** Performance analysis per layer and persona.

#### **Columns:**
- `layer_number` (integer)
- `layer_name` (text)
- `persona_id` (text)
- `total_ratings` (count)
- `avg_understanding` (average)
- `stddev_understanding` (standard deviation)
- `avg_communicability` (average)
- `stddev_communicability` (standard deviation)
- `avg_cognitive_load` (average)
- `stddev_cognitive_load` (standard deviation)
- `avg_time_seconds` (average)
- `min_time_seconds` (minimum)
- `max_time_seconds` (maximum)

---

## 🔄 **Data Flow**

```
1. User starts experiment
   ↓
   sessions (created with demographics)
   
2. User views persona prediction
   ↓
   predictions (ML prediction + SHAP values)
   
3. User rates each layer
   ↓
   layer_ratings (6 ratings per persona)
   
4. User completes post-questionnaire
   ↓
   post_questionnaires (feedback per persona)
   
5. Data aggregated in views
   ↓
   experiment_complete_data + layer_performance_analysis
```

---

## 🧹 **Recent Cleanup (2025-12-06)**

### **Removed Legacy Columns from `sessions`:**

| Column | Reason for Removal |
|--------|-------------------|
| `participant_background` | Replaced by `gender`, `age`, `financial_relationship` |
| `credit_experience` | No longer collected |
| `ai_familiarity` | No longer collected |
| `background_notes` | No longer collected |

**Migration:** `CLEANUP_LEGACY_COLUMNS.sql`

---

## 📝 **Field Enumerations**

### **Gender Values:**
- `male`
- `female`
- `non_binary`
- `prefer_not_to_say`

### **Financial Relationship:**
- `novice` - New to financial products
- `intermediate` - Some experience
- `expert` - Extensive experience

### **AI Trust Instinct:**
- `automation_bias` - Tends to trust AI
- `skeptical` - Questions AI decisions
- `neutral` - Balanced view

### **AI Fairness Stance:**
- `optimist` - Believes AI is fair
- `skeptic` - Concerned about bias
- `pragmatist` - Depends on implementation

### **Preferred Explanation Style:**
- `visual` - Prefers charts/graphs
- `technical` - Prefers detailed data
- `narrative` - Prefers text explanations
- `interactive` - Prefers Q&A

### **Decision Values:**
- `approved` - Loan approved
- `rejected` - Loan rejected

---

## 🔐 **Security & Access**

### **Row Level Security (RLS):**
- All tables should have RLS enabled
- Public read access for research purposes
- Write access restricted to authenticated backend

### **API Access:**
- Backend uses service role key for full access
- Frontend uses anon key with RLS policies

---

## 📊 **Data Export Queries**

### **Export Complete Session Data:**
```sql
SELECT * FROM experiment_complete_data
WHERE completed = true
ORDER BY session_completed DESC;
```

### **Export Layer Performance:**
```sql
SELECT * FROM layer_performance_analysis
ORDER BY layer_number, persona_id;
```

### **Export Raw Ratings:**
```sql
SELECT 
  lr.*,
  s.age,
  s.gender,
  s.financial_relationship
FROM layer_ratings lr
JOIN sessions s ON lr.session_id = s.session_id
WHERE s.completed = true
ORDER BY lr.created_at;
```

---

## 🛠️ **Maintenance**

### **Check Data Integrity:**
```sql
-- Check for orphaned predictions
SELECT COUNT(*) FROM predictions p
WHERE NOT EXISTS (
  SELECT 1 FROM sessions s WHERE s.session_id = p.session_id
);

-- Check for incomplete sessions
SELECT COUNT(*) FROM sessions
WHERE completed = false
AND created_at < NOW() - INTERVAL '24 hours';
```

### **Clean Up Old Test Data:**
```sql
-- Delete sessions older than 30 days that are incomplete
DELETE FROM sessions
WHERE completed = false
AND created_at < NOW() - INTERVAL '30 days';
```

---

## 📚 **Related Documentation**

- **Migration Files:** `/backend/migrations/`
- **Backend Models:** `/backend/app/services/supabase_service.py`
- **API Endpoints:** `/backend/app/api/experiment_clean.py`
- **Frontend Types:** `/frontend/types/`

---

## ✅ **Schema Status**

| Component | Status | Notes |
|-----------|--------|-------|
| Core tables | ✅ Clean | Legacy columns removed |
| Indexes | ✅ Optimized | Primary keys + unique constraints |
| Views | ✅ Working | Aggregation views functional |
| RLS | ⚠️ Review | Ensure policies are correct |
| Backups | ✅ Enabled | Supabase automatic backups |

---

**Next Steps:**
1. ✅ Run `CLEANUP_LEGACY_COLUMNS.sql` migration
2. ⚠️ Review and update RLS policies
3. 📊 Set up automated data exports
4. 🔍 Monitor query performance
