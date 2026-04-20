package models

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/lib/pq"
)

type Role string

const (
	RoleUser      Role = "user"
	RoleModerator Role = "moderator"
	RoleAdmin     Role = "admin"
	RoleTeacher   Role = "teacher"
)

type User struct {
	ID           uuid.UUID `db:"id"`
	Email        string    `db:"email"`
	PasswordHash string    `db:"password_hash"`
	FirstName    string    `db:"first_name"`
	LastName     string    `db:"last_name"`
	Role         Role      `db:"role"`
	SourceLang   string    `db:"source_lang"`

	CreatedAt time.Time  `db:"created_at"`
	UpdatedAt time.Time  `db:"updated_at"`
	DeletedAt *time.Time `db:"deleted_at"`
}

type UserLearningProfile struct {
	ID               uuid.UUID       `db:"id"`
	UserID           uuid.UUID       `db:"user_id"`
	SourceLang       string          `db:"source_lang"`
	TargetLang       string          `db:"target_lang"`
	FSRSWeights      pq.Float64Array `db:"fsrs_weights"`
	RequestRetention float32         `db:"request_retention"`
	MaximumInterval  int32           `db:"maximum_interval"`
	IsActive         bool            `db:"is_active"`
	CreatedAt        time.Time       `db:"created_at"`
	UpdatedAt        time.Time       `db:"updated_at"`
}

var (
	ErrUserNotFound       = errors.New("user not found")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrPermissionDenied   = errors.New("permission denied")
	ErrInvalidPassword    = errors.New("invalid password")
	ErrUserAlreadyExists  = errors.New("user already exists")
)
