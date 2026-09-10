# Arquitetura

Visão geral de como o projeto está organizado e por quê. Para decisões
pontuais com trade-offs específicos, ver os ADRs em [`docs/adr/`](./adr/).

## Stack

- **Frontend:** React 19 + TypeScript + Tailwind CSS, Vite, TanStack Query,
  React Router, Recharts, React Hook Form + Zod.
- **Backend:** Django + Django REST Framework, gerenciado com `uv`.
- **Banco de dados:** PostgreSQL.
- **Fila/agendamento:** Celery + Redis (previsão de gastos sob demanda,
  insights diários via Celery beat).
- **IA:** API da Anthropic (Claude) — Haiku para tarefas de alto volume/baixo
  custo, modelo configurável e mais forte para o chat.
- **Infra:** Docker Compose (um serviço por processo: `db`, `redis`,
  `backend`, `celery-worker`, `celery-beat`, `frontend`).

## Organização do backend: apps por domínio de negócio

Os apps Django são organizados por **domínio** (`wallets`, `categories`,
`transactions`, `budgets`, `analytics`), não por camada técnica. Cada app de
domínio segue o mesmo padrão: `models.py` / `serializers.py` / `views.py`
(`ModelViewSet` + `permissions.py` própria, quando aplicável) / `urls.py`
(via `DefaultRouter`) / `filters.py` (quando precisa de filtros avançados,
como em `transactions`).

As funcionalidades de IA vivem em apps próprios e isolados
(`ai_categorization`, `ai_forecasting`, `ai_assistant`, `ai_insights`), todos
consumindo um módulo central, `ai_core`, que concentra o acesso ao SDK da
Anthropic — nenhum outro app importa `anthropic` diretamente.

## Modelagem: núcleo de dados

```
User (custom, accounts) ─┬─< Wallet ─┬─< Transaction >─┬─ Category (self FK p/ subcategorias)
                          ├─< Category│                 └─ Tag (M2M)
                          ├─< Tag     │
                          ├─< Budget ─┘
                          ├─< ForecastResult
                          ├─< Insight
                          └─< ChatSession ─< ChatMessage
```

- `Wallet`/`Category`/`Tag`/`Budget` pertencem diretamente a um `User`
  (campo `user`).
- `Transaction` não tem `user` direto — chega ao dono através de `wallet`
  (`wallet__user`). A permissão `IsOwner` (`apps/common/permissions.py`)
  resolve os dois casos com a mesma classe.
- `Category` pode ter `user=None` — categorias padrão do sistema,
  compartilhadas entre todos os usuários (ver
  [ADR 0001](./adr/0001-categoria-padrao-do-sistema.md)).

## Autenticação e isolamento multi-tenant

JWT via `djangorestframework-simplejwt` (ver
[ADR 0002](./adr/0002-jwt-para-autenticacao.md)). Todo endpoint de dado de
usuário aplica **duas camadas** de isolamento:

1. `get_queryset()` sobrescrito em cada view, filtrando pelo usuário
   autenticado — o dado de outro usuário nunca aparece numa listagem.
2. `IsOwner` (permissão de objeto) — bloqueia ações em item específico
   (`PUT`/`DELETE`) mesmo que alguém adivinhe um ID de outro usuário na URL.

Nos serializers que aceitam `ForeignKey`/`ManyToMany` escolhidos pelo
cliente (`TransactionSerializer`, `BudgetSerializer`), o `queryset` de cada
campo de relação é restrito ao usuário autenticado dentro de `__init__` —
sem isso, um ID de `Wallet`/`Category` de outro usuário seria aceito
silenciosamente (IDOR).

## Integração de IA: padrões de controle de custo

- **Regra antes de IA:** categorização tenta um match determinístico por
  palavra-chave (`ai_categorization/rules.py`) antes de qualquer chamada à
  Anthropic — a maioria das transações do dia a dia nunca gera custo de IA.
- **Modelo por caso de uso:** Haiku (`ANTHROPIC_MODEL_FAST`) para
  categorização/insights (classificação simples, alto volume); modelo
  configurável e mais forte (`ANTHROPIC_MODEL_CHAT`) só para o chat, onde a
  qualidade da resposta aberta importa mais.
- **Batching:** insights narram todos os padrões detectados numa única
  chamada por usuário (`generate_insight_texts`), em vez de uma chamada por
  padrão.
- **Contexto agregado, não histórico bruto:** o chat manda um resumo
  financeiro compacto (`build_financial_context`) pro Claude, nunca a lista
  de transações inteira — mantém o prompt pequeno e barato.
- **Throttling dedicado:** `AICategorizationThrottle`/`AIChatThrottle`
  aplicam limites bem mais restritivos (`DEFAULT_THROTTLE_RATES`) que o
  resto da API, como um circuit breaker simples contra custo inesperado.
- **Degradação graciosa:** toda chamada à Anthropic está dentro de um
  `try/except anthropic.APIError`, e cada view checa
  `settings.ANTHROPIC_API_KEY` antes de tentar — sem chave configurada, a
  função ainda funciona (com uma mensagem clara), nunca retorna 500.

## Analytics: ORM agregado + SQL cru documentado

A maior parte dos endpoints de `analytics` usa `annotate`/`aggregate` do
ORM. A exceção deliberada é `CashflowView`
(`apps/analytics/views.py`), que usa uma query SQL crua com uma **window
function** (`SUM(...) OVER (ORDER BY ...)`) para calcular saldo acumulado
mês a mês — replicar isso em Python exigiria uma segunda passada nos dados;
no Postgres é uma única query. A query é documentada inline e teria uma
versão espelho em `analytics/sql/` para exploração/reprodutibilidade.

## Testes

- **Backend:** `pytest` + `pytest-django`, rodando contra o Postgres real
  (não SQLite) — os testes de `analytics`/`CashflowView` dependem de SQL
  específico do Postgres (window functions). `CELERY_TASK_ALWAYS_EAGER` é
  ativado só em `config/settings/test.py`, então tasks disparadas via
  `.delay()` rodam sincronamente nos testes, sem precisar de Redis/worker.
  Chamadas à Anthropic nunca acontecem de verdade nos testes — cada cenário
  de IA usa `override_settings(ANTHROPIC_API_KEY=...)` + mock do ponto de
  entrada (`apps.ai_core.client`).
- **Frontend:** Vitest + Testing Library, focado em lógica de estado
  (`AuthContext`) e comportamento de componentes-chave (`ProtectedRoute`),
  não em cobertura exaustiva de UI.

## CI

`.github/workflows/ci.yml` roda dois jobs em paralelo: `backend` (Postgres
como serviço, `ruff check` + `ruff format --check` + `pytest`) e `frontend`
(`eslint` + `vitest` + `tsc`/`vite build`). Nenhum dos dois depende de
Redis — a suíte inteira roda sem subir Celery de verdade.
