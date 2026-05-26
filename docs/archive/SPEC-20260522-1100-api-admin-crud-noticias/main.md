# SPEC-20260522-1100: API Admin CRUD de Notícias com Fluxo de Publicação

**Status:** done
**Criada:** 2026-05-22 11:00
**Ativada:** 2026-05-22 11:00
**Concluida:** 2026-05-25 15:30
**Commit final:** _(commit pendente)_
**Keywords:** noticias, news, admin-api, crud, scheduler, publicacao-automatica, draft-publish-archive
**Features:** editorial-content, tenant-resolution, auth, infra-base
**Branch:** feature/SQU-50-api-admin-crud-de-noticias
**Depende de:** SPEC-20260514-2012 (isolamento multitenant)
**Origem:** usuario em 2026-05-22 11:00
**Resumo:** Entregar endpoints admin CRUD para notícias com fluxo de status (draft → scheduled → published → archived) com publicação imediata ou agendada, isolamento multitenant rigoroso, e cron job que promove scheduled para published automaticamente.

## Objetivo

Permitir editores criarem notícias com data de publicação futura (ou imediata). Admin escreve hoje, agenda publicação pra próxima 4ª-feira de manhã, e sistema publica automaticamente no horário — sem precisar que alguém fique online.

## Escopo

**DENTRO:**
- Entidade TypeORM: `News` com campos id, tenant_id, title, slug, summary, body (HTML), cover_image_url, author, category, status, published_at, created_at, updated_at
- Status enum: `draft | scheduled | published | archived`
- Transições validadas: draft → {scheduled, published}, scheduled → published, published → archived, qualquer → archived
- DELETE permitido apenas em draft ou archived
- Endpoints CRUD:
  - GET `/api/admin/news` com paginação, filtro status, busca por title
  - POST `/api/admin/news` cria notícia (status=draft)
  - PUT `/api/admin/news/:id` atualiza campos (não muda status)
  - DELETE `/api/admin/news/:id` remove (só draft/archived)
  - POST `/api/admin/news/:id/publish` publica imediato ou agenda
  - POST `/api/admin/news/:id/archive` arquiva (qualquer status)
- Cron endpoint: POST `/api/cron/publish-scheduled` com header `X-Cron-Secret`
- Isolamento multitenant: tenant_id ignorado em payload, cross-tenant = 404
- Validação: slug único por tenant, publish_at não > 1h no passado (400), body sanitizado (max 50k chars)
- Cache Redis invalidado em CREATE/UPDATE/DELETE
- Sanitização de body com sanitize-html

**FORA:**
- UI do backoffice (Fase 5)
- Endpoints públicos de listagem (SPEC-20260525-1000 futura)
- Integração com external newsletter systems
- Webhooks ao publicar
- Testes e2e com browser

## Implementação

### Arquitetura

1. **Entidade:**
   - `News`: id (uuid), tenant_id (uuid, FK), title (varchar 255), slug (varchar 255), summary (text), body (text, até 50k), cover_image_url (varchar 500), author (varchar 100), category (varchar 50), status (varchar 20: draft|scheduled|published|archived), published_at (timestamp nullable), created_at, updated_at
   - Índices: `UNIQUE (tenant_id, slug)`, `(tenant_id, status)`, `(tenant_id, published_at)`, `(status, published_at)` para cron
   - FK: tenant_id → tb_tenant (ON DELETE CASCADE)

2. **Schemas Zod** (`lib/validators/news.ts`):
   - `CreateNewsSchema`: title (1-255), slug (optional, gerado se ausente), summary (1-500), body (HTML, max 50k), cover_image_url (URL válida ou null), author (1-100), category (1-50)
   - `UpdateNewsSchema`: title?, slug?, summary?, body?, cover_image_url?, author?, category?
   - `PublishSchema`: publish_at (ISO 8601 optional — se ausente ou < 1min, publica imediato)
   - Sanitização: body via sanitize-html antes de salvar

3. **Repositories:**
   - `NewsRepository`: CRUD com isolamento `withTenant`
   - Methods: create, findById, findAll (paginado), findBySlug, update, delete, findScheduled (para cron)

4. **Services:**
   - `NewsService`: regras de negócio
   - Methods: create, update, publishImmediate, publishScheduled, archive, delete
   - Validações: transições de status, publish_at não muito no passado, slug duplicado

5. **Controllers:**
   - `NewsController`: mapear HTTP → service

6. **Rotas** (em app/api/admin/news):
   - `route.ts`: GET /api/admin/news (lista), POST /api/admin/news (cria)
   - `[id]/route.ts`: PUT /api/admin/news/:id (atualiza), DELETE /api/admin/news/:id (deleta)
   - `[id]/publish/route.ts`: POST /api/admin/news/:id/publish (publica/agenda)
   - `[id]/archive/route.ts`: POST /api/admin/news/:id/archive (arquiva)

7. **Cron:**
   - `app/api/cron/publish-scheduled/route.ts`: POST com validação `X-Cron-Secret`
   - Query: `SELECT id, tenant_id FROM news WHERE status='scheduled' AND published_at <= NOW()`
   - UPDATE cada um para status='published'
   - Invalidar cache por tenant

8. **State machine** (`lib/news/state.ts`):
   - Helper: `canTransition(currentStatus, nextStatus) → boolean`
   - Validação rigorosa de transições

### HTTP Status Codes

- **200 OK:** GET, PUT com sucesso; POST /publish ou /archive; cron retorna resumo
- **201 Created:** POST /api/admin/news com sucesso
- **204 No Content:** DELETE com sucesso
- **400 Bad Request:** validação falhou, publish_at no passado distante (>1h), body muito grande
- **401 Unauthorized:** sem JWT
- **403 Forbidden:** sem permissão (role-based, implementação posterior)
- **404 Not Found:** cross-tenant ou recurso não existe
- **409 Conflict:** slug duplicado, transição de status inválida (ex: tentar publicar novamente), DELETE em published/scheduled
- **422 Unprocessable Entity:** validação semântica (ex: body vazio)

### Pseudocódigo — POST /api/admin/news/:id/publish

```
1. Auth check (requireAuth middleware)
2. body = { publish_at: ISO string optional }
3. news = withTenant(tenant_id).findOne({id})
4. SE !news: 404
5. SE news.status === 'published': 409 (já publicada)
6. SE !body.publish_at OR body.publish_at <= now() + 1min:
     novoStatus = 'published'
     newPublishedAt = now()
7. SENAO:
     novoStatus = 'scheduled'
     newPublishedAt = body.publish_at
8. SE body.publish_at AND body.publish_at < now() - 1h: 400 (data inválida)
9. UPDATE news SET status=novoStatus, published_at=newPublishedAt WHERE id=...
10. invalidateNewsCache(tenant_id)
11. RETURN 200 { id, status: novoStatus, published_at: newPublishedAt }
```

### Pseudocódigo — Cron POST /api/cron/publish-scheduled

```
1. VALIDAR header X-Cron-Secret == process.env.CRON_SECRET (senão 401)
2. now = NOW()
3. news_scheduled = SELECT id, tenant_id FROM news WHERE status='scheduled' AND published_at <= now
4. PARA CADA row:
     UPDATE news SET status='published' WHERE id=row.id
5. tenants_affected = SELECT DISTINCT tenant_id FROM news WHERE status='published' AND published_at BETWEEN (now - 1min) AND now
6. invalidar cache de cada tenant
7. RETURN 200 { promoted: { news: count } }
```

## Critério de aceite

- [x] Entidade `News` criada com índices `uq_tb_news_tenant_slug (tenant_id, slug)`, `(tenant_id, status)`, `(tenant_id, published_at)`, `(status, published_at)` (2026-05-22 11:00, commit `76c5b19`)
- [x] Validação manual em `dtos/news.dto.ts` (parser + validator) (2026-05-22 11:00, commit `76c5b19`) — `lib/validators/news.ts` com Zod **não foi criado**; SPEC alinha com decisão da SPEC-20260518-1625 (parser manual sem Zod). Funcionalmente equivalente.
- [x] Helper state machine em `lib/news/state.ts` (`canTransition`, `canDelete`) (2026-05-22 11:00, commit `76c5b19`)
- [x] GET `/api/admin/news` lista paginada com filtros status e busca (2026-05-22 11:00, commit `76c5b19`)
- [x] POST `/api/admin/news` cria notícia com status=draft (2026-05-22 11:00, commit `76c5b19`)
- [x] PUT `/api/admin/news/:id` atualiza campos sem mudar status (2026-05-22 11:00, commit `76c5b19`)
- [x] POST `/api/admin/news/:id/publish` publica imediato ou agenda (2026-05-22 11:00, commit `76c5b19`)
- [x] POST `/api/admin/news/:id/archive` arquiva (qualquer status) (2026-05-22 11:00, commit `76c5b19`)
- [x] DELETE `/api/admin/news/:id` remove (só draft/archived, senão 409) (2026-05-22 11:00, commit `76c5b19`)
- [x] POST `/api/cron/publish-scheduled` com X-Cron-Secret promove scheduled → published (2026-05-22 11:00, commit `76c5b19`)
- [x] Cron sem header retorna 401; sem `CRON_SECRET` configurado retorna 500 (2026-05-22 11:00, commit `76c5b19`)
- [x] Validação: publish_at não > 1h no passado lança `NewsPublishDateInPastError` (2026-05-22 11:00, commit `76c5b19`)
- [x] Validação: slug único por tenant via constraint `uq_tb_news_tenant_slug` + check no service (2026-05-22 11:00, commit `76c5b19`)
- [x] Validação: body max 50k chars + **sanitização HTML real** via `sanitizeRichTextHtml` (2026-05-25 15:00, commit pendente) — antes era só `trim()`/length cap; alinhado com decisão da SPEC-20260518-1625
- [x] Isolamento multitenant: `tenant_id` ignorado em payload, cross-tenant retorna 404 via `withTenant` + `TenantSubscriber` (2026-05-22 11:00, commit `76c5b19`)
- [x] Cache Redis invalidado em CREATE/UPDATE/DELETE/publish/archive (`news:detail:{tid}:{id}` + `news:list:{tid}:*`) (2026-05-22 11:00, commit `76c5b19`)
- [x] Transições de status validadas via `canTransition` (2026-05-22 11:00, commit `76c5b19`)
- [x] **Cron interno (setInterval 60s) cobre news também** — `jobs/publish-scheduled.ts` agora atualiza `tb_news` além de `tb_event` e `tb_theater_show` (2026-05-25 15:00, commit pendente). Coexiste com endpoint POST (defesa em profundidade).
- [x] **Features tocadas (editorial-content, tenant-resolution, auth, infra-base) atualizadas** com timestamp e referência a esta SPEC (2026-05-25 15:30, commit pendente)
- [x] `state.md` com entrada `[conclusão]` (2026-05-25 15:30, commit pendente)
- [x] `memory.md` com TL;DR final atualizado (2026-05-25 15:30, commit pendente)
