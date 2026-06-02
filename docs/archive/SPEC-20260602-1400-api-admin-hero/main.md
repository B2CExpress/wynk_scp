# SPEC-20260602-1400: API admin — hero principal da home

**Status:** active
**Criada:** 2026-06-02 14:00
**Ativada:** 2026-06-02 14:00
**Concluída:** —
**Commit final:** —
**Keywords:** hero, admin, api, portal, upsert, cache
**Features:** admin-content-api, portal-home
**Branch:** SCU-59-api-admin-hero
**Depende de:** SPEC-20260518-1915-postgres-drizzle-setup (Drizzle + Postgres no portal)
**Origem:** usuário em 2026-06-02 14:00
**Resumo:** Implementa GET + PUT /api/admin/hero no portal (Next.js App Router) para configurar o hero principal da home por tenant, com UPSERT via Drizzle, validação Zod e invalidação de cache público.

---

## Objetivo

Permitir que admins de tenant configurem rapidamente o hero principal da home (título, imagem de fundo, CTA, overlay) via API REST no portal.

O hero é config única por tenant (não é uma lista como banners). GET sempre retorna 200 com defaults se o tenant ainda não configurou. PUT faz UPSERT e invalida o cache público da home.

---

## Escopo

**DENTRO:**
- `GET /api/admin/hero` — retorna hero do tenant; 200 com defaults se não existe
- `PUT /api/admin/hero` — UPSERT com validação Zod; invalida cache público
- Validador Zod em `portal/src/lib/validators/hero.ts`
- Schema Drizzle da tabela `tenant_hero` em `portal/src/lib/db/schema.ts`
- Migration SQL `0001_create_tenant_hero.sql`
- Stub de `getAdminSession` em `portal/src/lib/auth/session.ts`
- Isolamento cross-tenant: `tenant_id` vem sempre da sessão, nunca do payload

**FORA:**
- Implementação real do JWT/auth (stub apenas — depende de SPEC futura)
- Endpoint público `GET /api/hero` (cache de 5 min) — será feito em SPEC separada
- UI do backoffice para chamar estes endpoints
- Upload de imagem (background_image_url é URL externa)

---

## Implementação

### Arquivos criados/modificados

```
portal/src/
  app/api/admin/hero/route.ts       ← GET + PUT handlers
  lib/validators/hero.ts            ← Zod schema + HERO_DEFAULTS
  lib/db/schema.ts                  ← tabela tenant_hero (Drizzle)
  lib/db/index.ts                   ← singleton db client (se não existir)
  lib/db/migrations/
    0001_create_tenant_hero.sql     ← migration SQL
  lib/auth/session.ts               ← stub getAdminSession
```

### Decisões técnicas

- **UPSERT via `onConflictDoUpdate`** — evita dois estados (existe/não existe) que obrigam o cliente a saber qual usar. Admin nunca precisa checar antes.
- **GET retorna defaults, nunca 404** — UI não precisa tratar dois estados. Defaults em `HERO_DEFAULTS` constante no validator.
- **`overlay_opacity` como NUMERIC(4,2) no banco** — evita imprecisão de float (0.4 não é representável exato em float64). Convertido para `number` na resposta JSON.
- **`tenant_id` sempre da sessão** — nunca do payload. Qualquer `tenant_id` no body é ignorado silenciosamente.
- **`revalidateTag(hero:${tenant_id})`** no PUT — invalida cache do endpoint público (quando implementado).

### Validações Zod

| Campo | Regra |
|---|---|
| `title` | string, obrigatório, max 300 |
| `subtitle` | string, opcional, max 500 |
| `background_image_url` | URL válida, obrigatório |
| `cta_text` | string, opcional, max 50 |
| `cta_link` | URL absoluta OU path interno (`/`), opcional |
| `overlay_color` | regex `^#[0-9A-Fa-f]{6}$`, default `#000000` |
| `overlay_opacity` | number entre 0 e 1, default `0.4` |

Erros retornados como `{ error, errors: { campo: [mensagens] } }` com status 400.

### Auth (stub)

`getAdminSession` retorna `null` até auth real ser implementada — endpoints respondem 401 por enquanto. Roles aceitas: `tenant_admin` ou `superadmin`.

---

## Critério de aceite

- [ ] `GET /api/admin/hero` retorna 200 com defaults quando tenant não tem hero cadastrado
- [ ] `GET /api/admin/hero` retorna 200 com dados do banco quando existe
- [ ] `PUT /api/admin/hero` cria hero (INSERT) quando tenant não tinha — SELECT confirma 1 linha
- [ ] `PUT /api/admin/hero` atualiza hero (UPDATE) em segundo PUT — SELECT mantém 1 linha, valores novos
- [ ] `PUT /api/admin/hero` com `overlay_opacity: 2.5` retorna 400 com erro campo-a-campo
- [ ] `PUT /api/admin/hero` sem `title` retorna 400
- [ ] `PUT /api/admin/hero` sem `background_image_url` retorna 400
- [ ] `overlay_color` inválido (`#ZZZZZZ`) retorna 400
- [ ] `tenant_id` no body é ignorado (isolamento cross-tenant garantido)
- [ ] Cache invalidado via `revalidateTag` no PUT
- [ ] Sem sessão válida: 401. Role errada: 403
- [ ] **Features tocadas (admin-content-api, portal-home) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado