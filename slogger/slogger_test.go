package slogger

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"log/slog"
	"strings"
	"testing"

	"github.com/google/uuid"
)

func TestIsPII(t *testing.T) {
	tests := []struct {
		name     string
		key      string
		expected bool
	}{
		{"Exact match email", "email", true},
		{"Substring match", "user_email", true},
		{"Password match", "password", true},
		{"Token match", "auth_token", true},
		{"API Secret match", "stripe_secret", true},
		{"Invite code", "invite_link", true},
		{"Safe key user_id", "user_id", false},
		{"Safe key request_id", "request_id", false},
		{"Case insensitive match", "EMAIL", true},
		{"Safe random field", "status", false},
		{"Code substring", "promo_code", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := isPII(tt.key); got != tt.expected {
				t.Errorf("isPII(%q) = %v, want %v", tt.key, got, tt.expected)
			}
		})
	}
}

func TestReplacePIIAttr(t *testing.T) {
	unsafeAttr := slog.String("user_email", "admin@synaply.no")
	replaced := replacePIIAttr(nil, unsafeAttr)
	if replaced.Value.String() != maskedValue {
		t.Errorf("Expected PII to be replaced with %q, got %q", maskedValue, replaced.Value.String())
	}

	safeAttr := slog.String("user_id", "12345")
	safeReplaced := replacePIIAttr(nil, safeAttr)
	if safeReplaced.Value.String() != "12345" {
		t.Errorf("Expected safe value to remain untouched, got %q", safeReplaced.Value.String())
	}
}

func TestContextHandler(t *testing.T) {
	var buf bytes.Buffer
	baseHandler := slog.NewJSONHandler(&buf, nil)

	ctxHandler := ContextHandler{Handler: baseHandler}
	logger := slog.New(ctxHandler)

	reqID := "req-1234-abcd"
	uID := uuid.New()

	ctx := context.WithValue(context.Background(), RequestIDKey, reqID)
	ctx = context.WithValue(ctx, UserIDKey, uID)

	logger.InfoContext(ctx, "test message")

	var logOutput map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &logOutput); err != nil {
		t.Fatalf("Failed to parse JSON log: %v", err)
	}

	if logOutput[KeyRequestID] != reqID {
		t.Errorf("Expected %s = %q, got %v", KeyRequestID, reqID, logOutput[KeyRequestID])
	}

	if logOutput[KeyUserID] != uID.String() {
		t.Errorf("Expected %s = %q, got %v", KeyUserID, uID.String(), logOutput[KeyUserID])
	}
}

func TestProductionLoggerMasking(t *testing.T) {
	var buf bytes.Buffer

	opts := slog.HandlerOptions{
		ReplaceAttr: replacePIIAttr,
	}
	baseHandler := slog.NewJSONHandler(&buf, &opts)
	logger := slog.New(ContextHandler{Handler: baseHandler})

	logger.Info("login attempt",
		slog.String("email", "hacker@test.com"),
		slog.String("password", "qwerty12345"),
		slog.String("status", "failed"),
	)

	var logOutput map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &logOutput); err != nil {
		t.Fatalf("Failed to parse JSON log: %v", err)
	}

	if logOutput["email"] != maskedValue {
		t.Errorf("Expected email to be masked, got %v", logOutput["email"])
	}
	if logOutput["password"] != maskedValue {
		t.Errorf("Expected password to be masked, got %v", logOutput["password"])
	}

	if logOutput["status"] != "failed" {
		t.Errorf("Expected status to be 'failed', got %v", logOutput["status"])
	}
}

func TestMaskPII(t *testing.T) {
	if got := maskPII("password", "supersecret"); got != maskedValue {
		t.Errorf("Expected PII to be masked, got %v", got)
	}

	if got := maskPII("user_id", "12345"); got != "12345" {
		t.Errorf("Expected safe value to remain untouched, got %v", got)
	}
}

func TestContextHandler_EmptyContext(t *testing.T) {
	var buf bytes.Buffer
	baseHandler := slog.NewJSONHandler(&buf, nil)
	logger := slog.New(ContextHandler{Handler: baseHandler})

	logger.InfoContext(context.Background(), "empty context test")

	var logOutput map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &logOutput); err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}

	if _, exists := logOutput[KeyRequestID]; exists {
		t.Errorf("Did not expect %s to be present", KeyRequestID)
	}
	if _, exists := logOutput[KeyUserID]; exists {
		t.Errorf("Did not expect %s to be present", KeyUserID)
	}
}

func TestContextHandler_NilUUID(t *testing.T) {
	var buf bytes.Buffer
	baseHandler := slog.NewJSONHandler(&buf, nil)
	logger := slog.New(ContextHandler{Handler: baseHandler})

	ctx := context.WithValue(context.Background(), UserIDKey, uuid.Nil)
	logger.InfoContext(ctx, "nil uuid test")

	var logOutput map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &logOutput); err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}

	if _, exists := logOutput[KeyUserID]; exists {
		t.Errorf("Did not expect %s to be present for uuid.Nil", KeyUserID)
	}
}

func TestPrettyHandler_NoPanic(t *testing.T) {
	var buf bytes.Buffer

	opts := PrettyHandlerOptions{SlogOpts: slog.HandlerOptions{Level: slog.LevelDebug}}
	handler := NewPrettyHandler(&buf, opts)
	logger := slog.New(ContextHandler{Handler: handler})

	logger.Info("pretty test", slog.String("email", "test@test.com"), slog.Int("count", 42))

	output := buf.String()
	if !strings.Contains(output, "pretty test") {
		t.Errorf("Expected output to contain log message")
	}
	if !strings.Contains(output, maskedValue) {
		t.Errorf("Expected PrettyHandler to mask PII, output: %s", output)
	}
}

func TestMakeLogger(t *testing.T) {
	MakeLogger("development")
	if Log == nil {
		t.Fatal("Expected Log to be initialized in development mode")
	}

	var buf bytes.Buffer
	opts := slog.HandlerOptions{ReplaceAttr: replacePIIAttr}
	baseHandler := slog.NewJSONHandler(&buf, &opts)
	prodLogger := slog.New(ContextHandler{Handler: baseHandler})

	prodLogger.Info("test", slog.String("email", "user@synaply.no"))

	var out map[string]interface{}
	if err := json.Unmarshal(buf.Bytes(), &out); err != nil {
		t.Fatalf("Failed to parse JSON: %v", err)
	}
	if out["email"] != maskedValue {
		t.Errorf("Expected email masked in production, got %v", out["email"])
	}
}

func TestPrettyHandler_AllLevels(t *testing.T) {
	levels := []struct {
		name string
		fn   func(logger *slog.Logger, msg string)
	}{
		{"Debug", func(l *slog.Logger, msg string) { l.Debug(msg) }},
		{"Warn", func(l *slog.Logger, msg string) { l.Warn(msg) }},
		{"Error", func(l *slog.Logger, msg string) { l.Error(msg) }},
	}

	for _, lvl := range levels {
		t.Run(lvl.name, func(t *testing.T) {
			var buf bytes.Buffer
			opts := PrettyHandlerOptions{SlogOpts: slog.HandlerOptions{Level: slog.LevelDebug}}
			handler := NewPrettyHandler(&buf, opts)
			logger := slog.New(ContextHandler{Handler: handler})

			lvl.fn(logger, "level test message")

			if !strings.Contains(buf.String(), "level test message") {
				t.Errorf("Expected output to contain message for level %s", lvl.name)
			}
		})
	}
}

func TestPrettyHandler_ErrorAttr(t *testing.T) {
	var buf bytes.Buffer
	opts := PrettyHandlerOptions{SlogOpts: slog.HandlerOptions{Level: slog.LevelDebug}}
	handler := NewPrettyHandler(&buf, opts)
	logger := slog.New(ContextHandler{Handler: handler})

	logger.Error("db failed", slog.Any("error", errors.New("connection refused")))

	output := buf.String()
	if !strings.Contains(output, "connection refused") {
		t.Errorf("Expected error message in output, got: %s", output)
	}
}
