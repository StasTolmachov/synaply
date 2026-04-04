package main

import (
	"log"

	"synaply/internal/config"
	"synaply/internal/server"
	"synaply/slogger"
)

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
