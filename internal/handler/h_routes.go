package handler

import (
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
	httpSwagger "github.com/swaggo/http-swagger/v2"

	"synaply/internal/middleware"
)

func RegisterRoutes(h *Handler) *chi.Mux {
	r := chi.NewRouter()

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"https://synaply.me",
			"http://localhost:3000", // for local frontend development
		},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	r.Use(middleware.LoggerMiddleware)
	r.Use(middleware.LimitPayloadSize)

	r.Get("/swagger/*", httpSwagger.WrapHandler)

	r.Route("/api/v1/", func(r chi.Router) {

		r.Route("/users", func(r chi.Router) {
			r.Use(httprate.LimitByIP(5, 1*time.Minute))

			r.Post("/register", h.Register)
			r.Post("/login", h.Login)
		})

	})

	return r
}
