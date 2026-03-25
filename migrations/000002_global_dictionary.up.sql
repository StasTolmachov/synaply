CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE global_words (
                              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                              source_lang VARCHAR(10) NOT NULL,
                              target_lang VARCHAR(10) NOT NULL,
                              source_word TEXT NOT NULL,
                              target_word TEXT NOT NULL,

                              created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                              CONSTRAINT unique_global_translation UNIQUE (source_lang, target_lang, source_word, target_word)
);
CREATE INDEX idx_global_words_search ON global_words (source_lang, target_lang, source_word);
