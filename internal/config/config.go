package config

import (
	"fmt"
	"os"
	"time"

	"github.com/joho/godotenv"

	"synaply_v2/slogger"
)

type Config struct {
	DB     DB
	Api    Api
	Redis  Redis
	Deepl  Deepl
	JWT    JWT
	Admin  Admin
	Gemini Gemini
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

type Api struct {
	Port string
}

type Redis struct {
	Host string
	Port string
	TTL  time.Duration
}

type Deepl struct {
	Key string
	Url string
}

type JWT struct {
	Secret string
	TTL    time.Duration
}

type Admin struct {
	Email    string
	Password string
}

type Gemini struct {
	Key   string
	Model string
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

	if cfg.Api.Port = os.Getenv("API_PORT"); cfg.Api.Port == "" {
		return nil, fmt.Errorf("API_PORT environment variable is not set")
	}

	if cfg.Redis.Host = os.Getenv("REDIS_HOST"); cfg.Redis.Host == "" {
		return nil, fmt.Errorf("REDIS_HOST environment variable is not set")
	}
	if cfg.Redis.Port = os.Getenv("REDIS_PORT"); cfg.Redis.Port == "" {
		return nil, fmt.Errorf("REDIS_PORT environment variable is not set")
	}
	redisTTLString := os.Getenv("REDIS_TTL")
	if redisTTLString == "" {
		return nil, fmt.Errorf("REDIS_TTL environment variable is not set")
	} else {
		ttl, err := time.ParseDuration(redisTTLString)
		if err != nil {
			return nil, fmt.Errorf("failed to parse REDIS_TTL environment variable as a duration")
		}
		cfg.Redis.TTL = ttl
	}

	if cfg.Deepl.Key = os.Getenv("DEEPL_KEY"); cfg.Deepl.Key == "" {
		return nil, fmt.Errorf("DEEPL_KEY environment variable is not set")
	}

	if cfg.Deepl.Url = os.Getenv("DEEPL_URL"); cfg.Deepl.Url == "" {
		return nil, fmt.Errorf("DEEPL_URL environment variable is not set")
	}

	if cfg.JWT.Secret = os.Getenv("JWT_SECRET"); cfg.JWT.Secret == "" {
		return nil, fmt.Errorf("JWT_SECRET environment variable not set")
	}
	ttlString := os.Getenv("JWT_TTL")
	if ttlString == "" {
		cfg.JWT.TTL = time.Hour * 24
	} else {
		ttl, err := time.ParseDuration(ttlString)
		if err != nil {
			cfg.JWT.TTL = time.Hour * 24
			slogger.Log.Warn("invalid JWT_TTL format:", "err", err)
		}
		cfg.JWT.TTL = ttl
	}

	if cfg.Admin.Email = os.Getenv("ADMIN_EMAIL"); cfg.Admin.Email == "" {
		return nil, fmt.Errorf("ADMIN_EMAIL environment variable not set")
	}
	if cfg.Admin.Password = os.Getenv("ADMIN_PASSWORD"); cfg.Admin.Password == "" {
		return nil, fmt.Errorf("ADMIN_PASSWORD environment variable not set")
	}

	if cfg.Gemini.Key = os.Getenv("GEMINI_API_KEY"); cfg.Gemini.Key == "" {
		return nil, fmt.Errorf("GEMINI_API_KEY environment variable not set")
	}
	if cfg.Gemini.Model = os.Getenv("GEMINI_MODEL"); cfg.Gemini.Model == "" {
		return nil, fmt.Errorf("GEMINI_MODEL environment variable not set")
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
