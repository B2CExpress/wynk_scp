# State — SPEC-20260526-1900: API Admin Gerenciar Banners

**Última atualização:** 2026-05-26 19:45

## Timeline

| Data | Hora | Evento |
|------|------|--------|
| 2026-05-26 | 19:00 | SPEC criada |
| 2026-05-26 | 19:30 | Implementação completa |
| 2026-05-26 | 19:45 | Build validado |

## Arquivos Criados

### SPEC
- ✓ `docs/active/SPEC-20260526-1900-api-admin-banners/main.md`
- ✓ `docs/active/SPEC-20260526-1900-api-admin-banners/memory.md`
- ✓ `docs/active/SPEC-20260526-1900-api-admin-banners/state.md` (este arquivo)

### Backend — Entities & DTOs
- ✓ `backend/src/entities/Banner.ts`
- ✓ `backend/src/dtos/banner.dto.ts`

### Backend — Repository & Service
- ✓ `backend/src/repositories/banner.repository.ts`
- ✓ `backend/src/services/banner.service.ts`

### Backend — Controller & Routes
- ✓ `backend/src/controllers/banner.controller.ts`
- ✓ `backend/src/routes/banner.routes.ts`

### Backend — Migrations
- ✓ `backend/src/migrations/1746844800000-CreateBannerTable.ts`

### Backend — Integração
- ✓ `backend/src/app.ts` — AppDeps + rota registrada
- ✓ `backend/src/server.ts` — Deps injeção (repos, services, controllers)
- ✓ `backend/src/config/database.ts` — Entity registrada
- ✓ `backend/__tests__/helpers/mock-deps.ts` — Stub para testes

## Endpoints Implementados

| Método | Rota | Handler | Status |
|--------|------|---------|--------|
| GET | `/api/admin/banners` | `listBanners()` | ✓ |
| POST | `/api/admin/banners` | `createBanner()` | ✓ |
| GET | `/api/admin/banners/:id` | `getBanner()` | ✓ |
| PUT | `/api/admin/banners/:id` | `updateBanner()` | ✓ |
| DELETE | `/api/admin/banners/:id` | `deleteBanner()` | ✓ |
| POST | `/api/admin/banners/reorder` | `reorderBanners()` | ✓ |
| POST | `/api/admin/banners/:id/toggle` | `toggleBanner()` | ✓ |

## Validações Implementadas

| Campo | Min | Max | Tipo | Obrigatório | Notas |
|-------|-----|-----|------|------------|-------|
| title | 2 | 200 | string | ✓ | Sanitizado |
| image_desktop_url | — | — | URL | ✓ | HTTP/HTTPS only |
| image_mobile_url | — | — | URL | ✓ | HTTP/HTTPS only |
| alt_text | 5 | 300 | string | ✓ | Acessibilidade |
| link_url | — | — | URL/path | ✗ | XSS: `javascript:` bloqueado |
| link_target | — | — | enum | ✗ | `_self` \| `_blank` (default `_self`) |
| starts_at | — | — | ISO 8601 | ✗ | Timezone obrigatório |
| ends_at | — | — | ISO 8601 | ✗ | Deve ser > starts_at |
| is_active | — | — | boolean | ✗ | Default `true` |
| sort_order | 0 | ∞ | integer | ✗ | Default `0` |

## Status de Build

```
$ npm run build
> backend@0.0.0 build
> tsc

(sem erros)
```

## Próximos Passos

1. **Testes Manuais** — Validar endpoints com curl/Postman
2. **Testes Automatizados** — Jest + integration tests
3. **API Pública (Fase 4.7)** — GET `/api/v1/banners` com filtro is_active + scheduling window

## Branching

- **Branch:** `SQU-58-api-admin-gerenciar-banners`
- **Base:** `main`
- **Status:** Pronto para testes

## Bloqueadores

Nenhum. Toda implementação completa e compilada.
