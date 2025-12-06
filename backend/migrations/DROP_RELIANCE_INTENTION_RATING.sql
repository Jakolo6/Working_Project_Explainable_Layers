-- Migration: Remove Reliance Intention Rating
-- Date: 2025-12-06
-- Purpose: Remove reliance question from per-layer ratings
--
-- RATIONALE:
-- The reliance question "I would rely on this explanation in a real scenario"
-- is removed to streamline the rating process and focus on core dimensions:
--   1. Understanding
--   2. Communicability  
--   3. Mental Ease (cognitive load inverted)
--
-- This reduces the rating burden from 4 to 3 dimensions per layer.

-- ============================================================================
-- STEP 1: Drop reliance_intention_rating column (CASCADE for dependent views)
-- ============================================================================

ALTER TABLE layer_ratings
DROP COLUMN IF EXISTS reliance_intention_rating CASCADE;

-- ============================================================================
-- STEP 2: Recreate dropped views without reliance column
-- ============================================================================

-- Recreate experiment_complete_data view (3 dimensions)
CREATE VIEW experiment_complete_data AS
SELECT 
    s.session_id,
    s.consent_given,
    s.age,
    s.gender,
    s.financial_relationship,
    s.preferred_explanation_style,
    s.ai_trust_instinct,
    s.ai_fairness_stance,
    s.completed,
    s.created_at AS session_started,
    s.completed_at AS session_completed,
    
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
    pq.ai_usefulness,
    pq.improvement_suggestions
    
FROM sessions s
LEFT JOIN layer_ratings lr ON s.session_id = lr.session_id
LEFT JOIN post_questionnaires pq ON s.session_id = pq.session_id
WHERE s.consent_given = TRUE
GROUP BY 
    s.session_id, s.consent_given, s.age, s.gender, s.financial_relationship,
    s.preferred_explanation_style, s.ai_trust_instinct, s.ai_fairness_stance,
    s.completed, s.created_at, s.completed_at,
    pq.most_helpful_layer, pq.most_trusted_layer, pq.best_for_customer,
    pq.overall_intuitiveness, pq.ai_usefulness, pq.improvement_suggestions;

-- Recreate layer_performance_analysis view (3 dimensions)
CREATE VIEW layer_performance_analysis AS
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
    
    -- Cognitive Load (Mental Ease)
    ROUND(AVG(lr.cognitive_load_rating)::numeric, 2) AS avg_cognitive_load,
    ROUND(STDDEV(lr.cognitive_load_rating)::numeric, 2) AS stddev_cognitive_load,
    
    -- Time Analysis
    ROUND(AVG(lr.time_spent_seconds)::numeric, 1) AS avg_time_seconds,
    MIN(lr.time_spent_seconds) AS min_time_seconds,
    MAX(lr.time_spent_seconds) AS max_time_seconds

FROM layer_ratings lr
GROUP BY lr.layer_number, lr.layer_name, lr.persona_id
ORDER BY lr.layer_number, lr.persona_id;

-- ============================================================================
-- STEP 3: Verify the change
-- ============================================================================

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'layer_ratings'
ORDER BY ordinal_position;

-- Show updated statistics (3 dimensions)
SELECT 
    layer_number,
    COUNT(*) AS n_ratings,
    ROUND(AVG(understanding_rating), 2) AS avg_understanding,
    ROUND(AVG(communicability_rating), 2) AS avg_communicability,
    ROUND(AVG(cognitive_load_rating), 2) AS avg_mental_ease
FROM layer_ratings
GROUP BY layer_number
ORDER BY layer_number;

-- ============================================================================
-- NOTES
-- ============================================================================
-- This migration is DESTRUCTIVE and IRREVERSIBLE.
-- All existing reliance_intention_rating data will be permanently deleted.
-- 
-- After running:
-- - Rating dimensions reduced from 4 to 3
-- - Frontend collects only 3 ratings per layer
-- - Backend statistics calculate based on 3 dimensions
-- - Views recreated without reliance column
