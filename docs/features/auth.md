# Feature: auth

**Keywords:** autenticacao, jwt, cookies-httponly, bcrypt, refresh-token, sessao, rate-limit, cross-tenant
**Arquivos principais:**
  - backend/lib/auth/jwt.ts
  - backend/lib/auth/password.ts
  - backend/lib/auth/session.ts
  - backend/lib/auth/rate-limit.ts
  - backend/app/api/auth/login/route.ts
  - backend/app/api/auth/logout/route.ts
  - backend/app/api/auth/refresh/route.ts
  - backend/app/api/auth/me/route.ts
**Resumo:** Autenticacao do painel administrativo via JWT em cookies HttpOnly. Access token curto (15 min) + refresh token longo (7 dias) em cookies separados. Login global por email com isolamento cross-tenant em 2 camadas (header `x-tenant-id` + cookie `domain: undefined`). Mensagens de erro genericas anti-enumeracao. Rate limit no login.

## Specs desta feature

### Concluidas
| ID | Data | Commit | Titulo |
|---|---|---|---|
| _(nenhuma ainda)_ | | | |

### Planejadas (future/)
| ID | Titulo | Motivo |
|---|---|---|
| _(nenhuma)_ | | |

### Em execucao (so em branches — nao aparece em main)
| ID | Titulo | Branch |
|---|---|---|
| SPEC-20260506-2214 | Autenticacao JWT do painel admin (SQU-37) | feature/SQU-37-autenticacao-jwt |

## Estado atual

_(feature recem-criada — estado sera preenchido na conclusao da SPEC-20260506-2214 conforme R.7)_

> Ultima atualizacao: 2026-05-06 22:14 (SPEC-20260506-2214)

## Decisoes arquiteturais ativas

_(nenhuma ainda — serao adicionadas ao concluir a SPEC-20260506-2214)_

## Alternativas consideradas e rejeitadas

_(nenhuma ainda)_

## Gotchas

_(nenhum ainda)_

## Estado congelado (se houver)

_(nenhum)_
