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
	Env      string `yaml:"env" env:"APP_ENV" env-default:"development"`
	HTTPPort string `yaml:"http_port" env:"API_PORT" env-default:"8080"`
}

type Postgres struct {
	URL      string `yaml:"url" env:"POSTGRES_URL" env-required:"true"`
	MaxConns int32  `yaml:"max_conns" env:"DB_MAX_CONNS" env-default:"20"`
	MinConns int32  `yaml:"min_conns" env:"DB_MIN_CONNS" env-default:"5"`
}

type Redis struct {
	URL string `yaml:"url" env:"REDIS_URL" env-required:"true"`
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

	var config Config

	if _, err := os.Stat(configPath); err == nil {

		if err := cleanenv.ReadConfig(configPath, &config); err != nil {
			return nil, fmt.Errorf("config error: %w", err)
		}
	} else {
		if err := cleanenv.ReadEnv(&config); err != nil {
			return nil, fmt.Errorf("config error: %w", err)
		}
	}

	return &config, nil
}
