package service

import (
	"context"
	"fmt"
	"log"

	"github.com/google/uuid"

	"wordsGo_v2/internal/cache"
	"wordsGo_v2/internal/models"
	"wordsGo_v2/internal/repository"
	"wordsGo_v2/slogger"
)

type WordsServiceI interface {
	Create(ctx context.Context, req *models.WordCreateReq, userID uuid.UUID) (*models.WordResp, error)
	GetLessonWords(ctx context.Context, userID uuid.UUID) (*models.WordResp, error)
	GetLessonWord(ctx context.Context, userID uuid.UUID) (*models.WordResp, error)
}

type WordsService struct {
	repo  repository.WordsPostgresI
	cache cache.CacheRepositoryI
}

func NewWordsService(repo repository.WordsPostgresI, cache cache.CacheRepositoryI) *WordsService {
	return &WordsService{repo: repo, cache: cache}
}

func (s *WordsService) Create(ctx context.Context, req *models.WordCreateReq, userID uuid.UUID) (*models.WordResp, error) {

	resp, err := s.repo.Create(ctx, models.CreateReqToDBCreateReq(req, userID))
	if err != nil {
		return nil, fmt.Errorf("error creating word: %w", err)
	}
	return models.WordDBToWordResp(resp), nil
}

func (s *WordsService) GetLessonWords(ctx context.Context, userID uuid.UUID) (*models.WordResp, error) {
	lessonWords, err := s.repo.GetLessonWords(ctx, userID)
	if err != nil {
		log.Printf("error getting lesson words: %v", err)
	}

	slogger.Log.DebugContext(ctx, "words for lesson:", "words", lessonWords)
	//save to redis

	word, err := s.GetLessonWord(ctx, userID)
	if err != nil {
		slogger.Log.ErrorContext(ctx, "error getting word: %v", "error", err)
		return nil, fmt.Errorf("error getting word: %w", err)
	}
	return word, nil

}

func (s *WordsService) GetLessonWord(ctx context.Context, userID uuid.UUID) (*models.WordResp, error) {
	wordID := uuid.New()
	//get from Redis wordID
	word, err := s.repo.GetWordByID(ctx, wordID)
	if err != nil {
		slogger.Log.ErrorContext(ctx, "error getting word: %v", "error", err)
		return nil, fmt.Errorf("error getting word: %w", err)
	}
	return models.WordDBToWordResp(word), nil
}
