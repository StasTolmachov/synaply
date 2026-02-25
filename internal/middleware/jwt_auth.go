package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"

	"wordsGo_v2/slogger"
)

var userID uuid.UUID = uuid.New()

func AuthMidleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := context.WithValue(r.Context(), slogger.UserIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
