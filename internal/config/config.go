package config

import (
	"errors"
	"os"

	"github.com/joho/godotenv"
)

// Config содержит все конфигурационные параметры приложения
type Config struct {
	Env         string // development, production, test
	HTTPPort    string
	PostgresDSN string
	RedisURL    string
}

// Load загружает конфигурацию из файла .env и переменных окружения OS
func Load() (*Config, error) {
	// Игнорируем ошибку загрузки .env, так как в production (AWS ECS)
	// мы будем передавать переменные окружения напрямую контейнеру.
	_ = godotenv.Load()

	cfg := &Config{
		Env:         getEnv("APP_ENV", "development"),
		HTTPPort:    getEnv("HTTP_PORT", "8080"),
		PostgresDSN: getEnv("POSTGRES_DSN", ""),
		RedisURL:    getEnv("REDIS_URL", ""),
	}

	// Валидация критически важных переменных
	if cfg.PostgresDSN == "" {
		return nil, errors.New("POSTGRES_DSN environment variable is required")
	}
	if cfg.RedisURL == "" {
		return nil, errors.New("REDIS_URL environment variable is required")
	}

	return cfg, nil
}

// getEnv получает значение переменной окружения или возвращает fallback (значение по умолчанию)
func getEnv(key, fallback string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return fallback
}

// for commit
