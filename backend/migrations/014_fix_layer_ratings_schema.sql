-- Migration: Fix layer_ratings table schema for current implementation
-- Run this in Supabase SQL Editor

-- The layer_name constraint still has old names from the schema file
-- Update it to match the new layer names or remove it entirely

-- Option 1: Update the constraint to new layer names
ALTER TABLE layer_ratings DROP CONSTRAINT IF EXISTS layer_ratings_layer_name_check;

-- Add constraint with new layer names (if you want to keep it)
ALTER TABLE layer_ratings ADD CONSTRAINT layer_ratings_layer_name_check 
CHECK (layer_name IN (
    'Baseline SHAP Explanation',
    'Interactive Dashboard', 
    'Narrative Explanation',
    'Counterfactual Analysis'
));

-- Option 2: Or completely remove the layer_name constraint (recommended)
-- ALTER TABLE layer_ratings DROP CONSTRAINT IF EXISTS layer_ratings_layer_name_check;

-- The session_id must be a valid UUID that exists in the sessions table
-- This is enforced by the foreign key constraint

-- Show current constraints after changes
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'layer_ratings'::regclass;
