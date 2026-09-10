# 0003 — Controle de custo nas funcionalidades de IA

## Status
Aceito.

## Contexto
As 4 funcionalidades de IA (categorização, previsão, chat, insights) usam a
API paga da Anthropic. Sem nenhum controle, uso descuidado (ou um bug que
gere chamadas em loop) poderia gerar custo inesperado — especialmente
importante num projeto pessoal, sem orçamento de infra de uma empresa por
trás.

## Decisão
Camadas combinadas de controle de custo, aplicadas de forma consistente
nos 4 apps de IA:

1. **Regra antes de IA** (`ai_categorization/rules.py`): um match
   determinístico por palavra-chave resolve a maioria dos casos sem
   nenhuma chamada à Anthropic; a IA só entra quando a regra não reconhece
   a descrição.
2. **Modelo por caso de uso**: `ANTHROPIC_MODEL_FAST` (Haiku, mais barato)
   para categorização/insights; `ANTHROPIC_MODEL_CHAT` (mais caro, mais
   capaz) só pro chat, onde o usuário faz perguntas abertas.
3. **Batching**: insights narram todos os padrões detectados numa única
   chamada por usuário/execução, em vez de uma chamada por padrão
   encontrado.
4. **Throttling dedicado** (`AICategorizationThrottle`/`AIChatThrottle`,
   escopos `ai`/`ai_chat` em `DEFAULT_THROTTLE_RATES`): limites bem mais
   restritivos que o resto da API — um circuit breaker simples por
   usuário/dia.
5. **Nada de IA automática/em background por padrão**: categorização e chat
   só disparam por ação explícita do usuário na interface (clique em
   botão). A única exceção é a rotina diária de insights via Celery beat
   (ver [ADR 0004](./0004-celery-beat-para-insights.md)), decisão tomada
   deliberadamente após estimar o custo esperado.

## Consequências
- Custo previsível e limitado, mesmo sem monitoramento externo de billing.
- Complexidade extra: cada view de IA precisa checar
  `settings.ANTHROPIC_API_KEY` e tratar `anthropic.APIError` explicitamente
  (ver também [ADR 0002](./0002-jwt-para-autenticacao.md) para o padrão
  geral de degradação graciosa usado em toda a API).
- Categorização por regra é propositalmente simples (dicionário de
  palavra-chave → categoria) — não tenta ser exaustiva; o objetivo é
  reduzir volume de chamadas à IA, não substituir completamente a
  categorização inteligente.
