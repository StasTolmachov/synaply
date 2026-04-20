package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"synaply/internal/models"
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

func (r *userRepository) CreateUser(ctx context.Context, user models.User) error {
	query := `insert into users
(id, email, password_hash, first_name, last_name, role, created_at, updated_at)
values ($1, $2, $3, $4, $5, $6, $7, $8)
`
	_, err := r.pgPool.Exec(ctx, query, user.ID, user.Email, user.PasswordHash, user.FirstName, user.LastName, user.Role, user.CreatedAt, user.UpdatedAt)
	if err != nil {
		if pgErr, ok := errors.AsType[*pgconn.PgError](err); ok && pgErr.Code == "23505" {
			return models.ErrUserAlreadyExists
		}
		return fmt.Errorf("failed to insert user: %w", err)
	}
	return nil
}

func (r *userRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `
select id, email, password_hash, first_name, last_name, role, created_at, updated_at
from users
where email = $1 and deleted_at IS NULL
`

	var user models.User
	err := r.pgPool.QueryRow(ctx, query, email).Scan(
		&user.ID, user.Email, user.PasswordHash, user.FirstName, user.LastName, user.Role, user.CreatedAt, user.UpdatedAt,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, models.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}
	return &user, nil
}
