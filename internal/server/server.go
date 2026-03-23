package server

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"sync"
	"syscall"
	"time"

	"synaply_v2/external/deepl"
	"synaply_v2/external/gemini"
	"synaply_v2/internal/cache"
	"synaply_v2/internal/config"
	"synaply_v2/internal/handler"
	"synaply_v2/internal/repository"
	"synaply_v2/internal/service"
	"synaply_v2/slogger"
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

	userRepo.SetCache(redisClient)

	client := &http.Client{
		Timeout: time.Second * 10,
	}
	deeplServ := deepl.NewService(cfg.Deepl.Key, cfg.Deepl.Url, client)
	geminiServ, err := gemini.NewService(cfg.Gemini.Key, cfg.Gemini.Model)
	if err != nil {
		slogger.Log.Warn("Error connecting to gemini:", "error", err)
	}

	var wg sync.WaitGroup
	wordsService := service.NewWordsService(wordsRepo, redisClient, deeplServ, &wg, geminiServ)
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
		WriteTimeout: 30 * time.Second,
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

	log.Println("Waiting for background tasks to finish...")
	wg.Wait()

	log.Println("Server exiting")
}
