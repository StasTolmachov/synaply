package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"synaply_v2/internal/config"
	"synaply_v2/internal/models"
	"synaply_v2/internal/repository"
	"synaply_v2/internal/repository/modelsDB"
	"synaply_v2/internal/utils"
	"synaply_v2/slogger"
)

type UserService interface {
	Create(ctx context.Context, req models.CreateUserRequest) (*models.UserResponse, error)
	Authenticate(ctx context.Context, email, password string) (*models.User, error)
	GetUserByID(ctx context.Context, id uuid.UUID) (*models.UserResponse, error)
	Delete(ctx context.Context, targetID uuid.UUID) error
	Update(ctx context.Context, id uuid.UUID, req models.UpdateUserRequest) (*models.UserResponse, error)
	GetUsers(ctx context.Context, limit, page uint64, order string) (*models.ListOfUsersResponse, error)
	Login(ctx context.Context, req models.LoginRequest) (string, string, error)
	SyncAdmin(ctx context.Context, adminCfg config.Admin) error
	GetUserByEmail(ctx context.Context, email string) (*models.UserResponse, error)
	GetTotalCorrect(ctx context.Context, userID uuid.UUID) (int64, error)
	SetTotalCorrect(ctx context.Context, userID uuid.UUID, totalCorrectUpdate int64) (int64, error)
	GetAdminStats(ctx context.Context, search string) (*models.AdminStats, error)
}

type userService struct {
	repo repository.UserRepository
	jwt  config.JWT
}

func NewUserService(repo repository.UserRepository, jwt config.JWT) UserService {
	return &userService{
		repo: repo,
		jwt:  jwt,
	}
}

func (s *userService) Create(ctx context.Context, req models.CreateUserRequest) (*models.UserResponse, error) {
	userRequest, err := models.NewUser(req, models.RoleUser)
	if err != nil {
		return nil, fmt.Errorf("invalid user data: %w", err)
	}

	userDB, err := s.repo.Create(ctx, models.ToUserDB(userRequest))

	if err != nil {
		if errors.Is(err, modelsDB.ErrDuplicateEmail) {
			return nil, models.ErrUserAlreadyExists
		}
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return models.FromDBToUserResponse(userDB), nil
}
func (s *userService) Login(ctx context.Context, req models.LoginRequest) (string, string, error) {
	userDB, err := s.repo.GetPasswordHashByEmail(ctx, req.Email)
	slogger.Log.DebugContext(ctx, "Login request", "userDB", userDB)
	if err != nil {
		if errors.Is(err, modelsDB.ErrUserNotFound) {
			return "", "", models.ErrInvalidCredentials
		}
		return "", "", fmt.Errorf("failed to get user by email: %w", err)
	}
	if !utils.ComparePasswords(userDB.PasswordHash, req.Password) {
		return "", "", models.ErrInvalidCredentials
	}
	token, err := utils.GenerateToken(userDB.ID, userDB.Role, s.jwt)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate token: %w", err)
	}
	return token, userDB.SourceLang, nil
}
func (s *userService) SyncAdmin(ctx context.Context, adminCfg config.Admin) error {
	slogger.Log.InfoContext(ctx, "Syncing admin user...", "email", adminCfg.Email)

	userDB, err := s.repo.GetPasswordHashByEmail(ctx, adminCfg.Email)
	if err != nil {
		if errors.Is(err, modelsDB.ErrUserNotFound) {
			slogger.Log.InfoContext(ctx, "Admin not found, creating new one")
			req := models.CreateUserRequest{
				Email:     adminCfg.Email,
				Password:  adminCfg.Password,
				FirstName: "Super",
				LastName:  "Admin",
			}
			newUser, err := models.NewUser(req, models.RoleAdmin)
			if err != nil {
				return fmt.Errorf("invalid admin data")
			}
			_, err = s.repo.Create(ctx, models.ToUserDB(newUser))
			if err != nil {
				return fmt.Errorf("failed to create admin: %w", err)
			}
			return nil
		}
		return err
	}

	hash, err := utils.HashPassword(adminCfg.Password)
	if err != nil {
		return err
	}

	fields := map[string]any{
		"password_hash": hash,
		"role":          string(models.RoleAdmin),
	}

	_, err = s.repo.Update(ctx, userDB.ID, fields)
	if err != nil {
		return fmt.Errorf("failed to update admin: %w", err)
	}
	slogger.Log.InfoContext(ctx, "Admin user synced successfully")

	return nil
}
func (s *userService) Authenticate(ctx context.Context, email, password string) (*models.User, error) {
	user, err := s.repo.GetPasswordHashByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("failed to get user by email: %w", err)
	}

	if !utils.ComparePasswords(user.PasswordHash, password) {
		return nil, models.ErrInvalidCredentials
	}
	return models.UserDBToUser(user), nil
}
func (s *userService) GetUserByID(ctx context.Context, id uuid.UUID) (*models.UserResponse, error) {

	slogger.Log.DebugContext(ctx, "Cache MISS for user", "id", id)
	user, err := s.repo.GetUserByID(ctx, id)
	if err != nil {
		if errors.Is(err, modelsDB.ErrUserNotFound) {
			return nil, models.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to GetUserByID: %w", err)
	}
	response := models.FromDBToUserResponse(user)

	return response, nil
}
func (s *userService) Delete(ctx context.Context, targetID uuid.UUID) error {

	err := s.repo.Delete(ctx, targetID)
	if err != nil {
		if errors.Is(err, modelsDB.ErrUserNotFound) {
			return models.ErrUserNotFound
		}
		return fmt.Errorf("failed to delete user: %w", err)
	}
	return nil
}
func (s *userService) Update(ctx context.Context, id uuid.UUID, req models.UpdateUserRequest) (*models.UserResponse, error) {

	fields := map[string]any{}
	var err error

	if req.Email != nil {
		fields["email"] = *req.Email
	}
	if req.Password != nil {
		fields["password_hash"], err = utils.HashPassword(*req.Password)
		if err != nil {
			return nil, err
		}
	}
	if req.FirstName != nil {
		fields["first_name"] = *req.FirstName
	}
	if req.LastName != nil {
		fields["last_name"] = *req.LastName
	}
	if req.Role != nil {
		fields["role"] = *req.Role
	}
	if req.SourceLang != nil {
		fields["source_lang"] = *req.SourceLang
	}
	if req.TargetLang != nil {
		fields["target_lang"] = *req.TargetLang
	}

	if len(fields) == 0 {
		currentUser, err := s.GetUserByID(ctx, id)
		if err != nil {
			if errors.Is(err, modelsDB.ErrUserNotFound) {
				return nil, models.ErrUserNotFound
			}
			return nil, fmt.Errorf("failed to get user by id: %w", err)
		}
		return currentUser, nil
	}
	updated, err := s.repo.Update(ctx, id, fields)
	slogger.Log.DebugContext(ctx, "UpdateUser from repo update", "updatedUserID", id, "err", err, "updated user:", updated)
	if err != nil {
		if errors.Is(err, modelsDB.ErrUserNotFound) {
			return nil, models.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to update user s.repo.Update: %w", err)
	}

	return models.FromDBToUserResponse(updated), nil
}
func (s *userService) GetUsers(ctx context.Context, limit, page uint64, order string) (*models.ListOfUsersResponse, error) {
	if limit == 0 {
		limit = 10
	}
	if page == 0 {
		page = 1
	}

	offset := (page - 1) * limit
	pagination := &modelsDB.Pagination{
		Limit:  limit,
		Offset: offset,
	}
	usersDB, total, err := s.repo.GetUsers(ctx, order, *pagination)
	slogger.Log.DebugContext(ctx, "s.repo.GetUsers", "err", err)
	if err != nil {
		return nil, err
	}

	usersResponse := make([]*models.UserResponse, len(usersDB))
	for i, userModel := range usersDB {
		usersResponse[i] = models.FromDBToUserResponse(&userModel)
	}

	pages := (total + limit - 1) / limit

	resp := &models.ListOfUsersResponse{
		Page:  page,
		Limit: limit,
		Total: total,
		Pages: pages,
		Data:  usersResponse,
	}

	return resp, nil
}
func (s *userService) GetUserByEmail(ctx context.Context, email string) (*models.UserResponse, error) {

	user, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, modelsDB.ErrUserNotFound) {
			return nil, models.ErrUserNotFound
		}
		return nil, fmt.Errorf("failed to GetUserByEmail: %w", err)
	}
	response := models.FromDBToUserResponse(user)

	return response, nil
}
func (s *userService) GetTotalCorrect(ctx context.Context, userID uuid.UUID) (int64, error) {
	totalCorrect, err := s.repo.GetTotalCorrect(ctx, userID)
	if err != nil {
		if errors.Is(err, modelsDB.ErrUserNotFound) {
			return 0, models.ErrUserNotFound
		}
		return 0, fmt.Errorf("failed to GetUserTotalCorrect: %w", err)
	}
	return totalCorrect, nil
}

func (s *userService) SetTotalCorrect(ctx context.Context, userID uuid.UUID, totalCorrectUpdate int64) (int64, error) {
	totalCorrect, err := s.repo.SetTotalCorrect(ctx, userID, totalCorrectUpdate+1)
	if err != nil {
		if errors.Is(err, modelsDB.ErrUserNotFound) {
			return 0, models.ErrUserNotFound
		}
		return 0, fmt.Errorf("failed to SetTotalCorrect: %w", err)
	}
	return totalCorrect, nil
}

func (s *userService) GetAdminStats(ctx context.Context, search string) (*models.AdminStats, error) {
	statsDB, err := s.repo.GetAdminStats(ctx, search)
	if err != nil {
		return nil, fmt.Errorf("failed to get admin stats: %w", err)
	}

	users := make([]*models.UserResponse, len(statsDB.Users))
	for i := range statsDB.Users {
		users[i] = models.FromDBToUserResponse(&statsDB.Users[i])
	}

	return &models.AdminStats{
		TotalUsers:       statsDB.TotalUsers,
		TotalWords:       statsDB.TotalWords,
		TotalLessons:     statsDB.TotalLessons,
		TotalPublicLists: statsDB.TotalPublicLists,
		TotalPlaylists:   statsDB.TotalPlaylists,
		NewUsersLast24h:  statsDB.NewUsersLast24h,
		Users:            users,
		Health: models.SystemHealth{
			Postgres: statsDB.PostgresAlive,
			Redis:    statsDB.RedisAlive,
		},
	}, nil
}
