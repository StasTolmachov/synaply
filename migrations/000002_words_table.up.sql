create extension if not exists "pgcrypto";

create table if not exists words (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    source_lang varchar(100) not null,
    target_lang varchar(100) not null,
    source_word text not null,
    target_word text not null,
    comment text,

    -- NEW FSRS FIELDS:
    due timestamptz not null default now(),      -- When R drops to 90% (time to review)
    stability double precision not null default 0, -- S (Stability)
    difficulty double precision not null default 0, -- D (Difficulty)
    elapsed_days integer not null default 0,      -- Days since last review
    scheduled_days integer not null default 0,    -- How many days it was deferred for
    reps integer not null default 0,              -- Total repetitions
    lapses integer not null default 0,            -- How many times forgotten
    state integer not null default 0,             -- 0-New, 1-Learning, 2-Review, 3-Relearning
    last_review timestamptz,                      -- Last review time

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz default null
);

alter table words add constraint unique_user_word unique (user_id, source_lang, target_lang, source_word, target_word);
