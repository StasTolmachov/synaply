Architecture Decision Record (ADR): Synaply MVP
1. Архитектурный паттерн: Modular Monolith
   Мы не строим распределенную систему на старте. Мы строим одно backend-приложение на Golang, но со строгой изоляцией доменов (Domain-Driven Design).
   Почему не микросервисы сейчас?
   Нет сетевых задержек (network latency) между сервисами.
   Не нужно решать проблемы распределенных транзакций.
   Деплой сводится к запуску одного Docker-контейнера.
   Как обеспечиваем готовность к росту (Future-Proofing)?
   Внутри репозитория Go мы жестко разделяем логику по пакетам (например: internal/auth (Feide OIDC), internal/fsrs (алгоритм интервальных повторений), internal/ai_router). Пакеты общаются друг с другом только через интерфейсы. Если AI-модуль начнет потреблять слишком много ресурсов, мы просто вырежем его в отдельный репозиторий за 1-2 спринта.
2. Технологический Стек и Ключевые Модули
   Frontend (Student PWA + Teacher/Admin Portal)
   Технология: Next.js (React) + Tailwind CSS.
   Почему: Позволяет шарить UI-компоненты между кабинетом ученика и учителя. PWA (Progressive Web App) избавит нас от необходимости на старте проходить ревью в App Store/Google Play (экономим 30% комиссии и недели времени).
   Деплой: Vercel (с жесткой привязкой региона к EU, например, Франкфурт) или AWS Amplify.
   Backend (Core API & Workers)
   Технология: Golang (Go).
   Почему: Фантастическая производительность, низкое потребление RAM (важно для экономии на серверах), строгая типизация.
   Core Learning Loop: Реализация математического ядра алгоритма FSRS v4 для вычисления интервалов повторения прямо в памяти Go-приложения (быстро и дешево).
   База Данных (Transactions & State & B2G Multi-Tenancy)
   Технология: PostgreSQL 15+ (Managed AWS RDS).
   Multi-Tenancy: Поскольку мы работаем со школами, используем Row-Level Security (RLS) или строгую фильтрацию по tenant_id (ID школы/коммуны) на уровне всех запросов. Данные разных школ не должны пересекаться.
   Аналитика в MVP: Никакого ClickHouse на старте. Вся базовая аналитика для Teacher Dashboard пишется и читается напрямую из PostgreSQL (создадим правильные индексы).
   Кэширование, Очереди и Rate Limiting
   Технология: Redis.
   Очереди: hibiken/asynq (надежная очередь задач поверх Redis для асинхронных запросов к LLM).
   Защита (Rate Limiting): Redis используется для жесткого Rate Limiting API (алгоритм Token Bucket), чтобы защититься от Thundering Herd problem и брутфорса, а также лимитировать запросы к платному AI для конкретных школ.
   Аутентификация (Critical for B2G)
   Интеграция: Feide SSO (OpenID Connect).
   Почему: Это абсолютный блокер для норвежского образовательного рынка. Наш бэкенд будет выступать OIDC/OAuth2 клиентом для Feide. Для учителей/админов оставим fallback в виде Magic Links или классического JWT.
3. Умный роутинг ИИ (AI Cost Management)
   Для оптимизации COGS (себестоимости) мы внедряем прокси-модуль internal/ai_router:
   DeepL API: Используется для простых, детерминированных переводов слов и фраз (быстро, дешево, надежно).
   Gemini 1.5 Flash API: Используется исключительно для сложных задач — генерации контекстных примеров, анализа ошибок (grammar explanations) и проверки правописания.
   Кэширование: Все успешные генерации (слово + перевод + пример) кэшируются в БД. Если 100 учеников ошибаются в слове "Kjøleskap", мы платим Gemini только за первый раз, остальные 99 получают кэшированное объяснение.
4. Схема Инфраструктуры MVP (AWS)
   graph TD
   Client[Mobile PWA / Web App] -->|HTTPS| Cloudflare[Cloudflare WAF / CDN]
   Cloudflare --> ALB[AWS Application Load Balancer]

   subgraph "EU Data Center (Frankfurt / Stockholm) - GDPR Zone"
   ALB --> ECS[AWS ECS Fargate: Go API + Worker Containers]

        ECS <-->|Read/Write / RLS| RDS[(AWS RDS: PostgreSQL)]
        ECS <-->|Cache, Rate Limit, Job Queue| ElastiCache[(AWS ElastiCache: Redis)]
   end

   ECS -.->|OIDC Auth| Feide[Feide SSO]
   ECS -.->|Simple Translations| DeepL[DeepL API]
   ECS -.->|Complex AI Tasks| Gemini[Gemini 1.5 Flash API]


5. Security & GDPR (Privacy by Design) - Абсолютный приоритет
   Data Residency: Вся инфраструктура разворачивается строго в европейских дата-центрах (AWS eu-central-1 или eu-north-1).
   Encryption: In transit: Исключительно TLS 1.3. At rest: AWS KMS (шифрование дисков RDS баз данных по умолчанию).
   Zero Data Retention для ИИ: Архитектурная гарантия автоматического удаления (Hard Delete) логов транзакционных чатов с ИИ старше 180 дней через cron-worker. Данные пользователей не используются для обучения базовых моделей (закрепляется в Data Processing Agreements с вендорами).
   Анонимизация логов: Логгер (slogger в Go) маскирует PII (Personal Identifiable Information), email-ы и токены.
   Data Portability: Эндпоинт GET /api/v1/users/{id}/export для выгрузки всей истории обучения ученика (JSON), как того требует Arkivloven и GDPR.
6. Out of Scope для MVP (Отложено ради Time-to-Market)
   Live Engagement Radar & WebSockets: Никаких SSE/WebSockets. Если нужен реалтайм на дашборде учителя, обойдемся SWR (Stale-While-Revalidate) поллингом со стороны фронтенда раз в 10-15 секунд.
   ClickHouse / OLAP: Пока хватает индексов PostgreSQL.
   Speech-to-Text (Голосовой ввод): Только текстовый ввод с клавиатуры.
   P2P Roleplay / Co-op multiplayer: Фокус на "одиночной кампании" (streaks), без синхронизации стейта между пользователями в реальном времени.
7. Затраты и Сроки [Estimate / Требует уточнения]
   Сроки MVP: ~6-8 недель (Фокус на Feide SSO, FSRS v4, интеграцию Gemini/DeepL).
   Стоимость инфраструктуры (0 - 5,000 DAU): ~$200-400/месяц (RDS: ~$60, ElastiCache: ~$15, ECS Fargate: ~$80, Vercel: ~$20).
