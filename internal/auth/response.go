package auth

import (
	"encoding/json"
	"errors"
	"net/http"

	"synaply/internal/utils"
)

type JSONError struct {
	Error string `json:"error"`
}

func JSONResponse(w http.ResponseWriter, statusCode int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(statusCode)

	if err := json.NewEncoder(w).Encode(payload); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
	}
}
func WriteError(w http.ResponseWriter, code int, message string) {
	JSONResponse(w, code, JSONError{Error: message})
}

func WriteValidationError(w http.ResponseWriter, err error) {
	validationResp := utils.FormatValidationError(err)
	JSONResponse(w, http.StatusBadRequest, validationResp)
}

func DecodeJSON[T any](w http.ResponseWriter, r *http.Request, maxBytes int64) (T, bool) {
	var val T
	if maxBytes > 0 {
		r.Body = http.MaxBytesReader(w, r.Body, maxBytes)
	}

	err := json.NewDecoder(r.Body).Decode(&val)
	if err != nil {
		if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
			WriteError(w, http.StatusRequestEntityTooLarge, ErrReqTooLarge.Error())
			return val, false
		}
		WriteError(w, http.StatusBadRequest, ErrInvalidJSON.Error())
		return val, false
	}

	if err := utils.Validate.Struct(val); err != nil {
		WriteValidationError(w, err)
		return val, false
	}

	return val, true
}
