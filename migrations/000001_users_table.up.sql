
create table if not exists users (
    id UUID primary key default gen_random_uuid(),
    email varchar(100) not null unique,
    password_hash varchar(255) not null,
    first_name varchar(100) not null,
    last_name varchar(100) not null,
    role varchar(20) not null default 'user',
    source_lang varchar(20) not null,
    target_lang varchar(20) not null,
    total_correct integer not null default 0,
    created_at TIMESTAMPTZ not null default now(),
    updated_at TIMESTAMPTZ not null default now(),
    deleted_at TIMESTAMPTZ null
);

create index idx_users_id on users (id);
create index idx_users_email on users (email);
alter table users add constraint check_role check ( role in ('user', 'moderator', 'admin') );