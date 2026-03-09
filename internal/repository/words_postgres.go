package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"wordsGo_v2/internal/repository/modelsDB"
	"wordsGo_v2/slogger"
)

type WordsPostgresI interface {
	Create(ctx context.Context, req *modelsDB.WordCreateReq) (*modelsDB.Word, error)
	GetLessonWords(ctx context.Context, userID uuid.UUID) (*[]modelsDB.LessonWordsDB, error)
	GetWordByID(ctx context.Context, wordID uuid.UUID) (*modelsDB.Word, error)
}
type WordsPostgres struct {
	db *Postgres
}

func NewWordsPostgres(db *Postgres) *WordsPostgres {
	return &WordsPostgres{db: db}
}

func (p *WordsPostgres) Create(ctx context.Context, req *modelsDB.WordCreateReq) (*modelsDB.Word, error) {
	query := `insert into words (user_id, source_lang, target_lang, source_word, target_word, comment) 
values ($1, $2, $3, $4, $5, $6)
returning id, user_id, source_lang, target_lang, source_word, target_word, comment`
	var resp modelsDB.Word
	err := p.db.db.QueryRowxContext(ctx, query, req.UserID, req.SourceLang, req.TargetLang, req.SourceWord, req.TargetWord, req.Comment).StructScan(&resp)
	if err != nil {
		return nil, fmt.Errorf("error creating word: %s", err)
	}
	slogger.Log.DebugContext(ctx, "Repo Create response", "resp", resp)
	return &resp, nil
}

func (p *WordsPostgres) GetLessonWords(ctx context.Context, userID uuid.UUID) (*[]modelsDB.LessonWordsDB, error) {
	query := `
	with
	new_words as (
		select w.id, w.source_word, w.target_word
		from words w
		where w.user_id = $1
		and w.is_learned = false
		and w.correct_streak = 0
		and w.total_mistakes = 0
		limit 3
	),
    hard_words as (
        select w.id, w.source_word, w.target_word
        from words w
        where w.user_id = $1
        and w.is_learned = false
        and (w.total_mistakes > 0 or w.correct_streak > 0)
        order by w.difficult_level desc, w.last_seen_at asc 
        limit 5
    ),
	review_words as (
	    select w.id, w.source_word, w.target_word
	    from words w
	    where w.user_id = $1 
	    and w.is_learned = true
	    order by w.last_seen_at asc
	    limit 2
	)
	select * from new_words
	union all 
	select hard_words
	union all 
	select review_words;
	`
	var resp []modelsDB.LessonWordsDB
	err := p.db.db.SelectContext(ctx, &resp, query, userID)
	if err != nil {
		return nil, fmt.Errorf("error getting words: %s", err)
	}

	return &resp, nil
}

func (p *WordsPostgres) GetWordByID(ctx context.Context, wordID uuid.UUID) (*modelsDB.Word, error) {
	query := `
	select user_id, source_lang, target_lang, source_word, target_word, comment
	from words
	where id = $1`

	var resp modelsDB.Word
	err := p.db.db.QueryRowxContext(ctx, query, wordID).StructScan(&resp)
	if err != nil {
		return nil, fmt.Errorf("error getting word by id: %w", err)
	}
	return &resp, nil
}
