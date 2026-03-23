package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"

	"synaply_v2/internal/cache"
	"synaply_v2/internal/models"
	"synaply_v2/internal/repository/modelsDB"
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

type userRepo struct {
	db    *Postgres
	cache cache.CacheRepositoryI
}

func NewUserRepo(pg *Postgres) UserRepository {
	return &userRepo{db: pg}
}

func (r *userRepo) SetCache(c cache.CacheRepositoryI) {
	r.cache = c
}
func (r *userRepo) Create(ctx context.Context, req *modelsDB.UserDB) (*modelsDB.UserDB, error) {

	query := `
		insert into users 
    	(email, password_hash, first_name, last_name, role, source_lang, target_lang, total_correct)
		values ($1, $2, $3, $4, $5, $6, $7, $8)
		returning id, email, first_name, last_name, role, source_lang, target_lang, created_at, updated_at, total_correct`

	var res modelsDB.UserDB
	err := r.db.db.QueryRowxContext(ctx, query,
		req.Email,
		req.PasswordHash,
		req.FirstName,
		req.LastName,
		req.Role,
		req.SourceLang,
		req.TargetLang,
		req.TotalCorrect,
	).StructScan(&res)

	if err != nil {
		return nil, modelsDB.ParseDBError(err)
	}

	return &res, nil
}

func (r *userRepo) GetPasswordHashByEmail(ctx context.Context, email string) (*modelsDB.UserDB, error) {
	query := `select id, email, password_hash, role, total_correct, first_name, last_name, source_lang, target_lang, created_at, updated_at from users where email = $1 and deleted_at is null`

	var userModel modelsDB.UserDB
	err := r.db.db.QueryRowxContext(ctx, query, email).StructScan(&userModel)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, modelsDB.ErrUserNotFound
		}
		return nil, modelsDB.ParseDBError(err)
	}
	return &userModel, nil

}

func (r *userRepo) GetUserByID(ctx context.Context, id uuid.UUID) (*modelsDB.UserDB, error) {
	query := `
        select id, email, first_name, last_name, role, created_at, updated_at, source_lang, target_lang, total_correct, password_hash
        from users 
        where id = $1 and deleted_at is null`
	var userModel modelsDB.UserDB
	err := r.db.db.QueryRowxContext(ctx, query, id).StructScan(&userModel)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, modelsDB.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by id: %w", err)
	}
	return &userModel, nil
}

func (r *userRepo) Delete(ctx context.Context, id uuid.UUID) error {
	query := `update users set deleted_at = now() where id = $1`
	_, err := r.db.db.ExecContext(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete user: %w", err)
	}

	return nil
}

func (r *userRepo) Update(ctx context.Context, id uuid.UUID, fields map[string]any) (*modelsDB.UserDB, error) {

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
       RETURNING id, email, password_hash, first_name, last_name, role, source_lang, target_lang, total_correct, created_at, updated_at
   `, strings.Join(setParts, ", "), i+1)

	var updatedUser modelsDB.UserDB
	err := r.db.db.QueryRowxContext(ctx, query, args...).StructScan(&updatedUser)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, modelsDB.ErrUserNotFound
		}
		return nil, err
	}
	return &updatedUser, nil
}

func (r *userRepo) GetUsers(ctx context.Context, order string, pagination modelsDB.Pagination) ([]modelsDB.UserDB, uint64, error) {
	sortOrder := "DESC"
	if strings.ToUpper(order) == "ASC" {
		sortOrder = "ASC"
	}
	query := fmt.Sprintf(`
        SELECT id, email, first_name, last_name, role, source_lang, target_lang, created_at, updated_at, total_correct, password_hash,
               count(id) over() as total 
        FROM users
        WHERE deleted_at IS NULL
        ORDER BY created_at %s
        LIMIT $1 OFFSET $2`, sortOrder)

	var userDBWithTotal []modelsDB.UserDBWithTotal
	err := r.db.db.SelectContext(ctx, &userDBWithTotal, query, pagination.Limit, pagination.Offset)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to get all users: %w", err)
	}

	if len(userDBWithTotal) == 0 {
		return []modelsDB.UserDB{}, 0, nil
	}

	total := userDBWithTotal[0].Total

	usersDB := make([]modelsDB.UserDB, len(userDBWithTotal))
	for i, user := range userDBWithTotal {
		usersDB[i] = user.UserDB
	}

	return usersDB, total, nil
}

func (r *userRepo) GetUserByEmail(ctx context.Context, email string) (*modelsDB.UserDB, error) {
	query := `
        select id, email, first_name, last_name, role, source_lang, target_lang, created_at, updated_at, total_correct, password_hash
        from users 
        where email = $1 and deleted_at is null`
	var userModel modelsDB.UserDB
	err := r.db.db.QueryRowxContext(ctx, query, email).StructScan(&userModel)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, models.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}
	return &userModel, nil
}

func (r *userRepo) GetTotalCorrect(ctx context.Context, userID uuid.UUID) (int64, error) {
	query := `
select total_correct
from users
where deleted_at is null and id = $1
`
	var totalCorrect int64
	err := r.db.db.QueryRowxContext(ctx, query, userID).Scan(&totalCorrect)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, models.ErrUserNotFound
		}
		return 0, fmt.Errorf("failed to get total count: %w", err)
	}
	return totalCorrect, nil
}
func (r *userRepo) SetTotalCorrect(ctx context.Context, userID uuid.UUID, totalCorrectUpdate int64) (int64, error) {
	query := `
update users
set total_correct = $1
where id = $2 and deleted_at is null
returning total_correct
`
	var totalCorrect int64
	err := r.db.db.QueryRowxContext(ctx, query, totalCorrectUpdate, userID).Scan(&totalCorrect)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, models.ErrUserNotFound
		}
		return 0, fmt.Errorf("failed to update total count: %w", err)
	}

	return totalCorrect, nil
}

func (r *userRepo) GetAdminStats(ctx context.Context, search string) (*modelsDB.AdminStatsDB, error) {
	queryStats := `
		SELECT
			(SELECT count(*) FROM users WHERE deleted_at IS NULL) as total_users,
			(SELECT count(*) FROM words WHERE deleted_at IS NULL) as total_words,
			(SELECT count(*) FROM words WHERE state = 2 AND deleted_at IS NULL) as total_lessons,
			(SELECT count(*) FROM public_word_lists) as total_public_lists,
			(SELECT count(*) FROM playlists) as total_playlists,
			(SELECT count(*) FROM users WHERE created_at > now() - interval '24 hours' AND deleted_at IS NULL) as new_users_24h
	`

	var stats modelsDB.AdminStatsDB
	err := r.db.db.GetContext(ctx, &stats, queryStats)
	if err != nil {
		return nil, fmt.Errorf("failed to get admin stats: %w", err)
	}

	// Health Checks
	stats.PostgresAlive = true
	if err := r.db.db.PingContext(ctx); err != nil {
		stats.PostgresAlive = false
	}

	stats.RedisAlive = false
	if r.cache != nil {
		if err := r.cache.Ping(ctx); err == nil {
			stats.RedisAlive = true
		}
	}

	queryUsers := `
		SELECT id, email, first_name, last_name, role, source_lang, target_lang, total_correct, created_at, updated_at
		FROM users
		WHERE deleted_at IS NULL
	`
	var args []any
	if search != "" {
		queryUsers += ` AND (email ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1)`
		args = append(args, "%"+search+"%")
	}
	queryUsers += ` ORDER BY created_at DESC`

	err = r.db.db.SelectContext(ctx, &stats.Users, queryUsers, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to get users for admin stats: %w", err)
	}

	return &stats, nil
}
