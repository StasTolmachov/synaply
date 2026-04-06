package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"synaply/internal/auth"
	"synaply/internal/config"
	"synaply/internal/handler/dto"
	"synaply/internal/models"
	"synaply/internal/repository"
	"synaply/slogger"
)

type UserService interface {
	Register(ctx context.Context, req dto.RegisterRequest) (*dto.TokenResponse, error)
	Login(ctx context.Context, req dto.LoginRequest) (*dto.TokenResponse, error)
	UpdateUser(ctx context.Context, id uuid.UUID, req dto.UpdateRequest) (*dto.UpdateResponse, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error
	SyncAdmin(ctx context.Context, adminCfg config.Admin) error
}

type userService struct {
	repo repository.UserRepository
	jwt  auth.TokenMaker
}

func NewService(repo repository.UserRepository, jwt auth.TokenMaker) UserService {
	return &userService{repo: repo, jwt: jwt}
}

func (s *userService) Register(ctx context.Context, req dto.RegisterRequest) (*dto.TokenResponse, error) {

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		return nil, err
	}
	userID := uuid.New()
	profileID := uuid.New()

	user := &models.User{ //todo
		ID:           userID,
		Email:        req.Email,
		PasswordHash: hash,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Role:         models.RoleUser,
	}

	profile := &models.UserLearningProfile{
		ID:               profileID,
		UserID:           userID,
		SourceLang:       req.SourceLang,
		TargetLang:       req.TargetLang,
		RequestRetention: 0.90, //todo
		MaximumInterval:  36500,
		IsActive:         true,
	}

	err = s.repo.CreateUserWithProfile(ctx, user, profile)
	if err != nil {
		return nil, err
	}

	token, err := s.jwt.GenerateToken(user.ID, string(user.Role))
	if err != nil {
		return nil, err
	}

	resp := &dto.TokenResponse{
		Token: token,
		User: dto.UserDTO{
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Role:      string(models.RoleUser),
			ActiveProfile: &dto.ProfileDTO{
				ID:         profile.ID,
				SourceLang: profile.SourceLang,
				TargetLang: profile.TargetLang,
			},
		},
	}
	return resp, nil
}
func (s *userService) Login(ctx context.Context, req dto.LoginRequest) (*dto.TokenResponse, error) {

	user, profile, err := s.repo.GetUserWithProfileByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if !auth.ComparePasswords(user.PasswordHash, req.Password) {
		return nil, models.ErrInvalidCredentials
	}
	token, err := s.jwt.GenerateToken(user.ID, string(user.Role))
	if err != nil {
		return nil, err
	}
	resp := &dto.TokenResponse{ //todo
		Token: token,
		User: dto.UserDTO{
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Role:      string(models.RoleUser),
			ActiveProfile: &dto.ProfileDTO{
				ID:         profile.ID,
				SourceLang: profile.SourceLang,
				TargetLang: profile.TargetLang,
			},
		},
	}
	return resp, nil
}
func (s *userService) UpdateUser(ctx context.Context, id uuid.UUID, req dto.UpdateRequest) (*dto.UpdateResponse, error) {
	fieldsReq := map[string]any{}
	var err error

	if req.FirstName != nil {
		fieldsReq["first_name"] = *req.FirstName
	}
	if req.LastName != nil {
		fieldsReq["last_name"] = *req.LastName
	}
	if req.Email != nil {
		fieldsReq["email"] = *req.Email
	}
	if req.Password != nil {
		fieldsReq["password"], err = auth.HashPassword(*req.Password)
		if err != nil {
			return nil, err
		}
	}

	if len(fieldsReq) == 0 {
		user, err := s.repo.GetUserByID(ctx, id) //todo is it needed?
		if err != nil {
			return nil, err
		}
		return &dto.UpdateResponse{
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
		}, nil
	}

	updatedUser, err := s.repo.UpdateUser(ctx, id, fieldsReq)
	if err != nil {
		return nil, err
	}

	return &dto.UpdateResponse{
		Email:     updatedUser.Email,
		FirstName: updatedUser.FirstName,
		LastName:  updatedUser.LastName,
	}, nil
}
func (s *userService) DeleteUser(ctx context.Context, id uuid.UUID) error {
	err := s.repo.DeleteUser(ctx, id)
	if err != nil {
		return err
	}
	return nil
}
func (s *userService) SyncAdmin(ctx context.Context, adminCfg config.Admin) error {
	slogger.Log.InfoContext(ctx, "Syncing admin user...", "email", adminCfg.Email)

	adminUser, err := s.repo.GetUserByEmail(ctx, adminCfg.Email)
	if err != nil {
		if errors.Is(err, models.ErrUserNotFound) {
			slogger.Log.InfoContext(ctx, "Admin not found, creating new one")

			hash, err := auth.HashPassword(adminCfg.Password)
			if err != nil {
				return err
			}
			newAdmin := &models.User{
				ID:           uuid.New(),
				Email:        adminCfg.Email,
				PasswordHash: hash,
				FirstName:    "Super",
				LastName:     "Admin",
				Role:         models.RoleAdmin,
			}

			err = s.repo.CreateUser(ctx, newAdmin)
			if err != nil {
				return fmt.Errorf("failed to create admin: %w", err)
			}
			return nil
		}
		return err
	}

	hash, err := auth.HashPassword(adminCfg.Password)
	if err != nil {
		return err
	}

	fields := map[string]any{
		"password_hash": hash,
		"role":          string(models.RoleAdmin),
	}

	_, err = s.repo.UpdateUser(ctx, adminUser.ID, fields)
	if err != nil {
		return fmt.Errorf("failed to update admin: %w", err)
	}
	slogger.Log.InfoContext(ctx, "Admin user synced successfully")

	return nil
}
