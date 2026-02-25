package repository

import (
	"context"
	"fmt"

	"wordsGo_v2/internal/repository/modelsDB"
	"wordsGo_v2/slogger"
)

type WordsPostgresI interface {
	Create(ctx context.Context, req *modelsDB.Word) (*modelsDB.Word, error)
}
type WordsPostgres struct {
	db *Postgres
}

func NewWordsPostgres(db *Postgres) *WordsPostgres {
	return &WordsPostgres{db: db}
}

func (w *WordsPostgres) Create(ctx context.Context, req *modelsDB.Word) (*modelsDB.Word, error) {
	query := `insert into words (user_id, source_lang, target_lang, source_word, target_word, comment) 
values ($1, $2, $3, $4, $5, $6)
returning id, user_id, source_lang, target_lang, source_word, target_word, comment`
	var resp modelsDB.Word
	err := w.db.db.QueryRowxContext(ctx, query, req.UserID, req.SourceLang, req.TargetLang, req.SourceWord, req.TargetWord, req.Comment).StructScan(&resp)
	if err != nil {
		return nil, fmt.Errorf("error creating word: %w", err)
	}
	slogger.Log.DebugContext(ctx, "Repo Create response", "resp", resp)
	return &resp, nil
}
