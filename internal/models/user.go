package models

import (
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"

	"wordsGo_v2/internal/repository/modelsDB"
	"wordsGo_v2/internal/utils"
)

type User struct {
	ID           uuid.UUID
	Email        string
	PasswordHash string
	FirstName    string
	LastName     string
	Role         UserRole
	SourceLang   string
	TargetLang   string
	TotalCorrect int64
	CreatedAt    time.Time
	UpdatedAt    time.Time
	DeletedAt    *time.Time
}
type UserRole string

const (
	RoleUser      UserRole = "user"
	RoleModerator UserRole = "moderator"
	RoleAdmin     UserRole = "admin"
)

type CreateUserRequest struct {
	Email      string `json:"email" validate:"required,email" example:"test@user.com"`
	Password   string `json:"password" validate:"required,min=8" example:"SecurePass123!"`
	FirstName  string `json:"first_name" validate:"required" example:"test"`
	LastName   string `json:"last_name" validate:"required" example:"user"`
	SourceLang string `json:"source_lang" validate:"required" example:"en"`
	TargetLang string `json:"target_lang" validate:"required" example:"en"`
}

func NewUser(req CreateUserRequest, role UserRole) (*User, error) {
	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" {
		return nil, fmt.Errorf("cannot create user with empty fields")
	}
	err := utils.ValidatePassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("%w: %s", ErrInvalidPassword, err.Error())
	}

	hash, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("cannot hash password: %w", err)
	}

	id := uuid.New()

	timeNow := time.Now()

	return &User{
		ID:           id,
		Email:        req.Email,
		PasswordHash: hash,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		Role:         role,
		SourceLang:   req.SourceLang,
		TargetLang:   req.TargetLang,
		CreatedAt:    timeNow,
		UpdatedAt:    timeNow,
		DeletedAt:    nil,
	}, nil
}

var (
	ErrUserAlreadyExists  = errors.New("user already exists")
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrPermissionDenied   = errors.New("permission denied")

	ErrInvalidPassword = errors.New("invalid password")
)

type UserResponse struct {
	ID           string `json:"id"`
	Email        string `json:"email"`
	FirstName    string `json:"first_name"`
	LastName     string `json:"last_name"`
	Role         string `json:"role"`
	SourceLang   string `json:"source_lang"`
	TargetLang   string `json:"target_lang"`
	TotalCorrect int64  `json:"total_correct"`
	CreatedAt    string `json:"created_at"`
	UpdatedAt    string `json:"updated_at"`
}
type UpdateUserRequest struct {
	Email      *string `json:"email,omitempty"`
	Password   *string `json:"password,omitempty"`
	FirstName  *string `json:"first_name,omitempty"`
	LastName   *string `json:"last_name,omitempty"`
	SourceLang *string `json:"source_lang,omitempty"`
	TargetLang *string `json:"target_lang,omitempty"`
	Role       *string `json:"role,omitempty"`
}

type ListOfUsersResponse struct {
	Page  uint64          `json:"page"`
	Limit uint64          `json:"limit"`
	Total uint64          `json:"total"`
	Pages uint64          `json:"pages"`
	Data  []*UserResponse `json:"data"`
}
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email" example:"test@user.com"`
	Password string `json:"password" validate:"required" example:"SecurePass123!"`
}

type LoginResponse struct {
	Token      string `json:"token"`
	SourceLang string `json:"source_lang"`
}

func ToUserDB(user *User) *modelsDB.UserDB {
	return &modelsDB.UserDB{
		ID:           user.ID,
		Email:        user.Email,
		PasswordHash: user.PasswordHash,
		FirstName:    user.FirstName,
		LastName:     user.LastName,
		Role:         string(user.Role),
		SourceLang:   user.SourceLang,
		TargetLang:   user.TargetLang,
		TotalCorrect: user.TotalCorrect,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
		DeletedAt:    user.DeletedAt,
	}
}
func FromDBToUserResponse(user *modelsDB.UserDB) *UserResponse {
	return &UserResponse{
		ID:           user.ID.String(),
		Email:        user.Email,
		FirstName:    user.FirstName,
		LastName:     user.LastName,
		Role:         user.Role,
		SourceLang:   user.SourceLang,
		TargetLang:   user.TargetLang,
		TotalCorrect: user.TotalCorrect,
		CreatedAt:    user.CreatedAt.Format(time.RFC3339),
		UpdatedAt:    user.UpdatedAt.Format(time.RFC3339),
	}
}
func UserDBToUser(user *modelsDB.UserDB) *User {
	return &User{
		ID:           user.ID,
		Email:        user.Email,
		PasswordHash: user.PasswordHash,
		FirstName:    user.FirstName,
		LastName:     user.LastName,
		Role:         UserRole(user.Role),
		SourceLang:   user.SourceLang,
		TargetLang:   user.TargetLang,
		TotalCorrect: user.TotalCorrect,
		CreatedAt:    user.CreatedAt,
		UpdatedAt:    user.UpdatedAt,
	}
}
func PermissionCheck(requester *User, target *UserResponse) bool {
	if requester.Role == RoleAdmin {
		return true
	}
	if requester.ID.String() == target.ID {
		return true
	}
	if requester.Role == RoleModerator {
		if target.Role != string(RoleUser) {
			return false
		}
		return true
	}
	return false
}

type GetMeResponse struct {
	ID           string       `json:"id"`
	Email        string       `json:"email"`
	FirstName    string       `json:"first_name"`
	LastName     string       `json:"last_name"`
	Role         string       `json:"role"`
	SourceLang   string       `json:"source_lang"`
	LangCodeResp LangCodeResp `json:"langCodeResp"`
	TotalCorrect int64        `json:"totalCorrect"`
}
