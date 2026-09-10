# 0004 — Insights automáticos via Celery beat (única exceção ao "IA só sob demanda")

## Status
Aceito.

## Contexto
Toda outra funcionalidade de IA do projeto é estritamente acionada por
clique do usuário na interface, por controle de custo (ver
[ADR 0003](./0003-controle-de-custo-de-ia.md)). Insights financeiros
("orçamento estourado", "gasto subiu X% no mês"), porém, só têm valor real
se forem detectados **proativamente** — pedir pro usuário lembrar de clicar
"gerar insights" todo dia derrota o propósito do recurso.

Isso foi discutido explicitamente durante o desenvolvimento: a alternativa
"só manual" preservaria a garantia de custo zero em background, mas
tornaria o recurso praticamente inútil. Antes de decidir, foi feita uma
estimativa de custo: 1 chamada ao Claude Haiku por usuário por dia,
narrando todos os padrões detectados numa única chamada batelada (não uma
chamada por padrão) — a estimativa ficou em torno de **$0.05–0.14/mês por
usuário ativo**, valor considerado aceitável dado o benefício.

## Decisão
`ai_insights` roda automaticamente 1x/dia via Celery beat
(`CELERY_BEAT_SCHEDULE["generate-insights-daily"]`, 08:00 UTC), disparando
uma task por usuário (`generate_insights_for_all_users` →
`generate_insights_task.delay(user_id)` para cada um) — um usuário com erro
não trava a geração dos demais. `TriggerInsightsView` continua disponível
pra gerar sob demanda também (útil pra testar sem esperar o ciclo diário).

## Consequências
- Único ponto do sistema onde uma chamada à IA acontece sem ação direta do
  usuário — precisa ficar bem documentado (aqui, e no
  `docstring` de `apps/ai_insights/tasks.py`) pra não ser confundido com o
  padrão geral do projeto.
- Exige Celery beat rodando como processo permanente (serviço próprio no
  `docker-compose.yml`, `celery-beat`), além do `celery-worker` — mais um
  processo pra manter de pé em produção.
- Detecção de padrão em si (`detection.py`) não gasta nenhum token — só a
  narração final em texto humano usa IA, e mesmo essa falha graciosamente
  (mantém o texto cru da regra) se a chamada à Anthropic falhar.
