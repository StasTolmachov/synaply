package main

import (
	"log"

	"wordsGo_v2/internal/config"
	"wordsGo_v2/internal/repo"
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
	db, err := repo.NewPostgres(cfg.DB)
	if err != nil {
		log.Fatalf("Error connecting to db: %s", err)
	}
	defer db.Close()
	//todo init repo
	//todo init service
	//todo init handler
	//todo run server
}
