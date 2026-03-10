package service

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"time"

	"github.com/google/uuid"

	"wordsGo_v2/internal/cache"
	"wordsGo_v2/internal/models"
	"wordsGo_v2/internal/repository"
)

type WordsServiceI interface {
	Create(ctx context.Context, req *models.CreateReq, userID uuid.UUID) (*models.Response, error)
	LessonStart(ctx context.Context, userID uuid.UUID) (*models.Response, error)
	CheckAnswer(ctx context.Context, req models.AnswerReq, userID uuid.UUID) (*models.Response, error)
}

type WordsService struct {
	repo  repository.WordsPostgresI
	cache cache.CacheRepositoryI
}

func NewWordsService(repo repository.WordsPostgresI, cache cache.CacheRepositoryI) *WordsService {
	return &WordsService{repo: repo, cache: cache}
}

func (s *WordsService) Create(ctx context.Context, req *models.CreateReq, userID uuid.UUID) (*models.Response, error) {

	resp, err := s.repo.Create(ctx, models.CreateReqToDB(req, userID))
	if err != nil {
		return nil, fmt.Errorf("error creating word: %s", err)
	}
	return models.DBtoResponse(resp), nil
}

func (s *WordsService) LessonStart(ctx context.Context, userID uuid.UUID) (*models.Response, error) {
	key := models.CacheKey(userID)

	nextWord, err := s.GetNextWord(ctx, userID)
	if err == nil {
		return nextWord, nil
	}

	wordsDB, err := s.repo.GetLessonWords(ctx, userID)

	wordsRedis := models.WordsDBtoLessonRedis(wordsDB)

	resp := FindMinIdx(wordsRedis)

	val, err := json.Marshal(wordsRedis)

	s.cache.Set(ctx, key, val)

	return resp, err
}

func (s *WordsService) CheckAnswer(ctx context.Context, req models.AnswerReq, userID uuid.UUID) (*models.Response, error) {
	key := models.CacheKey(userID)
	lesson := make(map[string]models.WordRedis)

	data, err := s.cache.Get(ctx, key)
	if err == nil {
		json.Unmarshal([]byte(data), &lesson)
	}

	if req.TargetWord != lesson[req.ID].TargetWord {
		word := lesson[req.ID]

		word.TotalMistakes++
		word.LastSeenAt = time.Now()
		word.DifficultLevel = CalculateDifficulty(word.CorrectStreak, word.TotalMistakes)
		lesson[req.ID] = word

		val, _ := json.Marshal(lesson)
		s.cache.Set(ctx, key, val)

		return models.WordRedisToResponse(&word), nil
	}
	word := lesson[req.ID]

	word.CorrectStreak++
	word.LastSeenAt = time.Now()
	word.DifficultLevel = CalculateDifficulty(word.CorrectStreak, word.TotalMistakes)
	word.Index++

	lesson[req.ID] = word

	val, _ := json.Marshal(lesson)
	s.cache.Set(ctx, key, val)

	nextWord, _ := s.GetNextWord(ctx, userID)
	return nextWord, nil
}

func (s *WordsService) GetNextWord(ctx context.Context, userID uuid.UUID) (*models.Response, error) {
	key := models.CacheKey(userID)
	lesson := make(map[string]models.WordRedis)

	data, err := s.cache.Get(ctx, key)
	if err == nil {
		json.Unmarshal([]byte(data), &lesson)

		return FindMinIdx(lesson), nil
	}
	return nil, err
}

func FindMinIdx(lesson map[string]models.WordRedis) *models.Response {
	minIdx := math.MaxInt32
	var nextWordID uuid.UUID
	for _, word := range lesson {

		if word.Index < minIdx {
			minIdx = word.Index
			nextWordID = word.ID
		}
	}
	nextWord := lesson[nextWordID.String()]
	return models.WordRedisToResponse(&nextWord)
}

// CalculateDifficulty вычисляет сложность слова от 0 до 100.
// Чем выше число, тем сложнее слово для пользователя.
func CalculateDifficulty(correctAnswers int, mistakes int) int {
	// Приводим к float64 для точного деления
	m := float64(mistakes)
	c := float64(correctAnswers)

	// Применяем формулу сглаживания Лапласа
	difficulty := ((m + 1.0) / (m + c + 2.0)) * 100.0

	// Округляем до ближайшего целого и возвращаем как int
	return int(math.Round(difficulty))
}
