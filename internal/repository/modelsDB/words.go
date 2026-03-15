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

type CreateReq struct {
	UserID     uuid.UUID `db:"user_id"`
	SourceLang string    `db:"source_lang"`
	TargetLang string    `db:"target_lang"`
	SourceWord string    `db:"source_word"`
	TargetWord string    `db:"target_word"`
	Comment    string    `db:"comment"`
}

type LessonDB struct {
	ID         uuid.UUID `db:"id"`
	SourceWord string    `db:"source_word"`
	TargetWord string    `db:"target_word"`
	Comment    string    `db:"comment"`

	// Поля FSRS
	Due           time.Time  `db:"due"`
	Stability     float64    `db:"stability"`
	Difficulty    float64    `db:"difficulty"`
	ElapsedDays   uint64     `db:"elapsed_days"`
	ScheduledDays uint64     `db:"scheduled_days"`
	Reps          uint64     `db:"reps"`
	Lapses        uint64     `db:"lapses"`
	State         int        `db:"state"`
	LastReview    *time.Time `db:"last_review"` // Указатель, так как может быть NULL у новых слов
}
