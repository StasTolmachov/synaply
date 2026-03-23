package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"

	"synaply_v2/slogger"
)

func LoggerMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = uuid.NewString()
		}
		ctx := context.WithValue(r.Context(), slogger.RequestIDKey, requestID)

		w.Header().Set("X-Request-ID", requestID)
		slogger.Log.InfoContext(ctx, "incoming request", "method", r.Method, "path", r.URL.Path, "request_id", requestID)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
