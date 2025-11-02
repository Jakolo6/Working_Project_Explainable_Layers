-- Migration: Create post_questionnaires table
-- Stores post-experiment questionnaire responses

CREATE TABLE IF NOT EXISTS post_questionnaires (
    id UUID PRIMARY KEY,
    session_id TEXT NOT NULL,
    overall_experience INTEGER NOT NULL CHECK (overall_experience >= 1 AND overall_experience <= 5),
    explanation_helpfulness INTEGER NOT NULL CHECK (explanation_helpfulness >= 1 AND explanation_helpfulness <= 5),
    preferred_layer TEXT NOT NULL,
    would_trust_ai INTEGER NOT NULL CHECK (would_trust_ai >= 1 AND would_trust_ai <= 5),
    comments TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries by session
CREATE INDEX IF NOT EXISTS idx_post_questionnaires_session ON post_questionnaires(session_id);

-- Enable Row Level Security (RLS)
ALTER TABLE post_questionnaires ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on post_questionnaires" ON post_questionnaires
    FOR ALL
    USING (true)
    WITH CHECK (true);
