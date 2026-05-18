# SPEC-20260516-1730: Catálogo de lojas - fase 2 pública e operacional

**Status:** done
**Criada:** 2026-05-16 17:30
**Ativada:** 2026-05-16 17:30
**Concluída:** 2026-05-18 (arquivamento; código entregue em 2026-05-16 23:38, validado no CI em 2026-05-18)
**Commit final:** `8aef2da`
**Keywords:** stores, categories, full-text, portal, backoffice, tenant-isolation, upload-stub
**Features:** admin-stores-crud, stores-public-api, tenant-resolution, portal-stores-pages
**Branch:** feature/SQU-39-fase-2-modulo-de-lojas
**Depende de:** SPEC-20260506-1400, SPEC-20260514-2012, SPEC-20260516-1430
**Origem:** usuário em 2026-05-16
**Resumo:** Fechar a experiência operacional e pública do catálogo de lojas: CRUD admin de categorias com reordenação, upload stub por metadata no CRUD de lojas, detalhe público completo, busca textual full-text, e páginas `/lojas` e `/lojas/[slug]` no portal. Inclui um backoffice mínimo funcional para operar o módulo via browser.

## Objetivo

Transformar a base de stores já entregue em um catálogo utilizável de ponta a ponta:
- Admin consegue organizar categorias e lojas do tenant sem SQL manual
- Visitante consegue navegar e buscar lojas em `/lojas`
- Detalhe público `/lojas/[slug]` mostra conteúdo completo da loja certa
- Busca textual deixa de ser só `ILIKE` e passa a usar full-text do Postgres
- Isolamento multitenant continua explícito em todas as queries e fluxos

## Escopo

**DENTRO:**
- Backend admin: CRUD de categorias de lojas com `sort_order` e endpoint de reordenação
- Backend admin: upload stub por metadata (`logo_upload`, `cover_upload`) no CRUD de lojas
- Backend público: `GET /api/v1/stores/:slug` com detalhe completo (`description`, `external_url`, `opening_hours`, `categories`)
- Backend público: `GET /api/v1/store-categories`
- Busca textual full-text Postgres em stores (`name + description`) com índice
- Portal Next.js: página `/lojas` com filtros por categoria, busca e cards
- Portal Next.js: página `/lojas/[slug]` com detalhe completo da loja
- Backoffice React mínimo: login por tenant slug + gestão de categorias e lojas
- Testes automatizados cobrindo busca, categorias e detalhe público/admin

**FORA:**
- Upload real para S3/CDN e persistência binária do arquivo
- Crop/editor de imagem
- Paginação infinita, facets avançadas ou ranking semântico
- Home do portal consumindo lojas em destaque
- ACL refinada de editor vs tenant_admin (fica tenant_admin/admin por enquanto)

## Implementação

### 1. Schema incremental

- Nova migration adiciona `category_sort_order int NOT NULL DEFAULT 0` em `tb_category`
- Nova migration adiciona coluna gerada `store_search_vector tsvector` em `tb_store`
- Criar índice GIN para `store_search_vector`

### 2. API admin de categorias

Endpoints novos:
- `GET /api/admin/store-categories`
- `POST /api/admin/store-categories`
- `PUT /api/admin/store-categories/:id`
- `DELETE /api/admin/store-categories/:id`
- `POST /api/admin/store-categories/reorder`

Contrato mínimo:
- `name`: obrigatório
- `slug`: opcional, auto-gerado se vazio
- `sort_order`: int opcional
- `reorder`: array ordenado de ids ou pares `{id, sort_order}`

### 3. Upload stub de imagens no CRUD de lojas

O upload nesta fase é **stub funcional**, sem multipart real. O admin envia metadata:

```json
{
  "logo_upload": { "file_name": "logo.png", "mime_type": "image/png", "size": 12345 },
  "cover_upload": { "file_name": "fachada.jpg", "mime_type": "image/jpeg", "size": 45678 }
}
```

O backend converte isso em URLs fake via `uploadStoreImage(...)`:
- `/uploads/{tenant_id}/stores/{slug}/{filename}`

Se `logo_upload` ou `cover_upload` vierem, eles sobrescrevem `logo_url` e `cover_image_url`.

### 4. API pública de catálogo

- `GET /api/v1/stores` continua paginada, mas busca passa a usar full-text + fallback de relevância
- `GET /api/v1/stores/:slug` devolve detalhe completo
- `GET /api/v1/store-categories` devolve categorias ordenadas do tenant para o filtro do portal

### 5. Portal

- `portal/src/app/lojas/page.tsx`: SSR, usa `headers().get('host')`, busca backend com `X-Forwarded-Host`
- `portal/src/app/lojas/[slug]/page.tsx`: SSR do detalhe
- UX com busca em querystring e filtro por categoria
- Manter identidade visual carregada do flavor do tenant

### 6. Backoffice mínimo

- Trocar o boilerplate do Vite por uma UI operacional mínima
- Login via `/auth/:slug/login`
- Após login, usar cookies `httpOnly` + `credentials: 'include'`
- Requisições admin mandam `X-Forwarded-Host` com o host do tenant retornado pelo login
- Tabs simples: `Categorias` e `Lojas`

## Critério de aceite

- [x] Admin consegue criar, editar, reordenar e deletar categorias de lojas pelo backoffice
- [x] Admin consegue criar, editar e desativar lojas com múltiplas categorias e upload stub de logo/capa
- [x] `GET /api/v1/stores` encontra resultados relevantes por full-text
- [x] `GET /api/v1/stores/:slug` retorna detalhe completo da loja certa e 404 cross-tenant
- [x] `GET /api/v1/store-categories` retorna categorias do tenant em ordem
- [x] `/lojas` lista apenas lojas do tenant correto e filtros funcionam
- [x] `/lojas/[slug]` mostra detalhe completo com categorias
- [x] Cache Redis continua funcionando na listagem pública (`X-Cache: MISS` depois `HIT`)
- [x] Testes automatizados cobrem detalhe público, categorias admin e busca
- [x] Features tocadas atualizadas com referência a esta SPEC
- [x] `state.md` com entrada de conclusão
- [x] `memory.md` com TL;DR final atualizado
