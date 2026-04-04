package auth

import (
	"errors"
	"net/http"

	"synaply/slogger"
)

type handler struct {
	service Service
}

func NewHandler(service Service) *handler {
	return &handler{service: service}
}

const MaxBodySize = 1048576 // 1MB

func (h *handler) Register(w http.ResponseWriter, r *http.Request) {
	req, ok := DecodeJSON[RegisterRequest](w, r, MaxBodySize)
	if !ok {
		return
	}

	err := ValidatePassword(req.Password)
	if err != nil {
		WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	createdUser, err := h.service.Register(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrUserAlreadyExists) {
			WriteError(w, http.StatusConflict, ErrUserAlreadyExists.Error())
			return
		}
		slogger.Log.ErrorContext(r.Context(), "Failed to register user", "email", req.Email, "error", err)
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusCreated, createdUser)
}

func (h *handler) Login(w http.ResponseWriter, r *http.Request) {
	req, ok := DecodeJSON[LoginRequest](w, r, MaxBodySize)
	if !ok {
		return
	}

	resp, err := h.service.Login(r.Context(), req)
	if err != nil {
		if errors.Is(err, ErrUserAlreadyExists) {
			WriteError(w, http.StatusConflict, ErrUserAlreadyExists.Error())
			return
		}
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSONResponse(w, http.StatusOK, resp)
}
