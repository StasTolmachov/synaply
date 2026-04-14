package config

import (
	"errors"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Env         string
	HTTPPort    string
	PostgresDSN string
	RedisURL    string
}

func Load() (*Config, error) {
	_ = godotenv.Load()

	cfg := &Config{
		Env:         getEnv("APP_ENV", "development"),
		HTTPPort:    getEnv("HTTP_PORT", "8080"),
		PostgresDSN: getEnv("POSTGRES_DSN", ""),
		RedisURL:    getEnv("REDIS_URL", ""),
	}

	if cfg.PostgresDSN == "" {
		return nil, errors.New("POSTGRES_DSN environment variable is required")
	}
	if cfg.RedisURL == "" {
		return nil, errors.New("REDIS_URL environment variable is required")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}
