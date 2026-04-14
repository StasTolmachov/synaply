План Разработки Backend-части Synaply (MVP)
Сформировано на основе "FRD MVP Платформы Synaply" и оригинального архитектурного плана.
📌 Global Definition of Done (Универсальные критерии готовности)
Разработчик не имеет права перевести задачу в статус "Done" или вмержить PR, если:*
API-First & Контракты (Swagger): До написания бизнес-логики и SQL-запросов спроектированы DTO-структуры (dto.go), описаны Swagger-аннотации и сгенерирован swagger.json. Фронтенд подтвердил контракт.
Тесты: Написаны Unit-тесты для бизнес-логики (слой service) и Интеграционные тесты для БД (слой repository).
CI/CD Pipeline & Security Linters: В GitHub Actions пройдены все проверки. Помимо golangci-lint, обязательно проходят gosec (безопасность) и bodyclose (утечки ресурсов).
Чистая Архитектура (Modular Monolith): Строгое разделение слоев. handler -> service -> repository.
Обработка отказов (Graceful Degradation): Код спроектирован с учетом сбоев (особенно для внешних API типа Gemini).
Epic 0: Инфраструктура и Каркас (Foundation)
Цель: Поднять скелет Cloud-Native приложения, готового к production.
Task 0.1: Конфигурация и Логирование (Анонимизация)
Парсинг .env. Настройка кастомного логгера slogger на базе log/slog.
Важно (Compliance): Логгер должен маскировать PII (email, токены, пароли). Запрет на логирование тела HTTP-запросов целиком.
Task 0.2: Подключение к БД и Redis
Хелперы в pkg/database. Инициализация пулов соединений (pgxpool.Pool для Postgres).
Task 0.3: HTTP Роутер и Graceful Shutdown
Роутер (chi/gin) в internal/server. Перехват SIGTERM/SIGINT в main.go.
Task 0.4: Базовые Middleware
LoggerMiddleware, Recoverer, CORS и RateLimiter (на базе Redis для защиты от Thundering Herd).
Epic 1: Идентификация и Профили (Домен auth)
Цель: B2G авторизация и языковые профили.
Task 1.1: Репозиторий Пользователей
CRUD для таблиц users и user_learning_profiles (internal/auth/repository.go).
Task 1.2: Feide SSO (OIDC) & Внутренняя авторизация
Блокер для MVP: Интеграция OIDC Feide (национальная норвежская система).
Выдача внутренних JWT-токенов после успешного входа через Feide или email/password.
Task 1.3: Middleware Авторизации и Профили
Middleware jwt_auth.go (добавляет user_id в context).
Эндпоинты для смены активного профиля обучения.
Epic 2: Контент и Пользовательские Коллекции (Домен content)
Цель: Работа с UGC и Zero-copy словарями.
Task 2.1: Глобальный словарь (Zero-copy)
Дедупликация слов при сохранении в global_words.
Task 2.2: Управление Word Lists (UGC)
CRUD для word_lists и word_list_items.
Epic 3: Движок Обучения - FSRS (Домен fsrs)
Цель: Математическое ядро интервальных повторений.
Task 3.1: Математика FSRS v4
Чистые функции в internal/fsrs/service.go для пересчета stability, difficulty и due. Требование: 100% Unit-тестов.
Task 3.2: Состояния карточек и Генерация Урока
CRUD для card_states и review_logs.
Эндпоинт GET /api/v1/study/lesson (Smart List Selection).
Task 3.3: Обработка Ответа (Review)
Транзакционная запись массива ответов: обновление card_states и insert в review_logs.
Epic 4: Интеграции с AI (Пакет external)
Цель: Маршрутизация затрат и AI-функционал.
Task 4.1: Клиент DeepL
Простые переводы через DeepL API (для снижения COGS).
Task 4.2: Клиент Google Gemini (1.5 Flash)
Промптинг для генерации мнемоник и анализа ошибок.
Task 4.3: Graceful Degradation
Защита урока: при 503 от ИИ или таймауте возвращаем карточку без подсказки, урок не должен падать.
Epic 5: Школа и B2B/B2G (Домен lms)
Цель: Инструментарий учителя без over-engineering.
Task 5.1: Управление Классами
CRUD для classrooms (и school_licenses, если заложено). Генерация invite_code.
Task 5.2: Student Join & Assignments
POST /api/v1/classrooms/join. Выдача домашних заданий на класс.
Task 5.3: Teacher Live Radar (SWR Polling)
Агрегация прогресса GET /api/v1/lms/classes/{id}/progress.
Ограничение MVP: Никаких WebSockets/SSE. Фронтенд использует SWR-поллинг каждые 10-15 сек.
Epic 6: Фоновые задачи, Статистика и GDPR
Цель: Background Workers и соответствие законам.
Task 6.1: Внедрение Redis Queue (Asynq)
Поднятие воркеров hibiken/asynq для асинхронных задач (избегаем блокировки HTTP-горутин).
Task 6.2: GDPR Data Portability (Arkivloven)
Эндпоинт GET /api/v1/users/{id}/export — формирование JSON со всей историей обучения ученика. Выполняется через фоновую задачу (Asynq).
Task 6.3: Zero Data Retention (Cron Worker)
Фоновый джоб, который каждую ночь делает Hard Delete транзакционных логов ИИ старше 180 дней.
Task 6.4: Skill Tree & Streaks
GET /api/v1/stats/me — базовая агрегация "ударных режимов" (streaks). Кооперативная механика Dugnad отложена до v2.
