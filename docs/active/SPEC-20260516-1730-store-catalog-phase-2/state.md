# State - SPEC-20260516-1730-store-catalog-phase-2

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-16 17:30

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-16 23:38
**Onde tô:** Implementação concluída e validada localmente
**Próximo passo:** Commit/PR e, após merge, mover a SPEC para `archive/`
**Última decisão:** Encerrar a fase com upload stub por metadata, full-text Postgres e UI mínima operacional em `portal/` e `backoffice/`
**Bloqueio atual:** nenhum
**Se retomar, ler:** `main.md` desta SPEC + diff local das apps `backend/`, `portal/` e `backoffice/`

---

## Status snapshot

| # | Descrição | Status | Atualizado | Commit |
|---|---|---|---|---|
| 1 | Criar SPEC + atualizar feature docs | concluído | 2026-05-16 23:38 | — |
| 2 | Backend de categorias, full-text e detalhe público | concluído | 2026-05-16 23:38 | — |
| 3 | Portal `/lojas` + `/lojas/[slug]` | concluído | 2026-05-16 23:38 | — |
| 4 | Backoffice mínimo funcional | concluído | 2026-05-16 23:38 | — |
| 5 | Testes + fechamento de docs | concluído | 2026-05-16 23:38 | — |

## Próximos passos

- [x] Criar endpoints admin de categorias
- [x] Adicionar migration de `category_sort_order` e full-text
- [x] Completar detalhe público de stores
- [x] Criar páginas públicas no `portal/`
- [x] Trocar boilerplate do `backoffice/` por UI mínima

## Fatos confirmados

- [2026-05-16 17:30] `tb_store`, `tb_category` e `tb_store_category` já existem e suportam a base do catálogo. Fonte: `backend/src/migrations/1746748400000-CreateStoreTables.ts`.
- [2026-05-16 17:30] CRUD admin de stores já existe, mas categorias admin, full-text e portal `/lojas` ainda não. Fonte: leitura de `backend/src` + `portal/src`.
- [2026-05-16 17:30] `backoffice/` ainda está no boilerplate do Vite e não opera o backend real. Fonte: `backoffice/src/App.tsx`.
- [2026-05-16 23:38] CRUD admin de categorias, full-text e detalhe público completo foram implementados e integrados ao app principal. Fonte: `backend/src/routes/store-category.routes.ts`, `backend/src/services/store.service.ts`, `backend/src/repositories/store.repository.ts`.
- [2026-05-16 23:38] O portal agora expõe `/lojas` e `/lojas/[slug]` via SSR, consumindo a API multitenant com `X-Forwarded-Host`. Fonte: `portal/src/app/lojas/page.tsx`, `portal/src/app/lojas/[slug]/page.tsx`, `portal/src/lib/stores/api.ts`.
- [2026-05-16 23:38] O backoffice foi trocado por uma UI mínima funcional para login, categorias e lojas. Fonte: `backoffice/src/App.tsx`.
- [2026-05-16 23:38] Validação local concluída: `npm run typecheck` em `backend/`, `portal/` e `backoffice/`; `npm test` em `backend/`. Fonte: execução local nesta sessão.

## Dúvidas em aberto

- [ ] Pós-merge: mover a SPEC para `docs/archive/` e atualizar as feature docs da branch para a seção de concluídas com commit final

---

## Log cronológico (APPEND-ONLY)

## 2026-05-16 17:30 - [ativação]

Usuário pediu explicitamente: ler docs, fazer a SPEC e depois o código para o catálogo de lojas como fase operacional e pública.

Decisão tomada nesta ativação:
- não reativar `SPEC-20260503-1506-modulo-lojas` (descartada corretamente)
- criar SPEC complementar focada sobre a base já entregue
- fechar backend primeiro, depois portal e backoffice

## 2026-05-16 23:38 - [conclusão local]

Implementação encerrada localmente dentro do escopo desta SPEC.

Entregas concluídas:
- migration com `category_sort_order` e `store_search_vector`
- CRUD admin de categorias com reorder
- upload stub por metadata no CRUD de lojas
- detalhe público completo e endpoint público de categorias
- páginas `portal/lojas` e `portal/lojas/[slug]`
- backoffice mínimo funcional com login, categorias e lojas
- docs de feature atualizadas para referenciar esta SPEC

Validação executada:
- `npm run typecheck` em `backend/`
- `npm run typecheck` em `portal/`
- `npm run typecheck` em `backoffice/`
- `npm test` em `backend/` (`11` suítes, `75` testes)

Pendência consciente fora da implementação:
- fazer commit/PR e mover a SPEC para `archive/` após merge
