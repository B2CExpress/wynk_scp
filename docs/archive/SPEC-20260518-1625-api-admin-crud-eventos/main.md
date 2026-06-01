# SPEC-20260518-1625: API Admin CRUD de Eventos e Apresentações Teatrais

**Status:** done
**Criada:** 2026-05-18 16:25
**Ativada:** 2026-05-18 16:25
**Concluida:** 2026-05-25 08:50
**Commit final:** `42197eb`
**Keywords:** eventos, theater-shows, admin-api, crud, multitenant, isolamento
**Features:** editorial-content, tenant-resolution, auth, infra-base
**Branch:** feature/SQU-51-api-admin-crud-de-eventos
**Depende de:** SPEC-20260514-2012 (isolamento multitenant)
**Origem:** usuario em 2026-05-18 16:25
**Resumo:** Entregar endpoints admin CRUD para eventos (com starts_at/ends_at) e peças teatrais com sessões individualizadas, garantindo isolamento multitenant, validação rigorosa e cron de publicação automática.

## Objetivo

Expandir a plataforma editorial com conteúdo datado (eventos, apresentações teatrais) que gera maior conversão. Eventos são similares a notícias mas com datas; theater shows são complexos — 1 peça tem N sessões, cada uma com data e link de ingresso próprio.

## Escopo

**DENTRO:**
- Entidades TypeORM: `Event`, `TheaterShow`, `TheaterSession`
- Endpoints CRUD para `/api/admin/events` (POST, GET, PUT, GET by ID, DELETE, PUBLISH)
- Endpoints CRUD para `/api/admin/theater-shows` (POST, GET, PUT, GET by ID, DELETE, PUBLISH)
- Endpoints para `/api/admin/theater-shows/:id/sessions` (POST adicionar sessão)
- Endpoints para `/api/admin/theater-sessions/:id` (PUT atualizar/marcar esgotada, DELETE remover)
- Validação com Zod: ISO 8601 com timezone, ends_at >= starts_at, validação de conflito de horário entre sessões (< 90min)
- Isolamento multitenant: `tenant_id` ignorado em payload, resposta 404 para cross-tenant, validação de categorias cross-tenant = 422
- Sanitização de `body` e `synopsis`
- Invalidação de cache Redis ao criar/atualizar/deletar
- Cron de publicação que cubra eventos e theater_shows agendados
- Repositories com `withTenant` garantindo isolamento
- Services com validações e cache
- Controllers com tratamento de erro adequado

**FORA:**
- UI do backoffice para gerenciar eventos e theater shows (Fase 5)
- Endpoints públicos de listagem (Fase posterior)
- Integração com sistema externo de ingressos (Sympla)
- Testes e2e com browser

## Implementação

### Arquitetura

1. **Entidades:**
   - `Event`: id, tenant_id, title, summary, body, starts_at, ends_at, location, ticket_info, status, published_at, created_at, updated_at
   - `TheaterShow`: id, tenant_id, title, synopsis, duration_minutes, age_rating, ticket_url, status, published_at, created_at, updated_at
   - `TheaterSession`: id, tenant_id, show_id, starts_at, ticket_url, is_sold_out, created_at, updated_at
   - Índices: `(tenant_id, starts_at)` em Event e TheaterSession; `(tenant_id, slug)` único em Event; `(tenant_id, status, published_at)` em Event

2. **DTOs e Validadores:**
   - `lib/validators/event.ts`: schemas Zod para criar/atualizar eventos
   - `lib/validators/theater.ts`: schemas Zod para criar/atualizar shows e sessões
   - Validação: ISO 8601 com timezone, ends_at >= starts_at (eventos), duration_minutes 10-600 (int), age_rating enum (L, 10, 12, 14, 16, 18), URL válida para ticket_url, conflito de sessão < 90min

3. **Repositories:**
   - `EventRepository`: CRUD com isolamento `withTenant`, busca por slug/data
   - `TheaterShowRepository`: CRUD com isolamento, JOIN com sessions
   - `TheaterSessionRepository`: CRUD com isolamento, validação de conflito
   - Todas usam transactions para manter consistência

4. **Services:**
   - `EventService`: criar, atualizar, publicar, invalidar cache
   - `TheaterShowService`: criar, atualizar, publicar, invalidar cache
   - `TheaterSessionService`: adicionar, atualizar, remover com validação de conflito

5. **Controllers:**
   - `EventController`: mapear HTTP → service, traduzir erros em status codes
   - `TheaterController`: mapear HTTP → service

6. **Rotas:**
   - GET/POST `/api/admin/events` (requireAuth)
   - GET/PUT/DELETE `/api/admin/events/:id` (requireAuth)
   - POST `/api/admin/events/:id/publish` (requireAuth)
   - GET/POST `/api/admin/theater-shows` (requireAuth)
   - GET/PUT/DELETE `/api/admin/theater-shows/:id` (requireAuth)
   - POST `/api/admin/theater-shows/:id/publish` (requireAuth)
   - POST `/api/admin/theater-shows/:id/sessions` (requireAuth)
   - PUT/DELETE `/api/admin/theater-sessions/:id` (requireAuth)

7. **Cron:**
   - Já existe `jobs/publish-scheduled.ts` — estender para cubrir `Event` e `TheaterShow`
   - Query: `WHERE status = 'scheduled' AND published_at <= NOW() RETURNING id`

### HTTP Status Codes

- **201 Created:** POST com sucesso
- **200 OK:** GET, PUT com sucesso
- **204 No Content:** DELETE com sucesso
- **400 Bad Request:** validação falhou (lista de erros campo-a-campo)
- **401 Unauthorized:** sem JWT
- **403 Forbidden:** JWT válido mas acesso negado (não implementar, auth é role-based posterior)
- **404 Not Found:** cross-tenant ou recurso não existe
- **409 Conflict:** validação de conflito (ex.: sessão < 90min de outra)
- **422 Unprocessable Entity:** categoria de outro tenant em payload

### Pseudocódigo (handler POST /api/admin/theater-shows/:id/sessions)

```
1. Auth + requireAuth middleware
2. show = withTenant(tenant_id).findOne(theater_shows, {id: params.id})
3. SE !show: 404 (cross-tenant blindado)
4. body = { starts_at, ticket_url? }
5. validar com Zod
6. SE starts_at < NOW() + 1h: 400 (futuro mínimo)
7. validar conflito: sessões da mesma peça com |starts_at - nova| < 90min → 409
8. INSERT em theater_sessions com show_id, tenant_id
9. invalidar cache de listagem de shows
10. retornar 201 com a sessão criada
```

## Critério de aceite

- [x] Entidades `Event`, `TheaterShow`, `TheaterSession` criadas com indexes corretos (2026-05-18 16:26, commit `3c48de1`)
- [x] Validadores funcionais em `dtos/event.dto.ts` e `dtos/theater.dto.ts` — parser/validador manual (sem Zod, decisão registrada) (2026-05-18 16:28, commit `3c48de1`)
- [x] `POST /api/admin/events` cria evento, `GET /api/admin/events` lista, `PUT /api/admin/events/:id` atualiza (2026-05-18 16:32, commit `3c48de1`)
- [x] `DELETE /api/admin/events/:id` remove evento (retorna 204) (2026-05-18 16:32, commit `3c48de1`)
- [x] `POST /api/admin/events/:id/publish` publica evento agendado (2026-05-18 16:32, commit `3c48de1`)
- [x] `POST /api/admin/theater-shows` cria peça (2026-05-18 16:32, commit `3c48de1`)
- [x] `GET /api/admin/theater-shows/:id` retorna peça com `sessions[]` no response (2026-05-18 16:32, commit `3c48de1`)
- [x] `PUT /api/admin/theater-shows/:id` atualiza peça (2026-05-18 16:32, commit `3c48de1`)
- [x] `DELETE /api/admin/theater-shows/:id` remove peça (CASCADE em sessões) (2026-05-18 16:32, commit `3c48de1`)
- [x] `POST /api/admin/theater-shows/:id/publish` publica peça agendada (2026-05-18 16:32, commit `3c48de1`)
- [x] `POST /api/admin/theater-shows/:id/sessions` adiciona sessão com validação de conflito < 90min (2026-05-18 16:32, commit `3c48de1`)
- [x] `PUT /api/admin/theater-sessions/:id` atualiza sessão (ex.: marcar `is_sold_out`) (2026-05-18 16:32, commit `3c48de1`)
- [x] `DELETE /api/admin/theater-sessions/:id` remove sessão (retorna 204) (2026-05-18 16:32, commit `3c48de1`)
- [x] Validação: ends_at >= starts_at (eventos) (2026-05-18 16:31, commit `3c48de1`)
- [x] Validação: starts_at no futuro (1h mínimo) — sessões (2026-05-18 16:31, commit `3c48de1`)
- [x] Validação: conflito de sessão < 90min retorna 409 (2026-05-18 16:31, commit `3c48de1`)
- [x] Isolamento multitenant: `tenant_id` ignorado em payload (2026-05-18 16:30, commit `3c48de1`)
- [x] Cross-tenant retorna 404 (2026-05-18 16:30, commit `3c48de1`) — validação de categoria 422 não aplica, entidades não têm coluna de categoria
- [x] Cache Redis invalidado em CREATE/UPDATE/DELETE (2026-05-18 16:32, commit `3c48de1`)
- [x] Cron de publicação cobre `Event` e `TheaterShow` (2026-05-25 08:50, commit `42197eb`)
- [x] Sanitização de `body` (eventos) e `synopsis` (shows) via `sanitize-html` (2026-05-25 08:50, commit `42197eb`)
- [x] **Features tocadas (editorial-content, tenant-resolution, auth, infra-base) atualizadas** com timestamp e referência a esta SPEC (2026-05-25 08:55, commit pendente)
- [x] `state.md` com entrada `[conclusão]` (2026-05-25 08:55, commit pendente)
- [x] `memory.md` com TL;DR final atualizado (2026-05-25 08:55, commit pendente)
