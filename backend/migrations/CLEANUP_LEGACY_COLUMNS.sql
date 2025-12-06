-- ============================================================================
-- CLEANUP LEGACY COLUMNS FROM SESSIONS TABLE
-- ============================================================================
-- Purpose: Remove unused legacy questionnaire columns that have been replaced
--          by the new demographic and preference fields
-- Date: 2025-12-06
-- ============================================================================

-- WHAT THIS MIGRATION DOES:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. Removes 4 legacy columns from sessions table that are no longer used
-- 2. These columns were replaced by new demographic fields in previous migration
-- 3. All new sessions have NULL values in these columns
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

-- BEFORE RUNNING:
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
-- 1. BACKUP YOUR DATABASE (Supabase > Database > Backups)
-- 2. Check if any old sessions have data in these columns:
--    SELECT COUNT(*) FROM sessions WHERE 
--      participant_background IS NOT NULL OR
--      credit_experience IS NOT NULL OR
--      ai_familiarity IS NOT NULL OR
--      background_notes IS NOT NULL;
-- 3. If count > 0, export that data first if you need it
-- ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BEGIN;

-- ============================================================================
-- STEP 1: Check for existing data (informational only)
-- ============================================================================
DO $$
DECLARE
  legacy_data_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO legacy_data_count
  FROM sessions
  WHERE 
    participant_background IS NOT NULL OR
    credit_experience IS NOT NULL OR
    ai_familiarity IS NOT NULL OR
    background_notes IS NOT NULL;
  
  RAISE NOTICE 'Found % sessions with legacy data', legacy_data_count;
  
  IF legacy_data_count > 0 THEN
    RAISE WARNING 'There are % sessions with legacy data. Consider backing up before proceeding.', legacy_data_count;
  END IF;
END $$;

-- ============================================================================
-- STEP 2: Remove legacy columns
-- ============================================================================

-- Remove participant_background (replaced by demographic fields)
ALTER TABLE sessions 
DROP COLUMN IF EXISTS participant_background;

-- Remove credit_experience (no longer collected)
ALTER TABLE sessions 
DROP COLUMN IF EXISTS credit_experience;

-- Remove ai_familiarity (no longer collected)
ALTER TABLE sessions 
DROP COLUMN IF EXISTS ai_familiarity;

-- Remove background_notes (no longer collected)
ALTER TABLE sessions 
DROP COLUMN IF EXISTS background_notes;

-- ============================================================================
-- STEP 3: Verify cleanup
-- ============================================================================
DO $$
DECLARE
  column_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO column_count
  FROM information_schema.columns
  WHERE table_name = 'sessions'
    AND column_name IN ('participant_background', 'credit_experience', 'ai_familiarity', 'background_notes');
  
  IF column_count = 0 THEN
    RAISE NOTICE '✅ Successfully removed all legacy columns';
  ELSE
    RAISE WARNING '⚠️  Some legacy columns still exist: %', column_count;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- CURRENT SESSIONS TABLE SCHEMA (AFTER MIGRATION)
-- ============================================================================
-- Core fields:
--   - id (uuid, PK)
--   - session_id (text, unique)
--   - consent_given (boolean)
--   - completed (boolean)
--   - current_step (text)
--   - created_at (timestamptz)
--   - updated_at (timestamptz)
--   - completed_at (timestamptz)
--
-- Demographic fields:
--   - age (integer)
--   - gender (text)
--   - financial_relationship (text)
--
-- Preference fields:
--   - preferred_explanation_style (text)
--   - ai_trust_instinct (text)
--   - ai_fairness_stance (text)
-- ============================================================================

-- ============================================================================
-- ROLLBACK (if needed)
-- ============================================================================
-- If you need to rollback, run this:
-- 
-- ALTER TABLE sessions ADD COLUMN participant_background TEXT;
-- ALTER TABLE sessions ADD COLUMN credit_experience TEXT;
-- ALTER TABLE sessions ADD COLUMN ai_familiarity INTEGER;
-- ALTER TABLE sessions ADD COLUMN background_notes TEXT;
-- ============================================================================
