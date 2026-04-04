package auth

import (
	"context"
	"database/sql"
	"errors"

	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

type Repository interface {
	CreateUserWithProfile(ctx context.Context, user *User, profile *UserLearningProfile) error
	GetUserWithProfileByEmail(ctx context.Context, email string) (*User, *UserLearningProfile, error)
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

func (r *postgresRepo) GetUserWithProfileByEmail(ctx context.Context, email string) (*User, *UserLearningProfile, error) {
	query := `
SELECT 
    u.id, u.email, u.password_hash, u.first_name, u.last_name, u.role, u.avatar_url, u.created_at, u.updated_at,
    p.id as "profile.id", p.user_id as "profile.user_id", p.source_lang as "profile.source_lang", 
    p.target_lang as "profile.target_lang", p.fsrs_weights as "profile.fsrs_weights", 
    p.request_retention as "profile.request_retention", p.maximum_interval as "profile.maximum_interval", 
    p.is_active as "profile.is_active", p.created_at as "profile.created_at", p.updated_at as "profile.updated_at"
FROM users u
LEFT JOIN user_learning_profiles p ON u.id = p.user_id
WHERE u.email = $1 AND u.deleted_at IS NULL
`
	var result struct {
		User
		UserLearningProfile
	}

	err := r.db.GetContext(ctx, &result, query, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil, ErrUserNotFound
		}
		return nil, nil, err
	}

	return &result.User, &result.UserLearningProfile, nil
}
