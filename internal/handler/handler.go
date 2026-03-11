package handler

import (
	"encoding/json"
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/google/uuid"

	"wordsGo_v2/internal/middleware"
	"wordsGo_v2/internal/models"
	"wordsGo_v2/internal/service"
	"wordsGo_v2/slogger"
)

type Handler struct {
	us service.WordsServiceI
}

func NewHandler(us service.WordsServiceI) *Handler {
	return &Handler{us: us}
}

func RegisterRoutes(h *Handler) *chi.Mux {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"https://*", "http://*"}, // Разрешаем откуда угодно (для разработки)
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.LoggerMiddleware)
	r.Use(middleware.AuthMidleware)

	r.Route("/api/v1/", func(r chi.Router) {
		r.Post("/create", h.Create)

		r.Group(func(r chi.Router) {
			r.Get("/start", h.StartLesson)
			r.Post("/check", h.CheckAnswer)
			r.Post("/finish", h.Finish)
		})
	})

	return r
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.CreateReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid request body")
		slogger.Log.ErrorContext(r.Context(), "invalid request body", "error", err)
		return
	}
	slogger.Log.DebugContext(r.Context(), "Handler Create called with req", "req", req)

	userID := r.Context().Value(slogger.UserIDKey).(uuid.UUID)

	resp, err := h.us.Create(r.Context(), req, userID)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrWordAlreadyExists):
			WriteError(w, http.StatusConflict, "word already exists")
			slogger.Log.ErrorContext(r.Context(), "word already exists", "error", err)
			return
		case errors.Is(err, models.ErrDBTimeout):
			WriteError(w, http.StatusRequestTimeout, "timeout")
			slogger.Log.ErrorContext(r.Context(), "timeout", "error", err)
			return
		default:
			WriteError(w, http.StatusInternalServerError, "internal server error")
			slogger.Log.ErrorContext(r.Context(), "internal server error", "error", err)
			return
		}
	}

	slogger.Log.DebugContext(r.Context(), "Handler Create called with resp", "resp", resp)
	JSONResponse(w, http.StatusOK, resp)
}

func (h *Handler) StartLesson(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(slogger.UserIDKey).(uuid.UUID)

	word, err := h.us.LessonStart(r.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, models.ErrNoWordsForLesson):
			WriteError(w, http.StatusNotFound, "no words found for lesson")
			slogger.Log.ErrorContext(r.Context(), "no words found for lesson", "error", err)
			return
		default:
			WriteError(w, http.StatusInternalServerError, "internal server error")
			slogger.Log.ErrorContext(r.Context(), "internal server error", "error", err)
			return
		}
	}

	JSONResponse(w, http.StatusOK, word)

}

func (h *Handler) CheckAnswer(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(slogger.UserIDKey).(uuid.UUID)

	var req models.AnswerReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid request body")
		slogger.Log.ErrorContext(r.Context(), "invalid request body", "error", err)
		return
	}
	slogger.Log.DebugContext(r.Context(), "Handler CheckAnswer called with req", "req", req)

	if req.ID == "" {
		slogger.Log.ErrorContext(r.Context(), "Handler CheckAnswer called with empty req.ID", "req", req.ID)
		WriteError(w, http.StatusBadRequest, "invalid request id")
		return
	}
	if req.TargetWord == "" {
		slogger.Log.ErrorContext(r.Context(), "Handler CheckAnswer called with empty req.TargetWord", "req", req.TargetWord)
		WriteError(w, http.StatusBadRequest, "invalid request target word")
		return
	}
	isCorrect, resp, err := h.us.CheckAnswer(r.Context(), req, userID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}
	responseData := struct {
		IsCorrect bool             `json:"is_correct"`
		NextWord  *models.Response `json:"next_word"`
	}{
		IsCorrect: isCorrect,
		NextWord:  resp,
	}

	if isCorrect {
		slogger.Log.DebugContext(r.Context(), "Handler CheckAnswer is correct")
	} else {
		slogger.Log.DebugContext(r.Context(), "Handler CheckAnswer is NOT correct")
	}

	JSONResponse(w, http.StatusOK, responseData)

}
func (h *Handler) Finish(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(slogger.UserIDKey).(uuid.UUID)

	h.us.Finish(r.Context(), userID)
	JSONResponse(w, http.StatusOK, nil)
}
