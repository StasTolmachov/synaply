package repository

import (
	"github.com/jackc/pgx/v5/pgxpool"
)

var allowedUpdateColumns = map[string]bool{
	"email":         true,
	"password_hash": true,
	"first_name":    true,
	"last_name":     true,
	"role":          true,
	"source_lang":   true,
	"target_lang":   true,
	"total_correct": true,
}

type UserRepository interface {
}

type userRepository struct {
	pgPool *pgxpool.Pool
}

func NewUserRepo(pgPool *pgxpool.Pool) UserRepository {
	return &userRepository{pgPool: pgPool}
}
