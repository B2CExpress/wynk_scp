# SPEC-20260602-1400: API admin — hero principal da home

**Status:** active
**Criada:** 2026-06-02 14:00
**Ativada:** 2026-06-02 14:00
**Re-escopada:** 2026-06-02 13:40 — Next.js App Router + Drizzle (no portal) → **Express + TypeORM (no backend)**. O desenho original foi escrito pra arquitetura Drizzle-no-portal que foi descartada no re-escopo geral do projeto; nenhum código tinha sido entregue (a pasta estava em `archive/` indevidamente, com `Status: active` e 0 critérios marcados). Decisão do usuário em 2026-06-02 13:40.
**Concluída:** —
**Commit final:** —
**Keywords:** hero, admin, api, express, typeorm, upsert, cache, multitenant, editorial
**Features:** editorial-content
**Branch:** SCU-59-API-admin-hero-principal-da-home
**Depende de:** —
**Origem:** usuário em 2026-06-02 14:00; re-escopada em 2026-06-02 13:40.
**Resumo:** `GET + PUT /api/admin/hero` no **backend Express** para configurar o hero principal da home por tenant — config única por tenant (não lista), GET retorna defaults se não existe, PUT faz UPSERT com validação manual em DTO e invalida cache Redis. Isolamento multitenant via `withTenant()` + `requireAuth` real.

## Objetivo

Permitir que admins de tenant configurem o hero principal da home (título, subtítulo, imagem de fundo, CTA, overlay) via API REST no backend. O hero é **config única por tenant** (1 linha por tenant, diferente de banners que são lista). `GET` sempre retorna 200 com defaults se o tenant ainda não configurou; `PUT` faz UPSERT e invalida o cache.

## Escopo

**DENTRO:**
- Entity `Hero` (`tb_hero`, colunas `hero_*`, **unique `tenant_id`** — 1 por tenant) + migration no schema `scp`.
- `GET /api/admin/hero` — retorna o hero do tenant; 200 com `HERO_DEFAULTS` se não existe (nunca 404).
- `PUT /api/admin/hero` — UPSERT (cria ou atualiza a única linha do tenant) com validação manual em DTO; invalida cache Redis.
- Validação campo-a-campo em `backend/src/dtos/hero.dto.ts` (manual, padrão do repo — **sem Zod**), com `HERO_DEFAULTS` exportado.
- `requireAuth` **real** nas rotas (não stub — o backend já tem o middleware, usado por banners/popup).
- Isolamento cross-tenant: `tenant_id` sempre do contexto da sessão (`requireTenantContext`/`withTenant`), nunca do payload.
- Wiring em `server.ts`/`app.ts` (+ stub no `__tests__/helpers/mock-deps.ts`).
- Testes backend.

**FORA:**
- Endpoint público `GET /api/v1/hero` (com cache 5 min) — SPEC separada.
- UI do backoffice para chamar estes endpoints.
- Upload de imagem (`background_image_url` é URL externa).

## Implementação

Modelo de referência: **banners/popup** (mesma feature `editorial-content`). Reaproveita `withTenant()`, cache Redis por tenant (`cached`/`invalidateByPattern`), `requireAuth`, e o padrão de DTO manual (`parseHeroInput`/`validateHeroInput`).

**Diferença-chave vs banners/popup:** hero é **singleton por tenant** (não tem `:id` na rota). O repository resolve sempre "a linha do tenant atual"; o `PUT` faz upsert (se existe → update; senão → insert). Unicidade garantida por índice unique em `tenant_id`.

**Entity `Hero` (`tb_hero`):**
- `id` (uuid PK, `hero_id`), `tenantId` (`tenant_id`, **unique**), `title`, `subtitle`, `backgroundImageUrl`, `ctaText`, `ctaLink`, `overlayColor`, `overlayOpacity`, `createdAt`, `updatedAt`.
- `overlayOpacity` como `numeric(4,2)` (evita jitter de float; 0.4 não é exato em float64). TypeORM devolve `numeric` como string → converter pra `number` na serialização.

**GET retorna defaults:** se `findForCurrentTenant` devolve null, o service responde `HERO_DEFAULTS` (constante no DTO) com 200. UI não precisa tratar "existe vs não existe".

### Validações (campo-a-campo, 400 com `{ errors: [{field, message}] }`)

| Campo | Regra |
|---|---|
| `title` | string, obrigatório, max 300 |
| `subtitle` | string, opcional, max 500 |
| `background_image_url` | URL válida, obrigatório |
| `cta_text` | string, opcional, max 50 |
| `cta_link` | URL absoluta OU path interno (`/...`), opcional |
| `overlay_color` | regex `^#[0-9A-Fa-f]{6}$`, default `#000000` |
| `overlay_opacity` | number entre 0 e 1, default `0.4` |

Body é snake_case (contrato externo). `tenant_id` no payload é ignorado.

## Critério de aceite

- [ ] Entity `Hero` (`tb_hero`, unique `tenant_id`) + migration; registrada em `config/database.ts`; backend compila
- [ ] `GET /api/admin/hero` retorna 200 com `HERO_DEFAULTS` quando o tenant não tem hero
- [ ] `GET /api/admin/hero` retorna 200 com os dados do banco quando existe
- [ ] `PUT /api/admin/hero` cria (INSERT) quando não existia e atualiza (UPDATE) no segundo PUT — sempre 1 linha por tenant
- [ ] `PUT` com `overlay_opacity` fora de [0,1] → 400 campo-a-campo; sem `title` → 400; sem `background_image_url` → 400; `overlay_color` inválido → 400
- [ ] `tenant_id` no body é ignorado (isolamento cross-tenant)
- [ ] Cache invalidado no PUT (Redis, padrão `hero:{tenant}`)
- [ ] Rotas com `requireAuth` (sem sessão → 401)
- [ ] Testes backend cobrindo defaults no GET, upsert, validação e isolamento (verdes)
- [ ] **Features tocadas (editorial-content) atualizadas** com timestamp e referência a esta SPEC
- [ ] Features-fantasma `admin-content-api` e `portal-home` removidas (descreviam o desenho Next/Drizzle descartado)
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
