# Feature: portal-home

**Keywords:** home, hero, portal, next.js, server-component, cache, tenant
**Arquivos principais:**
  - portal/src/app/page.tsx
  - portal/src/app/api/admin/hero/route.ts
  - portal/src/lib/db/schema.ts (tabela tenant_hero)
  - portal/src/lib/db/migrations/0001_create_tenant_hero.sql
**Resumo:** Página principal do portal público de cada tenant, com hero configurável por admin, renderizado server-side com cache por tenant.

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

`page.tsx` atual é placeholder de validação do pipeline white-label (mostra logo, cores, font do tenant). Hero real ainda não está renderizado na página pública — depende desta SPEC e de SPEC de UI futura.

Tabela `tenant_hero` criada em SPEC-20260602-1400. API admin (`GET + PUT /api/admin/hero`) implementada. Endpoint público `GET /api/hero` (com cache de 5 min via `revalidateTag`) está fora do escopo desta SPEC — previsto em SPEC futura.

Cache de invalidação preparado: `revalidateTag(\`hero:${tenant_id}\`)` chamado no PUT admin. Quando endpoint público for implementado, usa `fetch(..., { next: { tags: [\`hero:${tenant_id}\`] } })`.

## Decisões arquiteturais ativas

- **Hero único por tenant (não lista)** (origem: SPEC-20260602-1400, 2026-06-02 14:00) — Diferente de banners (múltiplos), hero é config única com UNIQUE(tenant_id) no banco. Sempre existe (com defaults se não configurado).
- **GET admin retorna defaults, nunca 404** (origem: SPEC-20260602-1400, 2026-06-02 14:00) — UI nunca precisa tratar dois estados. `HERO_DEFAULTS` em `lib/validators/hero.ts`.
- **overlay_opacity como NUMERIC(4,2) no banco** (origem: SPEC-20260602-1400, 2026-06-02 14:00) — Float64 não representa 0.4 exatamente. NUMERIC evita jitter na persistência.

## Alternativas consideradas e rejeitadas

- **Hero como item de lista (tipo banners)** — rejeitado em SPEC-20260602-1400 (2026-06-02 14:00). Hero é semanticamente único por design (primeira coisa que o visitante vê). Lista exigiria lógica de "qual é o ativo" no frontend.

## Gotchas

- **Endpoint público /api/hero ainda não existe** (2026-06-02 14:00, SPEC-20260602-1400) — `revalidateTag` no PUT admin está correto mas não tem efeito até o endpoint público com `next: { tags }` ser implementado. Não há bug, só feature incompleta.
- **page.tsx atual é placeholder** (2026-06-02 14:00, SPEC-20260602-1400) — Não consome `tenant_hero` do banco ainda. Hero real na UI pública depende de SPEC de componentes da home.

## Estado congelado (se houver)

_(nenhum)_