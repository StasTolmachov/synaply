package service

import (
	"context"

	"github.com/google/uuid"

	"synaply/internal/auth"
	"synaply/internal/handler/dto"
	"synaply/internal/models"
	"synaply/internal/repository"
)

type UserService interface {
	Register(ctx context.Context, req dto.RegisterRequest) (*dto.TokenResponse, error)
	Login(ctx context.Context, req dto.LoginRequest) (*dto.TokenResponse, error)
	GetUserWithProfileByID(ctx context.Context, id uuid.UUID) (*dto.UserDTO, error)
	UpdateUser(ctx context.Context, id uuid.UUID, req dto.UpdateRequest) (*dto.UpdateResponse, error)
	DeleteUser(ctx context.Context, id uuid.UUID) error
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

	user := &models.User{
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
		RequestRetention: 0.90,
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
func (s *userService) GetUserWithProfileByID(ctx context.Context, id uuid.UUID) (*dto.UserDTO, error) {
	user, profile, err := s.repo.GetUserWithProfileByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return &dto.UserDTO{
		ID:        user.ID,
		Email:     user.Email,
		FirstName: user.FirstName,
		LastName:  user.LastName,
		Role:      string(user.Role),
		ActiveProfile: &dto.ProfileDTO{
			ID:         profile.ID,
			SourceLang: profile.SourceLang,
			TargetLang: profile.TargetLang,
		},
	}, nil
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
		user, err := s.GetUserWithProfileByID(ctx, id)
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
