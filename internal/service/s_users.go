package service

import (
	"context"

	"github.com/redis/go-redis/v9"

	"synaply/internal/auth"
	"synaply/internal/models"
	"synaply/internal/repository"
)

type UserService interface {
}

type userService struct {
	repo  repository.UserRepository
	jwt   auth.TokenMaker
	redis *redis.Client
}

func NewService(repo repository.UserRepository, jwt auth.TokenMaker, redis *redis.Client) UserService {
	return &userService{repo: repo, jwt: jwt, redis: redis}
}

func (s *userService) Register(ctx context.Context, email, password string) (*models.User, error) {}
