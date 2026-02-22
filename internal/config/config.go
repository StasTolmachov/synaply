package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"

	"wordsGo_v2/slogger"
)

type Config struct {
	DB DB
}

type DB struct {
	DBName         string
	Host           string
	Port           string
	Username       string
	Password       string
	SSLMode        string
	MigrationsPath string
}

func NewConfig() (*Config, error) {
	cfg := &Config{}

	if err := godotenv.Load(); err != nil {
		slogger.Log.Warn("No .env file found")
	}

	if cfg.DB.DBName = os.Getenv("DB_NAME"); cfg.DB.DBName == "" {
		return nil, fmt.Errorf("DB_NAME environment variable is not set")
	}
	if cfg.DB.Host = os.Getenv("DB_HOST"); cfg.DB.Host == "" {
		return nil, fmt.Errorf("DB_HOST environment variable is not set")
	}
	if cfg.DB.Port = os.Getenv("DB_PORT"); cfg.DB.Port == "" {
		return nil, fmt.Errorf("DB_PORT environment variable is not set")
	}
	if cfg.DB.Username = os.Getenv("DB_USERNAME"); cfg.DB.Username == "" {
		return nil, fmt.Errorf("DB_USERNAME environment variable is not set")
	}
	if cfg.DB.Password = os.Getenv("DB_PASSWORD"); cfg.DB.Password == "" {
		return nil, fmt.Errorf("DB_PASSWORD environment variable is not set")
	}
	if cfg.DB.SSLMode = os.Getenv("DB_SSLMODE"); cfg.DB.SSLMode == "" {
		cfg.DB.SSLMode = "disable"
		slogger.Log.Warn("DB_SSLMODE environment variable is not set, defaulting to disable")
	}
	if cfg.DB.MigrationsPath = os.Getenv("MIGRATIONS_PATH"); cfg.DB.MigrationsPath == "" {
		return nil, fmt.Errorf("MIGRATIONS_PATH environment variable is not set")
	}

	return cfg, nil
}

func (d *DB) DSN() string {
	return fmt.Sprintf("postgres://%s:%s@%s:%s/%s?sslmode=%s",
		d.Username,
		d.Password,
		d.Host,
		d.Port,
		d.DBName,
		d.SSLMode,
	)
}
