package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgconn"

	"wordsGo_v2/internal/models"
	"wordsGo_v2/internal/repository/modelsDB"
	"wordsGo_v2/slogger"
)

type wordsPostgres struct {
	db *Postgres
}

func NewWordsPostgres(db *Postgres) WordsRepository {
	return &wordsPostgres{db: db}
}

func (p *wordsPostgres) Create(ctx context.Context, req modelsDB.CreateReq) (*modelsDB.Word, error) {
	slogger.Log.DebugContext(ctx, "create is started")

	query := `
	insert into words (user_id, source_lang, target_lang, source_word, target_word, comment) 
	values ($1, $2, $3, $4, $5, $6)
	returning id, user_id, source_lang, target_lang, source_word, target_word, comment
	`
	var resp modelsDB.Word
	err := p.db.db.QueryRowxContext(ctx, query, req.UserID, req.SourceLang, req.TargetLang, req.SourceWord, req.TargetWord, req.Comment).StructScan(&resp)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" {
			return nil, fmt.Errorf("%w: %s", models.ErrWordAlreadyExists, err)
		}
		if errors.Is(err, context.DeadlineExceeded) || errors.Is(err, context.Canceled) {
			return nil, fmt.Errorf("%w: %v", models.ErrDBTimeout, err)
		}
		return nil, fmt.Errorf("unexpected error creating word: %w", err)
	}
	slogger.Log.DebugContext(ctx, "Repo NewWord response", "resp", resp)
	return &resp, nil
}

func (p *wordsPostgres) GetLessonWords(ctx context.Context, userID uuid.UUID) ([]modelsDB.LessonDB, error) {
	query := `
	WITH
	new_words AS (
		-- Берем 3 новых слова (State = 0)
		SELECT id, source_word, target_word, comment, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review
		FROM words
		WHERE user_id = $1 AND state = 0
		ORDER BY created_at ASC
		LIMIT 3
	),
	review_words AS (
		-- Берем 7 слов, которые уже в процессе изучения (State != 0)
		SELECT id, source_word, target_word, comment, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review
		FROM words
		WHERE user_id = $1 AND state != 0
		ORDER BY due ASC -- МАГИЯ ЗДЕСЬ: Сначала те, которые давно пора повторить
		LIMIT 7
	)
	SELECT * FROM new_words
	UNION ALL 
	SELECT * FROM review_words;
	`
	var resp []modelsDB.LessonDB
	err := p.db.db.SelectContext(ctx, &resp, query, userID)
	if err != nil {
		return nil, fmt.Errorf("error getting lesson words: %w", err)
	}

	if len(resp) == 0 {
		return nil, models.ErrNoWordsForLesson
	}

	return resp, nil
}

func (p *wordsPostgres) GetWordByID(ctx context.Context, wordID string) (*modelsDB.LessonDB, error) {
	query := `
	select id, source_word, target_word, comment, due, stability, difficulty, elapsed_days, scheduled_days, reps, lapses, state, last_review
	from words
	where id = $1`

	var resp modelsDB.LessonDB
	err := p.db.db.QueryRowxContext(ctx, query, wordID).StructScan(&resp)
	if err != nil {
		return nil, fmt.Errorf("error getting word by id: %w", err)
	}
	return &resp, nil
}

func (p *wordsPostgres) Update(ctx context.Context, lesson map[string]modelsDB.LessonDB) error {
	query := `
update words
set comment = :comment,
    due = :due,
    stability = :stability,
    difficulty = :difficulty,
    elapsed_days = :elapsed_days,
    scheduled_days = :scheduled_days,
    reps = :reps,
    lapses = :lapses,
    state = :state,
    last_review = :last_review,
	updated_at = NOW()
where id = :id
`

	tx, err := p.db.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("error beginning transaction: %s", err)
	}

	defer tx.Rollback()

	for _, word := range lesson {
		_, err = tx.NamedExecContext(ctx, query, word)
		if err != nil {
			return fmt.Errorf("error updating word: %s", err)
		}
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("error committing transaction: %s", err)
	}
	return nil

}

func (p *wordsPostgres) UpdateWord(ctx context.Context, word modelsDB.LessonDB) error {
	query := `
update words
set comment = :comment,
    due = :due,
    stability = :stability,
    difficulty = :difficulty,
    elapsed_days = :elapsed_days,
    scheduled_days = :scheduled_days,
    reps = :reps,
    lapses = :lapses,
    state = :state,
    last_review = :last_review,
	updated_at = NOW()
where id = :id
`

	_, err := p.db.db.NamedExecContext(ctx, query, word)
	if err != nil {
		return fmt.Errorf("error updating word: %s", err)
	}

	return nil

}

func (p *wordsPostgres) SetWordInfo(ctx context.Context, req modelsDB.GeminiReq) error {
	query := `
	INSERT INTO gemini (source_lang, target_lang, source_word, target_word, response)
	VALUES (:source_lang, :target_lang, :source_word, :target_word, :response)
	ON CONFLICT (source_lang, target_lang, source_word, target_word) 
	DO UPDATE SET response = EXCLUDED.response;
	`

	_, err := p.db.db.NamedExecContext(ctx, query, req)
	if err != nil {
		return fmt.Errorf("error saving word info: %w", err)
	}

	return nil
}

func (p *wordsPostgres) GetWordInfo(ctx context.Context, req *modelsDB.GeminiReq) (*modelsDB.GeminiResp, error) {
	query := `
        SELECT response
        FROM gemini
        WHERE LOWER(TRIM(source_lang)) = LOWER(TRIM($1)) 
          AND LOWER(TRIM(target_lang)) = LOWER(TRIM($2)) 
          AND LOWER(TRIM(source_word)) = LOWER(TRIM($3)) 
          AND LOWER(TRIM(target_word)) = LOWER(TRIM($4))
        LIMIT 1`
	var resp modelsDB.GeminiResp
	err := p.db.db.GetContext(ctx, &resp, query, req.SourceLang, req.TargetLang, req.SourceWord, req.TargetWord)
	if err != nil {
		return nil, err
	}
	return &resp, nil
}

func (p *wordsPostgres) GetWordsList(ctx context.Context, req modelsDB.GetWordsListReq) ([]modelsDB.GetWordsListResp, int, error) {
	var words []modelsDB.GetWordsListResp
	var total int

	search := "%" + req.Search + "%"

	countQuery := `SELECT count(*) FROM words WHERE user_id = $1 AND (source_word ILIKE $2 OR target_word ILIKE $2)`
	err := p.db.db.GetContext(ctx, &total, countQuery, req.UserID, search)
	if err != nil {
		return nil, 0, err
	}

	query := `SELECT id, source_word, target_word, comment 
              FROM words 
              WHERE user_id = $1 AND (source_word ILIKE $2 OR target_word ILIKE $2)
              ORDER BY created_at DESC 
              LIMIT $3 OFFSET $4`

	err = p.db.db.SelectContext(ctx, &words, query, req.UserID, search, req.Limit, req.Offset)
	if err != nil {
		return nil, 0, err
	}

	return words, total, nil
}

func (p *wordsPostgres) DeleteWord(ctx context.Context, wordID string, userID uuid.UUID) error {
	query := `DELETE FROM words WHERE id = $1 AND user_id = $2`
	_, err := p.db.db.ExecContext(ctx, query, wordID, userID)
	return err
}

func (p *wordsPostgres) DeleteAllWords(ctx context.Context, userID uuid.UUID) error {
	query := `DELETE FROM words WHERE user_id = $1`
	_, err := p.db.db.ExecContext(ctx, query, userID)
	return err
}

func (p *wordsPostgres) UpdateWordFields(ctx context.Context, req modelsDB.UpdateWordReq, userID uuid.UUID) error {
	query := `UPDATE words SET source_word = $1, target_word = $2, comment = $3, updated_at = now() 
              WHERE id = $4 AND user_id = $5`
	_, err := p.db.db.ExecContext(ctx, query, req.SourceWord, req.TargetWord, req.Comment, req.ID, userID)
	return err
}

func (p *wordsPostgres) GetWordsForGemini(ctx context.Context, req *modelsDB.WordsForGeminiReq) ([]modelsDB.WordsForGeminiResp, error) {
	query := `
select source_word, target_word
from words
where user_id = $1
and source_lang = $2
and target_lang = $3
order by due asc 
limit 500
`
	var resp []modelsDB.WordsForGeminiResp
	err := p.db.db.SelectContext(ctx, &resp, query, req.UserID, req.SourceLang, req.TargetLang)
	if err != nil {
		return nil, err
	}
	return resp, nil
}

func (p *wordsPostgres) CreateBatch(ctx context.Context, reqs []modelsDB.CreateReq) error {
	// Мы пишем запрос так же, как для одной строки
	query := `
	insert into words (user_id, source_lang, target_lang, source_word, target_word, comment) 
	values (:user_id, :source_lang, :target_lang, :source_word, :target_word, :comment)
	`

	// Но передаем СЛАЙС структур reqs. sqlx сам развернет это в массовую вставку!
	_, err := p.db.db.NamedExecContext(ctx, query, reqs)
	if err != nil {
		return fmt.Errorf("failed to bulk insert words: %w", err)
	}
	return nil
}

func (p *wordsPostgres) GetGeminiWordList(ctx context.Context, sourceLang, targetLang, level, topic string) (*modelsDB.GeminiWordList, error) {
	var wordList modelsDB.GeminiWordList
	query := `SELECT id, source_lang, target_lang, level, topic, response, created_at 
              FROM gemini_word_lists 
              WHERE source_lang = $1 AND target_lang = $2 AND level = $3 AND topic = $4`
	err := p.db.db.GetContext(ctx, &wordList, query, sourceLang, targetLang, level, topic)
	if err != nil {
		return nil, err
	}
	return &wordList, nil
}

func (p *wordsPostgres) SaveGeminiWordList(ctx context.Context, wordList modelsDB.GeminiWordList) error {
	query := `INSERT INTO gemini_word_lists (source_lang, target_lang, level, topic, response) 
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (source_lang, target_lang, level, topic) DO UPDATE 
              SET response = EXCLUDED.response, created_at = CURRENT_TIMESTAMP`
	_, err := p.db.db.ExecContext(ctx, query, wordList.SourceLang, wordList.TargetLang, wordList.Level, wordList.Topic, wordList.Response)
	return err
}

func (p *wordsPostgres) GetProgressStats(ctx context.Context, userID uuid.UUID) (*models.ProgressStats, error) {
	query := `
		SELECT 
			COUNT(*) FILTER (WHERE state = 0) as new,
			COUNT(*) FILTER (WHERE state = 1) as learning,
			COUNT(*) FILTER (WHERE state = 2) as review,
			COUNT(*) FILTER (WHERE state = 3) as relearning
		FROM words 
		WHERE user_id = $1
	`

	var stats models.ProgressStats
	err := p.db.db.QueryRowxContext(ctx, query, userID).StructScan(&stats)
	if err != nil {
		return nil, fmt.Errorf("error getting progress stats: %w", err)
	}

	return &stats, nil
}
