# Monorepo Finanças — Docker centralizado em infra/dockers
ROOT_DIR := $(abspath $(dir $(lastword $(MAKEFILE_LIST))))
DOCKER_DIR := $(ROOT_DIR)/infra/dockers
ENV_FILE := $(DOCKER_DIR)/.env

COMPOSE := docker compose --project-directory $(DOCKER_DIR)
COMPOSE_VPS := $(COMPOSE) -f $(DOCKER_DIR)/docker-compose.yml -f $(DOCKER_DIR)/docker-compose.vps.yml

.DEFAULT_GOAL := help

.PHONY: help init up down restart deploy logs ps migrate health shell-api

help: ## Lista comandos disponíveis
	@echo "Finanças — monorepo"
	@echo ""
	@echo "VPS (rede vps-internal + Postgres da infra):"
	@echo "  make init      copia infra/dockers/.env.example → .env"
	@echo "  make up        sobe api + frontend"
	@echo "  make deploy    rebuild + recreate + migrate + health"
	@echo "  make down      para app na VPS"
	@echo "  make restart   rebuild + recreate"
	@echo ""
	@echo "Atalhos: migrate, health, logs, ps, shell-api"
	@echo ""
	@echo "URL: https://financas.nbdev.tech | API: /api/v1"

init:
	@test -f $(ENV_FILE) || cp $(DOCKER_DIR)/.env.example $(ENV_FILE)
	@echo "✓ $(ENV_FILE) — edite senhas e chaves antes de make up na VPS"

_check-vps-env:
	@test -f $(ENV_FILE) || (echo "Rode: make init" && exit 1)
	@grep -q 'FINANCAS_DB_PASSWORD=.\+' $(ENV_FILE) || (echo "Defina FINANCAS_DB_PASSWORD no .env" && exit 1)
	@grep -q 'SECRET_KEY_BASE=.\+' $(ENV_FILE) || (echo "Defina SECRET_KEY_BASE no .env" && exit 1)
	@grep -q 'DEVISE_JWT_SECRET_KEY=.\+' $(ENV_FILE) || (echo "Defina DEVISE_JWT_SECRET_KEY no .env" && exit 1)

up: _check-vps-env ## Sobe app na VPS (sem portas no host)
	$(COMPOSE_VPS) up -d --build api frontend

down: ## Para app na VPS
	-$(COMPOSE_VPS) down

restart: down up

deploy: _check-vps-env ## Rebuild + migrate + health (VPS)
	$(COMPOSE_VPS) build api frontend
	$(COMPOSE_VPS) up -d --force-recreate
	@echo "Aguardando API Rails…"
	@for i in 1 2 3 4 5 6 7 8 9 10 12 14 16 18 20; do \
		$(COMPOSE_VPS) exec -T api curl -sf http://localhost:3000/api/v1/status >/dev/null 2>&1 && break; \
		sleep 2; \
	done
	$(MAKE) migrate
	@$(MAKE) health
	@echo "✓ Deploy VPS concluído — https://financas.nbdev.tech"

migrate:
	$(COMPOSE_VPS) exec api bundle exec rails db:migrate

health:
	@$(COMPOSE_VPS) exec -T api curl -sf http://localhost:3000/api/v1/status && echo " API ok"

logs:
	$(COMPOSE_VPS) logs -f --no-log-prefix api frontend

ps:
	$(COMPOSE_VPS) ps

shell-api:
	$(COMPOSE_VPS) exec api bash
