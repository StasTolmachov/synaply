package server

import (
	"log"
	"net/http"
	"time"

	"wordsGo_v2/internal/config"
	"wordsGo_v2/internal/handler"
	"wordsGo_v2/internal/repository"
	"wordsGo_v2/internal/service"
)

func StartServer(cfg config.Config) {
	db, err := repository.NewPostgres(cfg.DB)
	if err != nil {
		log.Fatalf("Error connecting to database: %s", err)
	}

	wordsRepo := repository.NewWordsPostgres(db)

	wordsService := service.NewWordsService(wordsRepo)

	wordsHandler := handler.NewHandler(wordsService)

	router := handler.RegisterRoutes(wordsHandler)

	httpServer := &http.Server{
		Addr:         ":" + cfg.Api.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	if err := httpServer.ListenAndServe(); err != nil {
		log.Fatalf("Error starting server: %s", err)
	}
}
