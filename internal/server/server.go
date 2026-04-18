package server

import (
	"context"
	"log"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"synaply/internal/auth"
	"synaply/internal/config"
	"synaply/internal/database"
	"synaply/internal/handler"
	"synaply/internal/repository"
	"synaply/internal/service"
	"synaply/internal/utils"
	"synaply/slogger"
)

func StartServer(ctx context.Context, config config.Config) {

	pgPool, err := database.NewPostgres(ctx, config.Postgres)
	if err != nil {
		slog.ErrorContext(ctx, "Error connecting to database", slog.String("error", err.Error()))
		os.Exit(1)
	}
	defer pgPool.Close()

	redisClient, err := database.NewRedis(ctx, config.Redis)
	if err != nil {
		slog.ErrorContext(ctx, "Error connecting to redis", slog.String("error", err.Error()))
		os.Exit(1)
	}

	userRepo := repository.NewUserRepo(pgPool)

	jwt := auth.NewJWTManager(config.JWT.Secret, config.JWT.TTL)

	userServ := service.NewService(userRepo, jwt, redisClient)

	validator, err := utils.NewValidator()
	if err != nil {
		log.Fatalf("Error creating validator: %s", err)
	}

	userHandler := handler.NewHandler(userServ, validator)

	//ctxBG := context.Background()
	//if err := userServ.SyncAdmin(ctxBG, config.Admin); err != nil {
	//	log.Fatal("Failed to sync admin user:", err)
	//}

	router := handler.RegisterRoutes(userHandler)

	httpServer := &http.Server{
		Addr:         ":" + config.Api.HTTPPort,
		Handler:      router,
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	go func() {
		slogger.Log.Info("Starting http server on port", "port:", config.Api.HTTPPort)
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

	log.Println("Server exiting")
}
