CREATE EXTENSION IF NOT EXISTS "pgcrypto";


CREATE TABLE card_states (
                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             profile_id UUID NOT NULL REFERENCES user_learning_profiles(id) ON DELETE CASCADE,
                             global_word_id UUID NOT NULL REFERENCES global_words(id) ON DELETE CASCADE,
                             mnemonic TEXT,
                             state SMALLINT NOT NULL DEFAULT 0,
                             due TIMESTAMPTZ NOT NULL DEFAULT now(),
                             stability DOUBLE PRECISION NOT NULL DEFAULT 0,
                             difficulty DOUBLE PRECISION NOT NULL DEFAULT 0,
                             elapsed_days INTEGER NOT NULL DEFAULT 0,
                             scheduled_days INTEGER NOT NULL DEFAULT 0,
                             reps INTEGER NOT NULL DEFAULT 0,
                             lapses INTEGER NOT NULL DEFAULT 0,
                             last_review TIMESTAMPTZ NULL,
                             version INTEGER NOT NULL DEFAULT 1,
                             created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                             updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                             CONSTRAINT unique_profile_word UNIQUE(profile_id, global_word_id)
);
CREATE INDEX idx_card_states_lesson ON card_states(profile_id, state, due);


CREATE TABLE review_logs (
                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             card_state_id UUID NOT NULL REFERENCES card_states(id) ON DELETE CASCADE,
                             profile_id UUID NOT NULL REFERENCES user_learning_profiles(id) ON DELETE CASCADE,

                             rating SMALLINT NOT NULL,
                             state SMALLINT NOT NULL,
                             elapsed_days INTEGER NOT NULL,
                             scheduled_days INTEGER NOT NULL,
                             review_time TIMESTAMPTZ NOT NULL DEFAULT now(),
                             duration_ms INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_review_logs_optimizer ON review_logs(profile_id, review_time);

