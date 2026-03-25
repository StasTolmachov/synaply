package utils

import (
	"errors"
	"reflect"
	"strings"

	"github.com/go-playground/validator/v10"
)

var Validate *validator.Validate

func init() {
	Validate = validator.New()

	//use tag name
	Validate.RegisterTagNameFunc(func(fld reflect.StructField) string {
		name := strings.SplitN(fld.Tag.Get("json"), ",", 2)[0]
		if name == "-" {
			return ""
		}
		return name
	})
}

type ValidationErrorResponse struct {
	Error   string            `json:"error"`
	Details map[string]string `json:"details"`
}

func FormatValidationError(err error) ValidationErrorResponse {
	var valErrors validator.ValidationErrors

	if !errors.As(err, &valErrors) {
		return ValidationErrorResponse{
			Error: "invalid_request",
		}
	}

	details := make(map[string]string)

	for _, fieldErr := range valErrors {
		field := fieldErr.Field()

		switch fieldErr.Tag() {
		case "required":
			details[field] = "This field is required"
		case "email":
			details[field] = "Invalid email format"
		case "min":
			details[field] = "Minimum length is " + fieldErr.Param()
		case "nefield":
			details[field] = "Cannot be the same as " + fieldErr.Param()
		default:
			details[field] = "Invalid value"
		}
	}

	return ValidationErrorResponse{
		Error:   "validation_failed",
		Details: details,
	}
}
