-- Migration: Remove Perceived Fairness Rating
-- Date: 2025-12-06
-- Purpose: Remove fairness-related quantitative question from experiment
--
-- BACKGROUND:
-- The perceived fairness rating was removed from the quantitative questionnaire
-- because fairness is better assessed qualitatively rather than through a simple
-- Likert scale. The question "This explanation demonstrates that the decision was fair"
-- was too simplistic for capturing the nuanced concept of algorithmic fairness.
--
-- CHANGE:
-- Drop the perceived_fairness_rating column from the layer_ratings table.
-- This reduces the rating dimensions from 5 to 4:
--   1. Understanding
--   2. Communicability
--   3. Mental Ease (formerly Cognitive Load, inverted)
--   4. Reliance Intention
--
-- IMPACT:
-- - Existing data in perceived_fairness_rating column will be permanently deleted
-- - Frontend now collects only 4 ratings per layer
-- - Backend API and statistics calculations updated accordingly
-- - Results dashboard updated to show only 4 dimensions

-- ============================================================================
-- STEP 1: Drop the perceived_fairness_rating column (CASCADE to drop dependent views)
-- ============================================================================

-- Note: This will also drop views that depend on this column:
-- - experiment_complete_data
-- - layer_performance_analysis
-- These views will need to be recreated without the fairness column

ALTER TABLE layer_ratings
DROP COLUMN IF EXISTS perceived_fairness_rating CASCADE;

-- ============================================================================
-- STEP 1b: Recreate the dropped views without fairness column
-- ============================================================================

-- Recreate experiment_complete_data view (without fairness)
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
    
    -- Layer ratings aggregated (4 dimensions)
    COUNT(DISTINCT lr.id) AS total_layer_ratings,
    ROUND(AVG(lr.understanding_rating)::numeric, 2) AS avg_understanding,
    ROUND(AVG(lr.communicability_rating)::numeric, 2) AS avg_communicability,
    ROUND(AVG(lr.cognitive_load_rating)::numeric, 2) AS avg_cognitive_load,
    ROUND(AVG(lr.reliance_intention_rating)::numeric, 2) AS avg_reliance,
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

-- Recreate layer_performance_analysis view (without fairness)
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
-- STEP 2: Verify the change
-- ============================================================================

-- Check the updated table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'layer_ratings'
ORDER BY ordinal_position;

-- Verify no fairness column exists
DO $$
DECLARE
    fairness_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'layer_ratings'
        AND column_name = 'perceived_fairness_rating'
    ) INTO fairness_exists;
    
    IF fairness_exists THEN
        RAISE EXCEPTION 'ERROR: perceived_fairness_rating column still exists!';
    ELSE
        RAISE NOTICE 'SUCCESS: perceived_fairness_rating column has been removed';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Show current rating dimensions
-- ============================================================================

-- Display sample of remaining rating columns
SELECT 
    session_id,
    layer_number,
    understanding_rating,
    communicability_rating,
    cognitive_load_rating,
    reliance_intention_rating,
    created_at
FROM layer_ratings
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- STEP 4: Update statistics
-- ============================================================================

-- Show updated rating statistics (4 dimensions only)
SELECT 
    layer_number,
    COUNT(*) AS n_ratings,
    ROUND(AVG(understanding_rating), 2) AS avg_understanding,
    ROUND(AVG(communicability_rating), 2) AS avg_communicability,
    ROUND(AVG(cognitive_load_rating), 2) AS avg_mental_ease,
    ROUND(AVG(reliance_intention_rating), 2) AS avg_reliance
FROM layer_ratings
GROUP BY layer_number
ORDER BY layer_number;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- If you need to rollback this migration, run:
--
-- ALTER TABLE layer_ratings
-- ADD COLUMN perceived_fairness_rating INTEGER CHECK (perceived_fairness_rating >= 1 AND perceived_fairness_rating <= 5);
--
-- COMMENT ON COLUMN layer_ratings.perceived_fairness_rating IS 
-- 'Perceived fairness rating (1-5). Column was dropped on 2025-12-06 but restored.';
--
-- NOTE: This will recreate the column but all historical data will be NULL.
-- There is no way to recover the deleted data.

-- ============================================================================
-- NOTES
-- ============================================================================
-- 
-- This migration is DESTRUCTIVE and IRREVERSIBLE.
-- All existing perceived_fairness_rating data will be permanently deleted.
-- 
-- Make sure you have:
-- 1. Backed up the database before running this migration
-- 2. Updated all frontend code to remove fairness rating UI
-- 3. Updated all backend code to remove fairness from data structures
-- 4. Updated results dashboard to remove fairness from displays
-- 
-- After running this migration:
-- - New ratings will only have 4 dimensions
-- - Old ratings will have NULL in the fairness column (if you rollback)
-- - Statistics and analytics will calculate based on 4 dimensions only
