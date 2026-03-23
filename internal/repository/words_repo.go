package repository

import (
	"context"

	"github.com/google/uuid"

	"synaply_v2/internal/models"
	"synaply_v2/internal/repository/modelsDB"
)

type WordsRepository interface {
	Create(ctx context.Context, req modelsDB.CreateReq) (*modelsDB.Word, error)
	GetLessonWords(ctx context.Context, userID uuid.UUID) ([]modelsDB.LessonDB, error)
	GetWordByID(ctx context.Context, wordID string) (*modelsDB.LessonDB, error)
	Update(ctx context.Context, lesson map[string]modelsDB.LessonDB) error
	UpdateWord(ctx context.Context, word modelsDB.LessonDB) error
	SetWordInfo(ctx context.Context, req modelsDB.GeminiReq) error
	GetWordInfo(ctx context.Context, req *modelsDB.GeminiReq) (*modelsDB.GeminiResp, error)
	GetWordsList(ctx context.Context, req modelsDB.GetWordsListReq) ([]modelsDB.GetWordsListResp, int, error)
	DeleteWord(ctx context.Context, wordID string, userID uuid.UUID) error
	DeleteAllWords(ctx context.Context, userID uuid.UUID) error
	UpdateWordFields(ctx context.Context, req modelsDB.UpdateWordReq, userID uuid.UUID) error
	GetWordsForGemini(ctx context.Context, req *modelsDB.WordsForGeminiReq) ([]modelsDB.WordsForGeminiResp, error)
	CreateBatch(ctx context.Context, reqs []modelsDB.CreateReq) error
	GetGeminiWordList(ctx context.Context, sourceLang, targetLang, level, topic string) (*modelsDB.GeminiWordList, error)
	SaveGeminiWordList(ctx context.Context, wordList modelsDB.GeminiWordList) error
	GetProgressStats(ctx context.Context, userID uuid.UUID) (*models.ProgressStats, error)

	CreatePublicWordList(ctx context.Context, list modelsDB.PublicWordList, items []modelsDB.PublicWordListItem) (uuid.UUID, error)
	GetPublicWordLists(ctx context.Context, sourceLang, targetLang, level string) ([]modelsDB.PublicWordList, error)
	GetPublicWordListByID(ctx context.Context, listID uuid.UUID) (*modelsDB.PublicWordListDetail, error)
	UpdatePublicWordList(ctx context.Context, list modelsDB.PublicWordList, items []modelsDB.PublicWordListItem) error

	CreatePlaylist(ctx context.Context, playlist modelsDB.Playlist, listIDs []uuid.UUID) (uuid.UUID, error)
	GetPlaylists(ctx context.Context) ([]modelsDB.Playlist, error)
	GetPlaylistByID(ctx context.Context, playlistID uuid.UUID) (*modelsDB.PlaylistDetail, error)
	UpdatePlaylist(ctx context.Context, playlist modelsDB.Playlist, listIDs []uuid.UUID) error
	DeletePlaylist(ctx context.Context, playlistID uuid.UUID, userID uuid.UUID) error
}
