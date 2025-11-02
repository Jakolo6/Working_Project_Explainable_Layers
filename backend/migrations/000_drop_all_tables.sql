-- ============================================================================
-- DROP ALL TABLES SCRIPT
-- ============================================================================
-- WARNING: This will permanently delete ALL data in the database!
-- Use this to reset the database to a clean state before running the full schema.
-- ============================================================================

-- Drop tables in reverse order of dependencies (child tables first, then parent tables)

-- Drop policies first (if they exist)
DROP POLICY IF EXISTS "Allow all operations on layer_ratings" ON layer_ratings;
DROP POLICY IF EXISTS "Allow all operations on post_questionnaires" ON post_questionnaires;

-- Drop indexes
DROP INDEX IF EXISTS idx_layer_ratings_session_persona_layer;
DROP INDEX IF EXISTS idx_layer_ratings_persona;
DROP INDEX IF EXISTS idx_layer_ratings_session;
DROP INDEX IF EXISTS idx_post_questionnaires_session;
DROP INDEX IF EXISTS idx_participant_responses_session_id;
DROP INDEX IF EXISTS idx_layer_feedback_persona_layer;
DROP INDEX IF EXISTS idx_layer_feedback_session_id;
DROP INDEX IF EXISTS idx_predictions_timestamp;
DROP INDEX IF EXISTS idx_predictions_persona_id;
DROP INDEX IF EXISTS idx_predictions_session_id;
DROP INDEX IF EXISTS idx_post_experiment_session_id;
DROP INDEX IF EXISTS idx_pre_experiment_session_id;
DROP INDEX IF EXISTS idx_sessions_completed;
DROP INDEX IF EXISTS idx_sessions_created_at;

-- Drop child tables first (tables with foreign keys)
DROP TABLE IF EXISTS layer_ratings CASCADE;
DROP TABLE IF EXISTS post_questionnaires CASCADE;
DROP TABLE IF EXISTS participant_responses CASCADE;
DROP TABLE IF EXISTS layer_feedback CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS post_experiment_responses CASCADE;
DROP TABLE IF EXISTS pre_experiment_responses CASCADE;

-- Drop parent table last
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
