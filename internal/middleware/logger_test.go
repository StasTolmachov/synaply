package middleware

import (
	"bytes"
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"synaply/slogger"
)

func setupTestLogger(buf *bytes.Buffer) {
	handler := slog.NewJSONHandler(buf, nil)
	slog.SetDefault(slog.New(slogger.ContextHandler{Handler: handler}))
}

func parseLastLog(t *testing.T, buf *bytes.Buffer) map[string]interface{} {
	t.Helper()
	lines := strings.Split(strings.TrimSpace(buf.String()), "\n")
	last := lines[len(lines)-1]
	var out map[string]interface{}
	if err := json.Unmarshal([]byte(last), &out); err != nil {
		t.Fatalf("Failed to parse log JSON: %v\nraw: %s", err, last)
	}
	return out
}

func TestRequestLogger_SetsRequestIDHeader(t *testing.T) {
	var buf bytes.Buffer
	setupTestLogger(&buf)

	handler := RequestLogger()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Header().Get("X-Request-ID") == "" {
		t.Error("Expected X-Request-ID header to be set in response")
	}
}

func TestRequestLogger_PreservesIncomingRequestID(t *testing.T) {
	var buf bytes.Buffer
	setupTestLogger(&buf)

	const clientRequestID = "client-provided-id-123"

	handler := RequestLogger()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	req.Header.Set("X-Request-ID", clientRequestID)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if got := rec.Header().Get("X-Request-ID"); got != clientRequestID {
		t.Errorf("Expected X-Request-ID = %q, got %q", clientRequestID, got)
	}
}

func TestRequestLogger_InjectsRequestIDIntoContext(t *testing.T) {
	var buf bytes.Buffer
	setupTestLogger(&buf)

	var capturedID string
	handler := RequestLogger()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		capturedID, _ = r.Context().Value(slogger.RequestIDKey).(string)
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if capturedID == "" {
		t.Error("Expected RequestIDKey to be set in context")
	}
}

func TestRequestLogger_LogsHTTPFields(t *testing.T) {
	var buf bytes.Buffer
	setupTestLogger(&buf)

	handler := RequestLogger()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusCreated)
	}))

	req := httptest.NewRequest(http.MethodPost, "/api/v1/users", nil)
	req.Header.Set("User-Agent", "TestAgent/1.0")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	log := parseLastLog(t, &buf)

	checks := map[string]string{
		slogger.KeyMethod:    http.MethodPost,
		slogger.KeyPath:      "/api/v1/users",
		slogger.KeyUserAgent: "TestAgent/1.0",
	}
	for key, want := range checks {
		if got, ok := log[key].(string); !ok || got != want {
			t.Errorf("log[%q] = %v, want %q", key, log[key], want)
		}
	}

	if _, ok := log[slogger.KeyStatusCode]; !ok {
		t.Errorf("Expected log field %q to be present", slogger.KeyStatusCode)
	}
	if _, ok := log[slogger.KeyDuration]; !ok {
		t.Errorf("Expected log field %q to be present", slogger.KeyDuration)
	}
	if _, ok := log[slogger.KeyClientIP]; !ok {
		t.Errorf("Expected log field %q to be present", slogger.KeyClientIP)
	}
}

func TestRequestLogger_LogsCorrectStatusCode(t *testing.T) {
	cases := []struct {
		name   string
		status int
	}{
		{"200 OK", http.StatusOK},
		{"201 Created", http.StatusCreated},
		{"400 Bad Request", http.StatusBadRequest},
		{"404 Not Found", http.StatusNotFound},
		{"500 Internal Server Error", http.StatusInternalServerError},
	}

	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			var buf bytes.Buffer
			setupTestLogger(&buf)

			handler := RequestLogger()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(tc.status)
			}))

			req := httptest.NewRequest(http.MethodGet, "/", nil)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			log := parseLastLog(t, &buf)

			if got, ok := log[slogger.KeyStatusCode].(float64); !ok || int(got) != tc.status {
				t.Errorf("Expected status_code = %d, got %v", tc.status, log[slogger.KeyStatusCode])
			}
		})
	}
}

func TestRequestLogger_DefaultStatus200(t *testing.T) {
	var buf bytes.Buffer
	setupTestLogger(&buf)

	handler := RequestLogger()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	log := parseLastLog(t, &buf)

	if got, ok := log[slogger.KeyStatusCode].(float64); !ok || int(got) != http.StatusOK {
		t.Errorf("Expected default status_code = 200, got %v", log[slogger.KeyStatusCode])
	}
}

func TestRequestLogger_LogsRequestIDInLog(t *testing.T) {
	var buf bytes.Buffer
	setupTestLogger(&buf)

	const clientRequestID = "trace-abc-456"

	handler := RequestLogger()(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	req.Header.Set("X-Request-ID", clientRequestID)
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	log := parseLastLog(t, &buf)

	if got, ok := log[slogger.KeyRequestID].(string); !ok || got != clientRequestID {
		t.Errorf("Expected log[%q] = %q, got %v", slogger.KeyRequestID, clientRequestID, log[slogger.KeyRequestID])
	}
}

func TestResponseWriter_WriteHeaderIdempotent(t *testing.T) {
	rec := httptest.NewRecorder()
	rw := wrapResponseWriter(rec)

	rw.WriteHeader(http.StatusCreated)
	rw.WriteHeader(http.StatusInternalServerError)

	if rw.status != http.StatusCreated {
		t.Errorf("Expected status = 201 after double WriteHeader, got %d", rw.status)
	}
}
