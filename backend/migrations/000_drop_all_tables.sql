-- ============================================================================
-- DROP ALL TABLES SCRIPT (FORCE DELETE)
-- ============================================================================
-- WARNING: This will permanently delete ALL data in the database!
-- Use this to reset the database to a clean state before running the full schema.
-- ============================================================================

-- STEP 1: Disable RLS on all tables (prevents policy errors)
ALTER TABLE IF EXISTS layer_ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS post_questionnaires DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS participant_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS layer_feedback DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS predictions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS post_experiment_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS pre_experiment_responses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS sessions DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop all policies (must be done before dropping tables)
DROP POLICY IF EXISTS "Allow all operations on layer_ratings" ON layer_ratings;
DROP POLICY IF EXISTS "Allow all operations on post_questionnaires" ON post_questionnaires;
DROP POLICY IF EXISTS "Allow all operations on layer_feedback" ON layer_feedback;
DROP POLICY IF EXISTS "Allow all operations on post_experiment_responses" ON post_experiment_responses;
DROP POLICY IF EXISTS "Allow all operations on pre_experiment_responses" ON pre_experiment_responses;
DROP POLICY IF EXISTS "Allow all operations on predictions" ON predictions;
DROP POLICY IF EXISTS "Allow all operations on participant_responses" ON participant_responses;
DROP POLICY IF EXISTS "Allow all operations on sessions" ON sessions;

-- STEP 3: Drop all tables with CASCADE (forces deletion of dependencies)
-- CASCADE will automatically drop dependent objects (foreign keys, triggers, etc.)
DROP TABLE IF EXISTS layer_ratings CASCADE;
DROP TABLE IF EXISTS post_questionnaires CASCADE;
DROP TABLE IF EXISTS participant_responses CASCADE;
DROP TABLE IF EXISTS layer_feedback CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS post_experiment_responses CASCADE;
DROP TABLE IF EXISTS pre_experiment_responses CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Note: We keep the uuid-ossp extension as it's commonly used
-- If you want to remove it too, uncomment the line below:
-- DROP EXTENSION IF EXISTS "uuid-ossp";

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script, you can verify all tables are dropped by running:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';
-- ============================================================================
