package config

import (
	"os"
	"testing"
)

func TestLoad_AllEnvSet(t *testing.T) {
	t.Setenv("POSTGRES_DSN", "postgres://user:pass@localhost:5432/db")
	t.Setenv("REDIS_URL", "redis://localhost:6379")
	t.Setenv("APP_ENV", "production")
	t.Setenv("HTTP_PORT", "9090")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if cfg.PostgresDSN != "postgres://user:pass@localhost:5432/db" {
		t.Errorf("Unexpected PostgresDSN: %q", cfg.PostgresDSN)
	}
	if cfg.RedisURL != "redis://localhost:6379" {
		t.Errorf("Unexpected RedisURL: %q", cfg.RedisURL)
	}
	if cfg.Env != "production" {
		t.Errorf("Unexpected Env: %q", cfg.Env)
	}
	if cfg.HTTPPort != "9090" {
		t.Errorf("Unexpected HTTPPort: %q", cfg.HTTPPort)
	}
}

func TestLoad_MissingPostgresDSN(t *testing.T) {
	os.Unsetenv("POSTGRES_DSN")
	t.Setenv("REDIS_URL", "redis://localhost:6379")

	_, err := Load()
	if err == nil {
		t.Fatal("Expected error for missing POSTGRES_DSN, got nil")
	}
	if err.Error() != "POSTGRES_DSN environment variable is required" {
		t.Errorf("Unexpected error message: %q", err.Error())
	}
}

func TestLoad_MissingRedisURL(t *testing.T) {
	t.Setenv("POSTGRES_DSN", "postgres://user:pass@localhost:5432/db")
	os.Unsetenv("REDIS_URL")

	_, err := Load()
	if err == nil {
		t.Fatal("Expected error for missing REDIS_URL, got nil")
	}
	if err.Error() != "REDIS_URL environment variable is required" {
		t.Errorf("Unexpected error message: %q", err.Error())
	}
}

func TestLoad_DefaultValues(t *testing.T) {
	t.Setenv("POSTGRES_DSN", "postgres://user:pass@localhost:5432/db")
	t.Setenv("REDIS_URL", "redis://localhost:6379")
	os.Unsetenv("APP_ENV")
	os.Unsetenv("HTTP_PORT")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}

	if cfg.Env != "development" {
		t.Errorf("Expected default Env = %q, got %q", "development", cfg.Env)
	}
	if cfg.HTTPPort != "8080" {
		t.Errorf("Expected default HTTPPort = %q, got %q", "8080", cfg.HTTPPort)
	}
}

func TestGetEnv_ReturnsEnvValue(t *testing.T) {
	t.Setenv("TEST_KEY", "test_value")

	if got := getEnv("TEST_KEY", "fallback"); got != "test_value" {
		t.Errorf("Expected %q, got %q", "test_value", got)
	}
}

func TestGetEnv_ReturnsFallback(t *testing.T) {
	os.Unsetenv("MISSING_KEY")

	if got := getEnv("MISSING_KEY", "default"); got != "default" {
		t.Errorf("Expected fallback %q, got %q", "default", got)
	}
}

func TestGetEnv_EmptyStringIsValid(t *testing.T) {
	t.Setenv("EMPTY_KEY", "")

	if got := getEnv("EMPTY_KEY", "fallback"); got != "" {
		t.Errorf("Expected empty string, got %q", got)
	}
}
