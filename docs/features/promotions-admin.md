# Feature: promotions-admin

**Keywords:** promotions, promocoes, descontos, validade, valid_from, valid_until, expiracao-natural, admin-api, crud, multitenant, store-fk
**Arquivos principais:**
  - `backend/src/entities/Promotion.ts` (`tb_promotion`, FK obrigatória a `tb_store` + `tb_tenant`, unique `(tenant_id, slug)`)
  - `backend/src/dtos/promotion.dto.ts` (parser + validators manuais)
  - `backend/src/repositories/promotion.repository.ts` (`withTenant`, `storeExistsForCurrentTenant`, LEFT JOIN com `tb_store` na listagem)
  - `backend/src/services/promotion.service.ts` (erros tipados, cache invalidation cobrindo stores)
  - `backend/src/controllers/promotion.controller.ts` (7 handlers REST)
  - `backend/src/routes/promotion.routes.ts` (`/api/admin/promotions/*`, protegido por `requireAuth`)
  - `backend/src/migrations/1746748500000-CreatePromotionTable.ts`
  - `backend/__tests__/helpers/mock-deps.ts` (`makeStubPromotionController`)
  - `tests/helpers/setup.ts` (stub `promotionController` para test:isolation)
**Resumo:** CRUD admin de promoções vinculadas obrigatoriamente a loja (FK), com janela de validade `valid_from`/`valid_until` e expiração natural via filtro de query (sem cron). Isolamento multitenant em 3 camadas (`withTenant` + `TenantSubscriber` + validação cross-tenant explícita de `store_id` retornando 422). Slug único por tenant. Cache invalidation cobre `promotions:*` E `stores:*` (página/listagem de loja exibe preview de promoções).

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| SPEC-20260519-2010 | 2026-05-25 | _(commit pendente)_ | API Admin CRUD de Promoções |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| _(nenhuma)_ | | |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| _(nenhuma)_ | | |

## Estado atual

### Schema

`scp.tb_promotion`:
- `promotion_id uuid PK`
- `tenant_id uuid NOT NULL FK → tb_tenant ON DELETE CASCADE`
- `store_id uuid NOT NULL FK → tb_store ON DELETE CASCADE`
- `promotion_title varchar(200)`
- `promotion_slug varchar(250)`
- `promotion_description text`
- `promotion_image_url text NULL`
- `promotion_discount_label varchar(50)`
- `promotion_valid_from timestamptz`
- `promotion_valid_until timestamptz`
- `promotion_status varchar(20) DEFAULT 'draft'` (enum semântico: `draft | published | archived`)
- `promotion_published_at timestamptz NULL`
- `promotion_created_at`, `promotion_updated_at`

Constraints/indexes:
- `uq_tb_promotion_tenant_slug (tenant_id, promotion_slug)` — slug único POR TENANT (mesmo slug em tenants diferentes é permitido)
- `ix_tb_promotion_tenant_store (tenant_id, store_id)` — listagem por loja
- `ix_tb_promotion_tenant_status_published (tenant_id, promotion_status, promotion_published_at)` — filtro de portal público
- `ix_tb_promotion_tenant_valid_until (tenant_id, promotion_valid_until)` — filtro de expiração

### Endpoints admin

Todos sob `requireAuth`. JWT carrega tenant context (sem resolução por host pra rotas `/api/admin/*`).

- `GET /api/admin/promotions` — lista paginada. Query: `page` (default 1), `limit` (default 10, max 50), `status` (`draft|published|archived`), `store_id`, `expired` (`true|false` ou omitido). Response inclui `store: {id, name, slug}` via LEFT JOIN.
- `GET /api/admin/promotions/:id` — detalhe.
- `POST /api/admin/promotions` — cria draft. Valida `store_id` cross-tenant → 422 `store_not_found` se loja não pertence ao tenant.
- `PUT /api/admin/promotions/:id` — atualiza, campos opcionais. Re-valida `store_id` se mudou.
- `DELETE /api/admin/promotions/:id` — só permite se status `draft` ou `archived`. Caso contrário 409 `cannot_delete`.
- `POST /api/admin/promotions/:id/publish` — muda status para `published` e seta `publishedAt = now()`.
- `POST /api/admin/promotions/:id/archive` — muda status para `archived` (de qualquer estado).

### Validações

- `title`: string não-vazia, ≤200 chars
- `slug`: ≤250 chars, gerado automaticamente de `title` se omitido (`.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')`). Único por tenant → 409 `slug_conflict`.
- `description`: string não-vazia (HTML permitido — apenas `trim()`, **sem** sanitize-html nesta entrega — ver Decisões)
- `image_url`: URL ou null
- `discount_label`: string não-vazia, ≤50 chars (vai em destaque visual)
- `valid_from`, `valid_until`: ISO 8601 com timezone, até 2 anos no futuro
- Cross-field: `valid_until > valid_from` (estrita, igualdade rejeitada) → 400

### Isolamento multitenant (defense-in-depth)

1. **Query layer:** `withTenant(qb)` em todo `QueryBuilder` da `PromotionRepository`.
2. **Entity layer:** `TenantSubscriber` injeta `tenantId` no `beforeInsert` e proíbe alteração no `beforeUpdate` (ver [[tenant-resolution]]).
3. **Business layer:** `storeExistsForCurrentTenant(storeId)` no service antes de criar/atualizar — bloqueia tentativa de associar a loja de outro tenant retornando 422 (e não 404, porque a loja existe globalmente, só não no tenant atual).
4. **DB layer:** unique `(tenant_id, slug)` permite mesmo slug em tenants diferentes (isolamento garantido pela coluna no índice).

### Cache invalidation

Em toda mutação (CREATE/UPDATE/DELETE/PUBLISH/ARCHIVE):
1. `promotions:detail:{tenantId}:*` — detalhe da promoção
2. `promotions:list:{tenantId}:*` — listagem admin/pública
3. `stores:detail:{tenantId}:{storeId}:*` — página de loja exibe promoções ativas
4. `stores:list:{tenantId}:*` — listagem de lojas pode exibir preview de promoções

Invalidação via `invalidateByPattern` (SCAN + DEL — ver [[infra-base]]).

### Expiração

Sem cron. Filtros baseados em `valid_until` na query:
- **Pública (futuro):** `WHERE status = 'published' AND published_at <= now() AND valid_until >= now()`
- **Admin com `?expired=true`:** `WHERE valid_until < now()` (histórico)
- **Admin com `?expired=false`:** `WHERE valid_until >= now()` (ativas)
- **Admin sem filtro:** todas (independente de validade)

> Última atualização: 2026-05-25 09:30 (SPEC-20260519-2010)

## Decisões arquiteturais ativas

- **Expiração natural via query, sem cron** (origem: SPEC-20260519-2010, 2026-05-19 20:10) — Diferente de Event/TheaterShow ([[editorial-content]]) que têm `setInterval` mudando `status='scheduled' → 'published'` quando `published_at <= now()`. Promoções não têm "scheduled" — vão pra `published` por chamada explícita do endpoint. "Expirada" é só filtro de leitura, sem mudança de estado no DB. Trade-off: o registro permanece com `status='published'` mesmo após `valid_until` — consumer **precisa** aplicar `valid_until >= now()` pra não exibir expiradas.
- **`store_id` cross-tenant → 422 (não 404)** (origem: SPEC-20260519-2010, 2026-05-19 20:10) — A loja existe no sistema, só não no tenant atual. 422 é mais correto semanticamente que 404 (que seria "promoção não encontrada"). Cliente recebe sinal claro: "esse `store_id` é inválido pra você".
- **Validação `store_id` no service via `storeExistsForCurrentTenant` antes do INSERT** (origem: SPEC-20260519-2010, 2026-05-19 20:10) — Aceita custo de 1 query extra no caminho de create/update pra fail-fast com mensagem específica. Sem essa validação, a FK ainda bloquearia (ou silenciosamente associaria), mas o erro seria genérico.
- **Cache invalidation acopla promotions ↔ stores** (origem: SPEC-20260519-2010, 2026-05-19 20:10) — Mutação de promoção invalida cache de loja porque o detalhe/listagem da loja exibe preview de promoções ativas. Sem isso, criar promoção não aparece no detalhe da loja até o TTL natural.
- **`description` aceita HTML sem sanitização (apenas `trim()`)** (origem: SPEC-20260519-2010, 2026-05-19 20:10) — Diferente de [[editorial-content]] que aplica `sanitizeRichTextHtml` em `body`/`synopsis`. Decisão MVP: portal público de promoções ainda não existe; quando existir, revisitar (provavelmente aplicar mesmo helper). Trade-off: XSS possível se o portal renderizar HTML cru sem sanitização própria — risco contido enquanto o consumo é só admin.
- **Slug único por `(tenant_id, slug)`** (origem: SPEC-20260519-2010, 2026-05-19 20:10) — Mesmo padrão de Event/Store. Permite mesmo slug em tenants diferentes (caso típico: dois shoppings com promo "black-friday").
- **Delete bloqueado se `status='published'`** (origem: SPEC-20260519-2010, 2026-05-19 20:10) — Força fluxo: archive primeiro, depois delete. Evita exclusão acidental de promoção viva. Trade-off: rigidez vs. proteção de operação.

## Alternativas consideradas e rejeitadas

- **Cron pra "expirar" promoções (mudar status para `expired`)** — rejeitada em SPEC-20260519-2010 (2026-05-19 20:10). Motivo: adiciona componente background (custo operacional) sem benefício real; o filtro de query já cobre o caso e é mais barato. Status `expired` redundante com `valid_until < now()`.
- **`store_id` cross-tenant → 404** — rejeitada em SPEC-20260519-2010 (2026-05-19 20:10). Motivo: 404 sinaliza "rota/recurso não existe", confundindo com "promoção não encontrada". 422 é mais explícito sobre "payload semanticamente inválido".
- **Permitir `valid_until == valid_from`** (igualdade) — rejeitada em SPEC-20260519-2010 (2026-05-19 20:10). Motivo: promoção com duração zero é erro do usuário; rejeitar fail-fast vs. aceitar e nunca aparecer no público.
- **Sanitização HTML em `description`** — adiada, considerada em SPEC-20260519-2010 (2026-05-19 20:10). Motivo: portal público ainda não existe; XSS contido enquanto consumo é admin. SPEC futura de portal público vai puxar `sanitizeRichTextHtml` ([[infra-base]]).
- **Categoria/tag pra promoções** — fora do escopo desta SPEC. Pode entrar em sub-SPEC se virar requisito.

## Gotchas

- **Status `published` permanece após `valid_until` passar** (2026-05-19 20:10, SPEC-20260519-2010) — Consumer **deve** filtrar por `valid_until >= now()` pra não exibir expiradas. Visível com `?expired=true` no admin (histórico).
- **`description` aceita HTML mas não sanitiza** (2026-05-19 20:10, SPEC-20260519-2010) — Risco de XSS se portal público renderizar como HTML cru. Mitigação até SPEC futura: portal admin já é trusted; portal público ainda não existe.
- **Slug auto-gerado pode colidir entre promoções com títulos parecidos** (2026-05-19 20:10, SPEC-20260519-2010) — `"Black Friday 2026!"` e `"Black Friday 2026"` ambos geram `black-friday-2026`. Resultado: 409 `slug_conflict` na segunda. Admin pode passar `slug` explícito no payload para evitar.
- **Cache de loja invalidado em mutação de promotion** (2026-05-19 20:10, SPEC-20260519-2010) — Observar em logs: criar promoção também limpa `stores:list:{tid}:*` e `stores:detail:{tid}:{sid}:*`. Esperado, não bug.
- **Delete em status `published` retorna 409, não 404** (2026-05-19 20:10, SPEC-20260519-2010) — A promoção existe (404 seria errado). 409 sinaliza "conflito de estado": precisa arquivar primeiro.
- **Mid-merge `main` deixa `database.ts` com bloco `BACKEND_SRC` duplicado** (2026-05-25 09:10, SPEC-20260519-2010) — Padrão recorrente quando branches puxam `main` em paralelo. Verificar `git status` antes de commitar; rodar `typecheck` antes de declarar "merged".

## Estado congelado (se houver)

_(nenhum)_
