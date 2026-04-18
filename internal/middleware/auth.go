package middleware

import (
	"context"
	"errors"
	"net/http"
	"strings"

	"github.com/google/uuid"

	"synaply/internal/auth"
	"synaply/internal/models"
	"synaply/internal/utils"
)

type UserCtxKey struct{}

// GetUserFromContext safely extracts user from context
func GetUserFromContext(ctx context.Context) (*models.User, error) {
	user, ok := ctx.Value(UserCtxKey{}).(*models.User)
	if !ok {
		return nil, errors.New("user not found in context")
	}
	return user, nil
}

// AdminOnly is middleware that restricts access to routes for users with an admin role.
// It checks the user's role from the context and returns a 403 Forbidden response if the role is not admin.
// If no user is found in the context, it returns a 401 Unauthorized response.
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

// AuthMiddleware is an HTTP middleware that authenticates and authorizes requests using a TokenMaker.
// It extracts the Authorization header, validates the Bearer token, and sets the user context for downstream handlers.
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
			userCtx := &models.User{
				ID:   id,
				Role: models.Role(claims.Role),
			}

			ctx := context.WithValue(r.Context(), UserCtxKey{}, userCtx)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
