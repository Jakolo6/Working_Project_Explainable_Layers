-- ============================================================================
-- MIGRATION: Update questionnaire structure
-- Run this in Supabase SQL Editor to update existing tables
-- Date: 2025-12-02
-- ============================================================================

-- ============================================================================
-- 1. UPDATE SESSIONS TABLE - Add consent and new baseline questions
-- ============================================================================

-- Add new columns to sessions table
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT FALSE;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS participant_background TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS credit_experience TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS preferred_explanation_style TEXT;
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS background_notes TEXT DEFAULT '';

-- Update ai_familiarity to INTEGER if it was TEXT
-- First, drop the old constraint if exists
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_ai_familiarity_check;

-- Add new constraints
ALTER TABLE sessions ADD CONSTRAINT sessions_participant_background_check 
    CHECK (participant_background IS NULL OR participant_background IN ('banking', 'data_analytics', 'student', 'other'));
ALTER TABLE sessions ADD CONSTRAINT sessions_credit_experience_check 
    CHECK (credit_experience IS NULL OR credit_experience IN ('none', 'some', 'regular', 'expert'));
ALTER TABLE sessions ADD CONSTRAINT sessions_preferred_explanation_style_check 
    CHECK (preferred_explanation_style IS NULL OR preferred_explanation_style IN ('technical', 'visual', 'narrative', 'action_oriented'));

-- Drop old columns that are no longer needed (optional - keep for backward compatibility)
-- ALTER TABLE sessions DROP COLUMN IF EXISTS participant_name;
-- ALTER TABLE sessions DROP COLUMN IF EXISTS participant_age;
-- ALTER TABLE sessions DROP COLUMN IF EXISTS participant_profession;
-- ALTER TABLE sessions DROP COLUMN IF EXISTS finance_experience;

-- ============================================================================
-- 2. UPDATE LAYER_RATINGS TABLE - Replace old rating columns with new ones
-- ============================================================================

-- Add new rating columns
ALTER TABLE layer_ratings ADD COLUMN IF NOT EXISTS communicability_rating INTEGER;
ALTER TABLE layer_ratings ADD COLUMN IF NOT EXISTS perceived_fairness_rating INTEGER;
ALTER TABLE layer_ratings ADD COLUMN IF NOT EXISTS cognitive_load_rating INTEGER;
ALTER TABLE layer_ratings ADD COLUMN IF NOT EXISTS reliance_intention_rating INTEGER;

-- Add constraints for new columns
ALTER TABLE layer_ratings ADD CONSTRAINT layer_ratings_communicability_check 
    CHECK (communicability_rating IS NULL OR (communicability_rating >= 1 AND communicability_rating <= 5));
ALTER TABLE layer_ratings ADD CONSTRAINT layer_ratings_perceived_fairness_check 
    CHECK (perceived_fairness_rating IS NULL OR (perceived_fairness_rating >= 1 AND perceived_fairness_rating <= 5));
ALTER TABLE layer_ratings ADD CONSTRAINT layer_ratings_cognitive_load_check 
    CHECK (cognitive_load_rating IS NULL OR (cognitive_load_rating >= 1 AND cognitive_load_rating <= 5));
ALTER TABLE layer_ratings ADD CONSTRAINT layer_ratings_reliance_intention_check 
    CHECK (reliance_intention_rating IS NULL OR (reliance_intention_rating >= 1 AND reliance_intention_rating <= 5));

-- Drop old columns (optional - keep for backward compatibility with existing data)
-- ALTER TABLE layer_ratings DROP COLUMN IF EXISTS trust_rating;
-- ALTER TABLE layer_ratings DROP COLUMN IF EXISTS usefulness_rating;
-- ALTER TABLE layer_ratings DROP COLUMN IF EXISTS mental_effort_rating;

-- ============================================================================
-- 3. UPDATE POST_QUESTIONNAIRES TABLE - Replace old questions with new ones
-- ============================================================================

-- Add new columns
ALTER TABLE post_questionnaires ADD COLUMN IF NOT EXISTS most_helpful_layer TEXT;
ALTER TABLE post_questionnaires ADD COLUMN IF NOT EXISTS most_trusted_layer TEXT;
ALTER TABLE post_questionnaires ADD COLUMN IF NOT EXISTS best_for_customer TEXT;
ALTER TABLE post_questionnaires ADD COLUMN IF NOT EXISTS overall_intuitiveness INTEGER;
ALTER TABLE post_questionnaires ADD COLUMN IF NOT EXISTS ai_usefulness INTEGER;
ALTER TABLE post_questionnaires ADD COLUMN IF NOT EXISTS improvement_suggestions TEXT DEFAULT '';

-- Add constraints for new columns
ALTER TABLE post_questionnaires ADD CONSTRAINT post_questionnaires_most_helpful_layer_check 
    CHECK (most_helpful_layer IS NULL OR most_helpful_layer IN ('layer_1', 'layer_2', 'layer_3', 'layer_4'));
ALTER TABLE post_questionnaires ADD CONSTRAINT post_questionnaires_most_trusted_layer_check 
    CHECK (most_trusted_layer IS NULL OR most_trusted_layer IN ('layer_1', 'layer_2', 'layer_3', 'layer_4'));
ALTER TABLE post_questionnaires ADD CONSTRAINT post_questionnaires_best_for_customer_check 
    CHECK (best_for_customer IS NULL OR best_for_customer IN ('layer_1', 'layer_2', 'layer_3', 'layer_4'));
ALTER TABLE post_questionnaires ADD CONSTRAINT post_questionnaires_overall_intuitiveness_check 
    CHECK (overall_intuitiveness IS NULL OR (overall_intuitiveness >= 1 AND overall_intuitiveness <= 5));
ALTER TABLE post_questionnaires ADD CONSTRAINT post_questionnaires_ai_usefulness_check 
    CHECK (ai_usefulness IS NULL OR (ai_usefulness >= 1 AND ai_usefulness <= 5));

-- Drop old columns (optional - keep for backward compatibility with existing data)
-- ALTER TABLE post_questionnaires DROP COLUMN IF EXISTS overall_experience;
-- ALTER TABLE post_questionnaires DROP COLUMN IF EXISTS explanation_helpfulness;
-- ALTER TABLE post_questionnaires DROP COLUMN IF EXISTS preferred_layer;
-- ALTER TABLE post_questionnaires DROP COLUMN IF EXISTS would_trust_ai;
-- ALTER TABLE post_questionnaires DROP COLUMN IF EXISTS comments;

-- ============================================================================
-- DONE! New questionnaire structure is ready.
-- ============================================================================
