package handler

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi/v5"
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
	r.Use(middleware.LoggerMiddleware)
	r.Use(middleware.AuthMidleware)

	r.Route("/api/v1/", func(r chi.Router) {
		r.Post("/create", h.Create)
	})

	r.Group(func(r chi.Router) {
		r.Get("/Start", h.StartLesson)
		r.Post("/check", h.Check)
	})
	return r
}

func (h *Handler) Create(w http.ResponseWriter, r *http.Request) {
	var req models.WordCreateReq
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		WriteError(w, http.StatusBadRequest, "invalid request body")
		slogger.Log.ErrorContext(r.Context(), "invalid request body", "error", err)
		return
	}
	slogger.Log.DebugContext(r.Context(), "Handler Create called with req", "req", req)

	userID := r.Context().Value(slogger.UserIDKey).(uuid.UUID)

	resp, err := h.us.Create(r.Context(), &req, userID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		slogger.Log.ErrorContext(r.Context(), "error creating word", "error", err)
		return
	}

	slogger.Log.DebugContext(r.Context(), "Handler Create called with resp", "resp", resp)
	JSONResponse(w, http.StatusOK, resp)
}

func (h *Handler) StartLesson(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(slogger.UserIDKey).(uuid.UUID)

	word, err := h.us.StartLesson(r.Context(), userID)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
		return
	}

	JSONResponse(w, http.StatusOK, word)

}

func (h *Handler) CheckAnswer(w http.ResponseWriter, r *http.Request) {
	userID := r.Context().Value(slogger.UserIDKey).(uuid.UUID)

	req := models.AnswerReq{}
	resp, err := h.us.CheckAnswer(r.Context(), req)
	if err != nil {
		WriteError(w, http.StatusInternalServerError, err.Error())
	}

}
