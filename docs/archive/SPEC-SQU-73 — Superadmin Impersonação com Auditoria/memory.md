# SQU-73 — Memory

> Contexto persistente da feature. Atualizar quando decisões de design mudarem.

## O que é

Capacidade de Superadmin entrar no painel de um tenant como se fosse aquele tenant (impersonação), com auditoria completa e rastreável de cada ação.

## Por que existe

Sem impersonação, suporte precisa pedir senha do tenant (risco de segurança) ou depender de descrição imprecisa do problema. Com auditoria, qualquer acesso fica registrado — quem entrou, em qual tenant, quando, de qual IP.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | Node.js / Express + TypeORM |
| Banco | PostgreSQL |
| Backoffice | React (TypeScript) |
| Auth/Cookie | Cookie httpOnly, sameSite lax, secure |

## Tabela principal

`tb_audit_log` — append-only. Nunca permite UPDATE nem DELETE.

```
id               uuid          PK
event_type       varchar(50)   ex: 'impersonate_start'
actor_user_id    uuid          FK → admin_users (RESTRICT)
actor_role       varchar(15)   snapshot da role no momento
target_tenant_id uuid          nullable
target_user_id   uuid          nullable
metadata         jsonb         payload sanitizado (sem senhas)
ip_address       varchar(45)
user_agent       text
created_at       timestamp     DEFAULT NOW()
```

Índices: `(actor_user_id, created_at DESC)`, `(target_tenant_id, created_at DESC)`, `(event_type, created_at DESC)`, `(created_at DESC)`.

## Cookie de impersonação

```
Nome:     impersonate_tenant_id
httpOnly: true
secure:   true (prod) / false (dev)
sameSite: lax
maxAge:   14400 s (4 h)
path:     /
```

## Decisões de design fixadas

- Cookie TTL de 4 h (evitar sessão esquecida em PC público).
- Banner vermelho sem botão X — só "Encerrar impersonação".
- Metadata de audit log é sanitizada antes do INSERT (sem campos de senha).
- Resolução de tenant: cookie tem prioridade **somente** para `role === 'superadmin'`.
- Tenant com `status !== 'active'` retorna 404 na tentativa de impersonar.
- FKs da tabela usam RESTRICT para preservar histórico mesmo se ator/tenant for deletado.

## Eventos auditados

`impersonate_start` · `impersonate_stop` · `tenant_created` · `tenant_updated` · `tenant_deleted` · `user_created` · `user_updated` · `password_changed` · `login` · `logout`

## Arquivos-chave

```
backend/src/migrations/1747190400000-CreateAuditLogTable.ts
backend/src/entities/AuditLog.ts
backend/src/repositories/audit-log.repository.ts
backend/src/services/impersonation.service.ts
backend/src/controllers/impersonation.controller.ts
backend/src/routes/impersonation.routes.ts
backend/src/middleware/resolve-tenant-by-host.ts  ← modificado
backend/src/app.ts                                 ← modificado
backend/src/server.ts                              ← modificado
backoffice/src/components/admin/ImpersonationBanner.tsx
backoffice/src/pages/admin/AuditPage.tsx
backoffice/src/pages/tenants/TenantsPage.tsx       ← modificado
```