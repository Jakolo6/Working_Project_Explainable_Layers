-- ============================================================================
-- ADD NEW QUESTIONNAIRE FIELDS TO SESSIONS TABLE
-- Date: 2025-12-06
-- Purpose: Add missing demographic and questionnaire fields to sessions table
-- ============================================================================

-- CRITICAL: Run this migration in Supabase SQL Editor to enable data collection
-- for new questionnaire fields (age, gender, financial_relationship, etc.)

-- ============================================================================
-- 1. ADD NEW COLUMNS
-- ============================================================================

-- Section 1: Demographics
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS age INTEGER 
CHECK (age >= 18 AND age <= 99);

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS gender TEXT 
CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say'));

-- Section 2: Experience & Preferences  
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS financial_relationship TEXT 
CHECK (financial_relationship IN ('novice', 'consumer', 'financial_literate'));

-- Note: preferred_explanation_style already exists in schema

-- Section 3: Trust & Ethics
ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS ai_trust_instinct TEXT 
CHECK (ai_trust_instinct IN ('automation_bias', 'algorithm_aversion', 'neutral'));

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS ai_fairness_stance TEXT 
CHECK (ai_fairness_stance IN ('skeptic', 'conditional', 'optimist'));

-- ============================================================================
-- 2. ADD COLUMN COMMENTS (Documentation)
-- ============================================================================

COMMENT ON COLUMN sessions.age IS 'Participant age (18-99 years)';
COMMENT ON COLUMN sessions.gender IS 'Participant gender for demographic analysis';
COMMENT ON COLUMN sessions.financial_relationship IS 'Participant relationship with financial decision-making (novice, consumer, financial_literate)';
COMMENT ON COLUMN sessions.ai_trust_instinct IS 'Initial trust stance toward AI systems (automation_bias, algorithm_aversion, neutral)';
COMMENT ON COLUMN sessions.ai_fairness_stance IS 'Belief about AI fairness and bias (skeptic, conditional, optimist)';

-- ============================================================================
-- 3. VERIFICATION QUERY
-- ============================================================================

-- Run this to verify all columns exist:
/*
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'sessions'
AND column_name IN (
    'age',
    'gender',
    'financial_relationship',
    'preferred_explanation_style',
    'ai_trust_instinct',
    'ai_fairness_stance',
    'participant_background',
    'credit_experience',
    'ai_familiarity'
)
ORDER BY column_name;
*/

-- ============================================================================
-- 4. TEST DATA INSERTION
-- ============================================================================

-- Test that new columns accept valid data:
/*
INSERT INTO sessions (
    session_id,
    consent_given,
    age,
    gender,
    financial_relationship,
    preferred_explanation_style,
    ai_trust_instinct,
    ai_fairness_stance
) VALUES (
    'test-migration-' || gen_random_uuid()::text,
    true,
    25,
    'male',
    'consumer',
    'visual',
    'neutral',
    'conditional'
);

-- Clean up test data:
DELETE FROM sessions WHERE session_id LIKE 'test-migration-%';
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- After running this migration:
-- ✅ New sessions will save all questionnaire data
-- ✅ Gender/age will appear in Manage Data table  
-- ✅ Demographic analysis will have complete data
-- ❌ Old sessions will still have NULL values (they don't have this data)
