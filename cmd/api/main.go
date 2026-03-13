package main

import (
	"log"

	"wordsGo_v2/internal/config"
	"wordsGo_v2/internal/server"
	"wordsGo_v2/slogger"
)

// @title WordsGO
// @version 1.0
// @host localhost:8080
// @BasePath /api/v1

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
// @description Type "Bearer" followed by a space and your JWT token.
func main() {

	slogger.MakeLogger(true)

	cfg, err := config.NewConfig()
	if err != nil {
		log.Fatalf("Error loading config: %s", err)
	}
	slogger.Log.Info("Config loaded successfully")
	slogger.Log.Debug("loaded config", "config", cfg)

	server.StartServer(*cfg)
}
