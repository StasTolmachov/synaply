package auth

import (
	"context"

	"github.com/google/uuid"

	"synaply/internal/models"
)

type Service interface {
	Register(ctx context.Context, req RegisterRequest) (*TokenResponse, error)
	Login(ctx context.Context, req LoginRequest) (*TokenResponse, error)
}

type authService struct {
	repo Repository
	jwt  TokenMaker
}

func NewService(repo Repository, jwt TokenMaker) Service {
	return &authService{repo, jwt}
}

func (s *authService) Register(ctx context.Context, req RegisterRequest) (*TokenResponse, error) {

	hash, err := HashPassword(req.Password)
	if err != nil {
		return nil, err
	}
	userID := uuid.New()
	profileID := uuid.New()

	user := &User{
		ID:           userID,
		Email:        req.Email,
		PasswordHash: hash,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Role:         RoleUser,
		AvatarURL:    nil, //todo AvatarURL
	}

	profile := &UserLearningProfile{
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

	resp := &TokenResponse{
		Token: token,
		User: UserDTO{
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Role:      string(RoleUser),
			AvatarURL: user.AvatarURL,
			ActiveProfile: &ProfileDTO{
				ID:         profile.ID,
				SourceLang: profile.SourceLang,
				TargetLang: profile.TargetLang,
			},
		},
	}
	return resp, nil
}
func (s *authService) Login(ctx context.Context, req LoginRequest) (*TokenResponse, error) {

	user, profile, err := s.repo.GetUserWithProfileByEmail(ctx, req.Email)
	if err != nil {
		return nil, err
	}
	if !ComparePasswords(user.PasswordHash, req.Password) {
		return nil, models.ErrInvalidCredentials
	}
	token, err := s.jwt.GenerateToken(user.ID, string(user.Role))
	if err != nil {
		return nil, err
	}
	resp := &TokenResponse{
		Token: token,
		User: UserDTO{
			ID:        user.ID,
			Email:     user.Email,
			FirstName: user.FirstName,
			LastName:  user.LastName,
			Role:      string(RoleUser),
			AvatarURL: user.AvatarURL,
			ActiveProfile: &ProfileDTO{
				ID:         profile.ID,
				SourceLang: profile.SourceLang,
				TargetLang: profile.TargetLang,
			},
		},
	}
	return resp, nil
}
