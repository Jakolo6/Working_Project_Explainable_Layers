-- SQL Schema for XAI Financial Services Research Platform
-- This file contains all the necessary table creation statements for the Supabase database

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CORE TABLES
-- ============================================================================

-- Sessions Table
-- Stores participant information and session metadata
CREATE TABLE IF NOT EXISTS sessions (
  session_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  participant_name TEXT NOT NULL,
  participant_age INTEGER,
  participant_profession TEXT,
  finance_experience TEXT,
  ai_familiarity INTEGER CHECK (ai_familiarity BETWEEN 1 AND 5),
  completed BOOLEAN DEFAULT FALSE,
  metadata JSONB
);

-- ============================================================================
-- QUESTIONNAIRE TABLES
-- ============================================================================

-- Pre-Experiment Questionnaire Responses
-- Captures participant expectations before exposure to AI explanations
CREATE TABLE IF NOT EXISTS pre_experiment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
  expectation_ai_decision TEXT,
  expectation_fair_explanation TEXT,
  expectation_role_explanations TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Post-Experiment Questionnaire Responses
-- Captures overall impressions after completing all personas and layers
CREATE TABLE IF NOT EXISTS post_experiment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
  best_format TEXT,
  most_credible TEXT,
  most_useful TEXT,
  impact_on_perception TEXT,
  future_recommendations TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PREDICTION AND EXPLANATION TABLES
-- ============================================================================

-- Predictions Table
-- Stores model predictions and explanations for each persona
CREATE TABLE IF NOT EXISTS predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
  persona_id TEXT NOT NULL,
  decision TEXT NOT NULL,
  probability FLOAT NOT NULL,
  confidence_score FLOAT,
  shap_values JSONB,
  input_features JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Layer Feedback Table
-- Stores participant reflections for each explanation layer
CREATE TABLE IF NOT EXISTS layer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
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

-- ============================================================================
-- LEGACY TABLE (kept for backward compatibility)
-- ============================================================================

-- Participant Responses Table (deprecated - use layer_feedback instead)
CREATE TABLE IF NOT EXISTS participant_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES sessions(session_id) ON DELETE CASCADE,
  trust_rating INTEGER CHECK (trust_rating BETWEEN 1 AND 7),
  understanding_rating INTEGER CHECK (understanding_rating BETWEEN 1 AND 7),
  usefulness_rating INTEGER CHECK (usefulness_rating BETWEEN 1 AND 7),
  mental_effort_rating INTEGER CHECK (mental_effort_rating BETWEEN 1 AND 7),
  decision TEXT,
  probability FLOAT,
  explanation_layer TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_completed ON sessions(completed);
CREATE INDEX IF NOT EXISTS idx_pre_experiment_session_id ON pre_experiment_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_post_experiment_session_id ON post_experiment_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_predictions_session_id ON predictions(session_id);
CREATE INDEX IF NOT EXISTS idx_predictions_persona_id ON predictions(persona_id);
CREATE INDEX IF NOT EXISTS idx_predictions_timestamp ON predictions(timestamp);
CREATE INDEX IF NOT EXISTS idx_layer_feedback_session_id ON layer_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_layer_feedback_persona_layer ON layer_feedback(persona_id, layer_id);
CREATE INDEX IF NOT EXISTS idx_participant_responses_session_id ON participant_responses(session_id);

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE sessions IS 'Stores participant information and session metadata';
COMMENT ON TABLE pre_experiment_responses IS 'Captures participant expectations before AI exposure';
COMMENT ON TABLE post_experiment_responses IS 'Captures overall impressions after experiment completion';
COMMENT ON TABLE predictions IS 'Stores model predictions and SHAP explanations for each persona';
COMMENT ON TABLE layer_feedback IS 'Stores participant reflections for each explanation layer';
COMMENT ON TABLE participant_responses IS 'Legacy table - use layer_feedback for new implementations';

-- ============================================================================
-- ROW LEVEL SECURITY (Optional - uncomment to enable)
-- ============================================================================

-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pre_experiment_responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE post_experiment_responses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE layer_feedback ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE participant_responses ENABLE ROW LEVEL SECURITY;
