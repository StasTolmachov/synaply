.PHONY: run db-up db-down

run:
	go run cmd/main.go

db-up:
	docker compose up -d db

db-down:
	docker compose down -v