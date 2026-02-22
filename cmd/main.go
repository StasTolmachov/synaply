package main

import (
	"log"

	"wordsGo_v2/internal/config"
	"wordsGo_v2/slogger"
)

func main() {
	//Init logger
	slogger.MakeLogger(true)

	//init config
	cfg, err := config.NewConfig()
	if err != nil {
		log.Fatalf("Error loading config: %s", err)
	}
	slogger.Log.Info("Config loaded successfully", "config", cfg)
	//todo init db

	//todo init repo
	//todo init service
	//todo init handler
	//todo run server
}
