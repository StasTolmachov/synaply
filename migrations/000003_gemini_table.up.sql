create table if not exists gemini (
    id uuid primary key default gen_random_uuid(),
    source_lang varchar(100) not null,
    target_lang varchar(100) not null,
    source_word text not null,
    target_word text not null,
    response text
);

create index idx_lang_word on gemini (source_lang, target_lang, source_word, target_word);
alter table gemini add constraint unique_gemini_куызщтыу unique (source_lang, target_lang, source_word, target_word);