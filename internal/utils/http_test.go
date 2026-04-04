package utils

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJSONResponse(t *testing.T) {
	t.Run("Success", func(t *testing.T) {
		// Подготовка данных
		w := httptest.NewRecorder()
		statusCode := http.StatusOK
		payload := map[string]string{"message": "success"}

		// Вызов функции
		JSONResponse(w, statusCode, payload)

		// Проверка результатов
		assert.Equal(t, statusCode, w.Code)
		assert.Equal(t, "application/json; charset=utf-8", w.Header().Get("Content-Type"))

		var response map[string]string
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, payload, response)
	})

	t.Run("Created status code", func(t *testing.T) {
		w := httptest.NewRecorder()
		statusCode := http.StatusCreated
		payload := JSONError{Error: "resource created"}

		JSONResponse(w, statusCode, payload)

		assert.Equal(t, statusCode, w.Code)
		assert.Contains(t, w.Body.String(), `"error":"resource created"`)
	})

	t.Run("Encoding error", func(t *testing.T) {
		// В Go каналы нельзя сериализовать в JSON, что вызовет ошибку в json.NewEncoder(w).Encode(payload)
		w := httptest.NewRecorder()
		statusCode := http.StatusOK
		payload := make(chan int)

		JSONResponse(w, statusCode, payload)

		// Когда Encode возвращает ошибку, вызывается http.Error(w, ..., http.StatusInternalServerError)
		// Обратите внимание: Header и WriteHeader(statusCode) уже были вызваны до ошибки Encode.
		// Однако http.Error перезаписывает Content-Type на "text/plain; charset=utf-8" и статус-код, если он еще не зафиксирован.
		// В реализации JSONResponse WriteHeader(statusCode) вызывается ДО Encode, поэтому статус-код останется тем, который передали (в данном случае 200),
		// но http.Error попытается отправить 500. В стандартном ResponseRecorder это может привести к предупреждению "superfluous response.WriteHeader call".

		// Проверяем, что в теле ответа содержится сообщение об ошибке кодирования
		assert.Contains(t, w.Body.String(), "Failed to encode response")
	})
}

func TestWriteError(t *testing.T) {
	w := httptest.NewRecorder()
	code := http.StatusBadRequest
	message := "invalid request"

	WriteError(w, code, message)

	assert.Equal(t, code, w.Code)
	assert.Equal(t, "application/json; charset=utf-8", w.Header().Get("Content-Type"))

	var resp JSONError
	err := json.NewDecoder(w.Body).Decode(&resp)
	assert.NoError(t, err)
	assert.Equal(t, message, resp.Error)
}
func TestWriteValidationError(t *testing.T) {
	v, err := NewValidator()
	require.NoError(t, err)

	t.Run("ValidationErrors case", func(t *testing.T) {
		// Создаем структуру с ошибкой валидации
		type Request struct {
			Email string `validate:"required,email" json:"email"`
		}
		req := Request{Email: "invalid-email"}
		err := v.ValidateStruct(req)
		require.Error(t, err)

		w := httptest.NewRecorder()
		WriteValidationError(w, err, v)

		// Проверка статус-кода
		assert.Equal(t, http.StatusBadRequest, w.Code)
		// Проверка заголовка
		assert.Equal(t, "application/json; charset=utf-8", w.Header().Get("Content-Type"))

		// Проверка тела ответа
		var resp ValidationErrorResponse
		err = json.NewDecoder(w.Body).Decode(&resp)
		require.NoError(t, err)

		assert.Equal(t, ErrCodeValidationFailed, resp.Error)
		assert.Contains(t, resp.Details, "email")
		// Проверяем, что сообщение об ошибке переведено (по умолчанию на английский в NewValidator)
		assert.Contains(t, resp.Details["email"], "must be a valid email address")
	})

	t.Run("Other error case", func(t *testing.T) {
		genericErr := errors.New("some random error")

		w := httptest.NewRecorder()
		WriteValidationError(w, genericErr, v)

		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp ValidationErrorResponse
		err = json.NewDecoder(w.Body).Decode(&resp)
		require.NoError(t, err)

		assert.Equal(t, ErrCodeInvalidRequest, resp.Error)
		assert.Empty(t, resp.Details)
	})
}

// Тестовая структура для проверки декодирования и валидации
type testRequest struct {
	Name  string `json:"name" validate:"required"`
	Age   int    `json:"age" validate:"gte=0"`
	Email string `json:"email" validate:"required,email"`
}

func TestDecodeJSON(t *testing.T) {
	v, err := NewValidator()
	require.NoError(t, err)

	t.Run("Success", func(t *testing.T) {
		payload := `{"name": "John", "age": 30, "email": "john@example.com"}`
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(payload))
		w := httptest.NewRecorder()

		val, ok := DecodeJSON[testRequest](w, req, 1024, v)

		assert.True(t, ok)
		assert.Equal(t, "John", val.Name)
		assert.Equal(t, 30, val.Age)
		assert.Equal(t, http.StatusOK, w.Code)
	})

	t.Run("Request body too large", func(t *testing.T) {
		// Создаем тело больше, чем лимит maxBytes
		payload := `{"name": "John", "age": 30, "email": "john@example.com"}`
		maxBytes := int64(10) // Слишком мало для этого JSON
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(payload))
		w := httptest.NewRecorder()

		val, ok := DecodeJSON[testRequest](w, req, maxBytes, v)

		assert.False(t, ok)
		assert.Empty(t, val.Name)
		assert.Equal(t, http.StatusRequestEntityTooLarge, w.Code)

		var resp JSONError
		err := json.NewDecoder(w.Body).Decode(&resp)
		require.NoError(t, err)
		assert.Equal(t, ErrReqTooLarge.Error(), resp.Error)
	})

	t.Run("Invalid JSON format", func(t *testing.T) {
		payload := `{"name": "John", "age": 30, "email": "invalid-json` // Пропущена закрывающая кавычка и скобка
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(payload))
		w := httptest.NewRecorder()

		_, ok := DecodeJSON[testRequest](w, req, 1024, v)

		assert.False(t, ok)
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp JSONError
		err := json.NewDecoder(w.Body).Decode(&resp)
		require.NoError(t, err)
		assert.Equal(t, ErrInvalidJSON.Error(), resp.Error)
	})

	t.Run("Validation failed", func(t *testing.T) {
		// Ошибка: Name отсутствует (required), Age отрицательный (gte=0), Email невалидный
		payload := `{"age": -1, "email": "not-an-email"}`
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(payload))
		w := httptest.NewRecorder()

		_, ok := DecodeJSON[testRequest](w, req, 1024, v)

		assert.False(t, ok)
		assert.Equal(t, http.StatusBadRequest, w.Code)

		var resp ValidationErrorResponse
		err := json.NewDecoder(w.Body).Decode(&resp)
		require.NoError(t, err)
		assert.Equal(t, ErrCodeValidationFailed, resp.Error)
		assert.Contains(t, resp.Details, "name")
		assert.Contains(t, resp.Details, "age")
		assert.Contains(t, resp.Details, "email")
	})

	t.Run("No byte limit (maxBytes <= 0)", func(t *testing.T) {
		payload := `{"name": "No Limit", "age": 25, "email": "limit@test.com"}`
		req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(payload))
		w := httptest.NewRecorder()

		// Если maxBytes <= 0, http.MaxBytesReader не должен применяться
		val, ok := DecodeJSON[testRequest](w, req, 0, v)

		assert.True(t, ok)
		assert.Equal(t, "No Limit", val.Name)
		assert.Equal(t, http.StatusOK, w.Code)
	})
}
