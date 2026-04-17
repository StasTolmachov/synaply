package middleware

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"synaply/internal/auth"
	"synaply/internal/models"
)

// --- Helpers ---

// mockTokenMaker позволяет управлять поведением ParseToken в тестах.
type mockTokenMaker struct {
	claims *auth.CustomClaims
	err    error
}

func (m *mockTokenMaker) GenerateToken(_ uuid.UUID, _ string) (string, error) {
	return "mock-token", nil
}

func (m *mockTokenMaker) ParseToken(_ string) (*auth.CustomClaims, error) {
	return m.claims, m.err
}

// okHandler — следующий обработчик, который должен быть вызван при успехе.
var okHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
})

// jsonError декодирует тело ответа в структуру ошибки.
func jsonError(t *testing.T, body string) string {
	t.Helper()
	var resp struct {
		Error string `json:"error"`
	}
	require.NoError(t, json.Unmarshal([]byte(body), &resp))
	return resp.Error
}

// =============================================================================
// GetUserFromContext
// =============================================================================

func TestGetUserFromContext(t *testing.T) {
	t.Parallel()

	t.Run("UserPresent", func(t *testing.T) {
		t.Parallel()
		user := &models.User{ID: uuid.New(), Role: models.RoleUser}
		ctx := context.WithValue(context.Background(), UserCtxKey{}, user)

		got, err := GetUserFromContext(ctx)
		require.NoError(t, err)
		assert.Equal(t, user, got)
	})

	t.Run("UserAbsent", func(t *testing.T) {
		t.Parallel()
		got, err := GetUserFromContext(context.Background())
		assert.Nil(t, got)
		assert.EqualError(t, err, "user not found in context")
	})

	t.Run("WrongTypeInContext", func(t *testing.T) {
		t.Parallel()
		// Кладём строку вместо *models.User — type assertion должен провалиться.
		ctx := context.WithValue(context.Background(), UserCtxKey{}, "not-a-user")
		got, err := GetUserFromContext(ctx)
		assert.Nil(t, got)
		assert.EqualError(t, err, "user not found in context")
	})
}

// =============================================================================
// AdminOnly
// =============================================================================

func TestAdminOnly(t *testing.T) {
	t.Parallel()

	handler := AdminOnly(okHandler)

	t.Run("AdminPasses", func(t *testing.T) {
		t.Parallel()
		user := &models.User{ID: uuid.New(), Role: models.RoleAdmin}
		ctx := context.WithValue(context.Background(), UserCtxKey{}, user)

		req := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(ctx)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
	})

	t.Run("RegularUserForbidden", func(t *testing.T) {
		t.Parallel()
		user := &models.User{ID: uuid.New(), Role: models.RoleUser}
		ctx := context.WithValue(context.Background(), UserCtxKey{}, user)

		req := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(ctx)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusForbidden, rr.Code)
	})

	t.Run("ModeratorForbidden", func(t *testing.T) {
		t.Parallel()
		user := &models.User{ID: uuid.New(), Role: models.RoleModerator}
		ctx := context.WithValue(context.Background(), UserCtxKey{}, user)

		req := httptest.NewRequest(http.MethodGet, "/", nil).WithContext(ctx)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusForbidden, rr.Code)
	})

	t.Run("NoUserInContextUnauthorized", func(t *testing.T) {
		t.Parallel()
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusUnauthorized, rr.Code)
	})
}

// =============================================================================
// AuthMiddleware
// =============================================================================

func TestAuthMiddleware(t *testing.T) {
	t.Parallel()

	validUserID := uuid.New()
	validClaims := &auth.CustomClaims{
		UserID: validUserID.String(),
		Role:   string(models.RoleUser),
	}

	// nextHandler дополнительно проверяет, что user корректно попал в контекст.
	nextWithUserCheck := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, err := GetUserFromContext(r.Context())
		require.NoError(t, err)
		assert.Equal(t, validUserID, user.ID)
		assert.Equal(t, models.RoleUser, user.Role)
		w.WriteHeader(http.StatusOK)
	})

	t.Run("ValidBearerToken_SetsUserInContext", func(t *testing.T) {
		t.Parallel()
		tm := &mockTokenMaker{claims: validClaims}
		handler := AuthMiddleware(tm)(nextWithUserCheck)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "Bearer valid-token")
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
	})

	t.Run("MissingAuthorizationHeader", func(t *testing.T) {
		t.Parallel()
		tm := &mockTokenMaker{claims: validClaims}
		handler := AuthMiddleware(tm)(okHandler)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusUnauthorized, rr.Code)
		assert.Equal(t, "Unauthorized", jsonError(t, rr.Body.String()))
	})

	t.Run("EmptyAuthorizationHeader", func(t *testing.T) {
		t.Parallel()
		tm := &mockTokenMaker{claims: validClaims}
		handler := AuthMiddleware(tm)(okHandler)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "")
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusUnauthorized, rr.Code)
		assert.Equal(t, "Unauthorized", jsonError(t, rr.Body.String()))
	})

	t.Run("MissingBearerPrefix", func(t *testing.T) {
		t.Parallel()
		tm := &mockTokenMaker{claims: validClaims}
		handler := AuthMiddleware(tm)(okHandler)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "valid-token")
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusUnauthorized, rr.Code)
		assert.Equal(t, "Invalid Authorization header", jsonError(t, rr.Body.String()))
	})

	t.Run("WrongScheme_Basic", func(t *testing.T) {
		t.Parallel()
		tm := &mockTokenMaker{claims: validClaims}
		handler := AuthMiddleware(tm)(okHandler)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "Basic dXNlcjpwYXNz")
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusUnauthorized, rr.Code)
		assert.Equal(t, "Invalid Authorization header", jsonError(t, rr.Body.String()))
	})

	t.Run("BearerWithoutToken", func(t *testing.T) {
		t.Parallel()
		tm := &mockTokenMaker{claims: validClaims}
		handler := AuthMiddleware(tm)(okHandler)

		// "Bearer " — есть пробел, но токен пустой; ParseToken вернёт ошибку.
		tm.err = errors.New("invalid token")
		tm.claims = nil

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "Bearer ")
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusUnauthorized, rr.Code)
		assert.Equal(t, "Invalid token", jsonError(t, rr.Body.String()))
	})

	t.Run("InvalidToken_ParseError", func(t *testing.T) {
		t.Parallel()
		tm := &mockTokenMaker{err: errors.New("token is expired")}
		handler := AuthMiddleware(tm)(okHandler)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "Bearer expired-token")
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusUnauthorized, rr.Code)
		assert.Equal(t, "Invalid token", jsonError(t, rr.Body.String()))
	})

	t.Run("InvalidUserID_NotUUID", func(t *testing.T) {
		t.Parallel()
		badClaims := &auth.CustomClaims{
			UserID: "not-a-uuid",
			Role:   string(models.RoleUser),
		}
		tm := &mockTokenMaker{claims: badClaims}
		handler := AuthMiddleware(tm)(okHandler)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "Bearer some-token")
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusInternalServerError, rr.Code)
		assert.Equal(t, "Failed to parse user Slug", jsonError(t, rr.Body.String()))
	})

	t.Run("AdminRolePreservedInContext", func(t *testing.T) {
		t.Parallel()
		adminID := uuid.New()
		adminClaims := &auth.CustomClaims{
			UserID: adminID.String(),
			Role:   string(models.RoleAdmin),
		}
		tm := &mockTokenMaker{claims: adminClaims}

		nextCheck := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			user, err := GetUserFromContext(r.Context())
			require.NoError(t, err)
			assert.Equal(t, models.RoleAdmin, user.Role)
			w.WriteHeader(http.StatusOK)
		})

		handler := AuthMiddleware(tm)(nextCheck)
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "Bearer admin-token")
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.Equal(t, http.StatusOK, rr.Code)
	})

	t.Run("NextHandlerNotCalledOnError", func(t *testing.T) {
		t.Parallel()
		tm := &mockTokenMaker{err: errors.New("bad token")}
		called := false
		next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			called = true
		})
		handler := AuthMiddleware(tm)(next)

		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Authorization", "Bearer bad")
		rr := httptest.NewRecorder()
		handler.ServeHTTP(rr, req)

		assert.False(t, called, "next handler не должен вызываться при ошибке токена")
	})
}

// =============================================================================
// AuthMiddleware + AdminOnly (интеграционный сценарий)
// =============================================================================

func TestAuthMiddleware_WithAdminOnly_Integration(t *testing.T) {
	t.Parallel()

	manager := auth.NewJWTManager("integration-secret", time.Minute)

	adminID := uuid.New()
	userID := uuid.New()

	adminToken, err := manager.GenerateToken(adminID, string(models.RoleAdmin))
	require.NoError(t, err)

	userToken, err := manager.GenerateToken(userID, string(models.RoleUser))
	require.NoError(t, err)

	handler := AuthMiddleware(manager)(AdminOnly(okHandler))

	tests := []struct {
		name           string
		token          string
		expectedStatus int
	}{
		{"AdminTokenAllowed", adminToken, http.StatusOK},
		{"UserTokenForbidden", userToken, http.StatusForbidden},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			req := httptest.NewRequest(http.MethodGet, "/admin", nil)
			req.Header.Set("Authorization", "Bearer "+tt.token)
			rr := httptest.NewRecorder()
			handler.ServeHTTP(rr, req)
			assert.Equal(t, tt.expectedStatus, rr.Code)
		})
	}
}
