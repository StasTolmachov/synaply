package server

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"wordsGo_v2/external/deepl"
	"wordsGo_v2/internal/cache"
	"wordsGo_v2/internal/config"
	"wordsGo_v2/internal/handler"
	"wordsGo_v2/internal/repository"
	"wordsGo_v2/internal/service"
	"wordsGo_v2/slogger"
)

func StartServer(cfg config.Config) {
	db, err := repository.NewPostgres(cfg.DB)
	if err != nil {
		log.Fatalf("Error connecting to database: %s", err)
	}
	defer db.Close()

	wordsRepo := repository.NewWordsPostgres(db)
	userRepo := repository.NewUserRepo(db)

	redisClient, err := cache.NewRedisClient(cfg.Redis)
	if err != nil {
		slogger.Log.Warn("Error connecting to redis:", "error", err)
	}
	defer redisClient.Close()

	client := &http.Client{
		Timeout: time.Second * 10,
	}
	deeplServ := deepl.NewService(cfg.Deepl.Key, cfg.Deepl.Url, client)
	wordsService := service.NewWordsService(wordsRepo, redisClient, deeplServ)
	userService := service.NewUserService(userRepo, cfg.JWT)

	ctxBG := context.Background()
	if err := userService.SyncAdmin(ctxBG, cfg.Admin); err != nil {
		log.Fatal("Failed to sync admin user:", err)
	}

	wordsHandler := handler.NewHandler(wordsService, userService)

	router := handler.RegisterRoutes(wordsHandler, cfg.JWT.Secret)

	httpServer := &http.Server{
		Addr:         ":" + cfg.Api.Port,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slogger.Log.Info("Starting http server on port", "port:", cfg.Api.Port)
		if err := httpServer.ListenAndServe(); err != nil {
			log.Fatalf("Error starting server: %s", err)
		}
	}()

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	<-stop
	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown:", err)
	}
	log.Println("Server exiting")
}
