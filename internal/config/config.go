package config

import (
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/ilyakaznacheev/cleanenv"
	"github.com/joho/godotenv"
)

type Config struct {
	Api      Api      `yaml:"api"`
	Postgres Postgres `yaml:"postgres"`
	Redis    Redis    `yaml:"redis"`
	JWT      JWT
}

type Api struct {
	Env      string `yaml:"env"`
	HTTPPort string `yaml:"http_port"`
}

type Postgres struct {
	URl      string `yaml:"url" env:"POSTGRES_URL"`
	MaxConns int32  `yaml:"max_conns"`
	MinConns int32  `yaml:"min_conns"`
}

type Redis struct {
	URL string `yaml:"url" env:"REDIS_URL"`
}
type JWT struct {
	Secret string        `yaml:"secret" env:"JWT_SECRET"`
	TTL    time.Duration `yaml:"ttl" env:"JWT_TTL"`
}

func Load() (*Config, error) {

	if err := godotenv.Load(); err != nil {
		slog.Warn("No .env file found")
	}

	configPath := os.Getenv("CONFIG_PATH")
	if configPath == "" {
		configPath = "config.yaml"
	}

	if _, err := os.Stat(configPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("config file not found: %s", configPath)
	}

	var config Config

	if err := cleanenv.ReadConfig(configPath, &config); err != nil {
		return nil, fmt.Errorf("config error: %w", err)
	}
	return &config, nil
}
