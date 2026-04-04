package users

import (
	"errors"
	"net/http"

	"synaply/internal/auth"
	"synaply/internal/utils"
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
	// 1. Декодируем JSON из тела запроса в структуру RegisterRequest
	req, ok := utils.DecodeJSON[RegisterRequest](w, r, MaxBodySize)
	if !ok {
		return
	}

	// 2. Проверяем пароль на соответствие критериям безопасности
	err := auth.ValidatePassword(req.Password)
	if err != nil {
		// Возвращаем ошибку 400 (Bad Request), если пароль не прошел валидацию
		utils.WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	// 3. Вызываем сервис регистрации пользователя
	createdUser, err := h.service.Register(r.Context(), req)
	if err != nil {
		// 4. Обрабатываем случай, когда пользователь с таким email уже существует
		if errors.Is(err, ErrUserAlreadyExists) {
			utils.WriteError(w, http.StatusConflict, ErrUserAlreadyExists.Error())
			return
		}

		// 5. Логируем системную ошибку и возвращаем 500 (Internal Server Error)
		slogger.Log.ErrorContext(r.Context(), "Failed to register user", "email", req.Email, "error", err)
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// 6. Возвращаем созданного пользователя с кодом 201 (Created) в формате JSON
	utils.JSONResponse(w, http.StatusCreated, createdUser)
}

func (h *handler) Login(w http.ResponseWriter, r *http.Request) {
	// 1. Декодируем JSON из тела запроса в структуру LoginRequest
	req, ok := utils.DecodeJSON[LoginRequest](w, r, MaxBodySize)
	if !ok {
		return
	}

	// 2. Вызываем сервис входа пользователя
	resp, err := h.service.Login(r.Context(), req)
	if err != nil {
		// 3. Обрабатываем случай, когда пользователь не существует (используя ту же ошибку для совместимости)
		if errors.Is(err, ErrUserAlreadyExists) {
			utils.WriteError(w, http.StatusConflict, ErrUserAlreadyExists.Error())
			return
		}

		// 4. Возвращаем 500 (Internal Server Error) при системной ошибке
		utils.WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	// 5. Возвращаем результат входа с кодом 200 (OK) в формате JSON
	utils.JSONResponse(w, http.StatusOK, resp)
}

func (h *handler) UpdateUser(w http.ResponseWriter, r *http.Request) {

}
