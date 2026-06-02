# Feature: admin-content-api

**Keywords:** admin, api, hero, banners, conteúdo, portal, next.js, route-handler
**Arquivos principais:**
  - portal/src/app/api/admin/hero/route.ts
  - portal/src/lib/validators/hero.ts
  - portal/src/lib/auth/session.ts
**Resumo:** Endpoints REST no portal Next.js (App Router) para admins de tenant configurarem conteúdo dinâmico da home (hero, banners, etc.), com autenticação por role e isolamento cross-tenant via session.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| SPEC-20260602-1400 | API admin — hero principal da home | SCU-59-api-admin-hero |

## Estado atual

> Última atualização: 2026-06-02 14:00 (SPEC-20260602-1400)

Feature criada junto com SPEC-20260602-1400. Primeiro endpoint implementado: `GET + PUT /api/admin/hero`. Auth via `getAdminSession` ainda é stub (retorna null → 401) — depende de SPEC de auth futura para o portal.

Padrão estabelecido: endpoints em `app/api/admin/<recurso>/route.ts`, validação Zod em `lib/validators/<recurso>.ts`, sessão extraída por `lib/auth/session.ts`.

## Decisões arquiteturais ativas

- **Route Handlers do Next.js App Router para admin API** (origem: SPEC-20260602-1400, 2026-06-02 14:00) — Usa `export async function GET/PUT` em `app/api/admin/*/route.ts`. Alternativa REST dedicada no backend Express foi considerada mas rejeitada: portal já tem acesso ao banco via Drizzle (SPEC-20260518-1915) e evita round-trip extra.
- **tenant_id sempre da sessão, nunca do payload** (origem: SPEC-20260602-1400, 2026-06-02 14:00) — Isolamento cross-tenant garantido na camada de handler. Qualquer `tenant_id` no body é ignorado.
- **UPSERT via onConflictDoUpdate para recursos únicos por tenant** (origem: SPEC-20260602-1400, 2026-06-02 14:00) — Admin não precisa saber se recurso existe antes de salvar. Simplifica UX e elimina estado no cliente.

## Alternativas consideradas e rejeitadas

- **POST + PATCH separados** — rejeitado em SPEC-20260602-1400 (2026-06-02 14:00). Exige que cliente saiba se recurso já existe (GET-before-write). UX ruim para admin. UPSERT via PUT é idiomático para recursos únicos por tenant.
- **Endpoint no backend Express** — rejeitado em SPEC-20260602-1400 (2026-06-02 14:00). Portal já tem Drizzle + Postgres. Round-trip extra desnecessário. Centralizar auth no portal quando auth for implementada.

## Gotchas

- **getAdminSession é stub** (2026-06-02 14:00, SPEC-20260602-1400) — Retorna `null` até SPEC de auth do portal. Todos os endpoints retornam 401 em produção até auth estar implementada. Não testar em produção antes disso.

## Estado congelado (se houver)

_(nenhum)_