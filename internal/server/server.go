package server

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"synaply/internal/auth"
	"synaply/internal/config"
	"synaply/internal/handler"
	"synaply/internal/repository"
	"synaply/internal/service"
	"synaply/internal/utils"
	"synaply/slogger"
)

func StartServer(cfg config.Config) {
	db, err := repository.NewPostgres(cfg.DB)
	if err != nil {
		log.Fatalf("Error connecting to database: %s", err)
	}
	defer db.Close()

	userRepo := repository.NewUserRepo(db)

	jwt := auth.NewJWTManager(cfg.JWT.Secret, cfg.JWT.TTL)

	userServ := service.NewService(userRepo, jwt)
	validator, err := utils.NewValidator()
	if err != nil {
		log.Fatalf("Error creating validator: %s", err)
	}
	userHandler := handler.NewHandler(userServ, validator)

	ctxBG := context.Background()
	if err := userServ.SyncAdmin(ctxBG, cfg.Admin); err != nil {
		log.Fatal("Failed to sync admin user:", err)
	}

	router := handler.RegisterRoutes(userHandler)

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

	log.Println("Server exiting")
}
