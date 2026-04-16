package main

import (
	"context"
	"log/slog"
	"os"

	"synaply/internal/config"
	"synaply/internal/server"
	"synaply/slogger"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	slogger.MakeLogger("development")

	cfg, err := config.Load()
	if err != nil {
		slog.Error("Error loading config", slog.String("error", err.Error()))
		os.Exit(1)
	}

	slog.Info("Starting server...")
	server.StartServer(ctx, *cfg)
}
