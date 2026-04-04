CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE users (
                       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                       email VARCHAR(255) NOT NULL,
                       password_hash VARCHAR(255) NOT NULL,
                       first_name VARCHAR(100) NOT NULL,
                       last_name VARCHAR(100) NOT NULL,
                       role VARCHAR(20) NOT NULL DEFAULT 'user',

                       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                       updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                       deleted_at TIMESTAMPTZ NULL,

                       CONSTRAINT check_role CHECK ( role IN ('user', 'moderator', 'admin') )
);
CREATE UNIQUE INDEX idx_users_email_active ON users (email) WHERE deleted_at IS NULL;


CREATE TABLE user_learning_profiles (
                                        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                                        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

                                        source_lang VARCHAR(10) NOT NULL,
                                        target_lang VARCHAR(10) NOT NULL,

                                        fsrs_weights DOUBLE PRECISION[] NULL,
                                        request_retention REAL NOT NULL DEFAULT 0.90,
                                        maximum_interval INTEGER NOT NULL DEFAULT 36500,

                                        is_active BOOLEAN NOT NULL DEFAULT false,
                                        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                                        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                        CONSTRAINT unique_user_lang_pair UNIQUE (user_id, source_lang, target_lang)
);
CREATE INDEX idx_active_profile ON user_learning_profiles(user_id) WHERE is_active = true;
