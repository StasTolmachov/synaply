package utils

import (
	"errors"
	"fmt"
	"reflect"
	"strings"

	"github.com/go-playground/locales/en"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	enTranslations "github.com/go-playground/validator/v10/translations/en"
)

// Константы для стандартных ответов
const (
	ErrCodeInvalidRequest   = "invalid_request"
	ErrCodeValidationFailed = "validation_failed"
)

type Validator struct {
	validate   *validator.Validate
	translator ut.Translator
}

func NewValidator() (*Validator, error) {
	v := validator.New()

	// 1. Привязываем имена полей к JSON-тегам
	v.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})

	// 2. Настраиваем транслятор (по умолчанию английский)
	english := en.New()
	uni := ut.New(english, english)
	trans, ok := uni.GetTranslator("en")
	if !ok {
		return nil, errors.New("translator not found")
	}

	// Регистрация дефолтных переводов (избавляет от switch-case)
	if err := enTranslations.RegisterDefaultTranslations(v, trans); err != nil {
		return nil, fmt.Errorf("failed to register translations: %w", err)
	}

	return &Validator{
		validate:   v,
		translator: trans,
	}, nil
}

type ValidationErrorResponse struct {
	Error   string            `json:"error"`
	Details map[string]string `json:"details"`
}

// FormatError теперь метод структуры, так как ему нужен доступ к транслятору
func (v *Validator) FormatError(err error) ValidationErrorResponse {
	if valErrors, ok := errors.AsType[validator.ValidationErrors](err); ok {
		details := make(map[string]string, len(valErrors))
		// Translate превращает ошибки в человекочитаемые строки автоматически
		for _, fieldErr := range valErrors {
			details[fieldErr.Field()] = fieldErr.Translate(v.translator)
		}

		return ValidationErrorResponse{
			Error:   ErrCodeValidationFailed,
			Details: details,
		}
	}

	return ValidationErrorResponse{
		Error: ErrCodeInvalidRequest,
	}
}

// ValidateStruct — обертка для удобства
func (v *Validator) ValidateStruct(s any) error {
	return v.validate.Struct(s)
}
