.PHONY: up down build test lint format migrate revision

up:
	docker compose up -d

down:
	docker compose down

build:
	docker compose build

test:
	pytest tests/

lint:
	ruff check .

format:
	ruff format .
	ruff check --fix .

migrate:
	alembic upgrade head

revision:
	alembic revision --autogenerate -m "$(m)"
