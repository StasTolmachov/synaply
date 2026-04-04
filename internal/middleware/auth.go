package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"synaply/internal/auth"
	"synaply/internal/users"
	"synaply/internal/utils"
)

type UserCtxKey struct{}

// GetUserFromContext safely extracts user from context
func GetUserFromContext(ctx context.Context) (*users.User, error) {
	user, ok := ctx.Value(UserCtxKey{}).(*users.User)
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

		if user.Role != users.RoleAdmin {
			http.Error(w, "Forbidden", http.StatusForbidden)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func AuthMiddleware(tm auth.TokenMaker) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				utils.WriteError(w, http.StatusUnauthorized, "Unauthorized")
				return
			}
			parts := strings.SplitN(authHeader, " ", 2)
			if !(len(parts) == 2 && parts[0] == "Bearer") {
				utils.WriteError(w, http.StatusUnauthorized, "Invalid Authorization header")
				return
			}

			tokenString := parts[1]
			claims, err := tm.ParseToken(tokenString)
			if err != nil {
				utils.WriteError(w, http.StatusUnauthorized, "Invalid token")
				return
			}
			id, err := uuid.Parse(claims.UserID)
			if err != nil {
				utils.WriteError(w, http.StatusInternalServerError, "Failed to parse user Slug")
				return
			}
			userCtx := &users.User{
				ID:   id,
				Role: users.Role(claims.Role),
			}

			ctx := context.WithValue(r.Context(), UserCtxKey{}, userCtx)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
