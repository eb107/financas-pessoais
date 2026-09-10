# 0002 — JWT (via `djangorestframework-simplejwt`) para autenticação

## Status
Aceito.

## Contexto
O frontend é uma SPA React servida separadamente do backend Django (outra
origem/porta), então autenticação por sessão de cookie tradicional exigiria
lidar com CSRF entre origens e acoplaria mais o front ao ciclo de vida de
sessão do Django. Precisávamos de um mecanismo de autenticação stateless,
que funcione bem com um cliente HTTP puro (`axios`) fazendo chamadas
cross-origin.

## Decisão
Autenticação via JWT: `POST /api/auth/token/` retorna um par
`access` (vida curta, 30 min) + `refresh` (vida longa, 7 dias,
`ROTATE_REFRESH_TOKENS=True`). O frontend guarda os dois no `localStorage`
(`lib/auth-storage.ts`) e o `access` vai em todo request via header
`Authorization: Bearer <token>` (interceptor em `lib/api.ts`). Quando uma
resposta vem `401`, o mesmo interceptor tenta renovar o `access` via
`refresh` uma única vez antes de desistir e limpar a sessão.

## Consequências
- Backend não guarda nenhum estado de sessão — qualquer instância do
  backend consegue validar um token sozinha (importante se o projeto
  crescer pra múltiplas instâncias).
- `localStorage` é acessível via JavaScript (diferente de um cookie
  `httpOnly`), o que expõe o token a XSS caso exista uma vulnerabilidade de
  injeção de script no frontend — trade-off aceito para um projeto de
  portfólio; um ambiente de produção real levaria em conta cookies
  `httpOnly` + `SameSite` como alternativa mais robusta.
- Renovação de token é transparente pro usuário (o interceptor renova nos
  bastidores), mas adiciona complexidade ao cliente HTTP (fila de retry,
  guarda contra múltiplos refreshes simultâneos via `refreshPromise`).
