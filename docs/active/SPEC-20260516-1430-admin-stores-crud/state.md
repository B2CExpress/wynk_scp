# State — SPEC-20260516-1430-admin-stores-crud

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-16 14:30

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-16 14:30
**Onde tô:** Fase 0 — plano + leitura de contexto
**Próximo passo:** Criar validators Zod + sanitize lib, depois repository methods
**Última decisão:** Transação em POST/PUT para atualizar relações de categorias atomicamente
**Bloqueio atual:** nenhum
**Se retomar, ler:** Entradas a partir de [ativação]

---

## Status snapshot

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Validators (Zod) + sanitize + storage stub | pendente | 2026-05-16 14:30 | — |
| 2 | Expand repository + service | pendente | 2026-05-16 14:30 | — |
| 3 | Controllers GET+POST+PUT+DELETE | pendente | 2026-05-16 14:30 | — |
| 4 | Testes manuais (6 casos) | pendente | 2026-05-16 14:30 | — |
| 5 | Feature + memory final | pendente | 2026-05-16 14:30 | — |

### Próximos passos

- [ ] Ler schema Store entity existente e validar relações
- [ ] Criar Zod schema para POST/PUT payload
- [ ] Implementar sanitizeHtml wrapper com allowlist
- [ ] Stub upload storage
- [ ] Expandir StoreRepository com métodos de transação

### Bloqueios ativos

_(nenhum)_

---

## Fatos confirmados

- [2026-05-16 14:30] SPEC-20260506-1400 entregou schema base (`tb_store`, `tb_category`, `tb_store_category`) + listagem pública. Fonte: `docs/features/stores-public-api.md`.
- [2026-05-16 14:30] SPEC-20260514-2012 abriu minimamente admin com POST + PUT + GET /:slug. Fonte: `docs/active/SPEC-20260514-2012-stores-tenant-isolation/main.md`.
- [2026-05-16 14:30] Isolamento via `withTenant()` helper já implementado no backend. Tenant via `getTenantId()` middleware Express. Fonte: `docs/CLAUDE.md` (stack section).
- [2026-05-16 14:30] Cache invalidation helper `invalidateStoresCache(tenantId)` entregue por SPEC-1400, exportado mas ainda sem caller. Fonte: `docs/features/stores-public-api.md` estado atual.

## Inferências prováveis

- [2026-05-16 14:30] StoreRepository pode ser expandido das rotas SPEC-1400 ou criar novo. Se isolado, precisa ter estrutura consistente com wynk_ecommerce backend. Validar com: ler `backend/src/repositories/` no projeto.
- [2026-05-16 14:30] Transação em TypeORM pode usar `DataSource.transaction()` ou `QueryRunner`. Comum em wynk_ecommerce? Validar com: grep por `transaction` nos sources.

## Dúvidas em aberto

_(nenhuma, backlog foi detalhado pelo usuário)_

---

## Log cronológico (APPEND-ONLY)

## 2026-05-16 14:30 — [ativação]

Plano inicial: criar SPEC nova SQU-42 para CRUD admin completo de lojas (POST, GET, GET/:id, PUT, DELETE) com sanitização HTML, validação Zod, categorias em transação.

Depende de SPEC-20260514-2012 (isolação + rotas abertas minimamente).

Features tocadas: nova `admin-stores-crud`, + contexto de `stores-public-api` e `tenant-resolution`.

Arquivos identificados relevantes:
- Entidades: `backend/src/entities/Store.ts`, `Category.ts`, `StoreCategory.ts` (existem, SPEC-1400)
- Repository (placeholder): `backend/src/repositories/` (expandir)
- Service (placeholder): `backend/src/services/store.service.ts` (expandir)
- Controllers: `app/api/admin/stores/route.ts` (GET+POST), `app/api/admin/stores/[id]/route.ts` (GET+PUT+DELETE)
- Validators: `lib/validators/store.ts` (criar)
- Sanitize: `lib/sanitize.ts` (criar)
- Storage: `lib/storage/upload.ts` (criar stub)
