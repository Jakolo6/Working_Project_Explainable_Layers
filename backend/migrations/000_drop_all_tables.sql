-- ============================================================================
-- DROP ALL TABLES SCRIPT (SIMPLE & CLEAN)
-- ============================================================================
-- WARNING: This will permanently delete ALL data in the database!
-- Use this to reset the database to a clean state before running the full schema.
-- ============================================================================

-- Just drop all tables with CASCADE
-- CASCADE automatically removes policies, indexes, foreign keys, and all dependencies
-- IF EXISTS prevents errors if tables don't exist

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
