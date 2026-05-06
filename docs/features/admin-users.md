# Feature: admin-users

**Keywords:** admin-users, roles, superadmin, tenant-admin, editor, seed, password-hash, last-login
**Arquivos principais:**
  - backend/lib/db/schema.ts
  - backend/scripts/seed-tenants.ts
**Resumo:** Modelo e ciclo de vida dos usuarios administrativos do painel. Tabela `admin_users` com `tenant_id` nullable (NULL = superadmin global), email UNIQUE, password_hash (bcrypt), role (`superadmin` | `tenant_admin` | `editor`), `is_active` e `last_login_at`. Seed cria 1 admin por tenant + 1 superadmin global.

## Specs desta feature

### Concluidas
| ID | Data | Commit | Titulo |
|---|---|---|---|
| _(nenhuma ainda)_ | | | |

### Planejadas (future/)
| ID | Titulo | Motivo |
|---|---|---|
| SPEC-20260503-1509 | Configuracoes e Superadmin | CRUD de tenants + impersonacao por superadmin (toca admin-users indiretamente) |

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
