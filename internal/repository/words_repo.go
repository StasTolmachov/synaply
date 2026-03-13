package repository

import (
	"context"

	"github.com/google/uuid"

	"wordsGo_v2/internal/repository/modelsDB"
)

type WordsRepository interface {
	Create(ctx context.Context, req modelsDB.CreateReq) (*modelsDB.Word, error)
	GetLessonWords(ctx context.Context, userID uuid.UUID) ([]modelsDB.LessonDB, error)
	GetWordByID(ctx context.Context, wordID string) (*modelsDB.LessonDB, error)
	Update(ctx context.Context, lesson map[string]modelsDB.LessonDB) error
}
