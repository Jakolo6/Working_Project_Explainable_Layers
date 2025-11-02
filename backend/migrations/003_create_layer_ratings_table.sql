-- Migration: Create layer_ratings table
-- Stores participant ratings for each explanation layer

CREATE TABLE IF NOT EXISTS layer_ratings (
    id UUID PRIMARY KEY,
    session_id TEXT NOT NULL,
    persona_id TEXT NOT NULL,
    layer_number INTEGER NOT NULL CHECK (layer_number >= 1 AND layer_number <= 5),
    layer_name TEXT NOT NULL,
    trust_rating INTEGER NOT NULL CHECK (trust_rating >= 1 AND trust_rating <= 5),
    understanding_rating INTEGER NOT NULL CHECK (understanding_rating >= 1 AND understanding_rating <= 5),
    usefulness_rating INTEGER NOT NULL CHECK (usefulness_rating >= 1 AND usefulness_rating <= 5),
    mental_effort_rating INTEGER NOT NULL CHECK (mental_effort_rating >= 1 AND mental_effort_rating <= 5),
    comment TEXT DEFAULT '',
    time_spent_seconds INTEGER NOT NULL CHECK (time_spent_seconds >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries by session
CREATE INDEX IF NOT EXISTS idx_layer_ratings_session ON layer_ratings(session_id);

-- Create index for faster queries by persona
CREATE INDEX IF NOT EXISTS idx_layer_ratings_persona ON layer_ratings(persona_id);

-- Create composite index for session + persona + layer queries
CREATE INDEX IF NOT EXISTS idx_layer_ratings_session_persona_layer ON layer_ratings(session_id, persona_id, layer_number);

-- Enable Row Level Security (RLS)
ALTER TABLE layer_ratings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (adjust based on your auth requirements)
CREATE POLICY "Allow all operations on layer_ratings" ON layer_ratings
    FOR ALL
    USING (true)
    WITH CHECK (true);
