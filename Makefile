# ─────────────────────────────────────────────
# Aero-Agent Makefile
# ─────────────────────────────────────────────

.PHONY: dev down test seed simulate logs clean build help

# Default target
help: ## Show this help
	@echo "Aero-Agent Development Commands:"
	@echo "─────────────────────────────────────"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

# ── Docker ────────────────────────────────
dev: ## Start all services with Docker Compose
	docker compose up -d
	@echo "\n✅ All services started!"
	@echo "   Dashboard:        http://localhost:3000"
	@echo "   Decision Engine:  http://localhost:8000/docs"
	@echo "   Notification:     http://localhost:8001/docs"
	@echo "   Ingestion:        http://localhost:8002"

down: ## Stop all services
	docker compose down
	@echo "✅ All services stopped."

build: ## Build all Docker images
	docker compose build --no-cache

logs: ## Follow logs from all services
	docker compose logs -f

logs-engine: ## Follow Decision Engine logs
	docker compose logs -f decision-engine

logs-frontend: ## Follow Frontend logs
	docker compose logs -f frontend

# ── Development ───────────────────────────
engine-dev: ## Run Decision Engine locally (dev mode)
	cd services/decision-engine && uvicorn app.main:app --reload --port 8000

frontend-dev: ## Run Frontend locally (dev mode)
	cd frontend && npm run dev

# ── Database ──────────────────────────────
seed: ## Load sample data into database
	cd services/decision-engine && python -m app.db.seed

migrate: ## Run database migrations
	cd services/decision-engine && alembic upgrade head

# ── Testing ───────────────────────────────
test: ## Run all tests
	cd services/decision-engine && python -m pytest tests/ -v --tb=short
	cd frontend && npm test -- --watchAll=false

test-engine: ## Run Decision Engine tests only
	cd services/decision-engine && python -m pytest tests/ -v --tb=short

test-frontend: ## Run Frontend tests only
	cd frontend && npm test -- --watchAll=false

# ── Simulation ────────────────────────────
simulate: ## Run crisis simulation scenario
	python scripts/simulate_crisis.py

simulate-storm: ## Run snow storm scenario (3 flights, 150 pax)
	python scripts/simulate_crisis.py --scenario storm

# ── Cleanup ───────────────────────────────
clean: ## Remove all containers, volumes, and build artifacts
	docker compose down -v --remove-orphans
	@echo "✅ Cleaned up."

# ── Lint ──────────────────────────────────
lint: ## Run linters
	cd services/decision-engine && ruff check . && mypy .
	cd frontend && npm run lint
