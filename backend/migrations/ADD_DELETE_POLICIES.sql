-- ============================================================================
-- ADD DELETE POLICIES FOR RLS
-- Fix: Admin cannot delete sessions because DELETE policies are missing
-- Date: 2025-12-05
-- ============================================================================

-- Add DELETE policies to allow deletion (for admin operations)
-- These policies allow anyone to delete (suitable for admin endpoints)
-- In production, you might want to restrict this to authenticated admin users

CREATE POLICY "sessions_delete" ON sessions FOR DELETE USING (true);
CREATE POLICY "predictions_delete" ON predictions FOR DELETE USING (true);
CREATE POLICY "layer_ratings_delete" ON layer_ratings FOR DELETE USING (true);
CREATE POLICY "post_questionnaires_delete" ON post_questionnaires FOR DELETE USING (true);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check all policies for sessions table
-- SELECT * FROM pg_policies WHERE tablename = 'sessions';

-- Check all policies for all experiment tables
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE tablename IN ('sessions', 'predictions', 'layer_ratings', 'post_questionnaires')
-- ORDER BY tablename, cmd;
