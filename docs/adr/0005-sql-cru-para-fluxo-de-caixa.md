# 0005 — SQL cru (window function) para o fluxo de caixa mensal

## Status
Aceito.

## Contexto
`GET /api/analytics/cashflow/` precisa devolver, por mês, a receita, a
despesa e o **saldo acumulado até aquele mês** (não só o saldo daquele mês
isolado). O ORM do Django resolve bem agregações simples (`Sum` por mês),
mas não tem um jeito direto de expressar "soma acumulada ordenada" sem
buscar os totais mensais em Python e somar numa segunda passada.

## Decisão
`CashflowView` (`apps/analytics/views.py`) usa uma query SQL crua, com uma
**window function**:

```sql
SUM(SUM(...)) OVER (ORDER BY date_trunc('month', t.date))
```

Uma soma agregada por mês (`GROUP BY`) empilhada com uma soma corrida sobre
esses grupos (`OVER (ORDER BY ...)`) — o saldo acumulado sai pronto do
banco, numa única query, sem lógica extra em Python.

## Consequências
- Mais rápido e mais simples de manter correto do que replicar a mesma
  lógica em Python (evita o erro comum de "somar errado por reprocessar a
  lista na ordem errada").
- Acopla esse endpoint especificamente ao **Postgres** (window functions
  não são universais entre bancos SQL) — aceitável, já que o projeto nunca
  pretendeu trocar de banco.
- SQL cru não passa pelas proteções automáticas do ORM contra SQL
  injection — mitigado usando exclusivamente parâmetros nomeados
  (`%(user_id)s`, `%(date_from)s`) via `cursor.execute(sql, params)`, nunca
  concatenação de string.
- Documentado inline no código (docstring da view) para quem for mexer
  nessa query sem contexto do porquê ela foge do padrão ORM do resto do
  projeto.
