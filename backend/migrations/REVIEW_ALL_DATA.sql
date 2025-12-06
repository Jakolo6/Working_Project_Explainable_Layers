-- ═══════════════════════════════════════════════════════════════════════
-- COMPREHENSIVE DATA REVIEW FOR SUPABASE
-- ═══════════════════════════════════════════════════════════════════════
-- Purpose: Review all data and verify the new flow is working correctly
-- Run these queries in Supabase SQL Editor to inspect your data
-- ═══════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════
-- 1. SESSIONS OVERVIEW
-- ═══════════════════════════════════════════════════════════════════════

-- Get all sessions with their completion status
SELECT 
    session_id,
    participant_background,
    credit_experience,
    ai_familiarity,
    preferred_explanation_style,
    completed,
    created_at,
    completed_at,
    CASE 
        WHEN completed THEN 'Completed'
        ELSE 'In Progress'
    END as status
FROM sessions
ORDER BY created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════
-- 2. SESSIONS WITH COUNTS
-- ═══════════════════════════════════════════════════════════════════════

-- Get sessions with prediction, rating, and questionnaire counts
SELECT 
    s.session_id,
    s.participant_background,
    s.completed,
    s.created_at,
    COUNT(DISTINCT p.prediction_id) as total_predictions,
    COUNT(DISTINCT r.rating_id) as total_ratings,
    COUNT(DISTINCT q.questionnaire_id) as total_questionnaires,
    -- Count personas completed (personas with all 4 layers rated)
    COUNT(DISTINCT CASE 
        WHEN persona_layer_counts.layers_rated = 4 
        THEN persona_layer_counts.persona_id 
    END) as personas_completed
FROM sessions s
LEFT JOIN predictions p ON s.session_id = p.session_id
LEFT JOIN layer_ratings r ON s.session_id = r.session_id
LEFT JOIN questionnaires q ON s.session_id = q.session_id
LEFT JOIN (
    -- Subquery to count layers per persona
    SELECT 
        session_id,
        persona_id,
        COUNT(DISTINCT layer_number) as layers_rated
    FROM layer_ratings
    GROUP BY session_id, persona_id
) persona_layer_counts ON s.session_id = persona_layer_counts.session_id
GROUP BY s.session_id, s.participant_background, s.completed, s.created_at
ORDER BY s.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════
-- 3. PARTICIPANT BACKGROUND DISTRIBUTION
-- ═══════════════════════════════════════════════════════════════════════

-- Count participants by background (including new banking_and_analytics option)
SELECT 
    participant_background,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM sessions
GROUP BY participant_background
ORDER BY count DESC;

-- ═══════════════════════════════════════════════════════════════════════
-- 4. PREDICTIONS OVERVIEW
-- ═══════════════════════════════════════════════════════════════════════

-- Get all predictions with their details
SELECT 
    p.prediction_id,
    p.session_id,
    p.persona_id,
    p.decision,
    p.probability,
    p.model_type,
    p.created_at,
    -- Count how many layers have been rated for this prediction
    COUNT(DISTINCT r.layer_number) as layers_rated
FROM predictions p
LEFT JOIN layer_ratings r ON p.prediction_id = r.prediction_id
GROUP BY p.prediction_id, p.session_id, p.persona_id, p.decision, p.probability, p.model_type, p.created_at
ORDER BY p.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════
-- 5. LAYER RATINGS OVERVIEW
-- ═══════════════════════════════════════════════════════════════════════

-- Get all layer ratings with session and persona info
SELECT 
    r.rating_id,
    r.session_id,
    r.prediction_id,
    r.persona_id,
    r.layer_number,
    r.understanding,
    r.communicability,
    r.fairness,
    r.cognitive_load,
    r.reliance_intention,
    r.created_at,
    s.participant_background
FROM layer_ratings r
JOIN sessions s ON r.session_id = s.session_id
ORDER BY r.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════
-- 6. AVERAGE RATINGS BY LAYER
-- ═══════════════════════════════════════════════════════════════════════

-- Calculate average ratings for each layer
SELECT 
    layer_number,
    COUNT(*) as total_ratings,
    ROUND(AVG(understanding), 2) as avg_understanding,
    ROUND(AVG(communicability), 2) as avg_communicability,
    ROUND(AVG(fairness), 2) as avg_fairness,
    ROUND(AVG(cognitive_load), 2) as avg_cognitive_load,
    ROUND(AVG(reliance_intention), 2) as avg_reliance_intention,
    ROUND(AVG((understanding + communicability + fairness + cognitive_load + reliance_intention) / 5.0), 2) as avg_overall
FROM layer_ratings
GROUP BY layer_number
ORDER BY layer_number;

-- ═══════════════════════════════════════════════════════════════════════
-- 7. RATINGS BY BACKGROUND
-- ═══════════════════════════════════════════════════════════════════════

-- Compare ratings across different participant backgrounds
SELECT 
    s.participant_background,
    r.layer_number,
    COUNT(*) as count,
    ROUND(AVG(r.understanding), 2) as avg_understanding,
    ROUND(AVG(r.communicability), 2) as avg_communicability,
    ROUND(AVG(r.fairness), 2) as avg_fairness,
    ROUND(AVG(r.cognitive_load), 2) as avg_cognitive_load,
    ROUND(AVG(r.reliance_intention), 2) as avg_reliance_intention
FROM layer_ratings r
JOIN sessions s ON r.session_id = s.session_id
GROUP BY s.participant_background, r.layer_number
ORDER BY s.participant_background, r.layer_number;

-- ═══════════════════════════════════════════════════════════════════════
-- 8. QUESTIONNAIRES OVERVIEW
-- ═══════════════════════════════════════════════════════════════════════

-- Get all questionnaires with their responses
SELECT 
    q.questionnaire_id,
    q.session_id,
    q.persona_id,
    q.preferred_layer,
    q.least_preferred_layer,
    q.trust_change,
    q.decision_confidence,
    q.would_use_in_practice,
    q.additional_comments,
    q.created_at,
    s.participant_background
FROM questionnaires q
JOIN sessions s ON q.session_id = s.session_id
ORDER BY q.created_at DESC;

-- ═══════════════════════════════════════════════════════════════════════
-- 9. PREFERRED LAYER DISTRIBUTION
-- ═══════════════════════════════════════════════════════════════════════

-- Count which layers are most preferred
SELECT 
    preferred_layer,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM questionnaires
WHERE preferred_layer IS NOT NULL
GROUP BY preferred_layer
ORDER BY count DESC;

-- ═══════════════════════════════════════════════════════════════════════
-- 10. COMPLETION FUNNEL
-- ═══════════════════════════════════════════════════════════════════════

-- Analyze how many participants complete each stage
SELECT 
    'Started Session' as stage,
    COUNT(*) as count,
    100.0 as percentage
FROM sessions

UNION ALL

SELECT 
    'Made Prediction' as stage,
    COUNT(DISTINCT session_id) as count,
    ROUND(COUNT(DISTINCT session_id) * 100.0 / (SELECT COUNT(*) FROM sessions), 2) as percentage
FROM predictions

UNION ALL

SELECT 
    'Rated At Least 1 Layer' as stage,
    COUNT(DISTINCT session_id) as count,
    ROUND(COUNT(DISTINCT session_id) * 100.0 / (SELECT COUNT(*) FROM sessions), 2) as percentage
FROM layer_ratings

UNION ALL

SELECT 
    'Completed 1 Persona (4 layers)' as stage,
    COUNT(DISTINCT session_id) as count,
    ROUND(COUNT(DISTINCT session_id) * 100.0 / (SELECT COUNT(*) FROM sessions), 2) as percentage
FROM (
    SELECT session_id, persona_id, COUNT(DISTINCT layer_number) as layers
    FROM layer_ratings
    GROUP BY session_id, persona_id
    HAVING COUNT(DISTINCT layer_number) = 4
) persona_completions

UNION ALL

SELECT 
    'Completed 2 Personas (8 layers)' as stage,
    COUNT(DISTINCT session_id) as count,
    ROUND(COUNT(DISTINCT session_id) * 100.0 / (SELECT COUNT(*) FROM sessions), 2) as percentage
FROM (
    SELECT session_id, COUNT(DISTINCT persona_id) as personas
    FROM (
        SELECT session_id, persona_id, COUNT(DISTINCT layer_number) as layers
        FROM layer_ratings
        GROUP BY session_id, persona_id
        HAVING COUNT(DISTINCT layer_number) = 4
    ) completed_personas
    GROUP BY session_id
    HAVING COUNT(DISTINCT persona_id) = 2
) full_completions

UNION ALL

SELECT 
    'Marked Complete' as stage,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM sessions), 2) as percentage
FROM sessions
WHERE completed = true

ORDER BY count DESC;

-- ═══════════════════════════════════════════════════════════════════════
-- 11. PERSONA COMPLETION DETAILS
-- ═══════════════════════════════════════════════════════════════════════

-- See which personas are being completed
SELECT 
    persona_id,
    COUNT(DISTINCT session_id) as sessions_started,
    COUNT(DISTINCT CASE WHEN layers_rated = 4 THEN session_id END) as sessions_completed,
    ROUND(COUNT(DISTINCT CASE WHEN layers_rated = 4 THEN session_id END) * 100.0 / 
          COUNT(DISTINCT session_id), 2) as completion_rate
FROM (
    SELECT 
        session_id,
        persona_id,
        COUNT(DISTINCT layer_number) as layers_rated
    FROM layer_ratings
    GROUP BY session_id, persona_id
) persona_progress
GROUP BY persona_id
ORDER BY persona_id;

-- ═══════════════════════════════════════════════════════════════════════
-- 12. DATA QUALITY CHECKS
-- ═══════════════════════════════════════════════════════════════════════

-- Check for orphaned records (data integrity)
SELECT 
    'Predictions without sessions' as check_name,
    COUNT(*) as count
FROM predictions p
LEFT JOIN sessions s ON p.session_id = s.session_id
WHERE s.session_id IS NULL

UNION ALL

SELECT 
    'Ratings without predictions' as check_name,
    COUNT(*) as count
FROM layer_ratings r
LEFT JOIN predictions p ON r.prediction_id = p.prediction_id
WHERE p.prediction_id IS NULL

UNION ALL

SELECT 
    'Ratings without sessions' as check_name,
    COUNT(*) as count
FROM layer_ratings r
LEFT JOIN sessions s ON r.session_id = s.session_id
WHERE s.session_id IS NULL

UNION ALL

SELECT 
    'Questionnaires without sessions' as check_name,
    COUNT(*) as count
FROM questionnaires q
LEFT JOIN sessions s ON q.session_id = s.session_id
WHERE s.session_id IS NULL;

-- ═══════════════════════════════════════════════════════════════════════
-- 13. RECENT ACTIVITY (Last 24 hours)
-- ═══════════════════════════════════════════════════════════════════════

SELECT 
    'Sessions Created' as activity,
    COUNT(*) as count
FROM sessions
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'Predictions Made' as activity,
    COUNT(*) as count
FROM predictions
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'Layers Rated' as activity,
    COUNT(*) as count
FROM layer_ratings
WHERE created_at > NOW() - INTERVAL '24 hours'

UNION ALL

SELECT 
    'Questionnaires Submitted' as activity,
    COUNT(*) as count
FROM questionnaires
WHERE created_at > NOW() - INTERVAL '24 hours';

-- ═══════════════════════════════════════════════════════════════════════
-- 14. FULL SESSION DETAILS (for debugging)
-- ═══════════════════════════════════════════════════════════════════════

-- Get complete details for a specific session (replace 'SESSION_ID_HERE' with actual ID)
-- Uncomment and modify the session_id to use:

/*
SELECT 
    'Session Info' as data_type,
    json_build_object(
        'session_id', s.session_id,
        'background', s.participant_background,
        'experience', s.credit_experience,
        'ai_familiarity', s.ai_familiarity,
        'completed', s.completed,
        'created_at', s.created_at
    ) as data
FROM sessions s
WHERE s.session_id = 'SESSION_ID_HERE'

UNION ALL

SELECT 
    'Predictions' as data_type,
    json_agg(json_build_object(
        'prediction_id', p.prediction_id,
        'persona_id', p.persona_id,
        'decision', p.decision,
        'probability', p.probability,
        'created_at', p.created_at
    )) as data
FROM predictions p
WHERE p.session_id = 'SESSION_ID_HERE'

UNION ALL

SELECT 
    'Layer Ratings' as data_type,
    json_agg(json_build_object(
        'rating_id', r.rating_id,
        'persona_id', r.persona_id,
        'layer_number', r.layer_number,
        'understanding', r.understanding,
        'communicability', r.communicability,
        'fairness', r.fairness,
        'cognitive_load', r.cognitive_load,
        'reliance_intention', r.reliance_intention,
        'created_at', r.created_at
    )) as data
FROM layer_ratings r
WHERE r.session_id = 'SESSION_ID_HERE'

UNION ALL

SELECT 
    'Questionnaires' as data_type,
    json_agg(json_build_object(
        'questionnaire_id', q.questionnaire_id,
        'persona_id', q.persona_id,
        'preferred_layer', q.preferred_layer,
        'least_preferred_layer', q.least_preferred_layer,
        'trust_change', q.trust_change,
        'created_at', q.created_at
    )) as data
FROM questionnaires q
WHERE q.session_id = 'SESSION_ID_HERE';
*/

-- ═══════════════════════════════════════════════════════════════════════
-- 15. SCHEMA VERIFICATION
-- ═══════════════════════════════════════════════════════════════════════

-- Verify all tables exist and have correct columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('sessions', 'predictions', 'layer_ratings', 'questionnaires')
ORDER BY table_name, ordinal_position;

-- ═══════════════════════════════════════════════════════════════════════
-- END OF REVIEW QUERIES
-- ═══════════════════════════════════════════════════════════════════════
