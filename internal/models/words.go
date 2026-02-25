package models

import (
	"time"

	"github.com/google/uuid"

	"wordsGo_v2/internal/repository/modelsDB"
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

type WordCreateReq struct {
	SourceLang string `json:"source_lang"`
	TargetLang string `json:"target_lang"`
	SourceWord string `json:"source_word"`
	TargetWord string `json:"target_word"`
	Comment    string `json:"comment"`
}

func WordReqToWordDB(req *WordCreateReq, userID uuid.UUID) *modelsDB.Word {
	return &modelsDB.Word{
		UserID:     userID,
		SourceLang: req.SourceLang,
		TargetLang: req.TargetLang,
		SourceWord: req.SourceWord,
		TargetWord: req.TargetWord,
		Comment:    req.Comment,
	}
}

func WordDBToWordResp(word *modelsDB.Word) *WordResp {
	return &WordResp{
		ID:             word.ID,
		UserID:         word.UserID,
		SourceLang:     word.SourceLang,
		TargetLang:     word.TargetLang,
		SourceWord:     word.SourceWord,
		TargetWord:     word.TargetWord,
		Comment:        word.Comment,
		IsLearned:      word.IsLearned,
		CorrectStreak:  word.CorrectStreak,
		TotalMistakes:  word.TotalMistakes,
		DifficultLevel: word.DifficultLevel,
		LastSeenAt:     word.LastSeenAt,
		CreatedAt:      word.CreatedAt,
		UpdatedAt:      word.UpdatedAt,
		DeletedAt:      word.DeletedAt,
	}
}

type WordResp struct {
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
