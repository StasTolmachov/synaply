package models

import (
	"time"

	"github.com/google/uuid"
)

type Word struct {
	ID             uuid.UUID
	UserID         uuid.UUID
	SourceLang     string
	TargetLang     string
	SourceWord     string
	TargetWord     string
	Comment        string
	IsLearned      bool
	CorrectStreak  int
	TotalMistakes  int
	DifficultLevel int
	LastSeenAt     time.Time
	CreatedAt      time.Time
	UpdatedAt      time.Time
	DeletedAt      *time.Time
}
