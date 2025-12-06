-- Add gender column to sessions table
-- Run this migration in Supabase SQL Editor

ALTER TABLE sessions 
ADD COLUMN IF NOT EXISTS gender TEXT 
CHECK (gender IN ('male', 'female', 'non_binary', 'prefer_not_to_say'));

-- Add comment
COMMENT ON COLUMN sessions.gender IS 'Participant gender for demographic analysis';
