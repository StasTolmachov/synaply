package utils

import (
	"errors"
	"testing"

	"synaply/internal/handler/dto"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Тестовая структура для базовой проверки функционала валидатора
type testStruct struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Ignored  string `json:"-" validate:"required"`
}

func TestNewValidator(t *testing.T) {
	v, err := NewValidator()
	assert.NoError(t, err)
	assert.NotNil(t, v)
	assert.NotNil(t, v.validate)
	assert.NotNil(t, v.translator)
}

func TestValidator_ValidateStruct_Basic(t *testing.T) {
	v, _ := NewValidator()

	tests := []struct {
		name    string
		input   interface{}
		wantErr bool
	}{
		{
			name: "Valid basic struct",
			input: testStruct{
				Email:    "test@example.com",
				Password: "password123",
				Ignored:  "some-value",
			},
			wantErr: false,
		},
		{
			name: "Invalid email",
			input: testStruct{
				Email:    "invalid-email",
				Password: "password123",
			},
			wantErr: true,
		},
		{
			name: "Password too short",
			input: testStruct{
				Email:    "test@example.com",
				Password: "short",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := v.ValidateStruct(tt.input)
			if tt.wantErr {
				assert.Error(t, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidator_RegisterRequest(t *testing.T) {
	v, _ := NewValidator()

	validReq := dto.RegisterRequest{
		Email:      "user@example.com",
		Password:   "securePassword123",
		FirstName:  "John",
		LastName:   "Doe",
		SourceLang: "en",
		TargetLang: "ru",
	}

	tests := []struct {
		name    string
		modify  func(r *dto.RegisterRequest)
		wantErr bool
		field   string // Ожидаемое поле с ошибкой (JSON tag)
	}{
		{
			name:    "Valid registration request",
			modify:  func(r *dto.RegisterRequest) {},
			wantErr: false,
		},
		{
			name:    "Empty email",
			modify:  func(r *dto.RegisterRequest) { r.Email = "" },
			wantErr: true,
			field:   "email",
		},
		{
			name:    "Invalid email format",
			modify:  func(r *dto.RegisterRequest) { r.Email = "not-an-email" },
			wantErr: true,
			field:   "email",
		},
		{
			name:    "Password too short",
			modify:  func(r *dto.RegisterRequest) { r.Password = "123" },
			wantErr: true,
			field:   "password",
		},
		{
			name:    "Missing first name",
			modify:  func(r *dto.RegisterRequest) { r.FirstName = "" },
			wantErr: true,
			field:   "first_name",
		},
		{
			name:    "Missing last name",
			modify:  func(r *dto.RegisterRequest) { r.LastName = "" },
			wantErr: true,
			field:   "last_name",
		},
		{
			name:    "Missing source language",
			modify:  func(r *dto.RegisterRequest) { r.SourceLang = "" },
			wantErr: true,
			field:   "source_lang",
		},
		{
			name:    "Same source and target languages",
			modify:  func(r *dto.RegisterRequest) { r.SourceLang = "en"; r.TargetLang = "en" },
			wantErr: true,
			field:   "target_lang", // nefield=SourceLang вешается на TargetLang
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := validReq
			tt.modify(&req)

			err := v.ValidateStruct(req)
			if tt.wantErr {
				require.Error(t, err)
				resp := v.FormatError(err)
				assert.Equal(t, ErrCodeValidationFailed, resp.Error)
				assert.Contains(t, resp.Details, tt.field)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

func TestValidator_FormatError(t *testing.T) {
	v, _ := NewValidator()

	t.Run("Validation errors mapping to JSON tags", func(t *testing.T) {
		input := dto.RegisterRequest{
			Email:      "invalid",
			Password:   "short",
			SourceLang: "en",
			TargetLang: "en",
		}

		err := v.ValidateStruct(input)
		require.Error(t, err)

		resp := v.FormatError(err)

		assert.Equal(t, ErrCodeValidationFailed, resp.Error)
		// Проверяем, что ключи в Details — это JSON-теги
		assert.Contains(t, resp.Details, "email")
		assert.Contains(t, resp.Details, "password")
		assert.Contains(t, resp.Details, "target_lang")
		assert.Contains(t, resp.Details, "first_name") // required

		// Проверка локализованных сообщений
		assert.Contains(t, resp.Details["email"], "must be a valid email address")
		assert.Contains(t, resp.Details["password"], "must be at least 8 characters in length")
	})

	t.Run("Ignored field mapping", func(t *testing.T) {
		input := testStruct{
			Email:    "test@example.com",
			Password: "password123",
			Ignored:  "",
		}

		err := v.ValidateStruct(input)
		require.Error(t, err)

		resp := v.FormatError(err)
		// Для json:"-" возвращается пустая строка как имя поля
		assert.Contains(t, resp.Details, "Ignored")
	})

	t.Run("Generic error handling", func(t *testing.T) {
		genericErr := errors.New("something went wrong")
		resp := v.FormatError(genericErr)

		assert.Equal(t, ErrCodeInvalidRequest, resp.Error)
		assert.Nil(t, resp.Details)
	})

	t.Run("Nil error", func(t *testing.T) {
		resp := v.FormatError(nil)
		assert.Equal(t, ErrCodeInvalidRequest, resp.Error)
	})
}
