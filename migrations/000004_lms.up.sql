CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE classrooms (
                            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                            teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                            name VARCHAR(255) NOT NULL,
                            description TEXT,
                            source_lang VARCHAR(10) NOT NULL,
                            target_lang VARCHAR(10) NOT NULL,
                            invite_code VARCHAR(20) UNIQUE NOT NULL,
                            status VARCHAR(20) DEFAULT 'active'
                                cover_url VARCHAR(512) NULL,

                            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                            deleted_at TIMESTAMPTZ NULL
);
CREATE INDEX idx_classrooms_invite ON classrooms(invite_code) WHERE deleted_at IS NULL;


CREATE TABLE classroom_students (
                                    classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
                                    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                    class_role VARCHAR(20) NOT NULL DEFAULT 'student',
                                    join_status VARCHAR(20) DEFAULT 'pending'
                                        joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),

                                    PRIMARY KEY (classroom_id, student_id)
);


CREATE TABLE assignments (
                             id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                             classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
                             word_list_id UUID NOT NULL REFERENCES word_lists(id) ON DELETE CASCADE,
                             title VARCHAR(255) NOT NULL,
                             description TEXT,
                             due_date TIMESTAMPTZ NOT NULL,

                             created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
                             updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE student_assignments (
                                     assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
                                     student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                     status VARCHAR(20) NOT NULL DEFAULT 'assigned',
                                     completed_at TIMESTAMPTZ NULL,

                                     PRIMARY KEY (assignment_id, student_id)
);