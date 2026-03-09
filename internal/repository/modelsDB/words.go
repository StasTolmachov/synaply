package modelsDB

import (
	"time"

	"github.com/google/uuid"
)

type Word struct {
	ID             uuid.UUID  `db:"id"`
	UserID         uuid.UUID  `db:"user_id"`
	SourceLang     string     `db:"source_lang"`
	TargetLang     string     `db:"target_lang"`
	SourceWord     string     `db:"source_word"`
	TargetWord     string     `db:"target_word"`
	Comment        string     `db:"comment"`
	IsLearned      bool       `db:"is_learned"`
	CorrectStreak  int        `db:"correct_streak"`
	TotalMistakes  int        `db:"total_mistakes"`
	DifficultLevel int        `db:"difficult_level"`
	LastSeenAt     time.Time  `db:"last_seen_at"`
	CreatedAt      time.Time  `db:"created_at"`
	UpdatedAt      time.Time  `db:"updated_at"`
	DeletedAt      *time.Time `db:"deleted_at"`
}

type WordCreateReq struct {
	UserID     uuid.UUID `db:"user_id"`
	SourceLang string    `db:"source_lang"`
	TargetLang string    `db:"target_lang"`
	SourceWord string    `db:"source_word"`
	TargetWord string    `db:"target_word"`
	Comment    string    `db:"comment"`
}

type WordID struct {
	ID uuid.UUID `db:"id"`
}
type LessonWordsDB struct {
	ID         uuid.UUID `db:"id"`
	SourceWord string    `db:"source_word"`
	TargetWord string    `db:"target_word"`
}
