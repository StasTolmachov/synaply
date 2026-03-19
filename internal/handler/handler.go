package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
	"github.com/google/uuid"
	httpSwagger "github.com/swaggo/http-swagger/v2"

	"wordsGo_v2/external/gemini"
	"wordsGo_v2/internal/middleware"
	"wordsGo_v2/internal/models"
	"wordsGo_v2/internal/service"
	"wordsGo_v2/internal/utils"
	"wordsGo_v2/slogger"
)

const ctxWithTimeout time.Duration = time.Second * 5

type Handler struct {
	wordsService service.WordsServiceI
	userService  service.UserService
}

func NewHandler(ws service.WordsServiceI, us service.UserService) *Handler {
	return &Handler{wordsService: ws, userService: us}
}

func RegisterRoutes(h *Handler, jwtSecret string) *chi.Mux {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"https://wordsgo.tolmachov.dev",
			"http://localhost:3000", // для локальной разработки фронтенда
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.LoggerMiddleware)

	r.Get("/swagger/*", httpSwagger.WrapHandler)

	r.Route("/api/v1/", func(r chi.Router) {
		r.Use(httprate.LimitByIP(100, 1*time.Minute))

		r.Group(func(r chi.Router) {
			r.Use(middleware.TimeoutMiddleware(time.Second * 5))

			r.Route("/users", func(r chi.Router) {
				r.Get("/lang", h.Lang)
				r.With(httprate.LimitByIP(10, 1*time.Hour)).Post("/create", h.Create)
				r.With(httprate.LimitByIP(5, 1*time.Minute)).Post("/login", h.Login)

				r.Group(func(r chi.Router) {
					r.Use(middleware.AuthMidleware(jwtSecret))

					//r.Get("/{id}", h.GetUserByID)
					//r.Get("/all", h.GetUsers)

					r.Put("/{id}", h.Update)
					r.Delete("/{id}", h.Delete)

				})
			})
		})
		r.Group(func(r chi.Router) {

			r.Use(middleware.AuthMidleware(jwtSecret))

			r.Group(func(r chi.Router) {
				r.Use(middleware.TimeoutMiddleware(time.Second * 5))

				r.Route("/words", func(r chi.Router) {
					r.With(httprate.LimitByIP(30, 1*time.Minute)).Post("/create", h.NewWord)
					r.With(httprate.LimitByIP(20, 1*time.Minute)).Post("/translate", h.Translate)
					r.Get("/GetMe", h.GetMe)

				})
				r.Route("/lesson", func(r chi.Router) {
					r.Get("/start", h.StartLesson)
					r.Post("/check", h.CheckAnswer)
					r.Post("/finish", h.Finish)
				})
			})
			r.Group(func(r chi.Router) {
				r.Use(middleware.TimeoutMiddleware(time.Second * 30))

				r.With(httprate.LimitByIP(10, 1*time.Minute)).Post("/words/wordInfo", h.WordInfo)

				r.With(httprate.LimitByIP(10, 1*time.Minute)).Post("/practice/startPractice", h.StartPracticeWithGemini)
				r.With(httprate.LimitByIP(10, 1*time.Minute)).Post("/practice/checkAnswerPractice", h.CheckAnswerPracticeWithGemini)

			})

		})

	})

	return r
}

// Lang Get available languages
// @Summary Get available languages
// @Description Returns a list of supported source and target languages for learning and translation
// @Tags users
// @Produce json
// @Success 200 {object} models.LangResponse "Successfully retrieved languages"
// @Router /users/lang [get]
func (h *Handler) Lang(w http.ResponseWriter, r *http.Request) {

	var Response models.LangResponse
	Response.Source = models.SortedSourceLanguages
	Response.Target = models.SortedTargetLanguages
	slogger.Log.Debug("lang called", Response)
	JSONResponse(w, http.StatusOK, Response)
}

// Login
// @Summary User Login
// @Description Login and get JWT token
// @Tags users
// @Accept json
// @Produce json
// @Param input body models.LoginRequest true "Login credentials"
// @Success 200 {object} models.LoginResponse
// @Failure 401 {object} handler.JSONError "Invalid credentials"
// @Router /login [post]
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req models.LoginRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	ctx := r.Context()
	slogger.Log.DebugContext(ctx, "Login request", "req", req)

	token, err := h.userService.Login(ctx, req)
	slogger.Log.DebugContext(ctx, "Login response", "token", token)
	if err != nil {
		if errors.Is(err, models.ErrInvalidCredentials) {
			WriteError(w, http.StatusUnauthorized, "Invalid email or password")
			return
		}
		WriteError(w, http.StatusInternalServerError, "Internal server error")
		slogger.Log.ErrorContext(ctx, "Login failed", "err", err)
		return
	}

	JSONResponse(w, http.StatusOK, models.LoginResponse{Token: token})
}

// Create creates a new user
// @Summary Create a new user
// @Description Register a new user in the system
// @Tags users
// @Accept json
// @Produce json
// @Param input body models.CreateUserRequest true "User registration info"
// @Success 201 {object} models.UserResponse
// @Failure 400 {object} handler.JSONError "Invalid input or validation info"
// @Failure 409 {object} handler.JSONError "User already exists"
// @Failure 500 {object} handler.JSONError "Internal server error"
// @Router /users [post]
func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {

	var req models.CreateUserRequest

	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request body")
		slogger.Log.ErrorContext(r.Context(), "Invalid request body", "err", err)
		return
	}

	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" || req.SourceLang == "" || req.TargetLang == "" {
		WriteError(w, http.StatusBadRequest, "Fields cannot be empty")
		return
	}
	if err := utils.ValidatePassword(req.Password); err != nil {
		WriteError(w, http.StatusBadRequest, err.Error())
		return
	}

	ctx := r.Context()

	createdUser, err := h.userService.Create(ctx, req)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrUserAlreadyExists):
			WriteError(w, http.StatusConflict, "User already exists")
			return
		}
		WriteError(w, http.StatusInternalServerError, err.Error())
		slogger.Log.ErrorContext(ctx, "Failed to create user", "err", err)
		return
	}

	JSONResponse(w, http.StatusCreated, createdUser)
}

// GetUserByID Get User By ID
// @Summary Get user by ID
// @Description Get User By ID from DB
// @Tags users
// @Accept json
// @Produce json
// @Param id path string true "User UUID" format(uuid)
// @Success 200 {object} models.UserResponse
// @Failure 400 {object} handler.JSONError "Invalid UUID"
// @Failure 404 {object} handler.JSONError "User not found"
// @Failure 500 {object} handler.JSONError "Internal server error"
// @Router /users/{id} [get]
func (h *Handler) GetUserByID(w http.ResponseWriter, r *http.Request) {

	id, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	ctx := r.Context()

	user, err := h.userService.GetUserByID(ctx, id)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrUserNotFound):
			WriteError(w, http.StatusNotFound, "User not found")
			slogger.Log.DebugContext(ctx, "User not found", "err", err, "id", id)
			return
		default:
			WriteError(w, http.StatusInternalServerError, "Failed to get user")
			slogger.Log.ErrorContext(ctx, "Failed to get user", "err", err)
			return
		}
	}
	JSONResponse(w, http.StatusOK, user)
}

// GetUsers Get list of users
// @Summary Get list of users
// @Description Get list of all users from DB
// @Tags users
// @Accept json
// @Produce json
// @Param limit query int false "Limit records per page (default 10)"
// @Param page query int false "Page number (default 1)"
// @Param order query string false "Sort order: asc or desc (default desc)"
// @Success 200 {object} models.ListOfUsersResponse
// @Failure 500 {object} handler.JSONError "Failed to get users"
// @Router /users [get]
func (h *Handler) GetUsers(w http.ResponseWriter, r *http.Request) {

	var (
		limit uint64 = 10
		page  uint64 = 1
	)

	if s := r.URL.Query().Get("limit"); s != "" {
		l, err := strconv.ParseUint(s, 10, 64)
		if err != nil {
			WriteError(w, http.StatusBadRequest, "Invalid limit")
			return
		}
		limit = l
	}

	if s := r.URL.Query().Get("page"); s != "" {
		p, err := strconv.ParseUint(s, 10, 64)
		if err != nil {
			WriteError(w, http.StatusBadRequest, "Invalid page")
			return
		}
		page = p
	}

	order := r.URL.Query().Get("order")
	if order != "asc" {
		order = "desc"
	}

	ctx := r.Context()

	users, err := h.userService.GetUsers(ctx, limit, page, order)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to get users")
		slogger.Log.ErrorContext(ctx, "Failed to get users", "err", err)
		return
	}
	JSONResponse(w, http.StatusOK, users)
}

// Delete User delete by ID
// @Summary Delete user by ID
// @Description Delete user by ID from DB
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "User UUID" format(uuid)
// @Success 200 {object} nil
// @Failure 400 {object} handler.JSONError "Invalid user ID"
// @Failure 403 {object} handler.JSONError "You can delete only your own account"
// @Failure 500 {object} handler.JSONError "Failed to delete user"
// @Router /users/{id} [delete]
func (h *Handler) Delete(w http.ResponseWriter, r *http.Request) {
	targetID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}
	target, err := h.userService.GetUserByID(r.Context(), targetID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to get user")
		slogger.Log.ErrorContext(r.Context(), "Failed to get user", "err", err)
		return
	}
	user, err := middleware.GetUserFromContext(r.Context())
	if err != nil {
		WriteError(w, http.StatusUnauthorized, "unauthorized")
		slogger.Log.ErrorContext(r.Context(), "unauthorized", "error", err)
		return
	}

	ctx := r.Context()

	if !models.PermissionCheck(user, target) {
		WriteError(w, http.StatusForbidden, models.ErrPermissionDenied.Error())
		return
	}
	err = h.userService.Delete(ctx, targetID)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrUserNotFound):
			WriteError(w, http.StatusNotFound, "User not found")
			return
		case errors.Is(err, models.ErrPermissionDenied):
			WriteError(w, http.StatusForbidden, models.ErrPermissionDenied.Error())
			return

		}
		WriteError(w, http.StatusInternalServerError, "Failed to delete user")
		slogger.Log.ErrorContext(ctx, "Failed to delete user", "err", err)
		return
	}

	JSONResponse(w, http.StatusOK, nil)
}

// Update User update by ID
// @Summary Update user by ID
// @Description Update user information by its UUID
// @Tags users
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param id path string true "User UUID" format(uuid)
// @Param input body models.UpdateUserRequest true "User update info"
// @Success 200 {object} models.UserResponse "Successfully updated"
// @Failure 400 {object} handler.JSONError "Invalid user ID"
// @Failure 403 {object} handler.JSONError "Permission denied"
// @Failure 500 {object} handler.JSONError "Failed to update user"
// @Router /users/{id} [put]
func (h *Handler) Update(w http.ResponseWriter, r *http.Request) {

	targetID, err := uuid.Parse(chi.URLParam(r, "id"))
	if err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid user ID")
		return
	}

	user, err := middleware.GetUserFromContext(r.Context())
	if err != nil {
		WriteError(w, http.StatusUnauthorized, "unauthorized")
		slogger.Log.ErrorContext(r.Context(), "unauthorized", "error", err)
		return
	}
	slogger.Log.DebugContext(r.Context(), "Updating user", "targetID", targetID, "requester", user)

	target, err := h.userService.GetUserByID(r.Context(), targetID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to get user")
		slogger.Log.ErrorContext(r.Context(), "Failed to get user", "err", err)
		return
	}

	if !models.PermissionCheck(user, target) {
		WriteError(w, http.StatusForbidden, models.ErrPermissionDenied.Error())
		return
	}

	var req models.UpdateUserRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "Invalid request body")
		slogger.Log.ErrorContext(r.Context(), "Invalid request body", "err", err)
		return
	}
	ctx := r.Context()

	if req.Role != nil && user.Role != models.RoleAdmin {
		WriteError(w, http.StatusBadRequest, models.ErrPermissionDenied.Error())
		return
	}
	if req.Password != nil {
		if err := utils.ValidatePassword(*req.Password); err != nil {
			WriteError(w, http.StatusBadRequest, err.Error())
			return
		}
	}

	updatedUser, err := h.userService.Update(ctx, targetID, req)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrUserNotFound):
			WriteError(w, http.StatusNotFound, "User not found")
			return
		}
		WriteError(w, http.StatusInternalServerError, "Failed to update user")
		slogger.Log.ErrorContext(ctx, "Failed to update user", "err", err)
		return
	}

	JSONResponse(w, http.StatusOK, updatedUser)
}

// GetMe Get current user info
// @Summary Get current user info
// @Description Returns language settings and total correct answers for the current user
// @Tags words
// @Accept json
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.GetMeResponse  <--- ИСПРАВЛЕНО ЗДЕСЬ
// @Failure 401 {object} handler.JSONError "Unauthorized"
// @Failure 500 {object} handler.JSONError "Internal server error"
// @Router /words/GetMe [get]
func (h *Handler) GetMe(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userCtx, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, "unauthorized")
		slogger.Log.ErrorContext(ctx, "unauthorized", "error", err)
		return
	}

	user, err := h.userService.GetUserByID(ctx, userCtx.ID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to get user")
		slogger.Log.ErrorContext(ctx, "Failed to get user", "err", err)
		return
	}
	var langCodeResp models.LangCodeResp
	langCodeResp.Source = user.SourceLang
	langCodeResp.Target = user.TargetLang

	response := models.GetMeResponse{
		LangCodeResp: langCodeResp,
		TotalCorrect: user.TotalCorrect,
	}

	JSONResponse(w, http.StatusOK, response)
}

// Translate Translate a word
// @Summary Translate a word
// @Description Translates a word using DeepL API
// @Tags words
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body models.TranslateReq true "Translation request data"
// @Success 200 {object} models.TranslateResp
// @Failure 400 {object} handler.JSONError "Invalid request body"
// @Failure 401 {object} handler.JSONError "Unauthorized"
// @Failure 500 {object} handler.JSONError "Internal server error"
// @Router /words/translate [post]
func (h *Handler) Translate(w http.ResponseWriter, r *http.Request) {
	slogger.Log.DebugContext(r.Context(), "Translate")
	var req models.TranslateReq
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusInternalServerError, "invalid request body")
		return
	}
	if req.SourceWord == "" && req.TargetWord == "" {
		WriteError(w, http.StatusInternalServerError, "bad request: both source and target words are empty")
		return
	}

	ctx := r.Context()

	userCtx, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, "unauthorized")
		slogger.Log.ErrorContext(ctx, "unauthorized", "error", err)
		return
	}

	user, err := h.userService.GetUserByID(ctx, userCtx.ID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to get user")
		slogger.Log.ErrorContext(ctx, "Failed to get user", "err", err)
		return
	}
	//todo
	req.ID = userCtx.ID
	req.SourceLang = user.SourceLang
	req.TargetLang = user.TargetLang
	slogger.Log.Debug("translate req %+v", "req", req)
	resp, err := h.wordsService.Translate(ctx, req)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "error translating")
		return
	}
	slogger.Log.Debug("translate resp %+v", "resp", resp)

	JSONResponse(w, http.StatusOK, resp)
}

// NewWord Create a new word
// @Summary Create a new word
// @Description Adds a new word to the user's dictionary
// @Tags words
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body models.CreateReq true "Word data"
// @Success 200 {object} models.Response
// @Failure 400 {object} handler.JSONError "Invalid request body"
// @Failure 401 {object} handler.JSONError "Unauthorized"
// @Failure 408 {object} handler.JSONError "Database timeout"
// @Failure 409 {object} handler.JSONError "Word already exists"
// @Failure 500 {object} handler.JSONError "Internal server error"
// @Router /words/create [post]
func (h *Handler) NewWord(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	var req models.CreateReq

	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid request body")
		slogger.Log.ErrorContext(ctx, "invalid request body", "error", err)
		return
	}
	slogger.Log.DebugContext(ctx, "Handler NewWord called with req", "req", req)

	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, "unauthorized")
		slogger.Log.ErrorContext(ctx, "unauthorized", "error", err)
		return
	}

	resp, err := h.wordsService.Create(ctx, req, user.ID)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrWordAlreadyExists):
			WriteError(w, http.StatusConflict, "word already exists")
			slogger.Log.ErrorContext(ctx, "word already exists", "error", err)
			return
		case errors.Is(err, models.ErrDBTimeout):
			WriteError(w, http.StatusRequestTimeout, "timeout")
			slogger.Log.ErrorContext(ctx, "timeout", "error", err)
			return
		default:
			WriteError(w, http.StatusInternalServerError, "internal server error")
			slogger.Log.ErrorContext(ctx, "internal server error", "error", err)
			return
		}
	}

	slogger.Log.DebugContext(ctx, "Handler NewWord called with resp", "resp", resp)
	JSONResponse(w, http.StatusOK, resp)
}

// StartLesson Start a new lesson
// @Summary Start a learning lesson
// @Description Gets the next word for the user to learn
// @Tags lesson
// @Produce json
// @Security BearerAuth
// @Success 200 {object} models.StartLessonResponse <--- ИСПРАВЛЕНО ЗДЕСЬ
// @Failure 401 {object} handler.JSONError "Unauthorized"
// @Failure 404 {object} handler.JSONError "No words found for lesson"
// @Failure 500 {object} handler.JSONError "Internal server error"
// @Router /lesson/start [get]
func (h *Handler) StartLesson(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userCtx, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, "unauthorized")
		slogger.Log.ErrorContext(ctx, "unauthorized", "error", err)
		return
	}

	word, err := h.wordsService.LessonStart(ctx, userCtx.ID)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrNoWordsForLesson):
			WriteError(w, http.StatusNotFound, "no words found for lesson")
			slogger.Log.ErrorContext(ctx, "no words found for lesson", "error", err)
			return
		default:
			WriteError(w, http.StatusInternalServerError, "internal server error")
			slogger.Log.ErrorContext(ctx, "internal server error", "error", err)
			return
		}
	}

	totalCorrect, err := h.userService.GetTotalCorrect(ctx, userCtx.ID)
	if err != nil {
		//todo
	}

	response := models.StartLessonResponse{
		TotalCorrect: totalCorrect,
		Word:         word,
	}

	JSONResponse(w, http.StatusOK, response)

}

// CheckAnswer Check word answer
// @Summary Check the answer for a word
// @Description Submits an answer for the current word and returns the next word
// @Tags lesson
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body models.AnswerReq true "Answer data"
// @Success 200 {object} models.CheckAnswerResponse <--- ИСПРАВЛЕНО ЗДЕСЬ
// @Failure 400 {object} handler.JSONError "Invalid request body"
// @Failure 401 {object} handler.JSONError "Unauthorized"
// @Failure 500 {object} handler.JSONError "Internal server error"
// @Router /lesson/check [post]
func (h *Handler) CheckAnswer(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, "unauthorized")
		slogger.Log.ErrorContext(ctx, "unauthorized", "error", err)
		return
	}

	var req models.AnswerReq
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid request body")
		slogger.Log.ErrorContext(ctx, "invalid request body", "error", err)
		return
	}
	slogger.Log.DebugContext(ctx, "Handler CheckAnswer called with req", "req", req)

	if req.ID == "" {
		slogger.Log.ErrorContext(ctx, "Handler CheckAnswer called with empty req.ID", "req", req.ID)
		WriteError(w, http.StatusBadRequest, "invalid request id")
		return
	}
	isCorrect, resp, err := h.wordsService.CheckAnswer(ctx, req, user.ID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	totalCorrect, err := h.userService.GetTotalCorrect(ctx, user.ID)
	if err != nil {
		//todo
	}
	var totalCorrectUpdate int64
	if isCorrect {
		totalCorrectUpdate, err = h.userService.SetTotalCorrect(ctx, user.ID, totalCorrect)
		if err != nil {

		}
	} else {
		totalCorrectUpdate = totalCorrect
	}

	response := models.CheckAnswerResponse{
		IsCorrect:    isCorrect,
		TotalCorrect: totalCorrectUpdate,
		NextWord:     resp,
	}

	if isCorrect {
		slogger.Log.DebugContext(ctx, "Handler CheckAnswer is correct")
	} else {
		slogger.Log.DebugContext(ctx, "Handler CheckAnswer is NOT correct")
	}

	JSONResponse(w, http.StatusOK, response)

}

// Finish Finish current lesson
// @Summary Finish the learning lesson
// @Description Clears the current lesson state from the cache for the current user
// @Tags lesson
// @Produce json
// @Security BearerAuth
// @Success 200 {string} string "OK"
// @Failure 401 {object} handler.JSONError "Unauthorized"
// @Router /lesson/finish [post]
func (h *Handler) Finish(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	user, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, "unauthorized")
		slogger.Log.ErrorContext(ctx, "unauthorized", "error", err)
		return
	}

	h.wordsService.Finish(ctx, user.ID)
	JSONResponse(w, http.StatusOK, nil)
}

// WordInfo Get AI-generated information about a word
// @Summary Get word details using AI
// @Description Returns detailed explanation, grammar, and usage examples for a word using Gemini AI
// @Tags words
// @Accept json
// @Produce json
// @Security BearerAuth
// @Param input body gemini.WordInfoRequest true "Data for Gemini AI prompt"
// @Success 200 {object} gemini.WordInfoResponse "Successfully generated explanation"
// @Failure 400 {object} handler.JSONError "Invalid request body"
// @Failure 401 {object} handler.JSONError "Unauthorized"
// @Failure 500 {object} handler.JSONError "Internal server error"
// @Router /words/wordInfo [post]
func (h *Handler) WordInfo(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userCtx, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, "unauthorized")
		slogger.Log.ErrorContext(ctx, "unauthorized", "error", err)
		return
	}

	var req gemini.WordInfoRequest
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	user, err := h.userService.GetUserByID(ctx, userCtx.ID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to get user")
		slogger.Log.ErrorContext(ctx, "Failed to get user", "err", err)
		return
	}

	req.SourceLang = user.SourceLang
	req.TargetLang = user.TargetLang

	resp, err := h.wordsService.WordInfo(ctx, req)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	JSONResponse(w, http.StatusOK, resp)

}

func (h *Handler) StartPracticeWithGemini(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userCtx, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, "unauthorized")
		slogger.Log.ErrorContext(ctx, "unauthorized", "error", err)
		return
	}

	user, err := h.userService.GetUserByID(ctx, userCtx.ID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to get user")
		slogger.Log.ErrorContext(ctx, "Failed to get user", "err", err)
		return
	}

	var reqBody struct {
		Topic string `json:"topic"`
	}
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&reqBody); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	gemReq := &gemini.PracticeWithGemini{
		SourceLang: user.SourceLang,
		TargetLang: user.TargetLang,
		Topic:      reqBody.Topic,
	}
	resp, err := h.wordsService.StartPracticeWithGemini(ctx, gemReq, userCtx.ID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		slogger.Log.ErrorContext(ctx, "Failed to start practice", "err", err)
		return
	}
	JSONResponse(w, http.StatusOK, resp)
}

func (h *Handler) CheckAnswerPracticeWithGemini(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	userCtx, err := middleware.GetUserFromContext(ctx)
	if err != nil {
		WriteError(w, http.StatusUnauthorized, "unauthorized")
		slogger.Log.ErrorContext(ctx, "unauthorized", "error", err)
		return
	}

	user, err := h.userService.GetUserByID(ctx, userCtx.ID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, "Failed to get user")
		slogger.Log.ErrorContext(ctx, "Failed to get user", "err", err)
		return
	}

	var userTranslateResponse models.UserTranslateResponse
	r.Body = http.MaxBytesReader(w, r.Body, 1048576)
	if err := json.NewDecoder(r.Body).Decode(&userTranslateResponse); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid request body")
		return
	}

	gemReq := &gemini.PracticeWithGemini{
		SourceLang: user.SourceLang,
		TargetLang: user.TargetLang,
		Topic:      "",
	}
	resp, err := h.wordsService.CheckAnswerPracticeWithGemini(ctx, gemReq, userCtx.ID, userTranslateResponse.Translation)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		slogger.Log.ErrorContext(ctx, "Failed to start practice", "err", err)
		return
	}
	JSONResponse(w, http.StatusOK, resp)
}
