-- ============================================================================
-- PRODUCTION DATABASE SCHEMA
-- Final working schema for XAI Credit Decision Experiment
-- Date: 2025-12-06
-- Status: PRODUCTION READY ✅
-- 
-- EXPERIMENT STRUCTURE:
-- - 2 Personas: elderly-woman, young-entrepreneur
-- - 4 Explanation Layers per persona (Baseline, Dashboard, Narrative, Counterfactual)
-- - 5 Rating dimensions per layer (Likert 1-5)
-- - Post-questionnaire after each persona
-- - Enhanced baseline questionnaire with demographic data
-- ============================================================================

-- ============================================================================
-- 1. SESSIONS TABLE
-- Stores: consent, baseline questionnaire, demographic data, session metadata
-- ============================================================================
CREATE TABLE IF NOT EXISTS sessions (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    
    -- Consent (required)
    consent_given BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Baseline questionnaire - Professional background
    participant_background TEXT CHECK (participant_background IN ('banking', 'data_analytics', 'student', 'other')),
    credit_experience TEXT CHECK (credit_experience IN ('none', 'some', 'regular', 'expert')),
    ai_familiarity INTEGER CHECK (ai_familiarity >= 1 AND ai_familiarity <= 5),
    preferred_explanation_style TEXT CHECK (preferred_explanation_style IN ('technical', 'visual', 'narrative', 'action_oriented')),
    background_notes TEXT DEFAULT '',
    
    -- Baseline questionnaire - Demographics & attitudes
    age INTEGER CHECK (age >= 18 AND age <= 100),
    gender TEXT CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say')),
    financial_relationship TEXT CHECK (financial_relationship IN ('customer', 'employee', 'both', 'neither')),
    ai_trust_instinct TEXT CHECK (ai_trust_instinct IN ('very_skeptical', 'somewhat_skeptical', 'neutral', 'somewhat_trusting', 'very_trusting')),
    ai_fairness_stance TEXT CHECK (ai_fairness_stance IN ('very_unfair', 'somewhat_unfair', 'neutral', 'somewhat_fair', 'very_fair')),
    
    -- Session tracking
    completed BOOLEAN DEFAULT FALSE,
    current_step TEXT DEFAULT 'consent',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- 2. PREDICTIONS TABLE
-- Stores: AI predictions for each persona (one per session × persona)
-- ============================================================================
CREATE TABLE IF NOT EXISTS predictions (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key
    session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    
    -- Persona identification
    persona_id TEXT NOT NULL CHECK (persona_id IN ('elderly-woman', 'young-entrepreneur')),
    
    -- Prediction result
    decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected')),
    probability NUMERIC(5,4) NOT NULL CHECK (probability >= 0 AND probability <= 1),
    
    -- Explanation data (JSONB for flexibility)
    shap_values JSONB NOT NULL,      -- SHAP feature contributions
    input_features JSONB NOT NULL,   -- Application data used for prediction
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: One prediction per session × persona
    UNIQUE(session_id, persona_id)
);

-- ============================================================================
-- 3. LAYER_RATINGS TABLE
-- Stores: ratings for each explanation layer (2 personas × 4 layers = 8 per session)
-- ============================================================================
CREATE TABLE IF NOT EXISTS layer_ratings (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key
    session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    
    -- Layer identification
    persona_id TEXT NOT NULL CHECK (persona_id IN ('elderly-woman', 'young-entrepreneur')),
    layer_number INTEGER NOT NULL CHECK (layer_number >= 1 AND layer_number <= 4),
    layer_name TEXT NOT NULL,
    
    -- 5 Likert scale ratings (1-5)
    understanding_rating INTEGER NOT NULL CHECK (understanding_rating >= 1 AND understanding_rating <= 5),
    communicability_rating INTEGER NOT NULL CHECK (communicability_rating >= 1 AND communicability_rating <= 5),
    perceived_fairness_rating INTEGER NOT NULL CHECK (perceived_fairness_rating >= 1 AND perceived_fairness_rating <= 5),
    cognitive_load_rating INTEGER NOT NULL CHECK (cognitive_load_rating >= 1 AND cognitive_load_rating <= 5),
    reliance_intention_rating INTEGER NOT NULL CHECK (reliance_intention_rating >= 1 AND reliance_intention_rating <= 5),
    
    -- Optional feedback
    comment TEXT DEFAULT '',
    
    -- Time tracking (seconds spent on this layer)
    time_spent_seconds INTEGER DEFAULT 0,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: One rating per session × persona × layer
    UNIQUE(session_id, persona_id, layer_number)
);

-- ============================================================================
-- 4. POST_QUESTIONNAIRES TABLE
-- Stores: questionnaire after completing each persona (one per session × persona)
-- ============================================================================
CREATE TABLE IF NOT EXISTS post_questionnaires (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Foreign key
    session_id TEXT NOT NULL REFERENCES sessions(session_id) ON DELETE CASCADE,
    
    -- Persona identification
    persona_id TEXT NOT NULL CHECK (persona_id IN ('elderly-woman', 'young-entrepreneur')),
    
    -- Layer preference questions
    most_helpful_layer TEXT NOT NULL CHECK (most_helpful_layer IN ('layer_1', 'layer_2', 'layer_3', 'layer_4')),
    most_trusted_layer TEXT NOT NULL CHECK (most_trusted_layer IN ('layer_1', 'layer_2', 'layer_3', 'layer_4')),
    best_for_customer TEXT NOT NULL CHECK (best_for_customer IN ('layer_1', 'layer_2', 'layer_3', 'layer_4')),
    
    -- Overall ratings (1-5 Likert)
    overall_intuitiveness INTEGER NOT NULL CHECK (overall_intuitiveness >= 1 AND overall_intuitiveness <= 5),
    ai_usefulness INTEGER NOT NULL CHECK (ai_usefulness >= 1 AND ai_usefulness <= 5),
    
    -- Open feedback
    improvement_suggestions TEXT DEFAULT '',
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraint: One questionnaire per session × persona
    UNIQUE(session_id, persona_id)
);

-- ============================================================================
-- 5. INDEXES FOR QUERY PERFORMANCE
-- ============================================================================

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_sessions_completed ON sessions(completed);

-- Predictions indexes
CREATE INDEX IF NOT EXISTS idx_predictions_session_id ON predictions(session_id);
CREATE INDEX IF NOT EXISTS idx_predictions_persona_id ON predictions(persona_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created_at ON predictions(created_at);

-- Layer ratings indexes
CREATE INDEX IF NOT EXISTS idx_layer_ratings_session_id ON layer_ratings(session_id);
CREATE INDEX IF NOT EXISTS idx_layer_ratings_persona_id ON layer_ratings(persona_id);
CREATE INDEX IF NOT EXISTS idx_layer_ratings_layer_number ON layer_ratings(layer_number);
CREATE INDEX IF NOT EXISTS idx_layer_ratings_created_at ON layer_ratings(created_at);

-- Post questionnaires indexes
CREATE INDEX IF NOT EXISTS idx_post_questionnaires_session_id ON post_questionnaires(session_id);
CREATE INDEX IF NOT EXISTS idx_post_questionnaires_persona_id ON post_questionnaires(persona_id);

-- ============================================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE layer_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_questionnaires ENABLE ROW LEVEL SECURITY;

-- Sessions policies (allow public access for anonymous participants)
DROP POLICY IF EXISTS sessions_insert ON sessions;
DROP POLICY IF EXISTS sessions_select ON sessions;
DROP POLICY IF EXISTS sessions_update ON sessions;
DROP POLICY IF EXISTS sessions_delete ON sessions;

CREATE POLICY sessions_insert ON sessions FOR INSERT WITH CHECK (true);
CREATE POLICY sessions_select ON sessions FOR SELECT USING (true);
CREATE POLICY sessions_update ON sessions FOR UPDATE USING (true);
CREATE POLICY sessions_delete ON sessions FOR DELETE USING (true);

-- Predictions policies
DROP POLICY IF EXISTS predictions_insert ON predictions;
DROP POLICY IF EXISTS predictions_select ON predictions;
DROP POLICY IF EXISTS predictions_delete ON predictions;

CREATE POLICY predictions_insert ON predictions FOR INSERT WITH CHECK (true);
CREATE POLICY predictions_select ON predictions FOR SELECT USING (true);
CREATE POLICY predictions_delete ON predictions FOR DELETE USING (true);

-- Layer ratings policies
DROP POLICY IF EXISTS layer_ratings_insert ON layer_ratings;
DROP POLICY IF EXISTS layer_ratings_select ON layer_ratings;
DROP POLICY IF EXISTS layer_ratings_delete ON layer_ratings;

CREATE POLICY layer_ratings_insert ON layer_ratings FOR INSERT WITH CHECK (true);
CREATE POLICY layer_ratings_select ON layer_ratings FOR SELECT USING (true);
CREATE POLICY layer_ratings_delete ON layer_ratings FOR DELETE USING (true);

-- Post questionnaires policies
DROP POLICY IF EXISTS post_questionnaires_insert ON post_questionnaires;
DROP POLICY IF EXISTS post_questionnaires_select ON post_questionnaires;
DROP POLICY IF EXISTS post_questionnaires_delete ON post_questionnaires;

CREATE POLICY post_questionnaires_insert ON post_questionnaires FOR INSERT WITH CHECK (true);
CREATE POLICY post_questionnaires_select ON post_questionnaires FOR SELECT USING (true);
CREATE POLICY post_questionnaires_delete ON post_questionnaires FOR DELETE USING (true);

-- ============================================================================
-- 7. ANALYSIS VIEWS
-- ============================================================================

-- Complete experiment data per session
CREATE OR REPLACE VIEW experiment_complete_data AS
SELECT 
    s.session_id,
    s.consent_given,
    s.participant_background,
    s.credit_experience,
    s.ai_familiarity,
    s.preferred_explanation_style,
    s.age,
    s.gender,
    s.financial_relationship,
    s.ai_trust_instinct,
    s.ai_fairness_stance,
    s.background_notes,
    s.completed,
    s.created_at AS session_started,
    s.completed_at AS session_completed,
    
    -- Layer ratings aggregated
    COUNT(DISTINCT lr.id) AS total_layer_ratings,
    ROUND(AVG(lr.understanding_rating)::numeric, 2) AS avg_understanding,
    ROUND(AVG(lr.communicability_rating)::numeric, 2) AS avg_communicability,
    ROUND(AVG(lr.perceived_fairness_rating)::numeric, 2) AS avg_fairness,
    ROUND(AVG(lr.cognitive_load_rating)::numeric, 2) AS avg_cognitive_load,
    ROUND(AVG(lr.reliance_intention_rating)::numeric, 2) AS avg_reliance,
    SUM(lr.time_spent_seconds) AS total_time_spent_seconds
    
FROM sessions s
LEFT JOIN layer_ratings lr ON s.session_id = lr.session_id
WHERE s.consent_given = TRUE
GROUP BY 
    s.session_id, s.consent_given, s.participant_background, s.credit_experience,
    s.ai_familiarity, s.preferred_explanation_style, s.age, s.gender,
    s.financial_relationship, s.ai_trust_instinct, s.ai_fairness_stance,
    s.background_notes, s.completed, s.created_at, s.completed_at;

-- Layer performance analysis (for comparing layers)
CREATE OR REPLACE VIEW layer_performance_analysis AS
SELECT 
    lr.layer_number,
    lr.layer_name,
    lr.persona_id,
    COUNT(*) AS total_ratings,
    
    -- Understanding
    ROUND(AVG(lr.understanding_rating)::numeric, 2) AS avg_understanding,
    ROUND(STDDEV(lr.understanding_rating)::numeric, 2) AS stddev_understanding,
    
    -- Communicability
    ROUND(AVG(lr.communicability_rating)::numeric, 2) AS avg_communicability,
    ROUND(STDDEV(lr.communicability_rating)::numeric, 2) AS stddev_communicability,
    
    -- Fairness
    ROUND(AVG(lr.perceived_fairness_rating)::numeric, 2) AS avg_fairness,
    ROUND(STDDEV(lr.perceived_fairness_rating)::numeric, 2) AS stddev_fairness,
    
    -- Cognitive Load
    ROUND(AVG(lr.cognitive_load_rating)::numeric, 2) AS avg_cognitive_load,
    ROUND(STDDEV(lr.cognitive_load_rating)::numeric, 2) AS stddev_cognitive_load,
    
    -- Reliance Intention
    ROUND(AVG(lr.reliance_intention_rating)::numeric, 2) AS avg_reliance,
    ROUND(STDDEV(lr.reliance_intention_rating)::numeric, 2) AS stddev_reliance,
    
    -- Time Analysis
    ROUND(AVG(lr.time_spent_seconds)::numeric, 1) AS avg_time_seconds,
    MIN(lr.time_spent_seconds) AS min_time_seconds,
    MAX(lr.time_spent_seconds) AS max_time_seconds

FROM layer_ratings lr
GROUP BY lr.layer_number, lr.layer_name, lr.persona_id
ORDER BY lr.layer_number, lr.persona_id;

-- ============================================================================
-- 8. USEFUL ANALYSIS QUERIES (as comments for reference)
-- ============================================================================

/*
-- Overall layer comparison (main thesis result)
SELECT 
    layer_number,
    layer_name,
    COUNT(*) AS n,
    ROUND(AVG(understanding_rating), 2) AS understanding,
    ROUND(AVG(communicability_rating), 2) AS communicability,
    ROUND(AVG(perceived_fairness_rating), 2) AS fairness,
    ROUND(AVG(cognitive_load_rating), 2) AS cognitive_load,
    ROUND(AVG(reliance_intention_rating), 2) AS reliance,
    ROUND(AVG(time_spent_seconds), 1) AS avg_time_sec
FROM layer_ratings
GROUP BY layer_number, layer_name
ORDER BY layer_number;

-- Layer preferences from post-questionnaire
SELECT 
    most_helpful_layer,
    COUNT(*) AS votes,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM post_questionnaires
GROUP BY most_helpful_layer
ORDER BY votes DESC;

-- Background vs layer preference
SELECT 
    s.participant_background,
    pq.most_helpful_layer,
    COUNT(*) AS count
FROM sessions s
JOIN post_questionnaires pq ON s.session_id = pq.session_id
WHERE s.completed = TRUE
GROUP BY s.participant_background, pq.most_helpful_layer
ORDER BY s.participant_background, count DESC;

-- AI familiarity vs ratings
SELECT 
    s.ai_familiarity,
    ROUND(AVG(lr.understanding_rating), 2) AS avg_understanding,
    ROUND(AVG(lr.cognitive_load_rating), 2) AS avg_cognitive_load,
    COUNT(DISTINCT s.session_id) AS n_participants
FROM sessions s
JOIN layer_ratings lr ON s.session_id = lr.session_id
WHERE s.completed = TRUE
GROUP BY s.ai_familiarity
ORDER BY s.ai_familiarity;

-- Export for SPSS/R (full dataset)
SELECT 
    lr.session_id,
    s.participant_background,
    s.credit_experience,
    s.ai_familiarity,
    s.preferred_explanation_style,
    s.age,
    s.gender,
    s.financial_relationship,
    s.ai_trust_instinct,
    s.ai_fairness_stance,
    lr.persona_id,
    lr.layer_number,
    lr.layer_name,
    lr.understanding_rating,
    lr.communicability_rating,
    lr.perceived_fairness_rating,
    lr.cognitive_load_rating,
    lr.reliance_intention_rating,
    lr.time_spent_seconds,
    lr.created_at
FROM layer_ratings lr
JOIN sessions s ON lr.session_id = s.session_id
WHERE s.completed = TRUE
ORDER BY lr.session_id, lr.persona_id, lr.layer_number;

-- Completion funnel
SELECT 
    'Started' AS stage,
    COUNT(*) AS count
FROM sessions WHERE consent_given = TRUE
UNION ALL
SELECT 
    'Completed at least 1 rating' AS stage,
    COUNT(DISTINCT session_id) AS count
FROM layer_ratings
UNION ALL
SELECT 
    'Completed all 8 ratings (2 personas × 4 layers)' AS stage,
    COUNT(*) AS count
FROM (
    SELECT session_id, COUNT(*) AS rating_count
    FROM layer_ratings
    GROUP BY session_id
    HAVING COUNT(*) = 8
) sub
UNION ALL
SELECT 
    'Submitted post-questionnaire' AS stage,
    COUNT(*) AS count
FROM post_questionnaires;
*/

-- ============================================================================
-- SCHEMA COMPLETE ✅
-- Tables: sessions, predictions, layer_ratings, post_questionnaires
-- Views: experiment_complete_data, layer_performance_analysis
-- Status: PRODUCTION READY
-- ============================================================================
