package service

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	"github.com/open-spaced-repetition/go-fsrs/v4"

	"wordsGo_v2/external/deepl"
	"wordsGo_v2/external/gemini"
	"wordsGo_v2/internal/cache"
	"wordsGo_v2/internal/models"
	"wordsGo_v2/internal/repository"
	"wordsGo_v2/internal/repository/modelsDB"
	"wordsGo_v2/slogger"
)

var (
	fsrsParams    = fsrs.DefaultParam()
	fsrsScheduler = fsrs.NewFSRS(fsrsParams)
)

type WordsServiceI interface {
	Create(ctx context.Context, req models.CreateReq, userID uuid.UUID) (*models.Response, error)
	LessonStart(ctx context.Context, userID uuid.UUID) (*models.Response, error)
	CheckAnswer(ctx context.Context, req models.AnswerReq, userID uuid.UUID) (bool, *models.Response, error)
	Finish(ctx context.Context, userID uuid.UUID) error
	Translate(ctx context.Context, req models.TranslateReq) (*models.TranslateResp, error)
	WordInfo(ctx context.Context, req gemini.WordInfoRequest) (*gemini.WordInfoResponse, error)
	StartPracticeWithGemini(ctx context.Context, req *gemini.PracticeWithGemini, userID uuid.UUID) (string, error)
	CheckAnswerPracticeWithGemini(context context.Context, gemReq *gemini.PracticeWithGemini, userID uuid.UUID, translate string) (string, error)
	FinishPracticeWithGemini(ctx context.Context, userID uuid.UUID) error
}

type WordsService struct {
	repo  repository.WordsRepository
	cache cache.CacheRepositoryI
	deepl deepl.ServiceI
	wg    *sync.WaitGroup
	gem   gemini.Service
}

func NewWordsService(repo repository.WordsRepository, cache cache.CacheRepositoryI, deepl deepl.ServiceI, wg *sync.WaitGroup, gem gemini.Service) *WordsService {
	return &WordsService{repo: repo, cache: cache, deepl: deepl, wg: wg, gem: gem}
}

func (s *WordsService) Translate(ctx context.Context, req models.TranslateReq) (*models.TranslateResp, error) {
	var deeplReq deepl.Request

	if req.SourceWord != "" {
		deeplReq = deepl.Request{
			Text:       []string{req.SourceWord},
			TargetLang: req.TargetLang,
		}

		deeplResp, err := s.deepl.Translate(ctx, deeplReq)
		if err != nil {
			return nil, err
		}

		return &models.TranslateResp{
			ID:         req.ID,
			SourceWord: req.SourceWord,
			TargetWord: deeplResp.Translations[0].Text,
		}, nil
	}
	deeplReq = deepl.Request{
		Text:       []string{req.TargetWord},
		TargetLang: req.SourceLang,
		SourceLang: req.TargetLang,
	}
	deeplResp, err := s.deepl.Translate(ctx, deeplReq)
	if err != nil {
		return nil, err
	}

	return &models.TranslateResp{
		ID:         req.ID,
		SourceWord: deeplResp.Translations[0].Text,
		TargetWord: req.TargetWord,
	}, nil

}

func (s *WordsService) Create(ctx context.Context, req models.CreateReq, userID uuid.UUID) (*models.Response, error) {
	sourceWord := strings.ToLower(strings.TrimSpace(req.SourceWord))
	targetWord := strings.ToLower(strings.TrimSpace(req.TargetWord))

	req.SourceWord = sourceWord
	req.TargetWord = targetWord
	resp, err := s.repo.Create(ctx, models.CreateReqToDB(req, userID))
	if err != nil {
		return nil, err
	}
	return models.DBtoResponse(resp), nil
}

func (s *WordsService) LessonStart(ctx context.Context, userID uuid.UUID) (*models.Response, error) {
	key := models.CacheKey(userID)
	slogger.Log.DebugContext(ctx, "LessonStart is started ")

	nextWord, err := s.GetNextWordFromCache(ctx, userID)
	if err == nil {
		nextWordLog := models.LessonWordToResponse(nextWord)
		slogger.Log.DebugContext(ctx, "answer from GetNextWordFromCache", "next_word", nextWordLog)
		return models.LessonWordToResponse(nextWord), nil
	}
	slogger.Log.ErrorContext(ctx, "failed to get next word from cache", "error", err)

	wordsDB, err := s.repo.GetLessonWords(ctx, userID)
	if err != nil {
		return nil, err
	}

	LessonWords := models.LessonWordsDBtoLessonWords(wordsDB)
	val, err := json.Marshal(LessonWords)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal lesson: %w", err)
	}

	err = s.cache.Set(ctx, key, val)
	if err != nil {
		slogger.Log.ErrorContext(ctx, "failed to cache lesson", "key", key, "error", err)
		return nil, fmt.Errorf("failed to set lesson: %w", err)
	}

	id := FindMinIdx(LessonWords)
	nextWordDB := LessonWords[id]
	resp := models.LessonWordToResponse(&nextWordDB)
	slogger.Log.DebugContext(ctx, "successfully created lesson", "next word:", nextWordDB)

	return resp, err
}

func (s *WordsService) CheckAnswer(ctx context.Context, req models.AnswerReq, userID uuid.UUID) (bool, *models.Response, error) {
	key := models.CacheKey(userID)
	var isCorrect bool
	lesson := make(map[string]models.Lesson)
	var word models.Lesson

	data, err := s.cache.Get(ctx, key)
	if err == nil {
		if err := json.Unmarshal([]byte(data), &lesson); err != nil {
			return isCorrect, nil, fmt.Errorf("failed to unmarshal lesson: %w", err)
		}
		word = lesson[req.ID]
		if word.ID == uuid.Nil {
			wordDB, err := s.repo.GetWordByID(ctx, req.ID)
			if err != nil {
				return isCorrect, nil, err
			}
			word = models.LessonDBToLesson(wordDB)
		}
	} else {
		slogger.Log.DebugContext(ctx, "failed to get lesson from cache for checking", "key", key)
		wordDB, err := s.repo.GetWordByID(ctx, req.ID)
		if err != nil {
			return isCorrect, nil, err
		}
		word = models.LessonDBToLesson(wordDB)
	}

	card := fsrs.Card{
		Due:           word.Due,
		Stability:     word.Stability,
		Difficulty:    word.Difficulty,
		ElapsedDays:   word.ElapsedDays,
		ScheduledDays: word.ScheduledDays,
		Reps:          word.Reps,
		Lapses:        word.Lapses,
		State:         word.State,
		LastReview:    word.LastReview,
	}

	rating := fsrs.Good
	isCorrect = true
	if !strings.EqualFold(req.TargetWord, word.TargetWord) {
		rating = fsrs.Again
		isCorrect = false
	}

	schedulingInfo := fsrsScheduler.Next(card, time.Now(), rating)
	newCard := schedulingInfo.Card

	lesson[req.ID] = models.Lesson{
		ID:            word.ID,
		SourceWord:    word.SourceWord,
		TargetWord:    word.TargetWord,
		Comment:       word.Comment,
		Due:           newCard.Due,
		Stability:     newCard.Stability,
		Difficulty:    newCard.Difficulty,
		ElapsedDays:   newCard.ElapsedDays,
		ScheduledDays: newCard.ScheduledDays,
		Reps:          newCard.Reps,
		Lapses:        newCard.Lapses,
		State:         newCard.State,
		LastReview:    newCard.LastReview,
		Index:         word.Index + 1,
	}
	val, err := json.Marshal(lesson)
	if err != nil {
		return isCorrect, nil, fmt.Errorf("failed to marshal lesson: %w", err)
	}
	err = s.cache.Set(ctx, key, val)
	if err != nil {
		slogger.Log.ErrorContext(ctx, "failed to cache lesson", "key", key, "error", err)
	}
	bgCtx := context.WithoutCancel(ctx)

	s.wg.Add(1)
	//todo RabitMQ
	updatedWord := lesson[req.ID]
	go func(wordToSave models.Lesson) {
		defer s.wg.Done()

		timeoutCtx, cancel := context.WithTimeout(bgCtx, 5*time.Second)
		defer cancel()

		wordDB := models.LessonToLessonDB(&wordToSave)

		err := s.repo.UpdateWord(timeoutCtx, wordDB)
		if err != nil {
			slogger.Log.ErrorContext(timeoutCtx, "failed to update lesson", "key", key, "error", err)
		}
	}(updatedWord)

	if isCorrect {
		nextWord, err := s.GetNextWordFromCache(ctx, userID)
		if err != nil {
			if errors.Is(err, models.ErrNoWordsForLesson) {
				return isCorrect, nil, nil
			}
			return isCorrect, nil, err
		}
		resp := models.LessonWordToResponse(nextWord)
		slogger.Log.DebugContext(ctx, "successfully created next word", "next word:", nextWord)
		return isCorrect, resp, nil
	}

	return isCorrect, models.LessonWordToResponse(&word), nil
}

func (s *WordsService) GetNextWordFromCache(ctx context.Context, userID uuid.UUID) (*models.Lesson, error) {
	key := models.CacheKey(userID)
	data, err := s.cache.Get(ctx, key)
	if errors.Is(err, cache.ErrCacheMiss) {
		slogger.Log.DebugContext(ctx, "GetNextWordFromCache is cache miss")
	}
	if err != nil {
		return nil, err
	}

	lesson := make(map[string]models.Lesson)
	if err := json.Unmarshal([]byte(data), &lesson); err != nil {
		return nil, fmt.Errorf("failed to unmarshal lesson: %w", err)
	}
	slogger.Log.DebugContext(ctx, "GetNextWordFromCache lesson from cache", "lesson", lesson)

	id := FindMinIdx(lesson)
	word, exists := lesson[id]
	if !exists {
		slogger.Log.DebugContext(ctx, "GetNextWordFromCache is not exists")
	}

	slogger.Log.DebugContext(ctx, "GetNextWordFromCache is finished ", "word:", word)

	return &word, nil
}

func FindMinIdx(lesson map[string]models.Lesson) string {
	minIdx := math.MaxInt32
	var nextWordID string
	for key, word := range lesson {

		if word.Index < minIdx {
			minIdx = word.Index
			nextWordID = key
		}
	}

	return nextWordID
}

func (s *WordsService) Finish(ctx context.Context, userID uuid.UUID) error {

	err := s.cache.Del(ctx, models.CacheKey(userID))
	if err != nil {
		slogger.Log.ErrorContext(ctx, "failed to delete cache lesson", "error", err)
	}

	slogger.Log.DebugContext(ctx, "lesson finished and cache cleared", "userId", userID)
	return nil
}

func (s *WordsService) WordInfo(ctx context.Context, req gemini.WordInfoRequest) (*gemini.WordInfoResponse, error) {

	searchReq := &modelsDB.GeminiReq{
		SourceLang: req.SourceLang,
		TargetLang: req.TargetLang,
		SourceWord: req.SourceWord,
		TargetWord: req.TargetWord,
	}

	dbResp, err := s.repo.GetWordInfo(ctx, searchReq)
	if err == nil {
		slogger.Log.DebugContext(ctx, "success find in db", "resp", dbResp)
		return &gemini.WordInfoResponse{Response: dbResp.Response}, nil
	}

	respString, err := s.gem.WordInfo(ctx, req)
	if err != nil {
		slogger.Log.ErrorContext(ctx, "Gemini упал", "error", err)
		return nil, err
	}
	slogger.Log.DebugContext(ctx, "3. WordInfo from gemini", "word", respString)
	detachedCtx := context.WithoutCancel(ctx)
	s.wg.Add(1)
	go func(geminiAnswer string) {
		defer s.wg.Done()
		timeoutCtx, cancel := context.WithTimeout(detachedCtx, 5*time.Second)
		defer cancel()

		saveReq := modelsDB.GeminiReq{
			SourceLang: req.SourceLang,
			TargetLang: req.TargetLang,
			SourceWord: req.SourceWord,
			TargetWord: req.TargetWord,
			Response:   geminiAnswer,
		}

		if err := s.repo.SetWordInfo(timeoutCtx, saveReq); err != nil {
			slogger.Log.ErrorContext(timeoutCtx, "failed save to db:", "error", err)
		} else {
			slogger.Log.DebugContext(timeoutCtx, "success save to db", "resp", saveReq)
		}
	}(respString)

	return &gemini.WordInfoResponse{Response: respString}, nil
}

func (s *WordsService) StartPracticeWithGemini(ctx context.Context, req *gemini.PracticeWithGemini, userID uuid.UUID) (string, error) {
	temp := &modelsDB.WordsForGeminiReq{
		UserID:     userID,
		SourceLang: req.SourceLang,
		TargetLang: req.TargetLang,
	}

	wordList, err := s.repo.GetWordsForGemini(ctx, temp)
	if err != nil {
		return "", err
	}
	var wordsListString strings.Builder
	for _, word := range wordList {
		line := fmt.Sprintf("%s - %s\n", word.SourceWord, word.TargetWord)
		wordsListString.WriteString(line)
	}

	resp, err := s.gem.StartPracticeWithGemini(ctx, req, wordsListString.String())
	if err != nil {
		return "", err
	}

	key := fmt.Sprintf("PracticeWithGemini:%s", userID)

	data := &models.PracticeWithGeminiCache{
		TaskTranslate: resp,
		Topic:         req.Topic,
	}
	val, err := json.Marshal(data)
	if err != nil {
		return "", err
	}
	err = s.cache.Set(ctx, key, val)
	if errors.Is(err, cache.ErrCacheMiss) {
		slogger.Log.DebugContext(ctx, "GetNextWordFromCache is cache miss")
	}
	if err != nil {
		return "", err
	}

	return resp, nil
}
func (s *WordsService) CheckAnswerPracticeWithGemini(ctx context.Context, gemReq *gemini.PracticeWithGemini, userID uuid.UUID, userTranslate string) (string, error) {
	key := fmt.Sprintf("PracticeWithGemini:%s", userID)
	data, err := s.cache.Get(ctx, key)
	if errors.Is(err, cache.ErrCacheMiss) {
		slogger.Log.DebugContext(ctx, "GetNextWordFromCache is cache miss")
	}
	if err != nil {
		return "", err
	}

	var practiceWithGeminiCache models.PracticeWithGeminiCache
	if err := json.Unmarshal([]byte(data), &practiceWithGeminiCache); err != nil {
		return "", fmt.Errorf("failed to unmarshal lesson: %w", err)
	}

	var taskWithTranslate strings.Builder
	taskWithTranslate.WriteString("5 sentence for userTranslate:\n")
	taskWithTranslate.WriteString(practiceWithGeminiCache.TaskTranslate)
	taskWithTranslate.WriteString("answer from user:\n")
	taskWithTranslate.WriteString(userTranslate)

	gemReq.Topic = practiceWithGeminiCache.Topic
	resp, err := s.gem.CheckAnswerPracticeWithGemini(ctx, gemReq, taskWithTranslate.String())
	if err != nil {
		return "", err
	}

	return resp, nil
}

func (s *WordsService) FinishPracticeWithGemini(ctx context.Context, userID uuid.UUID) error {
	key := fmt.Sprintf("PracticeWithGemini:%s", userID)
	err := s.cache.Del(ctx, key)
	if err != nil {
		return err
	}
	return nil
}
