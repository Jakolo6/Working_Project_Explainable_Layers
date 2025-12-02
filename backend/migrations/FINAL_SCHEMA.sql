-- ============================================================================
-- FINAL DATABASE SCHEMA FOR XAI FINANCIAL SERVICES RESEARCH PLATFORM
-- ============================================================================
-- This is the consolidated, production-ready schema.
-- Run this after dropping all tables for a clean database setup.
-- Last updated: 2025-11-30
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. SESSIONS TABLE (Parent table - stores participant info + baseline questions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Consent
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    -- Baseline Questions (Q1-Q5)
    participant_background TEXT CHECK (participant_background IN ('banking', 'data_analytics', 'student', 'other')),
    credit_experience TEXT CHECK (credit_experience IN ('none', 'some', 'regular', 'expert')),
    ai_familiarity INTEGER CHECK (ai_familiarity >= 1 AND ai_familiarity <= 5),
    preferred_explanation_style TEXT CHECK (preferred_explanation_style IN ('technical', 'visual', 'narrative', 'action_oriented')),
    background_notes TEXT DEFAULT '',
    -- Session status
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

COMMENT ON TABLE sessions IS 'Stores consent, baseline questionnaire, and session metadata';
COMMENT ON COLUMN sessions.consent_given IS 'Required consent for research participation';
COMMENT ON COLUMN sessions.participant_background IS 'Q1: banking, data_analytics, student, other';
COMMENT ON COLUMN sessions.credit_experience IS 'Q2: none, some, regular, expert';
COMMENT ON COLUMN sessions.ai_familiarity IS 'Q3: Likert 1-5';
COMMENT ON COLUMN sessions.preferred_explanation_style IS 'Q4: technical, visual, narrative, action_oriented';
COMMENT ON COLUMN sessions.background_notes IS 'Q5: Optional free text';

-- ============================================================================
-- 2. PRE-EXPERIMENT QUESTIONNAIRE (DEPRECATED - merged into sessions table)
-- ============================================================================
-- Note: Baseline questions are now stored directly in the sessions table.
-- This table is kept for backward compatibility but should not be used for new data.
CREATE TABLE IF NOT EXISTS pre_experiment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    expectation_ai_decision TEXT,
    expectation_fair_explanation TEXT,
    expectation_role_explanations TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE pre_experiment_responses IS 'DEPRECATED: Baseline questions now in sessions table';

-- ============================================================================
-- 3. PREDICTIONS TABLE (Stores AI decisions for each persona)
-- ============================================================================
CREATE TABLE IF NOT EXISTS predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    persona_id TEXT NOT NULL CHECK (persona_id IN ('elderly-woman', 'young-entrepreneur', 'middle-aged-employee')),
    decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
    probability FLOAT NOT NULL CHECK (probability >= 0 AND probability <= 1),
    confidence_score FLOAT CHECK (confidence_score >= 0 AND confidence_score <= 1),
    shap_values JSONB NOT NULL,
    input_features JSONB NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE predictions IS 'Stores model predictions and SHAP explanations for each persona';

-- ============================================================================
-- 4. LAYER RATINGS TABLE (Core research data - 4 layers)
-- ============================================================================
-- Current layers:
--   1. Baseline SHAP Explanation - Simple SHAP table
--   2. Interactive Dashboard - Visual dashboard with charts
--   3. Narrative Explanation - LLM-generated text explanation
--   4. Counterfactual Analysis - What-if scenarios
-- ============================================================================
CREATE TABLE IF NOT EXISTS layer_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    persona_id TEXT NOT NULL CHECK (persona_id IN ('elderly-woman', 'young-entrepreneur', 'middle-aged-employee')),
    layer_number INTEGER NOT NULL CHECK (layer_number >= 1 AND layer_number <= 4),
    layer_name TEXT NOT NULL,
    -- New rating dimensions (all Likert 1-5)
    understanding_rating INTEGER NOT NULL CHECK (understanding_rating >= 1 AND understanding_rating <= 5),
    communicability_rating INTEGER NOT NULL CHECK (communicability_rating >= 1 AND communicability_rating <= 5),
    perceived_fairness_rating INTEGER NOT NULL CHECK (perceived_fairness_rating >= 1 AND perceived_fairness_rating <= 5),
    cognitive_load_rating INTEGER NOT NULL CHECK (cognitive_load_rating >= 1 AND cognitive_load_rating <= 5),
    reliance_intention_rating INTEGER NOT NULL CHECK (reliance_intention_rating >= 1 AND reliance_intention_rating <= 5),
    comment TEXT DEFAULT '',
    time_spent_seconds INTEGER NOT NULL CHECK (time_spent_seconds >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE layer_ratings IS 'Stores participant ratings for each explanation layer (4 layers × 3 personas = 12 ratings per participant)';
COMMENT ON COLUMN layer_ratings.layer_name IS 'Layer names: Baseline SHAP Explanation, Interactive Dashboard, Narrative Explanation, Counterfactual Analysis';
COMMENT ON COLUMN layer_ratings.understanding_rating IS 'This explanation helped me understand why the decision was made (1-5)';
COMMENT ON COLUMN layer_ratings.communicability_rating IS 'I could use this explanation to communicate the decision (1-5)';
COMMENT ON COLUMN layer_ratings.perceived_fairness_rating IS 'This explanation feels fair and appropriate (1-5)';
COMMENT ON COLUMN layer_ratings.cognitive_load_rating IS 'I found this explanation mentally demanding (1-5)';
COMMENT ON COLUMN layer_ratings.reliance_intention_rating IS 'I would rely on this explanation in a real scenario (1-5)';

-- ============================================================================
-- 5. POST-EXPERIMENT QUESTIONNAIRE
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    -- Q1-Q3: Layer preference questions
    most_helpful_layer TEXT NOT NULL CHECK (most_helpful_layer IN ('layer_1', 'layer_2', 'layer_3', 'layer_4')),
    most_trusted_layer TEXT NOT NULL CHECK (most_trusted_layer IN ('layer_1', 'layer_2', 'layer_3', 'layer_4')),
    best_for_customer TEXT NOT NULL CHECK (best_for_customer IN ('layer_1', 'layer_2', 'layer_3', 'layer_4')),
    -- Q4-Q5: Likert ratings
    overall_intuitiveness INTEGER NOT NULL CHECK (overall_intuitiveness >= 1 AND overall_intuitiveness <= 5),
    ai_usefulness INTEGER NOT NULL CHECK (ai_usefulness >= 1 AND ai_usefulness <= 5),
    -- Q6: Optional text
    improvement_suggestions TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE post_questionnaires IS 'Stores post-experiment questionnaire responses (1 per participant)';
COMMENT ON COLUMN post_questionnaires.most_helpful_layer IS 'Q1: Which layer was most helpful';
COMMENT ON COLUMN post_questionnaires.most_trusted_layer IS 'Q2: Which layer was most trusted';
COMMENT ON COLUMN post_questionnaires.best_for_customer IS 'Q3: Which layer best for customer communication';
COMMENT ON COLUMN post_questionnaires.overall_intuitiveness IS 'Q4: How intuitive were explanations overall (1-5)';
COMMENT ON COLUMN post_questionnaires.ai_usefulness IS 'Q5: How useful would AI assistant be (1-5)';
COMMENT ON COLUMN post_questionnaires.improvement_suggestions IS 'Q6: Optional improvement suggestions';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_completed ON sessions(completed);

-- Pre-experiment indexes
CREATE INDEX IF NOT EXISTS idx_pre_experiment_session_id ON pre_experiment_responses(session_id);

-- Predictions indexes
CREATE INDEX IF NOT EXISTS idx_predictions_session_id ON predictions(session_id);
CREATE INDEX IF NOT EXISTS idx_predictions_persona_id ON predictions(persona_id);
CREATE INDEX IF NOT EXISTS idx_predictions_session_persona ON predictions(session_id, persona_id);

-- Layer ratings indexes (IMPORTANT - main research data)
CREATE INDEX IF NOT EXISTS idx_layer_ratings_session ON layer_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_layer_ratings_persona ON layer_ratings(persona_id);
CREATE INDEX IF NOT EXISTS idx_layer_ratings_layer ON layer_ratings(layer_number);
CREATE INDEX IF NOT EXISTS idx_layer_ratings_session_persona_layer ON layer_ratings(session_id, persona_id, layer_number);

-- Post-questionnaire indexes
CREATE INDEX IF NOT EXISTS idx_post_questionnaires_session ON post_questionnaires(session_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_experiment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE layer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_questionnaires ENABLE ROW LEVEL SECURITY;

-- Permissive policies (allow all operations via anon key)
CREATE POLICY "Allow all operations on sessions" ON sessions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on pre_experiment_responses" ON pre_experiment_responses
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on predictions" ON predictions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on layer_ratings" ON layer_ratings
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on post_questionnaires" ON post_questionnaires
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- DATA FLOW SUMMARY
-- ============================================================================
-- 1. Consent + Baseline questionnaire → INSERT into sessions (consent_given, Q1-Q5)
-- 2. For each persona (3 total):
--    a. Generate prediction → INSERT into predictions
--    b. For each layer (4 total):
--       - Show explanation layer
--       - Collect ratings → INSERT into layer_ratings (5 Likert items + optional comment)
-- 3. Post-questionnaire → INSERT into post_questionnaires (Q1-Q6)
-- 4. Mark session complete → UPDATE sessions SET completed = TRUE
--
-- Total records per participant:
-- - 1 session (with consent + baseline)
-- - 3 predictions (one per persona)
-- - 12 layer_ratings (4 layers × 3 personas)
-- - 1 post_questionnaire
-- ============================================================================
