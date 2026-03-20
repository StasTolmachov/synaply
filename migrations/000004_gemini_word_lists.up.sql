CREATE TABLE IF NOT EXISTS gemini_word_lists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_lang VARCHAR(10) NOT NULL,
    target_lang VARCHAR(10) NOT NULL,
    level VARCHAR(10) NOT NULL,
    topic TEXT NOT NULL,
    response JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_gemini_word_lists_lookup ON gemini_word_lists (source_lang, target_lang, level, topic);
CREATE UNIQUE INDEX idx_gemini_word_lists_unique ON gemini_word_lists (source_lang, target_lang, level, topic);
