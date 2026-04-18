package handler

import (
	"synaply/internal/service"
	"synaply/internal/utils"
)

type Handler struct {
	service   service.UserService
	validator *utils.Validator
}

func NewHandler(service service.UserService, v *utils.Validator) *Handler {
	return &Handler{service: service, validator: v}
}
