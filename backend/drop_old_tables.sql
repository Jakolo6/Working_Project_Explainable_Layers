-- SQL Script to Drop Old Tables
-- Run this BEFORE executing supabase_schema.sql if you need to start fresh
-- WARNING: This will delete all existing data in these tables

-- ============================================================================
-- IMPORTANT: BACKUP YOUR DATA FIRST
-- ============================================================================
-- If you have important data, export it before running this script:
-- 1. Go to Supabase Dashboard > Table Editor
-- 2. Select each table and export to CSV
-- 3. Save the CSV files for backup

-- ============================================================================
-- DROP TABLES (in reverse order of dependencies)
-- ============================================================================

-- Drop tables that reference other tables first (to avoid foreign key constraints)
DROP TABLE IF EXISTS participant_responses CASCADE;
DROP TABLE IF EXISTS layer_feedback CASCADE;
DROP TABLE IF EXISTS predictions CASCADE;
DROP TABLE IF EXISTS post_experiment_responses CASCADE;
DROP TABLE IF EXISTS pre_experiment_responses CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script, verify all tables are dropped:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ============================================================================
-- NEXT STEPS
-- ============================================================================
-- 1. Verify tables are dropped
-- 2. Run supabase_schema.sql to create new tables
-- 3. Test with a sample session to ensure everything works
