.PHONY: run db-up db-down redis-up api-up docker-up docker-down dev frontend-dev

db-up:
	docker compose up -d db

redis-up:
	docker compose up -d redis

api-up:
	docker compose up -d api

frontend-up:
	docker compose up -d frontend

db-down:
	docker compose down -v

run:
	go run cmd/main.go

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

frontend-dev:
	cd frontend_app && npm run dev

# Запуск инфраструктуры в Docker и приложения локально
dev: db-up redis-up
	@echo "Waiting for services to start..."
	@sleep 3
	# Run API in background and frontend in foreground
	go run cmd/api/main.go & cd frontend_app && npm run dev