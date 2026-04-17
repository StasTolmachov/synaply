package config

import (
	"os"
	"testing"
	"time"
)

// clearConfigEnv сбрасывает все переменные окружения, связанные с конфигурацией,
// чтобы тесты не влияли друг на друга.
func clearConfigEnv(t *testing.T) {
	t.Helper()
	for _, key := range []string{
		"CONFIG_PATH",
		"APP_ENV",
		"API_PORT",
		"POSTGRES_URL",
		"DB_MAX_CONNS",
		"DB_MIN_CONNS",
		"REDIS_URL",
		"JWT_SECRET",
		"JWT_TTL",
	} {
		t.Setenv(key, "") // t.Setenv автоматически восстановит значение после теста
		os.Unsetenv(key)
	}
}

// --- Кейсы: загрузка через ENV (без yaml-файла) ---

// TestLoad_EnvOnly_RequiredVarsSet — все обязательные переменные заданы через env.
func TestLoad_EnvOnly_RequiredVarsSet(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("CONFIG_PATH", "nonexistent_config_for_test.yaml")
	t.Setenv("POSTGRES_URL", "postgres://user:pass@localhost:5432/db")
	t.Setenv("REDIS_URL", "redis://localhost:6379")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if cfg.Postgres.URL != "postgres://user:pass@localhost:5432/db" {
		t.Errorf("unexpected Postgres.URL: %q", cfg.Postgres.URL)
	}
	if cfg.Redis.URL != "redis://localhost:6379" {
		t.Errorf("unexpected Redis.URL: %q", cfg.Redis.URL)
	}
}

// TestLoad_EnvOnly_DefaultValues — проверяем дефолты для необязательных полей.
func TestLoad_EnvOnly_DefaultValues(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("CONFIG_PATH", "nonexistent_config_for_test.yaml")
	t.Setenv("POSTGRES_URL", "postgres://user:pass@localhost:5432/db")
	t.Setenv("REDIS_URL", "redis://localhost:6379")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if cfg.Api.Env != "development" {
		t.Errorf("expected default Api.Env = %q, got %q", "development", cfg.Api.Env)
	}
	if cfg.Api.HTTPPort != "8080" {
		t.Errorf("expected default Api.HTTPPort = %q, got %q", "8080", cfg.Api.HTTPPort)
	}
	if cfg.Postgres.MaxConns != 20 {
		t.Errorf("expected default Postgres.MaxConns = 20, got %d", cfg.Postgres.MaxConns)
	}
	if cfg.Postgres.MinConns != 5 {
		t.Errorf("expected default Postgres.MinConns = 5, got %d", cfg.Postgres.MinConns)
	}
}

// TestLoad_EnvOnly_OverrideOptionalValues — переопределяем необязательные поля через env.
func TestLoad_EnvOnly_OverrideOptionalValues(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("CONFIG_PATH", "nonexistent_config_for_test.yaml")
	t.Setenv("POSTGRES_URL", "postgres://user:pass@localhost:5432/db")
	t.Setenv("REDIS_URL", "redis://localhost:6379")
	t.Setenv("APP_ENV", "production")
	t.Setenv("API_PORT", "9090")
	t.Setenv("DB_MAX_CONNS", "50")
	t.Setenv("DB_MIN_CONNS", "10")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if cfg.Api.Env != "production" {
		t.Errorf("expected Api.Env = %q, got %q", "production", cfg.Api.Env)
	}
	if cfg.Api.HTTPPort != "9090" {
		t.Errorf("expected Api.HTTPPort = %q, got %q", "9090", cfg.Api.HTTPPort)
	}
	if cfg.Postgres.MaxConns != 50 {
		t.Errorf("expected Postgres.MaxConns = 50, got %d", cfg.Postgres.MaxConns)
	}
	if cfg.Postgres.MinConns != 10 {
		t.Errorf("expected Postgres.MinConns = 10, got %d", cfg.Postgres.MinConns)
	}
}

// TestLoad_EnvOnly_MissingPostgresURL — POSTGRES_URL обязателен, должна быть ошибка.
func TestLoad_EnvOnly_MissingPostgresURL(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("CONFIG_PATH", "nonexistent_config_for_test.yaml")
	t.Setenv("REDIS_URL", "redis://localhost:6379")
	// POSTGRES_URL намеренно не задан

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for missing POSTGRES_URL, got nil")
	}
}

// TestLoad_EnvOnly_MissingRedisURL — REDIS_URL обязателен, должна быть ошибка.
func TestLoad_EnvOnly_MissingRedisURL(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("CONFIG_PATH", "nonexistent_config_for_test.yaml")
	t.Setenv("POSTGRES_URL", "postgres://user:pass@localhost:5432/db")
	// REDIS_URL намеренно не задан

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for missing REDIS_URL, got nil")
	}
}

// TestLoad_EnvOnly_MissingBothRequired — оба обязательных поля отсутствуют.
func TestLoad_EnvOnly_MissingBothRequired(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("CONFIG_PATH", "nonexistent_config_for_test.yaml")

	_, err := Load()
	if err == nil {
		t.Fatal("expected error for missing required fields, got nil")
	}
}

// TestLoad_EnvOnly_JWTFields — JWT поля читаются корректно.
func TestLoad_EnvOnly_JWTFields(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("CONFIG_PATH", "nonexistent_config_for_test.yaml")
	t.Setenv("POSTGRES_URL", "postgres://user:pass@localhost:5432/db")
	t.Setenv("REDIS_URL", "redis://localhost:6379")
	t.Setenv("JWT_SECRET", "supersecret")
	t.Setenv("JWT_TTL", "24h")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if cfg.JWT.Secret != "supersecret" {
		t.Errorf("expected JWT.Secret = %q, got %q", "supersecret", cfg.JWT.Secret)
	}
	if cfg.JWT.TTL != 24*time.Hour {
		t.Errorf("expected JWT.TTL = 24h, got %v", cfg.JWT.TTL)
	}
}

// TestLoad_EnvOnly_JWTDefaults — JWT поля не заданы, должны быть нулевые значения.
func TestLoad_EnvOnly_JWTDefaults(t *testing.T) {
	clearConfigEnv(t)
	t.Setenv("CONFIG_PATH", "nonexistent_config_for_test.yaml")
	t.Setenv("POSTGRES_URL", "postgres://user:pass@localhost:5432/db")
	t.Setenv("REDIS_URL", "redis://localhost:6379")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if cfg.JWT.Secret != "" {
		t.Errorf("expected empty JWT.Secret, got %q", cfg.JWT.Secret)
	}
	if cfg.JWT.TTL != 0 {
		t.Errorf("expected zero JWT.TTL, got %v", cfg.JWT.TTL)
	}
}

// --- Кейсы: загрузка через YAML-файл ---

// TestLoad_YAMLFile_ValidConfig — загрузка из валидного yaml-файла.
func TestLoad_YAMLFile_ValidConfig(t *testing.T) {
	clearConfigEnv(t)

	content := `
api:
  env: "staging"
  http_port: "7070"
postgres:
  url: "postgres://yaml_user:yaml_pass@localhost:5432/yamldb"
  max_conns: 30
  min_conns: 3
redis:
  url: "redis://localhost:6380"
jwt:
  secret: "yaml_secret"
  ttl: "12h"
`
	f, err := os.CreateTemp("", "config_test_*.yaml")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(f.Name())
	if _, err := f.WriteString(content); err != nil {
		t.Fatalf("failed to write temp file: %v", err)
	}
	f.Close()

	t.Setenv("CONFIG_PATH", f.Name())

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if cfg.Api.Env != "staging" {
		t.Errorf("expected Api.Env = %q, got %q", "staging", cfg.Api.Env)
	}
	if cfg.Api.HTTPPort != "7070" {
		t.Errorf("expected Api.HTTPPort = %q, got %q", "7070", cfg.Api.HTTPPort)
	}
	if cfg.Postgres.URL != "postgres://yaml_user:yaml_pass@localhost:5432/yamldb" {
		t.Errorf("unexpected Postgres.URL: %q", cfg.Postgres.URL)
	}
	if cfg.Postgres.MaxConns != 30 {
		t.Errorf("expected Postgres.MaxConns = 30, got %d", cfg.Postgres.MaxConns)
	}
	if cfg.Postgres.MinConns != 3 {
		t.Errorf("expected Postgres.MinConns = 3, got %d", cfg.Postgres.MinConns)
	}
	if cfg.Redis.URL != "redis://localhost:6380" {
		t.Errorf("unexpected Redis.URL: %q", cfg.Redis.URL)
	}
	if cfg.JWT.Secret != "yaml_secret" {
		t.Errorf("expected JWT.Secret = %q, got %q", "yaml_secret", cfg.JWT.Secret)
	}
	if cfg.JWT.TTL != 12*time.Hour {
		t.Errorf("expected JWT.TTL = 12h, got %v", cfg.JWT.TTL)
	}
}

// TestLoad_YAMLFile_MissingRequiredField — yaml без обязательного поля postgres.url.
func TestLoad_YAMLFile_MissingRequiredField(t *testing.T) {
	clearConfigEnv(t)

	content := `
api:
  env: "development"
redis:
  url: "redis://localhost:6379"
`
	f, err := os.CreateTemp("", "config_test_*.yaml")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(f.Name())
	if _, err := f.WriteString(content); err != nil {
		t.Fatalf("failed to write temp file: %v", err)
	}
	f.Close()

	t.Setenv("CONFIG_PATH", f.Name())

	_, err = Load()
	if err == nil {
		t.Fatal("expected error for missing postgres.url in yaml, got nil")
	}
}

// TestLoad_YAMLFile_InvalidYAML — невалидный yaml должен вернуть ошибку.
func TestLoad_YAMLFile_InvalidYAML(t *testing.T) {
	clearConfigEnv(t)

	f, err := os.CreateTemp("", "config_test_*.yaml")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(f.Name())
	if _, err := f.WriteString(": invalid: [yaml"); err != nil {
		t.Fatalf("failed to write temp file: %v", err)
	}
	f.Close()

	t.Setenv("CONFIG_PATH", f.Name())

	_, err = Load()
	if err == nil {
		t.Fatal("expected error for invalid yaml, got nil")
	}
}

// TestLoad_YAMLFile_EnvOverridesYAML — переменные окружения перекрывают значения из yaml.
func TestLoad_YAMLFile_EnvOverridesYAML(t *testing.T) {
	clearConfigEnv(t)

	content := `
api:
  env: "development"
  http_port: "8080"
postgres:
  url: "postgres://yaml_user:yaml_pass@localhost:5432/yamldb"
redis:
  url: "redis://localhost:6379"
`
	f, err := os.CreateTemp("", "config_test_*.yaml")
	if err != nil {
		t.Fatalf("failed to create temp file: %v", err)
	}
	defer os.Remove(f.Name())
	if _, err := f.WriteString(content); err != nil {
		t.Fatalf("failed to write temp file: %v", err)
	}
	f.Close()

	t.Setenv("CONFIG_PATH", f.Name())
	t.Setenv("APP_ENV", "production")
	t.Setenv("API_PORT", "9999")

	cfg, err := Load()
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}
	if cfg.Api.Env != "production" {
		t.Errorf("expected env overridden to %q, got %q", "production", cfg.Api.Env)
	}
	if cfg.Api.HTTPPort != "9999" {
		t.Errorf("expected port overridden to %q, got %q", "9999", cfg.Api.HTTPPort)
	}
}

// TestLoad_ConfigPath_DefaultFallback — если CONFIG_PATH не задан, используется config.yaml.
// Тест проверяет, что функция не паникует и возвращает либо конфиг, либо ошибку (не панику).
func TestLoad_ConfigPath_DefaultFallback(t *testing.T) {
	clearConfigEnv(t)
	// CONFIG_PATH не задан — Load должен попробовать config.yaml из рабочей директории
	// В тестовом окружении файл может существовать или нет — оба исхода допустимы.
	_, _ = Load()
}
