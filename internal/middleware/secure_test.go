package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestLimitPayloadSize(t *testing.T) {
	// Создаем фиктивный обработчик, который будет вызываться, если проверка пройдена
	nextHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// Оборачиваем его в наше middleware
	handlerToTest := LimitPayloadSize(nextHandler)

	tests := []struct {
		name           string
		contentLength  int64
		expectedStatus int
	}{
		{
			name:           "Payload within limit",
			contentLength:  MaxBodySize - 1,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Payload exactly at limit",
			contentLength:  MaxBodySize,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Payload exceeds limit",
			contentLength:  MaxBodySize + 1,
			expectedStatus: http.StatusRequestEntityTooLarge,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Создаем запрос
			req := httptest.NewRequest("POST", "/", nil)
			// Устанавливаем ContentLength вручную для имитации размера тела
			req.ContentLength = tt.contentLength

			// Создаем ResponseRecorder для записи ответа
			rr := httptest.NewRecorder()

			// Выполняем запрос
			handlerToTest.ServeHTTP(rr, req)

			// Проверяем статус-код
			if rr.Code != tt.expectedStatus {
				t.Errorf("handler returned wrong status code: got %v want %v",
					rr.Code, tt.expectedStatus)
			}

			// Если ожидается ошибка, можно также проверить тело ответа
			if tt.expectedStatus == http.StatusRequestEntityTooLarge {
				expectedBody := "Request Entity Too Large\n"
				if rr.Body.String() != expectedBody {
					t.Errorf("handler returned unexpected body: got %v want %v",
						rr.Body.String(), expectedBody)
				}
			}
		})
	}
}
