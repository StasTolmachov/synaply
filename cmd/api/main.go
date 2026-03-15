package main

import (
	"log"

	"wordsGo_v2/internal/config"
	"wordsGo_v2/internal/server"
	"wordsGo_v2/slogger"
)

// @title WordsGo API
// @version 1.0
// @description API Server for spaced repetition app

// @securityDefinitions.apikey BearerAuth
// @in header
// @name Authorization
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
