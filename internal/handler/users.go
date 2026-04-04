package handler

import (
	"errors"
	"net/http"

	"synaply/internal/auth"
	"synaply/internal/handler/dto"
	"synaply/internal/middleware"
	"synaply/internal/models"
	"synaply/internal/service"
	"synaply/internal/utils"
	"synaply/slogger"
)

type Handler interface{}
type handler struct {
	service service.UserService
}

func NewHandler(service service.UserService) Handler {
	return &handler{service: service}
}

const MaxBodySize = 1048576 // 1MB

func (h *handler) Register(w http.ResponseWriter, r *http.Request) {
	req, ok := utils.DecodeJSON[dto.RegisterRequest](w, r, MaxBodySize)
	if !ok {
		return
	}

	err := auth.ValidatePassword(req.Password)
	if err != nil {
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	createdUser, err := h.service.Register(r.Context(), req)
	if err != nil {
		if errors.Is(err, models.ErrUserAlreadyExists) {
			utils.WriteError(w, http.StatusConflict, models.ErrUserAlreadyExists.Error())
			return
		}

		slogger.Log.ErrorContext(r.Context(), "Failed to register user", "email", req.Email, "error", err)
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.JSONResponse(w, http.StatusCreated, createdUser)
}

func (h *handler) Login(w http.ResponseWriter, r *http.Request) {
	req, ok := utils.DecodeJSON[dto.LoginRequest](w, r, MaxBodySize)
	if !ok {
		return
	}

	resp, err := h.service.Login(r.Context(), req)
	if err != nil {
		if errors.Is(err, models.ErrUserAlreadyExists) {
			utils.WriteError(w, http.StatusConflict, models.ErrUserAlreadyExists.Error())
			return
		}

		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	utils.JSONResponse(w, http.StatusOK, resp)
}

func (h *handler) UpdateUser(w http.ResponseWriter, r *http.Request) {
	user, err := middleware.GetUserFromContext(r.Context())
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}
	req, ok := utils.DecodeJSON[dto.UpdateRequest](w, r, MaxBodySize)
	if !ok {
		return
	}

	updatedUser, err := h.service.UpdateUser(r.Context(), user.ID, req)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error()) //todo
		return
	}
	utils.JSONResponse(w, http.StatusOK, updatedUser)
}

func (h *handler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	user, err := middleware.GetUserFromContext(r.Context())
	if err != nil {
		utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	err = h.service.DeleteUser(r.Context(), user.ID)
	if err != nil {
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	utils.JSONResponse(w, http.StatusOK, nil)
}
