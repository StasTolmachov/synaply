package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
)

func TestJWTManager(t *testing.T) {
	t.Parallel()

	secretKey := "super_secret_key"
	ttl := time.Minute
	manager := NewJWTManager(secretKey, ttl)

	userID := uuid.New()
	role := "admin"

	t.Run("GenerateAndParseSuccess", func(t *testing.T) {
		token, err := manager.GenerateToken(userID, role)
		require.NoError(t, err)
		require.NotEmpty(t, token)

		claims, err := manager.ParseToken(token)
		require.NoError(t, err)
		require.NotNil(t, claims)

		require.Equal(t, userID.String(), claims.UserID)
		require.Equal(t, role, claims.Role)
		require.WithinDuration(t, time.Now().Add(ttl), claims.ExpiresAt.Time, 5*time.Second)
		require.WithinDuration(t, time.Now(), claims.IssuedAt.Time, 5*time.Second)
	})

	t.Run("ExpiredToken", func(t *testing.T) {
		expiredManager := NewJWTManager(secretKey, -time.Second)
		token, err := expiredManager.GenerateToken(userID, role)
		require.NoError(t, err)
		require.NotEmpty(t, token)

		claims, err := manager.ParseToken(token)
		require.Error(t, err)
		require.ErrorIs(t, err, jwt.ErrTokenExpired)
		require.Nil(t, claims)
	})

	t.Run("InvalidSigningAlgorithm", func(t *testing.T) {
		claims := CustomClaims{
			UserID: userID.String(),
			Role:   role,
			RegisteredClaims: jwt.RegisteredClaims{
				ExpiresAt: jwt.NewNumericDate(time.Now().Add(ttl)),
				IssuedAt:  jwt.NewNumericDate(time.Now()),
			},
		}

		// Use None signing method which is definitely NOT HMAC
		token := jwt.NewWithClaims(jwt.SigningMethodNone, claims)
		tokenString, err := token.SignedString(jwt.UnsafeAllowNoneSignatureType)
		require.NoError(t, err)

		claimsParsed, err := manager.ParseToken(tokenString)
		require.Error(t, err)
		require.Contains(t, err.Error(), "unexpected signing method")
		require.Nil(t, claimsParsed)
	})

	t.Run("TamperedToken", func(t *testing.T) {
		token, err := manager.GenerateToken(userID, role)
		require.NoError(t, err)

		// Modify the signature part of the token
		tamperedToken := token + "abc"

		claims, err := manager.ParseToken(tamperedToken)
		require.Error(t, err)
		require.Contains(t, err.Error(), "signature is invalid")
		require.Nil(t, claims)
	})

	t.Run("IncorrectSecretKey", func(t *testing.T) {
		token, err := manager.GenerateToken(userID, role)
		require.NoError(t, err)

		otherManager := NewJWTManager("wrong_secret", ttl)
		claims, err := otherManager.ParseToken(token)
		require.Error(t, err)
		require.Contains(t, err.Error(), "signature is invalid")
		require.Nil(t, claims)
	})

	t.Run("InvalidTokenFormat", func(t *testing.T) {
		claims, err := manager.ParseToken("this.is.not.a.token")
		require.Error(t, err)
		require.Nil(t, claims)
	})
}
