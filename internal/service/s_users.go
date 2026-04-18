package service

import (
	"github.com/redis/go-redis/v9"

	"synaply/internal/auth"
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
