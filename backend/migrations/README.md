# Database Schema for XAI Credit Experiment

## 🎯 SINGLE SOURCE OF TRUTH

**USE THIS FILE:** `FINAL_CLEAN_SCHEMA.sql` ✅

This is the **final, production-ready** schema reflecting all applied migrations.

**Status:** ✅ Updated 2025-12-06  
**Database:** Supabase (PostgreSQL)  
**Rating Dimensions:** 3 (Understanding, Communicability, Mental Ease)

---

## Overview

This schema supports a within-subjects experiment design for evaluating explainable AI in credit decisions.

### Experiment Structure
- **2 Personas**: elderly-woman (borderline approved), young-entrepreneur (borderline rejected)
- **4 Explanation Layers** per persona:
  1. Baseline SHAP Explanation (technical table)
  2. Interactive Dashboard (visual charts)
  3. Narrative Explanation (natural language + chatbot)
  4. Counterfactual Analysis (what-if scenarios)
- **3 Rating Dimensions** per layer (Likert 1-5):
  1. Understanding
  2. Communicability
  3. Mental Ease (5=easy, 1=hard - inverted cognitive load)
- **Total**: 2 personas × 4 layers × 3 ratings = 24 ratings per participant

## Tables

### 1. `sessions`
Stores consent and baseline questionnaire data.

| Column | Type | Description |
|--------|------|-------------|
| session_id | TEXT | Unique session identifier (UUID) |
| consent_given | BOOLEAN | Research consent |
| participant_background | TEXT | banking, data_analytics, student, other |
| credit_experience | TEXT | none, some, regular, expert |
| ai_familiarity | INTEGER | 1-5 Likert scale |
| preferred_explanation_style | TEXT | technical, visual, narrative, action_oriented |
| background_notes | TEXT | Optional free text |
| completed | BOOLEAN | Session completed flag |
| created_at | TIMESTAMP | Session start time |
| completed_at | TIMESTAMP | Session end time |

### 2. `predictions`
Stores AI predictions for each persona.

| Column | Type | Description |
|--------|------|-------------|
| session_id | TEXT | FK to sessions |
| persona_id | TEXT | elderly-woman, young-entrepreneur |
| decision | TEXT | approved or rejected |
| probability | DECIMAL | Model confidence (0-1) |
| shap_values | JSONB | SHAP feature contributions |
| input_features | JSONB | Application data used |

### 3. `layer_ratings`
Stores ratings for each explanation layer (12 per session).

| Column | Type | Description |
|--------|------|-------------|
| session_id | TEXT | FK to sessions |
| persona_id | TEXT | Which persona |
| layer_number | INTEGER | 1-4 |
| layer_name | TEXT | Human-readable layer name |
| understanding_rating | INTEGER | 1-5 |
| communicability_rating | INTEGER | 1-5 |
| cognitive_load_rating | INTEGER | 1-5 (inverted: 5=easy) |
| comment | TEXT | Optional feedback |
| time_spent_seconds | INTEGER | Time on this layer |

### 4. `post_questionnaires`
Stores final questionnaire (one per session).

| Column | Type | Description |
|--------|------|-------------|
| session_id | TEXT | FK to sessions |
| most_helpful_layer | TEXT | layer_1 to layer_4 |
| most_trusted_layer | TEXT | layer_1 to layer_4 |
| best_for_customer | TEXT | layer_1 to layer_4 |
| overall_intuitiveness | INTEGER | 1-5 |
| ai_usefulness | INTEGER | 1-5 |
| improvement_suggestions | TEXT | Optional feedback |

## Views

### `experiment_complete_data`
Aggregated view joining sessions with ratings and post-questionnaire.

### `layer_performance_analysis`
Per-layer statistics with mean, stddev for all rating dimensions.

## Setup

**Your database is already set up correctly!** ✅

If you need to recreate the schema from scratch, run `FINAL_CLEAN_SCHEMA.sql` in Supabase SQL Editor.

## Applied Migrations

The following migrations have been applied to reach the current schema:

1. ✅ **Inverted Cognitive Load Scale** (5=easy instead of 5=hard)
2. ✅ **Removed Perceived Fairness Rating** (5 → 4 dimensions)
3. ✅ **Removed Reliance Intention Rating** (4 → 3 dimensions)

All migration files have been removed. `FINAL_CLEAN_SCHEMA.sql` is the single source of truth.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/experiment/session` | POST | Create session with consent + baseline |
| `/api/v1/experiment/predict_persona` | POST | Get AI prediction for persona |
| `/api/v1/experiment/rate-layer` | POST | Submit layer rating |
| `/api/v1/experiment/post-questionnaire` | POST | Submit final questionnaire |

## Data Flow

```
1. Consent + Baseline → sessions table
2. For each persona (2x):
   a. Submit application → predictions table
   b. For each layer (4x):
      - View explanation
      - Submit 3 ratings → layer_ratings table
   c. Post-persona questionnaire → post_questionnaires table
3. Session marked complete
```

## Rating Questions

**Per-Layer Ratings (3 questions, Likert 1-5):**
1. "I understood the explanation provided in this layer."
2. "I could easily communicate this explanation to the applicant."
3. "The explanation was easy to understand without much mental effort." (5=easy)

**Post-Persona Questionnaire (6 questions):**
1. Most helpful layer (layer_1 to layer_4)
2. Most trusted layer (layer_1 to layer_4)
3. Best for customer communication (layer_1 to layer_4)
4. Overall intuitiveness (1-5)
5. AI usefulness (1-5)
6. Improvement suggestions (optional text)
