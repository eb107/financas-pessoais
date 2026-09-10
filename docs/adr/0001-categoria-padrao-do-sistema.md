# 0001 — Categorias padrão do sistema via `user = None`

## Status
Aceito.

## Contexto
Todo usuário novo precisa de um conjunto básico de categorias
(Alimentação, Transporte, Moradia...) pra que a categorização automática e
os dashboards façam sentido desde o primeiro uso, sem exigir que o usuário
cadastre tudo manualmente antes de começar.

## Decisão
`Category.user` é opcional (`null=True, blank=True`). Uma categoria com
`user=None` é uma categoria "global", compartilhada e visível para todos os
usuários; uma categoria com `user` preenchido pertence só a quem a criou.
As views (`get_queryset`) filtram com
`Q(user=request.user) | Q(user__isnull=True)`, misturando as duas
naturalmente na mesma listagem.

Alternativas consideradas:
- Uma tabela separada `SystemCategory` + `UserCategory`: rejeitada por
  duplicar o modelo e complicar toda referência de `Transaction`/`Budget` a
  "uma categoria, seja lá de onde vier".
- Copiar as categorias padrão pra cada usuário no cadastro (fixture por
  usuário): rejeitada porque dificulta atualizar as categorias padrão
  depois (teria que migrar dado de cada usuário já existente).

## Consequências
- Simples de consultar (uma tabela só, um `Q()` a mais).
- Exige cuidado em toda visualização de categoria pro cliente: nunca supor
  que existe um dono (`category.user` pode ser `None`).
- Categorias padrão não podem ser editadas/deletadas por um usuário comum
  (ficariam fora do seu `get_queryset` de escrita caso a permissão de dono
  fosse aplicada ingenuamente) — isso é o comportamento desejado, mas exige
  atenção ao implementar qualquer tela de "editar categoria".
