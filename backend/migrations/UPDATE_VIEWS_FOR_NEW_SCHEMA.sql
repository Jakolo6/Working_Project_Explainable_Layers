-- ============================================================================
-- UPDATE VIEWS TO MATCH NEW SCHEMA
-- ============================================================================
-- Purpose: Recreate experiment_complete_data view to use new demographic fields
--          instead of legacy columns that were removed
-- Date: 2025-12-07
-- ============================================================================

-- PROBLEM:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- The experiment_complete_data view was created with old schema and references:
--   - participant_background (removed)
--   - credit_experience (removed)
--   - ai_familiarity (removed)
--   - background_notes (removed)
--
-- But it's MISSING the new demographic fields:
--   - age
--   - gender
--   - financial_relationship
--   - ai_trust_instinct
--   - ai_fairness_stance
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ============================================================================
-- STEP 1: Drop the old view
-- ============================================================================
DROP VIEW IF EXISTS experiment_complete_data;

-- ============================================================================
-- STEP 2: Recreate with correct schema
-- ============================================================================
CREATE VIEW experiment_complete_data AS
SELECT 
    -- Core session info
    s.session_id,
    s.consent_given,
    s.completed,
    s.created_at AS session_started,
    s.completed_at AS session_completed,
    
    -- NEW: Demographic fields
    s.age,
    s.gender,
    s.financial_relationship,
    
    -- NEW: Preference fields
    s.preferred_explanation_style,
    s.ai_trust_instinct,
    s.ai_fairness_stance,
    
    -- Layer ratings aggregated (3 dimensions)
    COUNT(DISTINCT lr.id) AS total_layer_ratings,
    ROUND(AVG(lr.understanding_rating)::numeric, 2) AS avg_understanding,
    ROUND(AVG(lr.communicability_rating)::numeric, 2) AS avg_communicability,
    ROUND(AVG(lr.cognitive_load_rating)::numeric, 2) AS avg_cognitive_load,
    SUM(lr.time_spent_seconds) AS total_time_spent_seconds,
    
    -- Post questionnaire (from most recent questionnaire if multiple personas)
    MAX(pq.most_helpful_layer) AS most_helpful_layer,
    MAX(pq.most_trusted_layer) AS most_trusted_layer,
    MAX(pq.best_for_customer) AS best_for_customer,
    MAX(pq.overall_intuitiveness) AS overall_intuitiveness,
    MAX(pq.ai_usefulness) AS ai_usefulness,
    MAX(pq.improvement_suggestions) AS improvement_suggestions
    
FROM sessions s
LEFT JOIN layer_ratings lr ON s.session_id = lr.session_id
LEFT JOIN post_questionnaires pq ON s.session_id = pq.session_id
WHERE s.consent_given = TRUE
GROUP BY 
    s.session_id,
    s.consent_given,
    s.completed,
    s.created_at,
    s.completed_at,
    s.age,
    s.gender,
    s.financial_relationship,
    s.preferred_explanation_style,
    s.ai_trust_instinct,
    s.ai_fairness_stance;

-- ============================================================================
-- STEP 3: Verify the view
-- ============================================================================
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'experiment_complete_data';
  
  RAISE NOTICE '✅ View recreated with % columns', column_count;
  
  -- Check that new demographic columns exist
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'experiment_complete_data'
    AND column_name IN ('age', 'gender', 'financial_relationship', 'ai_trust_instinct', 'ai_fairness_stance');
  
  IF column_count = 5 THEN
    RAISE NOTICE '✅ All 5 new demographic fields are present';
  ELSE
    RAISE WARNING '⚠️  Only % of 5 demographic fields found', column_count;
  END IF;
  
  -- Check that old columns are gone
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'experiment_complete_data'
    AND column_name IN ('participant_background', 'credit_experience', 'ai_familiarity', 'background_notes');
  
  IF column_count = 0 THEN
    RAISE NOTICE '✅ Legacy columns successfully removed from view';
  ELSE
    RAISE WARNING '⚠️  Still found % legacy columns in view', column_count;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- NEW VIEW SCHEMA
-- ============================================================================
-- experiment_complete_data now contains:
--
-- Session Info:
--   - session_id (text)
--   - consent_given (boolean)
--   - completed (boolean)
--   - session_started (timestamptz)
--   - session_completed (timestamptz)
--
-- Demographics:
--   - age (integer)
--   - gender (text)
--   - financial_relationship (text)
--
-- Preferences:
--   - preferred_explanation_style (text)
--   - ai_trust_instinct (text)
--   - ai_fairness_stance (text)
--
-- Aggregated Metrics:
--   - total_layer_ratings (bigint)
--   - avg_understanding (numeric)
--   - avg_communicability (numeric)
--   - avg_cognitive_load (numeric)
--   - total_time_spent_seconds (bigint)
--
-- Post-Questionnaire:
--   - most_helpful_layer (text)
--   - most_trusted_layer (text)
--   - best_for_customer (text)
--   - overall_intuitiveness (integer)
--   - ai_usefulness (integer)
--   - improvement_suggestions (text)
-- ============================================================================

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Get all complete sessions with demographics
-- SELECT * FROM experiment_complete_data WHERE completed = true;

-- Analyze by gender
-- SELECT gender, COUNT(*), AVG(avg_understanding), AVG(avg_cognitive_load)
-- FROM experiment_complete_data
-- WHERE completed = true
-- GROUP BY gender;

-- Analyze by age group
-- SELECT 
--   CASE 
--     WHEN age < 25 THEN '18-24'
--     WHEN age < 35 THEN '25-34'
--     WHEN age < 45 THEN '35-44'
--     WHEN age < 55 THEN '45-54'
--     ELSE '55+'
--   END as age_group,
--   COUNT(*),
--   AVG(avg_understanding)
-- FROM experiment_complete_data
-- WHERE completed = true
-- GROUP BY age_group;

-- Analyze by financial experience
-- SELECT 
--   financial_relationship,
--   COUNT(*),
--   AVG(avg_cognitive_load),
--   AVG(total_time_spent_seconds)
-- FROM experiment_complete_data
-- WHERE completed = true
-- GROUP BY financial_relationship;
