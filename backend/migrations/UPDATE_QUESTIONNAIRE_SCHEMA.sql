-- ═══════════════════════════════════════════════════════════════════════
-- UPDATE QUESTIONNAIRE SCHEMA
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Update sessions table to reflect new pre-experiment questionnaire
-- Date: 2024-12-06
--
-- CHANGES:
-- OLD FIELDS (REMOVED):
--   - participant_background (banking/data_analytics/student/other)
--   - credit_experience (none/some/regular/expert)
--   - ai_familiarity (1-5 Likert scale)
--   - background_notes (free text)
--
-- NEW FIELDS (ADDED):
--   Section 1: Demographics
--   - age (18-99)
--   - gender (female/male/non_binary)
--   
--   Section 2: Experience & Preferences
--   - financial_relationship (novice/consumer/financial_literate)
--   - preferred_explanation_style (technical/visual/narrative/action)
--   
--   Section 3: Trust & Ethics
--   - ai_trust_instinct (automation_bias/algorithm_aversion/neutral)
--   - ai_fairness_stance (skeptic/conditional/optimist)
-- ═══════════════════════════════════════════════════════════════════════

-- Step 1: Add new columns to sessions table
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS financial_relationship TEXT,
  ADD COLUMN IF NOT EXISTS ai_trust_instinct TEXT,
  ADD COLUMN IF NOT EXISTS ai_fairness_stance TEXT;

-- Step 2: Add constraints for new columns
ALTER TABLE sessions
  DROP CONSTRAINT IF EXISTS sessions_age_check,
  DROP CONSTRAINT IF EXISTS sessions_gender_check,
  DROP CONSTRAINT IF EXISTS sessions_financial_relationship_check,
  DROP CONSTRAINT IF EXISTS sessions_ai_trust_instinct_check,
  DROP CONSTRAINT IF EXISTS sessions_ai_fairness_stance_check;

ALTER TABLE sessions
  ADD CONSTRAINT sessions_age_check 
    CHECK (age IS NULL OR (age >= 18 AND age <= 99)),
  ADD CONSTRAINT sessions_gender_check 
    CHECK (gender IS NULL OR gender IN ('female', 'male', 'non_binary')),
  ADD CONSTRAINT sessions_financial_relationship_check 
    CHECK (financial_relationship IS NULL OR financial_relationship IN ('novice', 'consumer', 'financial_literate')),
  ADD CONSTRAINT sessions_ai_trust_instinct_check 
    CHECK (ai_trust_instinct IS NULL OR ai_trust_instinct IN ('automation_bias', 'algorithm_aversion', 'neutral')),
  ADD CONSTRAINT sessions_ai_fairness_stance_check 
    CHECK (ai_fairness_stance IS NULL OR ai_fairness_stance IN ('skeptic', 'conditional', 'optimist'));

-- Step 3: Update preferred_explanation_style constraint to include new 'action' value
ALTER TABLE sessions
  DROP CONSTRAINT IF EXISTS sessions_preferred_explanation_style_check;

ALTER TABLE sessions
  ADD CONSTRAINT sessions_preferred_explanation_style_check 
    CHECK (preferred_explanation_style IS NULL OR preferred_explanation_style IN ('technical', 'visual', 'narrative', 'action', 'action_oriented'));

-- Step 4: Drop old constraints for fields we're keeping for backward compatibility
-- (Keep old columns for now to preserve existing data, but remove strict constraints)
ALTER TABLE sessions
  DROP CONSTRAINT IF EXISTS sessions_participant_background_check,
  DROP CONSTRAINT IF EXISTS sessions_credit_experience_check,
  DROP CONSTRAINT IF EXISTS sessions_ai_familiarity_check;

-- Step 5: Make old columns nullable (for backward compatibility)
ALTER TABLE sessions
  ALTER COLUMN participant_background DROP NOT NULL,
  ALTER COLUMN credit_experience DROP NOT NULL,
  ALTER COLUMN ai_familiarity DROP NOT NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════

-- Check the updated schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sessions'
    AND column_name IN (
        'age', 'gender', 'financial_relationship', 
        'preferred_explanation_style', 'ai_trust_instinct', 'ai_fairness_stance',
        'participant_background', 'credit_experience', 'ai_familiarity', 'background_notes'
    )
ORDER BY ordinal_position;

-- Check constraints
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'sessions'::regclass
    AND conname LIKE '%check%'
ORDER BY conname;

-- ═══════════════════════════════════════════════════════════════════════
-- MIGRATION NOTES
-- ═══════════════════════════════════════════════════════════════════════

/*
BACKWARD COMPATIBILITY:
- Old columns (participant_background, credit_experience, ai_familiarity, background_notes) 
  are kept but made nullable
- This allows existing data to remain valid
- New sessions will use the new fields

DATA MIGRATION:
- No automatic data migration is performed
- Old sessions will have NULL values in new fields
- New sessions will have NULL values in old fields
- This is acceptable since we're analyzing each session independently

FRONTEND CHANGES REQUIRED:
- Update /app/experiment/start/page.tsx ✅ (DONE)
- Update API endpoint to accept new fields
- Update results page to display new fields

BACKEND CHANGES REQUIRED:
- Update session creation endpoint to accept new fields
- Update Pydantic models to include new fields
- Update results/analytics queries to use new fields

CLEANUP (OPTIONAL - DO LATER):
After confirming all new sessions use new fields and you've exported old data:
1. DROP COLUMN participant_background;
2. DROP COLUMN credit_experience;
3. DROP COLUMN ai_familiarity;
4. DROP COLUMN background_notes;
*/
