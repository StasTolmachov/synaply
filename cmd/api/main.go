package main

import (
	"log"
	"log/slog"

	"synaply/internal/config"
	"synaply/internal/server"
	"synaply/slogger"
)

func main() {

	slogger.MakeLogger("development")

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Error loading config: %s", err)
	}

	slog.Info("Starting server...", "env", cfg.Env, slogger.KeyPort, cfg.HTTPPort)
	server.StartServer(*cfg)
}
