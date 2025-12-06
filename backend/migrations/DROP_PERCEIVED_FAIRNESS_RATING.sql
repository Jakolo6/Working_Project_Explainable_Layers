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
-- STEP 1: Drop the perceived_fairness_rating column
-- ============================================================================

ALTER TABLE layer_ratings
DROP COLUMN IF EXISTS perceived_fairness_rating;

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
