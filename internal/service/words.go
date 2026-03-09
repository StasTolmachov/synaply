package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"wordsGo_v2/internal/cache"
	"wordsGo_v2/internal/models"
	"wordsGo_v2/internal/repository"
)

type WordsServiceI interface {
	Create(ctx context.Context, req *models.WordCreateReq, userID uuid.UUID) (*models.WordResp, error)
	GetNextWord(ctx context.Context, userID uuid.UUID, cacheKey string) (*models.WordResp, error)
	GetWordIDs(ctx context.Context, userID uuid.UUID, cacheKey string) (*uuid.UUID, error)
	GetWordByID(ctx context.Context, wordID uuid.UUID) (*models.WordResp, error)
	StartLesson(ctx context.Context, userID uuid.UUID) (*models.WordResp, error)
	CheckAnswer(ctx context.Context, req models.AnswerReq) (*models.AnswerResp, error)
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
		return nil, fmt.Errorf("error creating word: %s", err)
	}
	return models.WordDBToWordResp(resp), nil
}

func (s *WordsService) GetNextWord(ctx context.Context, userID uuid.UUID, cacheKey string) (*models.WordResp, error) {
	//check redis for words and get one
	result, err := s.cache.ZRange(ctx, cacheKey, 0, 0)
	if err == nil && len(result) > 0 {
		//if word exists, send to handle
		wordID, _ := uuid.Parse(result[0])
		word, _ := s.repo.GetWordByID(ctx, wordID)
		err := s.cache.ZIncrBy(ctx, cacheKey, 1, wordID.String())
		if err != nil {
			return nil, fmt.Errorf("failed increment showed word: %s", err)
		}
		return models.WordDBToWordResp(word), nil
	}
	return nil, err
}

func (s *WordsService) GetWordIDs(ctx context.Context, userID uuid.UUID, cacheKey string) (*uuid.UUID, error) {
	//if word not exists in redis, get new 10 words id
	wordsDB, err := s.repo.GetLessonWords(ctx, userID)
	words := models.LessonWordsFromDB(wordsDB)
	if err != nil {
		return nil, fmt.Errorf("error getting words: %s", err)
	}
	//save 10 words ids to redis
	var members []redis.Z
	for _, word := range words {
		members = append(members, redis.Z{
			Score:  0,
			Member: word.ID.String(),
		})
		answerKey := fmt.Sprintf("answer_%s", word.ID)
		err := s.cache.Set(ctx, answerKey, word.TargetWord)
		if err != nil {
			return nil, fmt.Errorf("error setting answer to redis: %s", err)
		}
	}
	err = s.cache.ZAdd(ctx, cacheKey, members...)
	if err != nil {
		return nil, fmt.Errorf("error adding words id to redis: %s", err)
	}
	return &words[0].ID, nil
}

func (s *WordsService) GetWordByID(ctx context.Context, wordID uuid.UUID) (*models.WordResp, error) {
	//get word by id from db
	word, err := s.repo.GetWordByID(ctx, wordID)
	if err != nil {
		return nil, fmt.Errorf("error getting word by id: %s", err)
	}
	return models.WordDBToWordResp(word), nil
}

func (s *WordsService) StartLesson(ctx context.Context, userID uuid.UUID) (*models.WordResp, error) {
	cacheKey := fmt.Sprintf("lesson_words_%s", userID)
	word, err := s.GetNextWord(ctx, userID, cacheKey)
	if err != nil {
		wordID, err := s.GetWordIDs(ctx, userID, cacheKey)
		if err != nil {
			return nil, fmt.Errorf("error getting word ids: %s", err)
		}
		word, err = s.GetWordByID(ctx, *wordID)
		if err != nil {
			return nil, fmt.Errorf("error getting word by id: %s", err)
		}
		return word, nil
	}
	return word, nil
}

func (s *WordsService) CheckAnswer(ctx context.Context, req models.AnswerReq) (*models.AnswerResp, error) {
	answerKey := fmt.Sprintf("answer_%s", req.ID)
	correctAnswer, err := s.cache.Get(ctx, answerKey)
	if err != nil {
		word, err := s.repo.GetWordByID(ctx, req.ID)
		if err != nil {
			return nil, fmt.Errorf("error getting word by id: %s", err)
		}
		correctAnswer = word.SourceWord
	}
	answerUser := strings.TrimSpace(req.TargetWord)
	isCorrect := strings.EqualFold(correctAnswer, answerUser)

	//stat
	resp := models.AnswerResp{}
	if isCorrect {
		//need to send next word

	} else {
		//need to send previous word again
		resp = models.AnswerResp{
			ID:         req.ID,
			SourceWord: correctAnswer,
			TargetWord: req.TargetWord,
		}
	}

	return &resp, nil
}
