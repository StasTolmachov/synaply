package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"

	"synaply/internal/models"
	"synaply/internal/repository/modelsDB"
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
	CreateUserWithProfile(ctx context.Context, user *models.User, profile *models.UserLearningProfile) error
	GetUserWithProfileByEmail(ctx context.Context, email string) (*models.User, *models.UserLearningProfile, error)
	GetUserWithProfileByID(ctx context.Context, id uuid.UUID) (*models.User, *models.UserLearningProfile, error)
	UpdateUser(ctx context.Context, id uuid.UUID, fields map[string]any) (*models.User, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error
}

type userRepository struct {
	db *Postgres
}

func NewUserRepo(pg *Postgres) UserRepository {
	return &userRepository{db: pg}
}

func (r *userRepository) CreateUserWithProfile(ctx context.Context, user *models.User, profile *models.UserLearningProfile) error {

	tx, err := r.db.db.BeginTxx(ctx, nil)
	if err != nil {
		return err
	}

	defer tx.Rollback()

	userQuery := `
INSERT INTO users (id, email, password_hash, first_name, last_name, role)
VALUES ($1, $2, $3, $4, $5, $6)
RETURNING created_at, updated_at
`
	err = tx.QueryRowxContext(ctx, userQuery,
		user.ID,
		user.Email,
		user.PasswordHash,
		user.FirstName,
		user.LastName,
		user.Role,
	).Scan(&user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		if pqErr, ok := errors.AsType[*pq.Error](err); ok && pqErr.Code == "23505" {
			return models.ErrUserAlreadyExists
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
func (r *userRepository) GetUserWithProfileByEmail(ctx context.Context, email string) (*models.User, *models.UserLearningProfile, error) {
	query := `
SELECT 
    u.id, u.email, u.password_hash, u.first_name, u.last_name, u.role, u.avatar_url,
    p.id as "profile.id", p.source_lang as "profile.source_lang", 
    p.target_lang as "profile.target_lang"
FROM users u
LEFT JOIN user_learning_profiles p ON u.id = p.user_id
WHERE u.id = $1 AND u.deleted_at IS NULL AND is_active = true
`
	var result struct {
		models.User
		models.UserLearningProfile
	}

	err := r.db.db.GetContext(ctx, &result, query, email)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil, models.ErrUserNotFound
		}
		return nil, nil, err
	}

	return &result.User, &result.UserLearningProfile, nil
}
func (r *userRepository) GetUserWithProfileByID(ctx context.Context, id uuid.UUID) (*models.User, *models.UserLearningProfile, error) {
	query := `
SELECT 
    u.id, u.email, u.password_hash, u.first_name, u.last_name, u.role, u.avatar_url,
    p.id as "profile.id", p.source_lang as "profile.source_lang", 
    p.target_lang as "profile.target_lang"
FROM users u
LEFT JOIN user_learning_profiles p ON u.id = p.user_id
WHERE u.id = $1 AND u.deleted_at IS NULL AND is_active = true
`
	var result struct {
		models.User
		models.UserLearningProfile
	}

	err := r.db.db.GetContext(ctx, &result, query, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, nil, models.ErrUserNotFound
		}
		return nil, nil, err
	}

	return &result.User, &result.UserLearningProfile, nil
}
func (r *userRepository) UpdateUser(ctx context.Context, id uuid.UUID, fields map[string]any) (*models.User, error) {
	setParts := make([]string, 0, len(fields))
	args := make([]any, 0, len(fields)+1)

	i := 1
	for column, val := range fields {
		if !allowedUpdateColumns[column] {
			return nil, fmt.Errorf("column %s is not allowed", column)
		}
		setParts = append(setParts, fmt.Sprintf("%s = $%d", column, i))
		args = append(args, val)
		i++
	}

	setParts = append(setParts, fmt.Sprintf("updated_at = $%d", i))
	args = append(args, time.Now())

	args = append(args, id)

	query := fmt.Sprintf(`
       UPDATE users
       SET %s
       WHERE id = $%d
       RETURNING id, email, password_hash, first_name, last_name, role
   `, strings.Join(setParts, ", "), i+1)

	var updatedUser models.User
	err := r.db.db.QueryRowxContext(ctx, query, args...).StructScan(&updatedUser)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, modelsDB.ErrUserNotFound
		}
		return nil, err
	}
	return &updatedUser, nil
}
func (r *userRepository) DeleteUser(ctx context.Context, id uuid.UUID) error {
	query := `
UPDATE users 
SET deleted_at = NOW()
WHERE id = $1 AND deleted_at IS NULL
`
	result, err := r.db.db.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return err
	}

	if rows == 0 {
		return models.ErrUserNotFound
	}

	return nil
}
