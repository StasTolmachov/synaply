package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"synaply_v2/internal/models"
	"synaply_v2/internal/utils"
	"synaply_v2/slogger"
)

type UserCtxKey struct{}

func AuthMidleware(secret string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			parts := strings.SplitN(authHeader, " ", 2)
			if !(len(parts) == 2 && parts[0] == "Bearer") {
				http.Error(w, "Invalid Authorization header", http.StatusUnauthorized)
				return
			}

			tokenString := parts[1]
			claims, err := utils.ParseToken(tokenString, secret)
			if err != nil {
				http.Error(w, "Invalid token", http.StatusUnauthorized)
				slogger.Log.DebugContext(r.Context(), "Token parse error", "err", err)
				return
			}
			id, err := uuid.Parse(claims.UserID)
			if err != nil {
				http.Error(w, "Failed to parse user Slug", http.StatusInternalServerError)
				slogger.Log.ErrorContext(r.Context(), "Failed to parse user Slug", "err", err)
				return
			}
			userCtx := &models.User{
				ID:   id,
				Role: models.UserRole(claims.Role),
			}

			ctx := context.WithValue(r.Context(), UserCtxKey{}, userCtx)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserFromContext safely extracts user from context
func GetUserFromContext(ctx context.Context) (*models.User, error) {
	user, ok := ctx.Value(UserCtxKey{}).(*models.User)
	if !ok {
		return nil, errors.New("user not found in context")
	}
	return user, nil
}

func AdminOnly(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := GetUserFromContext(r.Context())
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		if user.Role != models.RoleAdmin {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}
