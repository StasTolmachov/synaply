package handler

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"

	"synaply/internal/handler/dto"
	"synaply/internal/models"
	"synaply/internal/service/mocks" // Тот самый сгенерированный пакет!
	"synaply/internal/utils"
)

func TestHandler_Register(t *testing.T) {
	// 1. Описываем структуру нашего тест-кейса
	type testCase struct {
		name           string                         // Название теста
		input          dto.RegisterRequest            // Входные данные
		mockBehavior   func(s *mocks.MockUserService) // Как должен повести себя мок
		expectedStatus int                            // Какой HTTP статус мы ждем
	}
	registerRequest := dto.RegisterRequest{
		Email:      "test@user.com",
		Password:   "SecurePass123!",
		FirstName:  "John",
		LastName:   "Doe",
		SourceLang: "en",
		TargetLang: "es",
	}
	tokenResponse := &dto.TokenResponse{
		Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
		User: dto.UserDTO{
			ID:        uuid.New(),
			Email:     "test@user.com",
			FirstName: "John",
			LastName:  "Doe",
			Role:      "user",
			ActiveProfile: &dto.ProfileDTO{
				ID:         uuid.New(),
				SourceLang: "en",
				TargetLang: "es",
			},
		},
	}

	// 2. Создаем нашу "таблицу" сценариев
	tests := []testCase{
		{
			name:  "Success: successful registration",
			input: registerRequest,
			mockBehavior: func(s *mocks.MockUserService) {
				// Ожидаем, что сервис вызовут 1 раз. Возвращаем мок-пользователя и nil (без ошибки)
				s.EXPECT().
					Register(mock.Anything, mock.AnythingOfType("dto.RegisterRequest")).
					Return(tokenResponse, nil).
					Once()
			},
			expectedStatus: http.StatusCreated, // 201
		},
		{
			name: "Error: weak password (validation fails)",
			input: dto.RegisterRequest{
				Email:    "test@synaply.com",
				Password: "123", // Упадет на auth.ValidatePassword
			},
			mockBehavior: func(s *mocks.MockUserService) {
				// Метод сервиса НЕ должен быть вызван, поэтому тут ничего не пишем
			},
			expectedStatus: http.StatusBadRequest, // 400
		},
		{
			name:  "Error: user already exists",
			input: registerRequest,
			mockBehavior: func(s *mocks.MockUserService) {
				// Имитируем ошибку от базы данных (через сервис)
				s.EXPECT().
					Register(mock.Anything, mock.AnythingOfType("dto.RegisterRequest")).
					Return(nil, models.ErrUserAlreadyExists).
					Once()
			},
			expectedStatus: http.StatusConflict, // 409
		},
		{
			name:  "Error: unexpected error",
			input: registerRequest,
			mockBehavior: func(s *mocks.MockUserService) {
				s.EXPECT().
					Register(mock.Anything, mock.AnythingOfType("dto.RegisterRequest")).
					Return(nil, errors.New("unexpected error")).
					Once()
			},
			expectedStatus: http.StatusInternalServerError,
		},
	}

	// 3. Запускаем все тесты в цикле
	for _, tc := range tests {
		tc := tc
		t.Run(tc.name, func(t *testing.T) {
			t.Parallel()
			// --- Аранжировка (Arrange) ---

			// Создаем наш сгенерированный мок сервиса
			mockService := mocks.NewMockUserService(t)

			// Настраиваем его поведение для текущего сценария
			tc.mockBehavior(mockService)

			// Создаем хендлер, прокидывая в него мок и реальный валидатор
			v, _ := utils.NewValidator() // Предполагаю, что у тебя есть конструктор валидатора
			h := NewHandler(mockService, v)

			body, _ := json.Marshal(tc.input)
			// Создаем фейковый HTTP-запрос (Recorder + Request)
			req := httptest.NewRequest(http.MethodPost, "/register", bytes.NewReader(body))
			req.Header.Set("Content-Type", "application/json")
			rec := httptest.NewRecorder() // rec запишет ответ от хендлера

			// --- Действие (Act) ---
			h.Register(rec, req)

			// --- Проверка (Assert) ---

			// Проверяем, совпадает ли реальный статус код с ожидаемым
			assert.Equal(t, tc.expectedStatus, rec.Code)

			if tc.expectedStatus == http.StatusOK {
				var resp dto.TokenResponse
				err := json.Unmarshal(rec.Body.Bytes(), &resp)
				assert.NoError(t, err)
				assert.Equal(t, resp.Token, tokenResponse.Token)
				assert.Equal(t, resp.User.ID, tokenResponse.User.ID)
			}

			// testify сам проверит, что все методы мока (описанные в EXPECT()) были вызваны.
			// Так как мы передали `t` в `mocks.NewMockUserService(t)`, нам даже не нужно
			// писать mockService.AssertExpectations(t) вручную!
		})
	}
}
