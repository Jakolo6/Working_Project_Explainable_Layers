-- Migration: Invert Cognitive Load Scale
-- Date: 2025-12-06
-- Purpose: Fix cognitive load scale to align with other Likert scales
--
-- PROBLEM:
-- The cognitive load scale was originally:
--   1 = Easy (low cognitive load)
--   5 = Hard (high cognitive load)
--
-- This is INVERTED from all other scales where 5 = positive/good.
-- This causes confusion in data analysis where high scores should be good.
--
-- SOLUTION:
-- Invert the scale so that:
--   1 = Hard (high cognitive load)
--   5 = Easy (low cognitive load)
--
-- This makes 5 = positive across ALL dimensions.
--
-- FORMULA: new_value = 6 - old_value
--   Old 1 (easy) → New 5 (easy)
--   Old 2        → New 4
--   Old 3        → New 3 (neutral stays neutral)
--   Old 4        → New 2
--   Old 5 (hard) → New 1 (hard)

-- ============================================================================
-- STEP 1: Invert existing cognitive_load_rating values in layer_ratings table
-- ============================================================================

UPDATE layer_ratings
SET cognitive_load_rating = 6 - cognitive_load_rating
WHERE cognitive_load_rating IS NOT NULL;

-- Verify the update
SELECT 
    'layer_ratings' AS table_name,
    COUNT(*) AS total_rows,
    MIN(cognitive_load_rating) AS min_rating,
    MAX(cognitive_load_rating) AS max_rating,
    ROUND(AVG(cognitive_load_rating), 2) AS avg_rating
FROM layer_ratings;

-- ============================================================================
-- STEP 2: Add comment to document the change
-- ============================================================================

COMMENT ON COLUMN layer_ratings.cognitive_load_rating IS 
'Cognitive load rating (1-5). Scale inverted on 2025-12-06: 1=Hard/High Load, 5=Easy/Low Load. This aligns with other Likert scales where 5=positive.';

-- ============================================================================
-- STEP 3: Verify data integrity
-- ============================================================================

-- Check that all values are still within valid range (1-5)
DO $$
DECLARE
    invalid_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO invalid_count
    FROM layer_ratings
    WHERE cognitive_load_rating < 1 OR cognitive_load_rating > 5;
    
    IF invalid_count > 0 THEN
        RAISE EXCEPTION 'Found % invalid cognitive_load_rating values after inversion!', invalid_count;
    ELSE
        RAISE NOTICE 'Data integrity check passed: All cognitive_load_rating values are within valid range (1-5)';
    END IF;
END $$;

-- ============================================================================
-- STEP 4: Show before/after statistics
-- ============================================================================

-- This will show the distribution after inversion
SELECT 
    cognitive_load_rating AS rating_value,
    COUNT(*) AS count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS percentage
FROM layer_ratings
GROUP BY cognitive_load_rating
ORDER BY cognitive_load_rating;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- If you need to rollback this migration, run:
-- UPDATE layer_ratings SET cognitive_load_rating = 6 - cognitive_load_rating WHERE cognitive_load_rating IS NOT NULL;
-- (The same formula works in both directions)
