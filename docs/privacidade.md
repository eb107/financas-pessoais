# Aviso de Privacidade

Este documento descreve como o **Finanças Pessoais** trata dados pessoais,
em conformidade com a Lei Geral de Proteção de Dados (LGPD, Lei nº
13.709/2018). Ele reflete o comportamento real do código nesta versão do
projeto — qualquer mudança na forma como dados são tratados deve atualizar
este arquivo junto.

## Quem trata os dados

Projeto de portfólio pessoal, sem CNPJ ou operação comercial por trás. Não
há Encarregado de Dados (DPO) formalmente designado — o próprio
desenvolvedor é o ponto de contato para qualquer dúvida ou solicitação
relacionada a dados pessoais.

## Quais dados são coletados

| Dado | Onde | Por quê |
|---|---|---|
| Username, e-mail, senha (com hash) | Cadastro | Identificação e autenticação |
| Carteiras, categorias, tags, transações, orçamentos | Uso normal do app | É a própria finalidade do serviço — controle financeiro pessoal |
| Mensagens de chat com o assistente de IA | Feature de chat | Histórico da conversa, pra dar contexto nas respostas seguintes |
| Data/hora do primeiro uso de alguma funcionalidade de IA | Automático, ao usar IA pela 1ª vez | Registro de consentimento (ver seção "IA e terceiros") |

Nenhum dado sensível na definição da LGPD (Art. 5º, II — origem racial,
convicção religiosa, opinião política, saúde, vida sexual, dado genético
ou biométrico) é coletado por este app. Dado financeiro é dado pessoal
comum, não dado sensível.

## Base legal

O tratamento se baseia na **execução de um serviço solicitado pelo próprio
usuário** (LGPD Art. 7º, V) — os dados existem porque o usuário pediu pra
controlar as próprias finanças através do app, não por qualquer outra
finalidade (marketing, venda a terceiros, etc.).

## IA e compartilhamento com terceiros

Três funcionalidades enviam dado pessoal para a API da Anthropic (Claude),
empresa americana — isso configura **transferência internacional de dados
pessoais** (LGPD Art. 33):

- **Categorização automática**: a descrição da transação (texto livre)
  é enviada, mas só quando nenhuma regra local reconhece o texto (a
  maioria dos casos é resolvida sem IA nenhuma).
- **Chat assistente**: um resumo financeiro agregado (totais por mês,
  por categoria, orçamentos) — nunca o histórico bruto de transações.
- **Insights automáticos**: os padrões já detectados localmente (ex:
  "orçamento X estourado") são narrados em texto natural pela IA.

**A previsão de gastos não usa IA** — é regressão linear local
(scikit-learn), nenhum dado sai do servidor.

Nenhuma dessas três chama a Anthropic automaticamente antes do usuário ter
optado por usar alguma funcionalidade de IA explicitamente pelo menos uma
vez (clicar em "categorizar com IA", mandar uma mensagem no chat, ou
disparar "gerar insights" manualmente) — esse momento fica registrado
(`ai_consent_given_at`). Em particular, a rotina automática diária de
insights (que roda em background, sem ação do usuário naquele momento)
**não chama a IA** para quem nunca deu esse consentimento antes — ela usa
o texto bruto da regra detectada em vez disso.

## Retenção de dados

- **Insights**: removidos automaticamente após 365 dias (rotina mensal).
- **Tokens de autenticação (JWT)**: expirados/revogados são removidos
  automaticamente na mesma rotina mensal.
- **Demais dados** (carteiras, transações, categorias, orçamentos,
  histórico de chat): mantidos enquanto a conta existir. Excluir a conta
  remove tudo de uma vez (ver "Seus direitos" abaixo).

## Segurança

- Senhas nunca armazenadas em texto plano (hash PBKDF2 do Django).
- Autenticação via JWT, com limite de tentativas (proteção contra força
  bruta) e revogação de sessão no logout.
- Cada usuário só acessa os próprios dados — validado tanto na listagem
  quanto em ações sobre um item específico.
- HTTPS obrigatório em produção (`config/settings/prod.py`).
- Exportação e exclusão de conta ficam registradas num log de auditoria
  interno, pra ser possível provar o que aconteceu com um dado, se
  questionado.

## Seus direitos (LGPD Art. 18)

| Direito | Como exercer |
|---|---|
| Confirmar quais dados existem | `GET /api/auth/me/` |
| Exportar seus dados (portabilidade) | `GET /api/auth/me/export/` |
| Corrigir dados incorretos | Editar diretamente pela interface (carteiras, transações, etc.) |
| Excluir a conta e todos os dados associados | `DELETE /api/auth/me/` |

A exclusão é definitiva e imediata — o cascade do banco remove carteiras,
categorias, transações, orçamentos, previsões, insights e histórico de
chat junto com a conta, numa única operação.
