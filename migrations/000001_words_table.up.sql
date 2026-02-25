create extension if not exists "pgcrypto";

create table if not exists words (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    source_lang varchar(100) not null,
    target_lang varchar(100) not null,
    source_word text not null,
    target_word text not null,
    comment text,
    is_learned boolean default false,
    correct_streak integer,
    total_mistakes integer,
    difficult_level integer,
    Last_seen_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz not null default now()
);

alter table words add constraint unique_user_word unique (user_id, source_lang, target_lang, source_word, target_word);