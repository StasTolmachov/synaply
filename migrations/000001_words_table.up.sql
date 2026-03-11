create extension if not exists "pgcrypto";

create table if not exists words (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    source_lang varchar(100) not null,
    target_lang varchar(100) not null,
    source_word text not null,
    target_word text not null,
    comment text,

    -- НОВЫЕ ПОЛЯ FSRS:
    due timestamptz not null default now(),      -- Когда R упадет до 90% (пора повторять)
    stability double precision not null default 0, -- S (Стабильность)
    difficulty double precision not null default 0, -- D (Сложность)
    elapsed_days integer not null default 0,      -- Дней с прошлого показа
    scheduled_days integer not null default 0,    -- На сколько дней было отложено
    reps integer not null default 0,              -- Всего повторений
    lapses integer not null default 0,            -- Сколько раз забыл
    state integer not null default 0,             -- 0-New, 1-Learning, 2-Review, 3-Relearning
    last_review timestamptz,                      -- Время последнего ответа

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz not null default now()
);

alter table words add constraint unique_user_word unique (user_id, source_lang, target_lang, source_word, target_word);