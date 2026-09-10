# Finanças Pessoais — Projeto de Portfólio

Aplicação full-stack de controle financeiro pessoal, com dashboards analíticos e
funcionalidades de IA (categorização automática, previsão de gastos, chat
assistente e insights automáticos).

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Python + Django + Django REST Framework (gerenciado com `uv`)
- **Banco de dados:** PostgreSQL
- **IA:** API da Anthropic (Claude)
- **Infra:** Docker Compose (Redis + Celery pra tarefas em background)

## Como rodar

1. Copie `.env.example` para `.env` e ajuste os valores se necessário.
2. Suba tudo com Docker Compose:

```bash
docker compose up -d --build
```

3. Backend disponível em `http://localhost:8000` (health-check em `/api/health/`), frontend em `http://localhost:5173`.

## Testes

```bash
# Backend
cd backend && uv run pytest

# Frontend
cd frontend && npm test
```

CI (`.github/workflows/ci.yml`) roda lint + testes de backend e frontend em
paralelo a cada push/PR. Ver [`docs/architecture.md`](docs/architecture.md)
para a visão geral da arquitetura, [`docs/adr/`](docs/adr/) para as
decisões com trade-offs relevantes, e [`docs/privacidade.md`](docs/privacidade.md)
para como o app trata dados pessoais (LGPD).

## Status

✅ Completo — Fase 8 (testes, CI e polish final).

## Roadmap

- [x] Fase 0 — Fundação (Docker, scaffolding backend/frontend)
- [x] Fase 1 — Autenticação + CRUD core
- [x] Fase 2 — Dashboards analíticos
- [x] Fase 3 — Orçamentos e filtros avançados
- [x] Fase 4 — Categorização automática (IA)
- [x] Fase 5 — Previsão de gastos (IA)
- [x] Fase 6 — Chat assistente (IA)
- [x] Fase 7 — Insights e alertas automáticos (IA)
- [x] Fase 8 — Testes, CI e polish final