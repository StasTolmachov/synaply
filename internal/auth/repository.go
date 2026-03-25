package auth

import (
	"context"
	"errors"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type Repository interface {
	CreateUserWithProfile(ctx context.Context, user *User, profile *UserLearningProfile) error
}

type postgresRepo struct {
	db *sqlx.DB
}

func NewPostgresRepo(db *sqlx.DB) Repository {
	return &postgresRepo{db}
}

func (r *postgresRepo) CreateUserWithProfile(ctx context.Context, user *User, profile *UserLearningProfile) error {

	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	defer tx.Rollback()

	userQuery := `
INSERT INTO users (id, email, password_hash, first_name, last_name, role, avatar_url)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING created_at, updated_at
`
	err = tx.QueryRowxContext(ctx, userQuery,
		user.ID,
		user.Email,
		user.PasswordHash,
		user.FirstName,
		user.LastName,
		user.Role,
		user.AvatarURL,
	).Scan(&user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if pqErr, ok := errors.AsType[*pq.Error](err); ok && pqErr.Code == "23505" {
			return ErrUserAlreadyExists
		}
		return err
	}

	profileQuery := `
INSERT INTO user_learning_profiles (id, user_id, source_lang, target_lang, request_retention, maximum_interval, is_active)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING created_at, updated_at
`
	err = tx.QueryRowxContext(ctx, profileQuery,
		profile.ID,
		profile.UserID,
		profile.SourceLang,
		profile.TargetLang,
		profile.RequestRetention,
		profile.MaximumInterval,
		profile.IsActive,
	).Scan(&profile.CreatedAt, &profile.UpdatedAt)
	if err != nil {
		return err
	}

	if err := tx.Commit(); err != nil {
		return err
	}
	return nil
}
