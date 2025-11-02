-- Migration: Fix ai_familiarity column type from INTEGER to TEXT
-- This fixes the schema mismatch between frontend/backend (TEXT) and database (INTEGER)

-- Step 1: Drop the old constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_ai_familiarity_check;

-- Step 2: Change column type from INTEGER to TEXT
ALTER TABLE sessions ALTER COLUMN ai_familiarity TYPE TEXT USING ai_familiarity::TEXT;

-- Step 3: Add new constraint for valid values
ALTER TABLE sessions ADD CONSTRAINT sessions_ai_familiarity_check 
  CHECK (ai_familiarity IN ('none', 'basic', 'intermediate', 'advanced'));

-- Verify the change
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'sessions' AND column_name = 'ai_familiarity';
