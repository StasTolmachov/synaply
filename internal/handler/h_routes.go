package handler

import (
	"net/http"

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

	// 3. CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"https://synaply.me",
			"http://localhost:3000", // для локальной разработки фронтенда
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token", "X-Request-ID"},
		ExposedHeaders:   []string{"Link", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Get("/healthz/live", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	r.Get("/healthz/ready", func(w http.ResponseWriter, r *http.Request) {
		//todo ping to db
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"READY"}`))
	})

	r.Route("/api/v1/", func(r chi.Router) {

		r.Route("/users", func(r chi.Router) {

		})

	})

	return r
}
