.PHONY: run db-up db-down redis-up

db-up:
	docker compose up -d db

redis-up:
	docker compose up -d redis

db-down:
	docker compose down -v

run:
	go run cmd/main.go