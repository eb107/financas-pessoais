# Finanças Pessoais — Projeto de Portfólio

Aplicação full-stack de controle financeiro pessoal, com dashboards analíticos e
funcionalidades de IA (categorização automática, previsão de gastos, chat
assistente e insights automáticos).

## Stack

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Python + Django + Django REST Framework (gerenciado com `uv`)
- **Banco de dados:** PostgreSQL
- **IA:** API da Anthropic (Claude)
- **Infra:** Docker Compose

## Como rodar

1. Copie `.env.example` para `.env` e ajuste os valores se necessário.
2. Suba tudo com Docker Compose:

```bash
docker compose up -d --build
```

3. Backend disponível em `http://localhost:8000` (health-check em `/api/health/`), frontend em `http://localhost:5173`.

## Status

🚧 Em construção — Fase 5 (previsão de gastos com IA).

## Roadmap

- [x] Fase 0 — Fundação (Docker, scaffolding backend/frontend)
- [x] Fase 1 — Autenticação + CRUD core
- [x] Fase 2 — Dashboards analíticos
- [x] Fase 3 — Orçamentos e filtros avançados
- [x] Fase 4 — Categorização automática (IA)
- [ ] Fase 5 — Previsão de gastos (IA)
- [ ] Fase 6 — Chat assistente (IA)
- [ ] Fase 7 — Insights e alertas automáticos (IA)
- [ ] Fase 8 — Testes, CI e polish final