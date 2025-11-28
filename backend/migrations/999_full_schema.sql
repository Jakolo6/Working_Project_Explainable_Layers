-- ============================================================================
-- COMPLETE DATABASE SCHEMA FOR XAI FINANCIAL SERVICES RESEARCH PLATFORM
-- ============================================================================
-- This script creates all tables needed for the experiment from scratch.
-- Run this after 000_drop_all_tables.sql for a clean database setup.
-- ============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. SESSIONS TABLE (Parent table - stores participant info)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    participant_name TEXT NOT NULL,
    participant_age INTEGER CHECK (participant_age >= 18 AND participant_age <= 100),
    participant_profession TEXT,
    finance_experience TEXT CHECK (finance_experience IN ('none', 'basic', 'intermediate', 'advanced')),
    ai_familiarity TEXT CHECK (ai_familiarity IN ('none', 'basic', 'intermediate', 'advanced')),
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB
);

COMMENT ON TABLE sessions IS 'Stores participant information and session metadata';
COMMENT ON COLUMN sessions.completed IS 'True when participant finishes all personas and post-questionnaire';

-- ============================================================================
-- 2. PRE-EXPERIMENT QUESTIONNAIRE
-- ============================================================================
CREATE TABLE IF NOT EXISTS pre_experiment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    expectation_ai_decision TEXT,
    expectation_fair_explanation TEXT,
    expectation_role_explanations TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE pre_experiment_responses IS 'Captures participant expectations before AI exposure';

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
COMMENT ON COLUMN predictions.shap_values IS 'Top SHAP features with values and impacts';
COMMENT ON COLUMN predictions.input_features IS 'Raw input data used for prediction';

-- ============================================================================
-- 4. LAYER RATINGS TABLE (NEW - Core research data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS layer_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    persona_id TEXT NOT NULL CHECK (persona_id IN ('elderly-woman', 'young-entrepreneur', 'middle-aged-employee')),
    layer_number INTEGER NOT NULL CHECK (layer_number >= 1 AND layer_number <= 4),
    layer_name TEXT NOT NULL CHECK (layer_name IN ('Complete SHAP Analysis', 'Analytical Dashboard', 'Narrative Explanation', 'Counterfactual Analysis')),
    trust_rating INTEGER NOT NULL CHECK (trust_rating >= 1 AND trust_rating <= 5),
    understanding_rating INTEGER NOT NULL CHECK (understanding_rating >= 1 AND understanding_rating <= 5),
    usefulness_rating INTEGER NOT NULL CHECK (usefulness_rating >= 1 AND usefulness_rating <= 5),
    mental_effort_rating INTEGER NOT NULL CHECK (mental_effort_rating >= 1 AND mental_effort_rating <= 5),
    comment TEXT DEFAULT '',
    time_spent_seconds INTEGER NOT NULL CHECK (time_spent_seconds >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE layer_ratings IS 'Stores participant ratings for each explanation layer (4 layers × 3 personas = 12 ratings per participant)';
COMMENT ON COLUMN layer_ratings.trust_rating IS '1=Not at all, 5=Completely';
COMMENT ON COLUMN layer_ratings.understanding_rating IS '1=Not at all, 5=Completely';
COMMENT ON COLUMN layer_ratings.usefulness_rating IS '1=Not useful, 5=Very useful';
COMMENT ON COLUMN layer_ratings.mental_effort_rating IS '1=Very easy, 5=Very difficult';

-- ============================================================================
-- 5. POST-EXPERIMENT QUESTIONNAIRE
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_questionnaires (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    overall_experience INTEGER NOT NULL CHECK (overall_experience >= 1 AND overall_experience <= 5),
    explanation_helpfulness INTEGER NOT NULL CHECK (explanation_helpfulness >= 1 AND explanation_helpfulness <= 5),
    preferred_layer TEXT NOT NULL CHECK (preferred_layer IN ('Minimal', 'Feature Importance', 'Detailed SHAP', 'Visual', 'Counterfactual')),
    would_trust_ai INTEGER NOT NULL CHECK (would_trust_ai >= 1 AND would_trust_ai <= 5),
    comments TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE post_questionnaires IS 'Stores post-experiment questionnaire responses (1 per participant)';
COMMENT ON COLUMN post_questionnaires.preferred_layer IS 'Which explanation layer the participant found most useful overall';

-- ============================================================================
-- 6. LEGACY TABLES (Kept for backward compatibility - can be removed later)
-- ============================================================================

-- Layer Feedback (Old qualitative feedback system - replaced by layer_ratings)
CREATE TABLE IF NOT EXISTS layer_feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    persona_id TEXT NOT NULL,
    layer_id INTEGER CHECK (layer_id BETWEEN 1 AND 4),
    layer_name TEXT NOT NULL,
    understanding_gained TEXT,
    unclear_aspects TEXT,
    customer_confidence TEXT,
    interpretation_effort INTEGER CHECK (interpretation_effort BETWEEN 1 AND 7),
    expectation_difference TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE layer_feedback IS 'LEGACY: Old qualitative feedback system. Use layer_ratings for new data.';

-- Post Experiment Responses (Old format - replaced by post_questionnaires)
CREATE TABLE IF NOT EXISTS post_experiment_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    best_format TEXT,
    most_credible TEXT,
    most_useful TEXT,
    impact_on_perception TEXT,
    future_recommendations TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE post_experiment_responses IS 'LEGACY: Old post-experiment format. Use post_questionnaires for new data.';

-- Participant Responses (Very old format - deprecated)
CREATE TABLE IF NOT EXISTS participant_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    trust_rating INTEGER CHECK (trust_rating BETWEEN 1 AND 7),
    understanding_rating INTEGER CHECK (understanding_rating BETWEEN 1 AND 7),
    usefulness_rating INTEGER CHECK (usefulness_rating BETWEEN 1 AND 7),
    mental_effort_rating INTEGER CHECK (mental_effort_rating BETWEEN 1 AND 7),
    decision TEXT,
    probability FLOAT,
    explanation_layer TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE participant_responses IS 'LEGACY: Very old format. Use layer_ratings for new data.';

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
CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(timestamp);
CREATE INDEX IF NOT EXISTS idx_predictions_session_persona ON predictions(session_id, persona_id);

-- Layer ratings indexes (IMPORTANT - main research data)
CREATE INDEX IF NOT EXISTS idx_layer_ratings_session ON layer_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_layer_ratings_persona ON layer_ratings(persona_id);
CREATE INDEX IF NOT EXISTS idx_layer_ratings_layer ON layer_ratings(layer_number);
CREATE INDEX IF NOT EXISTS idx_layer_ratings_session_persona_layer ON layer_ratings(session_id, persona_id, layer_number);

-- Post-questionnaire indexes
CREATE INDEX IF NOT EXISTS idx_post_questionnaires_session ON post_questionnaires(session_id);

-- Legacy table indexes
CREATE INDEX IF NOT EXISTS idx_layer_feedback_session_id ON layer_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_layer_feedback_persona_layer ON layer_feedback(persona_id, layer_id);
CREATE INDEX IF NOT EXISTS idx_post_experiment_session_id ON post_experiment_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_participant_responses_session_id ON participant_responses(session_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_experiment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE layer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE layer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_experiment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_responses ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (allow all operations for now)
-- NOTE: In production, you should restrict these based on authentication

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

CREATE POLICY "Allow all operations on layer_feedback" ON layer_feedback
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on post_experiment_responses" ON post_experiment_responses
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on participant_responses" ON participant_responses
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- After running this script, verify the setup with:
--
-- 1. List all tables:
--    SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
--
-- 2. Check table sizes:
--    SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
--    FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
--
-- 3. Verify foreign key constraints:
--    SELECT conname, conrelid::regclass, confrelid::regclass
--    FROM pg_constraint WHERE contype = 'f';
--
-- ============================================================================
-- EXPECTED DATA FLOW
-- ============================================================================
-- 1. Participant starts → INSERT into sessions
-- 2. Pre-questionnaire → INSERT into pre_experiment_responses
-- 3. For each persona (3 total):
--    a. Generate prediction → INSERT into predictions
--    b. For each layer (5 total):
--       - Show explanation layer
--       - Collect ratings → INSERT into layer_ratings
-- 4. Post-questionnaire → INSERT into post_questionnaires
-- 5. Mark session complete → UPDATE sessions SET completed = TRUE
--
-- Total records per participant:
-- - 1 session
-- - 1 pre_experiment_response
-- - 3 predictions (one per persona)
-- - 15 layer_ratings (5 layers × 3 personas)
-- - 1 post_questionnaire
-- ============================================================================
