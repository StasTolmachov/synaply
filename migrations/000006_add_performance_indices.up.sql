-- Migration to add indices to words table for performance optimization
CREATE INDEX IF NOT EXISTS idx_words_user_id ON words (user_id);
CREATE INDEX IF NOT EXISTS idx_words_user_id_state_due ON words (user_id, state, due);
CREATE INDEX IF NOT EXISTS idx_words_user_id_created_at ON words (user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);
