CREATE EXTENSION IF NOT EXISTS "pgcrypto";


CREATE TABLE word_lists (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            title VARCHAR(255) NOT NULL,
                            description TEXT,
                            visibility VARCHAR(20) NOT NULL DEFAULT 'private',

                            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                            deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_word_lists_public ON word_lists(visibility) WHERE visibility = 'public' AND deleted_at IS NULL;


CREATE TABLE word_list_items (
                                 list_id UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
                                 global_word_id UUID NOT NULL REFERENCES global_words(id) ON DELETE CASCADE,
                                 added_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                 PRIMARY KEY (list_id, global_word_id)
);


CREATE TABLE courses (
                         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                         author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                         title VARCHAR(255) NOT NULL,
                         description TEXT,
                         level VARCHAR(10),
                         status VARCHAR(20) NOT NULL DEFAULT 'draft',

                         created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                         updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                         deleted_at TIMESTAMPTZ NULL
);


CREATE TABLE course_modules (
                                course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                                list_id UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
                                sort_order INTEGER NOT NULL DEFAULT 0,

                                PRIMARY KEY (course_id, list_id)
);


CREATE TABLE course_subscriptions (
                                      profile_id UUID NOT NULL REFERENCES user_learning_profiles(id) ON DELETE CASCADE,
                                      course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
                                      status VARCHAR(20) NOT NULL DEFAULT 'active',
                                      subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                      PRIMARY KEY (profile_id, course_id)
);
