package middleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"

	"wordsGo_v2/slogger"
)

var userID uuid.UUID

func AuthMidleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		userID, _ := uuid.Parse("22c31c05-11c8-4098-a86e-d6fada2ab797")

		ctx := context.WithValue(r.Context(), slogger.UserIDKey, userID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
