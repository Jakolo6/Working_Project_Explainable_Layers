# Database Schema for XAI Credit Experiment

## 🎯 CURRENT PRODUCTION SCHEMA

**USE THIS FILE:** `PRODUCTION_SCHEMA.sql` ✅

This is the **final, verified, production-ready** schema that matches your current working database.

**Status:** ✅ Verified on 2025-12-06  
**Database:** Supabase (PostgreSQL)  
**Records:** 11 sessions, 16 predictions, 49 layer ratings

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
- **5 Rating Dimensions** per layer (Likert 1-5):
  1. Understanding
  2. Communicability
  3. Perceived Fairness
  4. Cognitive Load
  5. Reliance Intention
- **Total**: 2 personas × 4 layers = 8 layer ratings per participant

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
| perceived_fairness_rating | INTEGER | 1-5 |
| cognitive_load_rating | INTEGER | 1-5 |
| reliance_intention_rating | INTEGER | 1-5 |
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

If you need to recreate the schema, run `PRODUCTION_SCHEMA.sql` in Supabase SQL Editor to:
1. Create all tables (sessions, predictions, layer_ratings, post_questionnaires)
2. Set up indexes for performance
3. Enable RLS policies for security
4. Create analysis views

## Migration Files (Archive)

- `PRODUCTION_SCHEMA.sql` - ✅ **CURRENT PRODUCTION SCHEMA** (use this one!)
- `FINAL_CLEAN_SCHEMA.sql` - Previous version (archived)
- `UPDATE_QUESTIONNAIRE_SCHEMA.sql` - Questionnaire updates (archived)
- `ADD_DELETE_POLICIES.sql` - RLS policy updates (archived)
- `REVIEW_ALL_DATA.sql` - Data analysis queries (archived)

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
2. For each persona (3x):
   a. Submit application → predictions table
   b. For each layer (4x):
      - View explanation
      - Submit rating → layer_ratings table
3. Post-questionnaire → post_questionnaires table
   → Session marked complete
```
