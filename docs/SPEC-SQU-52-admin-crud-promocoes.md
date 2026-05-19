# SPEC SQU-52: CRUD Admin de Promoções

**Status**: IMPLEMENTADO  
**Data**: 2026-05-19  
**Autor**: Especificação de Promoções

---

## Contexto

Promoções são sempre vinculadas a uma loja (FK obrigatória) e possuem janela de validade com `valid_from` e `valid_until`. Diferente de notícias, promoções expiram automaticamente quando passam de `valid_until`, sem necessidade de cron job.

### Por que importa

- Promoções geram tráfego significativo
- Acessadas no detalhe da loja
- Boa integração com módulo de lojas valoriza ambos
- Validação cross-tenant crítica (uma loja de tenant A não pode ter promoção de tenant B)

---

## O que será construído

CRUD de promoções com:
- Validação obrigatória de loja (cross-tenant)
- Agendamento via `valid_from`/`valid_until`
- Expiração automática (não requer cron)
- Cache invalidation de promoções E da loja vinculada
- Filtro `expired` para admin visualizar histórico

---

## Endpoints

### GET /api/admin/promotions

Lista paginada com filtro por loja e status.

**Query params:**
- `page` (int, default: 1) — página
- `limit` (int, default: 10, max: 50) — itens por página
- `status` (string, optional) — filtrar por status (draft|published|archived)
- `store_id` (uuid, optional) — filtrar por loja
- `expired` (boolean, optional) — true=só expiradas, false=só ativas

**Response (200 OK):**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "title": "Black Friday Renner",
      "slug": "black-friday-renner",
      "description": "<p>Até 70% OFF em seleção</p>",
      "imageUrl": "https://cdn.example.com/promo.jpg",
      "discountLabel": "Até 70% OFF",
      "validFrom": "2026-11-25T00:00:00-03:00",
      "validUntil": "2026-11-29T23:59:59-03:00",
      "status": "published",
      "publishedAt": "2026-11-20T10:30:00-03:00",
      "storeId": "550e8400-e29b-41d4-a716-446655440001",
      "store": {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Renner",
        "slug": "renner"
      },
      "createdAt": "2026-11-15T08:00:00-03:00",
      "updatedAt": "2026-11-20T10:30:00-03:00"
    }
  ],
  "total": 5
}
```

**HTTP Codes:**
- `200` — Sucesso
- `401` — Não autenticado
- `403` — Sem permissão

---

### POST /api/admin/promotions

Cria promoção vinculada a loja.

**Request body:**
```json
{
  "store_id": "550e8400-e29b-41d4-a716-446655440001",
  "title": "Black Friday Renner",
  "slug": "black-friday-renner",
  "description": "<p>Até 70% OFF em seleção</p>",
  "image_url": "https://cdn.example.com/promo.jpg",
  "discount_label": "Até 70% OFF",
  "valid_from": "2026-11-25T00:00:00-03:00",
  "valid_until": "2026-11-29T23:59:59-03:00"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Black Friday Renner",
  "slug": "black-friday-renner",
  "description": "<p>Até 70% OFF em seleção</p>",
  "imageUrl": "https://cdn.example.com/promo.jpg",
  "discountLabel": "Até 70% OFF",
  "validFrom": "2026-11-25T00:00:00-03:00",
  "validUntil": "2026-11-29T23:59:59-03:00",
  "status": "draft",
  "publishedAt": null,
  "storeId": "550e8400-e29b-41d4-a716-446655440001",
  "createdAt": "2026-11-15T08:00:00-03:00",
  "updatedAt": "2026-11-15T08:00:00-03:00"
}
```

**HTTP Codes:**
- `201` — Criada com sucesso
- `400` — Payload inválido (vide validação)
- `401` — Não autenticado
- `403` — Sem permissão
- `409` — Slug duplicado no tenant
- `422` — `store_id` inválido ou pertence a outro tenant

---

### PUT /api/admin/promotions/:id

Atualiza promoção. Todos os campos são opcionais.

**Request body:**
```json
{
  "title": "Black Friday Renner 2026",
  "discount_label": "Até 80% OFF",
  "valid_until": "2026-11-30T23:59:59-03:00"
}
```

**Response (200 OK):** Promoção atualizada (mesmo schema do POST)

**HTTP Codes:**
- `200` — Sucesso
- `400` — Payload inválido
- `401` — Não autenticado
- `403` — Sem permissão
- `404` — Promoção não encontrada
- `409` — Slug duplicado (se alterado)
- `422` — `store_id` inválido (se alterado)

---

### POST /api/admin/promotions/:id/publish

Publica promoção e define `publishedAt` para agora. Altera status para `published`.

**Response (200 OK):** Promoção publicada

**HTTP Codes:**
- `200` — Publicada
- `401` — Não autenticado
- `403` — Sem permissão
- `404` — Promoção não encontrada

---

### POST /api/admin/promotions/:id/archive

Arquiva promoção. Altera status para `archived`.

**Response (200 OK):** Promoção arquivada

**HTTP Codes:**
- `200` — Arquivada
- `401` — Não autenticado
- `403` — Sem permissão
- `404` — Promoção não encontrada

---

### DELETE /api/admin/promotions/:id

Apaga promoção. **Só permite delete se status for `draft` ou `archived`**.

**Response (204 No Content):** —

**HTTP Codes:**
- `204` — Deletada
- `401` — Não autenticado
- `403` — Sem permissão
- `404` — Promoção não encontrada
- `409` — Não pode deletar (status é `published`)

---

## Validação de Payload

Para cada campo do request body, aplicar:

### store_id
- **Tipo:** UUID válido (formato: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- **Obrigatório em:** POST (criação)
- **Validação cruzada:** Deve existir em `stores` do tenant atual
  - Se não encontrada → **422** `store_not_found`
- **Impedimento:** Não permitir associar promoção com loja de outro tenant

### title
- **Tipo:** String não-vazia
- **Comprimento máximo:** 200 caracteres
- **Obrigatório em:** POST
- **Opcional em:** PUT
- **Se inválido:** **400** com campo `title` em errors array

### slug
- **Tipo:** String não-vazia
- **Comprimento máximo:** 250 caracteres
- **Obrigatório em:** Não (gerado automaticamente de `title` se omitido)
- **Geração automática:** `title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').substring(0, 250)`
- **Unicidade:** Por tenant (unique constraint `(tenant_id, slug)`)
- **Se duplicado:** **409** `slug_conflict`
- **Opcional em:** PUT
- **Se inválido:** **400**

### description
- **Tipo:** String não-vazia (pode conter HTML)
- **Obrigatório em:** POST
- **Opcional em:** PUT
- **Sanitização:** Trim apenas (permitir HTML)
- **Se inválido:** **400**

### image_url
- **Tipo:** URL ou null
- **Obrigatório em:** Não
- **Nullable:** Sim
- **Se inválido:** **400**

### discount_label
- **Tipo:** String não-vazia
- **Comprimento máximo:** 50 caracteres (aparece em destaque)
- **Obrigatório em:** POST
- **Opcional em:** PUT
- **Se inválido:** **400**

### valid_from
- **Tipo:** ISO 8601 com timezone (`2026-11-25T00:00:00-03:00` ou com Z)
- **Obrigatório em:** POST
- **Opcional em:** PUT
- **Validação temporal:** Deve estar até 2 anos no futuro
- **Se inválido:** **400**

### valid_until
- **Tipo:** ISO 8601 com timezone
- **Obrigatório em:** POST
- **Opcional em:** PUT
- **Validação temporal:** Deve estar até 2 anos no futuro
- **Validação cruzada:** `valid_until > valid_from` (não permite igualdade)
- **Se inválido:** **400** com mensagem clara

**Resposta de erro (400):**
```json
{
  "error": "validation_failed",
  "errors": [
    {
      "field": "discount_label",
      "message": "discount_label must not exceed 50 characters"
    },
    {
      "field": "valid_until",
      "message": "valid_until must be greater than valid_from"
    }
  ]
}
```

---

## Fluxo de Criação (Pseudocódigo)

```
1. Auth + role check (middleware requireAuth)
2. body = await request.json()
3. payload = parsePromotionInput(body)
4. errors = validatePromotionInput(payload, isCreate=true)
5. SE errors.length > 0: retornar 400 com errors array
6. SE payload.valid_until <= payload.valid_from: retornar 400
7. storeExists = await repo.storeExistsForCurrentTenant(payload.store_id)
8. SE !storeExists: retornar 422 'store_not_found'
9. slug = payload.slug || generateSlug(payload.title)
10. slugExists = await repo.findBySlugForCurrentTenant(slug)
11. SE slugExists: retornar 409 'slug_conflict'
12. INSERT em promotions com tenant_id, store_id, e payload
13. invalidar cache: invalidateListings(tenant_id, store_id)
14. SE UNIQUE conflict em (tenant_id, slug): retornar 409
15. retornar 201 com promoção criada
```

---

## Expiração Automática

**Sem cron job.** Expiração é natural via filtro de query:

### API Pública (futuro)
```sql
WHERE status = 'published'
  AND published_at <= now()
  AND valid_until >= now()
```

### API Admin (hoje)
- `?expired=false` → Mostra só ativas: `valid_until >= now()`
- `?expired=true` → Mostra só expiradas: `valid_until < now()`
- Sem query → Mostra todas (independente de expiração)

---

## Cache Invalidation

Ao mutar uma promoção (create, update, delete, publish, archive):

1. Invalidar: `promotions:detail:{tenantId}:*`
2. Invalidar: `promotions:list:{tenantId}:*`
3. Invalidar: `stores:detail:{tenantId}:{storeId}:*` (detail da loja mostrar promoções ativas)
4. Invalidar: `stores:list:{tenantId}:*` (listagem de lojas pode mostrar preview de promoções)

---

## Isolamento Multitenant

### Defense in Depth

1. **Query layer:** `withTenant()` adiciona `WHERE tenant_id = ?` em todas as queries
2. **Entity layer:** `TenantSubscriber` auto-injeta `tenantId` e rejeita alterações de `tenantId`
3. **Business logic:** Validação de `store_id` via `storeExistsForCurrentTenant()` garante FK
4. **Test layer:** Testes de isolação verificam que slug duplicado entre tenants é permitido

### Armadilhas Comuns

❌ Aceitar `tenant_id` do payload em vez do `session`  
❌ Validar `store_id` sem `withTenant()` → permite associar loja de outro tenant  
❌ Esquecer filtro `valid_until >= now()` no público → mostra promoções vencidas  
❌ Confundir `expired` (automático) com `archived` (manual) → estados diferentes  
❌ Esquecer invalidar cache da loja → detalhe não mostra promoção recém-criada

---

## Critério de Aceite

- ✅ CRUD completo (GET list, GET by ID, POST, PUT, DELETE)
- ✅ Endpoints publish e archive funcionais
- ✅ `store_id` de outro tenant retorna **422**
- ✅ `valid_until <= valid_from` retorna **400**
- ✅ Listagem admin inclui/exclui expiradas via `?expired=true|false`
- ✅ Invalidação de cache de loja ao criar/atualizar promoção
- ✅ JOIN com stores no GET list retorna `store { id, name, slug }`
- ✅ Slug gerado automaticamente de title se omitido
- ✅ Slug duplicado retorna **409** (por tenant)
- ✅ Delete só permite status `draft` ou `archived`, retorna **409** caso contrário
- ✅ Todos os status codes HTTP conforme especificado
- ✅ Validação campo-a-campo com errors array em **400**

---

## Schema de Banco

```sql
CREATE TABLE tb_promotion (
  promotion_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tb_tenant(tenant_id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES tb_store(store_id) ON DELETE CASCADE,
  promotion_title varchar(200) NOT NULL,
  promotion_slug varchar(250) NOT NULL,
  promotion_description text NOT NULL,
  promotion_image_url text,
  promotion_discount_label varchar(50) NOT NULL,
  promotion_valid_from timestamptz NOT NULL,
  promotion_valid_until timestamptz NOT NULL,
  promotion_status varchar(20) NOT NULL DEFAULT 'draft',
  promotion_published_at timestamptz,
  promotion_created_at timestamptz NOT NULL DEFAULT now(),
  promotion_updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Índices
  CONSTRAINT uq_tb_promotion_tenant_slug UNIQUE (tenant_id, promotion_slug),
  INDEX ix_tb_promotion_tenant_store (tenant_id, store_id),
  INDEX ix_tb_promotion_tenant_status_published (tenant_id, promotion_status, promotion_published_at),
  INDEX ix_tb_promotion_tenant_valid_until (tenant_id, promotion_valid_until)
);
```

---

## Status Enum

- `draft` — Rascunho, não visível ao público
- `published` — Publicada, visível ao público se dentro da validade
- `archived` — Arquivada manualmente, não visível ao público

---

## Testes Recomendados

### Testes de Funcionalidade

1. **Criar promoção com store_id válido** → 201
2. **Criar com store_id de outro tenant** → 422
3. **Criar com datas inválidas** (`valid_until < valid_from`) → 400
4. **Criar com slug duplicado** → 409
5. **Listar só expiradas** (`?expired=true`) → Retorna só com `valid_until < now()`
6. **Listar só ativas** (`?expired=false`) → Retorna só com `valid_until >= now()`
7. **Deletar só draft/archived** → 204; publicadas → 409
8. **Invalidação de cache** → Detail de loja atualiza após criar promoção
9. **Filtro por status** (`?status=published`) → Funciona
10. **Filtro por store_id** (`?store_id=xxx`) → Funciona

### Testes de Isolação

1. **Slug duplicado entre tenants** → Permitido
2. **Store de tenant A não visa promoção de tenant B** → 422
3. **Cache por tenant** → Chaves incluem `{tenantId}`

---

## Implementação

| Artefato | Arquivo | Status |
|----------|---------|--------|
| Migration | `1746748500000-CreatePromotionTable.ts` | ✅ Done |
| Entity | `src/entities/Promotion.ts` | ✅ Done |
| DTO | `src/dtos/promotion.dto.ts` | ✅ Done |
| Repository | `src/repositories/promotion.repository.ts` | ✅ Done |
| Service | `src/services/promotion.service.ts` | ✅ Done |
| Controller | `src/controllers/promotion.controller.ts` | ✅ Done |
| Routes | `src/routes/promotion.routes.ts` | ✅ Done |
| Integration | `src/app.ts`, `src/server.ts`, `src/config/database.ts` | ✅ Done |
| Test Mocks | `__tests__/helpers/mock-deps.ts` | ✅ Done |
