.PHONY: run db-up db-down redis-up api-up docker-up docker-down dev

db-up:
	docker compose up -d db

redis-up:
	docker compose up -d redis

api-up:
	docker compose up -d api

db-down:
	docker compose down -v

run:
	go run cmd/main.go

docker-up:
	docker compose up -d --build

docker-down:
	docker compose down

# Запуск инфраструктуры в Docker и API локально
dev: db-up redis-up
	@echo "Waiting for services to start..."
	@sleep 3 # Даем пару секунд базе проснуться
	go run cmd/api/main.go