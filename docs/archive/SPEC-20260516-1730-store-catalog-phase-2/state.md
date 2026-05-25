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

## 2026-05-18 - [MARCO] [conclusão]

SPEC concluída e arquivada após resolução do conflito com main, verde no CI e fix de lint errors.

**Contexto da retomada:** sessão #1 (Leonardo, 2026-05-16 23:38) entregou todo o código (commit `53d2b28`) e marcou `Concluída: 2026-05-16 23:38` no `main.md`, mas a SPEC ficou em `docs/active/` porque o PR estava em DRAFT e nunca foi arquivada formalmente. Sessão #2 (2026-05-18) fez o merge com main após PR #13 e #14, resolveu 4 conflitos + 1 erro de lint, validou no CI e fechou o arquivamento.

**Caminho da sessão #2 (2026-05-18):**

1. **`127df79`** — Merge de `main` na branch. Resolveu 4 conflitos:
   - `docs/features/admin-stores-crud.md` e `stores-public-api.md`: removeu linhas obsoletas em "Em execução" (SPECs já arquivadas em main pelos PRs #13/#14/#16), manteve só a SPEC-1730.
   - `backend/src/repositories/store.repository.ts` (3 conflitos): manteve a versão HEAD do #15 que usa fulltext `websearch_to_tsquery('simple', :q)` + fallback `ILIKE` + `addSelect search_rank` (referenciado depois no `orderBy`). A versão main (PR #9) usava `plainto_tsquery('portuguese', :q)` simples mas o `orderBy('search_rank', 'DESC')` logo abaixo só funciona com a versão HEAD. Função `escapeLikePattern` reintroduzida porque é usada nas 2 buscas (pública + admin).
   - `backend/src/services/store.service.ts`: manteve versão HEAD do #15 (inline map com `mapCategory`) porque o helper `serializeAdminListItem` referenciado pela versão main não existe no arquivo.
   - Adicionou seção `## Decisões arquiteturais ativas` em 3 features tocadas (`admin-stores-crud`, `portal-stores-pages`, `stores-public-api`) — Leonardo reescreveu os docs simplificando demais e omitiu a seção obrigatória, lint-docs procura literal.
   - `npm install` na raiz pra trazer deps novas do package-lock atualizado.
2. **`8aef2da`** — Fix de 2 lint errors do CI:
   - `backend/src/repositories/store-category.repository.ts`: removido import `In` não utilizado (TypeORM).
   - `portal/src/app/lojas/[slug]/page.tsx`: JSX estava dentro de try/catch — antipattern do React Server Components (rendering errors não são capturados por try/catch sem error boundary). Movido o JSX pra fora do bloco; try/catch agora envolve só o `fetchStoreDetail` + `notFound()`. Comentário curto explica o porquê.

**Resultado final no CI (commit `8aef2da`):**

```
✓ format check
✓ portal/backoffice/backend (typecheck/lint/test)
✓ validate flavor manifest
✓ isolation tests          ← suite de cross-tenant cobre os endpoints novos
```

12/12 checks verdes.

**Stack reaffirmada durante o arquivamento:**
- Portal = Next.js 16 (App Router, SSR para SEO público)
- Backoffice = Vite 8 + React 19 (SPA logada, sem SSR)
- Backend = Express 4 + TypeORM 0.3
- Conferido em `portal/package.json`, `backoffice/package.json`, `backend/package.json`.

**R.7 (features atualizadas):**
- `docs/features/admin-stores-crud.md` — SPEC-1730 em "Concluídas", "Em execução" zerado; adicionada seção "Decisões arquiteturais ativas" no merge.
- `docs/features/stores-public-api.md` — SPEC-1730 em "Concluídas", "Em execução" zerado; adicionada seção "Decisões arquiteturais ativas" no merge.
- `docs/features/tenant-resolution.md` — SPEC-1730 em "Concluídas".
- `docs/features/portal-stores-pages.md` (criada nesta SPEC) — SPEC-1730 em "Concluídas", "Em execução" zerado; adicionada seção "Decisões arquiteturais ativas" no merge.

**Dívidas técnicas registradas (não bloqueiam arquivamento):**

- **Upload real para CDN** — `lib/storage.ts` continua stub. Quando a Fase 6 entrar no roadmap, abrir SPEC nova (substituir `/uploads/{tenant_id}/stores/{slug}/{filename}` por persistência real). Já registrado em `admin-stores-crud.md` "Planejadas".
- **`opening_hours` no portal** — atualmente renderizado como `<pre>{JSON.stringify(...)}</pre>` (placeholder). UI dedicada de horário por dia da semana fica pra SPEC futura.
- **`dangerouslySetInnerHTML` defense-in-depth** — `description` chega sanitizada do backend (allowlist `sanitize-html`), mas portal não sanitiza novamente. Defense-in-depth seria sanitizar também no portal — registrado nas decisões de `portal-stores-pages.md`.
- **2 warnings de `any` em `backend/src/repositories/store.repository.ts:178,238`** — tipos de `openingHours` em payloads. Não bloqueia (warning, não error), mas vale tipar quando a estrutura de `openingHours` virar contrato formal.

**SPECs futuras inferíveis a partir desta entrega:**
- Upload real para CDN (Fase 6) — já mencionada na SPEC-1430 e nesta.
- UI estruturada para `opening_hours` (dias da semana, intervalos, fechado).
- ACL separando `tenant_admin` × `editor` × `superadmin` — hoje qualquer usuário com role `tenant_admin` ou `admin` opera tudo.
- Cache de detalhe por slug (`/api/v1/stores/:slug`) — quando o tráfego justificar.

Commit do arquivamento: este commit.
