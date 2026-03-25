package auth

import (
	"encoding/json"
	"errors"
	"net/http"

	"synaply/internal/utils"
	"synaply/slogger"
)

type handler struct {
	service Service
}

func NewHandler(service Service) *handler {
	return &handler{service: service}
}

func (h *handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		if _, ok := errors.AsType[*http.MaxBytesError](err); ok {
			WriteError(w, http.StatusRequestEntityTooLarge, "Request body too large")
			return
		}
		WriteError(w, http.StatusBadRequest, "Invalid JSON format")
		return
	}

	if err := utils.Validate.Struct(req); err != nil {
		validationResp := utils.FormatValidationError(err)
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusBadRequest)
		json.NewEncoder(w).Encode(validationResp)
		return
	}

	err = ValidatePassword(req.Password)
	if err != nil {
		WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	createdUser, err := h.service.Register(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrUserAlreadyExists) {
			WriteError(w, http.StatusConflict, "User already exists")
			return
		}
		slogger.Log.ErrorContext(r.Context(), "Failed to register user", "email", req.Email, "error", err)
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusCreated, createdUser)
}
