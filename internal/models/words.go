package models

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/open-spaced-repetition/go-fsrs/v4"

	"wordsGo_v2/internal/repository/modelsDB"
)

type Word struct {
	ID         uuid.UUID
	UserID     uuid.UUID
	SourceLang string
	TargetLang string
	SourceWord string
	TargetWord string
	Comment    string
	// Поля FSRS
	Due           time.Time
	Stability     float64
	Difficulty    float64
	ElapsedDays   uint64
	ScheduledDays uint64
	Reps          uint64
	Lapses        uint64
	State         int8
	LastReview    time.Time

	CreatedAt time.Time
	UpdatedAt time.Time
	DeletedAt *time.Time
}

type CreateReq struct {
	SourceLang string `json:"source_lang"`
	TargetLang string `json:"target_lang"`
	SourceWord string `json:"source_word"`
	TargetWord string `json:"target_word"`
	Comment    string `json:"comment"`
}

func CreateReqToDB(req CreateReq, userID uuid.UUID) modelsDB.CreateReq {
	return modelsDB.CreateReq{
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
		SourceWord: word.SourceWord,
		TargetWord: word.TargetWord,
		Comment:    word.Comment,
	}
}

type Response struct {
	ID         string `json:"id"`
	SourceWord string `json:"source_word"`
	TargetWord string `json:"target_word"`
	Comment    string `json:"comment"`
}

type Lesson struct {
	ID         uuid.UUID
	SourceWord string
	TargetWord string
	Comment    string

	// Поля FSRS
	Due           time.Time
	Stability     float64
	Difficulty    float64
	ElapsedDays   uint64
	ScheduledDays uint64
	Reps          uint64
	Lapses        uint64
	State         fsrs.State
	LastReview    time.Time
	//index for order
	Index int
}

func LessonToLessonDB(lesson *Lesson) modelsDB.LessonDB {
	var lastReviewDB *time.Time
	if !lesson.LastReview.IsZero() {
		lastReviewDB = &lesson.LastReview
	}
	return modelsDB.LessonDB{
		Comment:       lesson.Comment,
		Due:           lesson.Due,
		Stability:     lesson.Stability,
		Difficulty:    lesson.Difficulty,
		ElapsedDays:   lesson.ElapsedDays,
		ScheduledDays: lesson.ScheduledDays,
		Reps:          lesson.Reps,
		Lapses:        lesson.Lapses,
		State:         int(lesson.State),
		LastReview:    lastReviewDB,
	}
}

func LessonDBToLesson(lessonDB *modelsDB.LessonDB) Lesson {
	var lastReview time.Time
	if lessonDB.LastReview != nil {
		lastReview = *lessonDB.LastReview
	}
	return Lesson{
		ID:            lessonDB.ID,
		SourceWord:    lessonDB.SourceWord,
		TargetWord:    lessonDB.TargetWord,
		Comment:       lessonDB.Comment,
		Due:           lessonDB.Due,
		Stability:     lessonDB.Stability,
		Difficulty:    lessonDB.Difficulty,
		ElapsedDays:   lessonDB.ElapsedDays,
		ScheduledDays: lessonDB.ScheduledDays,
		Reps:          lessonDB.Reps,
		Lapses:        lessonDB.Lapses,
		State:         fsrs.State(lessonDB.State),
		LastReview:    lastReview,
		Index:         0,
	}
}

func LessonWordToResponse(word *Lesson) *Response {
	resp := &Response{
		ID:         word.ID.String(),
		SourceWord: word.SourceWord,
		TargetWord: word.TargetWord,
		Comment:    word.Comment,
	}
	return resp
}

type AnswerReq struct {
	ID         string `json:"id"`
	TargetWord string `json:"target_word"`
}

func CacheKey(userID uuid.UUID) string {
	return fmt.Sprintf("lesson_for_%s", userID)
}

func LessonWordsDBtoLessonWords(wordsDB []modelsDB.LessonDB) map[string]Lesson {
	var lessonWords = make(map[string]Lesson)
	for _, word := range wordsDB {
		lessonWords[word.ID.String()] = LessonDBToLesson(&word)
	}
	return lessonWords
}

var (
	ErrWordAlreadyExists = errors.New("word already exists")
	ErrDBTimeout         = errors.New("db timeout")
	ErrNoWordsForLesson  = errors.New("no words found for lesson")
)
