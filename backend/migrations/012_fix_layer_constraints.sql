-- Migration: Fix layer_ratings constraints completely
-- Run this in Supabase SQL Editor

-- First, let's see what constraints exist
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'layer_ratings'::regclass;

-- Drop ALL constraints on layer_ratings to start fresh
ALTER TABLE layer_ratings DROP CONSTRAINT IF EXISTS layer_ratings_layer_name_check;
ALTER TABLE layer_ratings DROP CONSTRAINT IF EXISTS layer_ratings_layer_number_check;

-- Update any existing rows with old layer names
UPDATE layer_ratings 
SET layer_name = CASE layer_name
    WHEN 'Complete SHAP Analysis' THEN 'Baseline SHAP Explanation'
    WHEN 'Analytical Dashboard' THEN 'Interactive Dashboard'
    ELSE layer_name
END
WHERE layer_name IN ('Complete SHAP Analysis', 'Analytical Dashboard');

-- Add the new layer_name constraint
ALTER TABLE layer_ratings ADD CONSTRAINT layer_ratings_layer_name_check 
CHECK (layer_name IN (
    'Baseline SHAP Explanation',
    'Interactive Dashboard', 
    'Narrative Explanation',
    'Counterfactual Analysis'
));

-- Add the layer_number constraint ( 1-4 )
ALTER TABLE layer_ratings ADD CONSTRAINT layer_ratings_layer_number_check 
CHECK (layer_number >= 1 AND layer_number <= 4);

-- Verify everything looks correct
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'layer_ratings'::regclass;

-- Check current data
SELECT layer_name, layer_number, COUNT(*) 
FROM layer_ratings 
GROUP BY layer_name, layer_number 
ORDER BY layer_number, layer_name;
