package handler

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chiMiddleware "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"

	"synaply/internal/middleware"
)

func RegisterRoutes(h *Handler) *chi.Mux {
	r := chi.NewRouter()

	r.Use(chiMiddleware.Recoverer)
	r.Use(chiMiddleware.RealIP)

	r.Use(middleware.RequestLogger())
	r.Use(middleware.LimitPayloadSize)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"https://synaply.me",
			"http://localhost:3000", //todo for local dev front
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID"},
		ExposedHeaders:   []string{"Link", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	//Liveness probe
	r.Get("/healthz/live", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	//Readiness Probe
	r.Get("/healthz/ready", func(w http.ResponseWriter, r *http.Request) {
		//todo ping to db
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"READY"}`))
	})

	r.Route("/api/v1/", func(r chi.Router) {

		// ==========================================
		// PUBLIC ROUTES (limit by IP)
		// ==========================================
		r.Group(func(r chi.Router) {
			r.Use(middleware.RateLimiter(redisClient, 20, time.Minute))

			r.Post("/auth/login", h.Login)
			r.Post("/auth/register", h.Register)
		})

		// ==========================================
		// PRIVET ROUTES (limit by UserID)
		// ==========================================
		r.Group(func(r chi.Router) {
			r.Use(middleware.RateLimiter(redisClient, 100, time.Minute))
		})

	})

	return r
}
