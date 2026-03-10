package models

import (
	"fmt"
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

type CreateReq struct {
	SourceLang string `json:"source_lang"`
	TargetLang string `json:"target_lang"`
	SourceWord string `json:"source_word"`
	TargetWord string `json:"target_word"`
	Comment    string `json:"comment"`
}

func CreateReqToDB(req *CreateReq, userID uuid.UUID) *modelsDB.CreateReq {
	return &modelsDB.CreateReq{
		UserID:     userID,
		SourceLang: req.SourceLang,
		TargetLang: req.TargetLang,
		SourceWord: req.SourceWord,
		TargetWord: req.TargetWord,
		Comment:    req.Comment,
	}
}

func DBtoResponse(word *modelsDB.Word) *Response {
	return &Response{
		ID:         word.UserID.String(),
		SourceLang: word.SourceLang,
		TargetLang: word.TargetLang,
		SourceWord: word.SourceWord,
		TargetWord: word.TargetWord,
		Comment:    word.Comment,
	}
}

type Response struct {
	ID         string `json:"id"`
	SourceLang string `json:"source_lang"`
	TargetLang string `json:"target_lang"`
	SourceWord string `json:"source_word"`
	TargetWord string `json:"target_word"`
	Comment    string `json:"comment"`
}

type WordRedis struct {
	ID             uuid.UUID
	SourceWord     string
	TargetWord     string
	Comment        string
	CorrectStreak  int
	TotalMistakes  int
	DifficultLevel int
	LastSeenAt     time.Time
	Index          int
}

func LessonDBtoRedis(word modelsDB.LessonWordsDB) WordRedis {
	return WordRedis{
		ID:             word.ID,
		SourceWord:     word.SourceWord,
		TargetWord:     word.TargetWord,
		Comment:        word.Comment,
		CorrectStreak:  word.CorrectStreak,
		TotalMistakes:  word.TotalMistakes,
		DifficultLevel: word.DifficultLevel,
		LastSeenAt:     word.LastSeenAt,
		Index:          0,
	}
}

func WordsDBtoLessonRedis(wordsDB *[]modelsDB.LessonWordsDB) map[string]WordRedis {
	result := make(map[string]WordRedis)
	for _, word := range *wordsDB {
		result[word.ID.String()] = WordRedis{ID: word.ID, SourceWord: word.SourceWord, TargetWord: word.TargetWord, Comment: word.Comment, CorrectStreak: word.CorrectStreak, TotalMistakes: word.TotalMistakes, DifficultLevel: word.DifficultLevel, LastSeenAt: word.LastSeenAt, Index: 0}
	}
	return result
}

func CacheKey(userID uuid.UUID) string {
	return fmt.Sprintf("lesson_words_%s", userID.String())
}

func WordRedisToResponse(req *WordRedis) *Response {
	return &Response{
		ID:         req.ID.String(),
		SourceLang: req.SourceWord,
		TargetLang: req.TargetWord,
		SourceWord: req.SourceWord,
		TargetWord: req.TargetWord,
		Comment:    req.Comment,
	}
}

type AnswerReq struct {
	ID         string
	TargetWord string
}
