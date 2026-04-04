package repository

import (
	"context"

	"github.com/google/uuid"

	"synaply/internal/cache"
	"synaply/internal/repository/modelsDB"
)

type UserRepositoryOld interface {
	Create(ctx context.Context, req *modelsDB.UserDB) (*modelsDB.UserDB, error)
	GetPasswordHashByEmail(ctx context.Context, email string) (*modelsDB.UserDB, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (*modelsDB.UserDB, error)
	Delete(ctx context.Context, id uuid.UUID) error
	Update(ctx context.Context, id uuid.UUID, fields map[string]any) (*modelsDB.UserDB, error)
	GetUsers(ctx context.Context, order string, pagination modelsDB.Pagination) ([]modelsDB.UserDB, uint64, error)
	GetUserByEmail(ctx context.Context, email string) (*modelsDB.UserDB, error)
	GetTotalCorrect(ctx context.Context, userID uuid.UUID) (int64, error)
	SetTotalCorrect(ctx context.Context, userID uuid.UUID, totalCorrectUpdate int64) (int64, error)
	GetAdminStats(ctx context.Context, search string) (*modelsDB.AdminStatsDB, error)
	SetCache(c cache.CacheRepositoryI)
}
