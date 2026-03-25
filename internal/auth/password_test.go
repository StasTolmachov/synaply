package auth

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		isValid  bool
	}{
		{"Valid Password", "StrongPass1!", true},
		{"Too Short", "Weak1!", false},
		{"No Uppercase", "weakpass1!", false},
		{"No Lowercase", "WEAKPASS1!", false},
		{"No Digit", "WeakPass!", false},
		{"No Special Char", "WeakPass1", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ValidatePassword(tt.password)
			if tt.isValid {
				assert.NoError(t, err)
			} else {
				assert.Error(t, err)
			}
		})
	}
}

func TestHashAndComparePasswords(t *testing.T) {
	password := "SecretPass123!"

	// 1. Hashing test
	hash, err := HashPassword(password)
	assert.NoError(t, err)
	assert.NotEmpty(t, hash)
	assert.NotEqual(t, password, hash)

	// 2. Comparison test (success)
	match := ComparePasswords(hash, password)
	assert.True(t, match, "Password should match hash")

	// 3. Comparison test (failure)
	match = ComparePasswords(hash, "WrongPass")
	assert.False(t, match, "Wrong password should not match hash")
}
