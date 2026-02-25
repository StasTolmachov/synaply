package service

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"wordsGo_v2/internal/models"
	"wordsGo_v2/internal/repository"
)

type WordsServiceI interface {
	Create(ctx context.Context, req *models.WordCreateReq, userID uuid.UUID) (*models.WordResp, error)
}

type WordsService struct {
	repo repository.WordsPostgresI
}

func NewWordsService(repo repository.WordsPostgresI) *WordsService {
	return &WordsService{repo: repo}
}

func (s *WordsService) Create(ctx context.Context, req *models.WordCreateReq, userID uuid.UUID) (*models.WordResp, error) {

	resp, err := s.repo.Create(ctx, models.WordReqToWordDB(req, userID))
	if err != nil {
		return nil, fmt.Errorf("error creating word: %w", err)
	}
	return models.WordDBToWordResp(resp), nil
}
