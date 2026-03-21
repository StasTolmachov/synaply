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
	SourceLang string    `db:"source_lang"`
	TargetLang string    `db:"target_lang"`

	// FSRS fields
	Due           time.Time  `db:"due"`
	Stability     float64    `db:"stability"`
	Difficulty    float64    `db:"difficulty"`
	ElapsedDays   uint64     `db:"elapsed_days"`
	ScheduledDays uint64     `db:"scheduled_days"`
	Reps          uint64     `db:"reps"`
	Lapses        uint64     `db:"lapses"`
	State         int        `db:"state"`
	LastReview    *time.Time `db:"last_review"` // Pointer because it can be NULL for new words
}

type GeminiReq struct {
	SourceLang string `db:"source_lang"`
	TargetLang string `db:"target_lang"`
	SourceWord string `db:"source_word"`
	TargetWord string `db:"target_word"`
	Response   string `db:"response"`
}

type GeminiResp struct {
	Response string `db:"response"`
}

type WordsForGeminiReq struct {
	UserID     uuid.UUID `db:"user_id"`
	SourceLang string    `db:"source_lang"`
	TargetLang string    `db:"target_lang"`
}

type GetWordsListReq struct {
	UserID uuid.UUID `db:"user_id"`
	Search string    `db:"search"`
	Limit  int       `db:"limit"`
	Offset int       `db:"offset"`
}

type GetWordsListResp struct {
	ID         uuid.UUID `db:"id" json:"id"`
	SourceWord string    `db:"source_word" json:"source_word"`
	TargetWord string    `db:"target_word" json:"target_word"`
	Comment    string    `db:"comment" json:"comment"`
}

type UpdateWordReq struct {
	ID         uuid.UUID `db:"id" json:"id"`
	SourceWord string    `db:"source_word" json:"source_word"`
	TargetWord string    `db:"target_word" json:"target_word"`
	Comment    string    `db:"comment" json:"comment"`
}

type WordsForGeminiResp struct {
	SourceWord string `db:"source_word"`
	TargetWord string `db:"target_word"`
}

type GeminiWordList struct {
	ID         uuid.UUID `db:"id"`
	SourceLang string    `db:"source_lang"`
	TargetLang string    `db:"target_lang"`
	Level      string    `db:"level"`
	Topic      string    `db:"topic"`
	Response   []byte    `db:"response"`
	CreatedAt  time.Time `db:"created_at"`
}

type PublicWordList struct {
	ID          uuid.UUID `db:"id" json:"id"`
	UserID      uuid.UUID `db:"user_id" json:"user_id"`
	CreatorName string    `db:"creator_name" json:"creator_name"`
	Title       string    `db:"title" json:"title"`
	Description string    `db:"description" json:"description"`
	SourceLang  string    `db:"source_lang" json:"source_lang"`
	TargetLang  string    `db:"target_lang" json:"target_lang"`
	Level       string    `db:"level" json:"level"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

type PublicWordListItem struct {
	ID         uuid.UUID `db:"id" json:"id"`
	ListID     uuid.UUID `db:"list_id" json:"list_id"`
	SourceWord string    `db:"source_word" json:"source_word"`
	TargetWord string    `db:"target_word" json:"target_word"`
	Comment    string    `db:"comment" json:"comment"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
}

type PublicWordListDetail struct {
	PublicWordList
	Items []PublicWordListItem `json:"items"`
}

type Playlist struct {
	ID          uuid.UUID `db:"id" json:"id"`
	UserID      uuid.UUID `db:"user_id" json:"user_id"`
	CreatorName string    `db:"creator_name" json:"creator_name"`
	Title       string    `db:"title" json:"title"`
	Description string    `db:"description" json:"description"`
	CreatedAt   time.Time `db:"created_at" json:"created_at"`
	UpdatedAt   time.Time `db:"updated_at" json:"updated_at"`
}

type PlaylistDetail struct {
	Playlist
	Lists []PublicWordList `json:"lists"`
}
