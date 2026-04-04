package dto

import (
	"github.com/google/uuid"
)

type RegisterRequest struct {
	Email      string `json:"email" validate:"required,email" example:"test@user.com"`
	Password   string `json:"password" validate:"required,min=8" example:"SecurePass123!"`
	FirstName  string `json:"first_name" validate:"required" example:"John"`
	LastName   string `json:"last_name" validate:"required" example:"Doe"`
	SourceLang string `json:"source_lang" validate:"required" example:"en"`
	TargetLang string `json:"target_lang" validate:"required,nefield=SourceLang" example:"es"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email" example:"test@user.com"`
	Password string `json:"password" validate:"required" example:"SecurePass123!"`
}

type TokenResponse struct {
	Token string  `json:"token" example:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."`
	User  UserDTO `json:"user"`
}
type UserDTO struct {
	ID            uuid.UUID   `json:"id" example:"550e8400-e29b-41d4-a716-446655440000"`
	Email         string      `json:"email" example:"test@user.com"`
	FirstName     string      `json:"first_name" example:"John"`
	LastName      string      `json:"last_name" example:"Doe"`
	Role          string      `json:"role" example:"user"`
	ActiveProfile *ProfileDTO `json:"active_profile,omitempty"`
}

type ProfileDTO struct {
	ID         uuid.UUID `json:"id" example:"660e8400-e29b-41d4-a716-446655440000"`
	SourceLang string    `json:"source_lang" example:"en"`
	TargetLang string    `json:"target_lang" example:"es"`
}

type UpdateRequest struct {
	Email     *string `json:"email"`
	Password  *string `json:"password"`
	FirstName *string `json:"first_name"`
	LastName  *string `json:"last_name"`
}

type UpdateResponse struct {
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}
