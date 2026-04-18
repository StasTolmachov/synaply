package middleware

import (
	"context"
	"log/slog"
	"net/http"
	"time"

	"github.com/google/uuid"

	"synaply/slogger"
)

type responseWriter struct {
	http.ResponseWriter
	status      int
	wroteHeader bool
}

func wrapResponseWriter(w http.ResponseWriter) *responseWriter {
	return &responseWriter{ResponseWriter: w, status: http.StatusOK}
}

func (rw *responseWriter) WriteHeader(code int) {
	if rw.wroteHeader {
		return
	}
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
	rw.wroteHeader = true
}

// RequestLogger returns a middleware function that logs HTTP requests, including method, path, status, and duration.
func RequestLogger() func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()

			requestID := r.Header.Get("X-Request-ID")
			if requestID == "" {
				requestID = uuid.NewString()
			}

			w.Header().Set("X-Request-ID", requestID)

			ctx := context.WithValue(r.Context(), slogger.RequestIDKey, requestID)

			wrapped := wrapResponseWriter(w)
			next.ServeHTTP(wrapped, r.WithContext(ctx))

			durationMs := time.Since(start).Milliseconds()

			slog.InfoContext(ctx, "HTTP Request",
				slog.String(slogger.KeyMethod, r.Method),
				slog.String(slogger.KeyPath, r.URL.Path),
				slog.Int(slogger.KeyStatusCode, wrapped.status),
				slog.Int64(slogger.KeyDuration, durationMs),
				slog.String(slogger.KeyClientIP, r.RemoteAddr),
				slog.String(slogger.KeyUserAgent, r.UserAgent()),
			)
		})
	}
}
