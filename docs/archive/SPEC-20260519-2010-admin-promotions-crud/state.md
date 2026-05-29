# State — SPEC-20260519-2010

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-19 20:10 (registro formal retroativo em 2026-05-25 09:00)

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-25 09:30
**Onde tô:** SPEC concluída — critério 100% marcado, R.7 aplicado nas 5 features tocadas, pronta para archive
**Próximo passo:** commit final + push do PR `feature/SQU-52-api-admin-crud-de-promocoes`
**Última decisão:** migrar SPEC informal `docs/SPEC-SQU-52-admin-crud-promocoes.md` pro formato SPEC-driven v2 retroativamente em vez de manter no formato livre
**Bloqueio atual:** nenhum
**Se retomar, ler:** entrada `[conclusão]` 2026-05-25 09:30

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Entidade + migration | concluído | 2026-05-19 20:10 | `b1d13dc` |
| 2 | DTO + validators manuais | concluído | 2026-05-19 20:10 | `b1d13dc` |
| 3 | Repository com `withTenant` + storeExistsForCurrentTenant | concluído | 2026-05-19 20:10 | `b1d13dc` |
| 4 | Service com erros tipados + cache invalidation | concluído | 2026-05-19 20:10 | `b1d13dc` |
| 5 | Controller + rotas integradas em app.ts | concluído | 2026-05-19 20:10 | `b1d13dc` |
| 6 | Mock controller (`makeStubPromotionController`) em mock-deps | concluído | 2026-05-19 20:10 | `b1d13dc` |
| 7 | Fix do merge `main` (database.ts duplicado, lint errors, stub test:isolation) | concluído | 2026-05-25 09:20 | _(commit pendente)_ |
| 8 | Migração para SPEC-driven v2 + R.7 nas features | concluído | 2026-05-25 09:30 | _(commit pendente)_ |

### Próximos passos

_(nenhum — SPEC fechada)_

### Bloqueios ativos

_(nenhum)_

---

## Fatos confirmados

- [2026-05-19 20:10] Branch `feature/SQU-52-api-admin-crud-de-promocoes` recebeu commit único `b1d13dc feat(promotions): implementa CRUD completo com expiracao natural e validacao multi-tenant` contendo toda a entrega da SPEC. Fonte: `git log b1d13dc -n 1`.
- [2026-05-19 20:10] A entrega original criou `docs/SPEC-SQU-52-admin-crud-promocoes.md` (439 linhas) no formato livre do dev (não-SPEC-driven). Fonte: `git diff` do commit `b1d13dc`.
- [2026-05-25 09:00] Branch ficou mid-merge após pull de `main` (que trouxe SPEC-20260518-1625 já arquivada + outras). Conflito real apenas em `backend/src/config/database.ts` (bloco `BACKEND_SRC/MIGRATIONS_GLOB/SUBSCRIBERS_GLOB` duplicado pela resolução automática, idem ao que aconteceu na SPEC-20260518-1625). Fonte: `git status` + `git show HEAD:... && git show MERGE_HEAD:...`.
- [2026-05-25 09:15] Backend tem 2 lint errors herdados: `SelectQueryBuilder` import unused em `promotion.repository.ts`, `CACHE_TTL_SECONDS` const unused em `promotion.service.ts`. Fonte: `npm run lint -w backend`.
- [2026-05-25 09:20] `test:isolation` pós-merge requer stub `promotionController` em `tests/helpers/setup.ts` — `AppDeps` agora exige (não-opcional). `backend/__tests__/helpers/mock-deps.ts` já tinha `makeStubPromotionController` da entrega original. Fonte: leitura de `backend/src/app.ts` e `tests/helpers/setup.ts`.

## Inferências prováveis

- [2026-05-25 09:00] O dev pulou o protocolo SPEC-driven v2 ao implementar SQU-52 (gravou doc fora da estrutura). Esta sessão retroage formalmente para alinhar a branch ao processo antes do merge na `main`. Validar: a presença de `docs/SPEC-SQU-52-admin-crud-promocoes.md` em vez de pasta `docs/active/SPEC-<timestamp>-.../`.

## Dúvidas em aberto

_(nenhuma)_

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-05-19 20:10 — [ativação] [tentativa] Entrega original em formato livre

Implementação completa (entidade, migration, DTO, repo, service, controller, rotas, mock-deps, integration) em commit único `b1d13dc`. Doc da SPEC em `docs/SPEC-SQU-52-admin-crud-promocoes.md` (formato livre, fora da estrutura SPEC-driven v2). Não criou pasta `docs/active/SPEC-<timestamp>-.../`. Critério marcado pelo próprio dev com ✅ no arquivo informal.

Lição aplicada nesta sessão: retroceder o registro formal pra `active/` e seguir o ciclo completo (active → archive) em vez de aceitar como "SPEC livre".

## 2026-05-25 09:00 — [MARCO] [decisão] Migrar SPEC retroativamente pro formato v2

Branch puxou `main` (com SPEC-20260518-1625 já arquivada + features atualizadas). Antes de fechar o merge, decisão de migrar a SPEC informal de SQU-52 pro template SPEC-driven v2:
- Criar `docs/active/SPEC-20260519-2010-admin-promotions-crud/{main,state,memory}.md`
- Criar feature nova `docs/features/promotions-admin.md` (promotions é conceito distinto de stores — API, schema e ciclo separados, apenas FK)
- Aplicar R.7 nas features tocadas
- Arquivar SPEC + apagar arquivo informal (substituído pelo formal)

Alternativas consideradas:
- Manter SPEC informal e só fechar CI → rejeitado: dívida processual que cresce a cada PR
- Criar SPEC formal só com referência ao informal → rejeitado: não cumpre o template (Objetivo/Escopo/Implementação/Critério separados)
- Criar direto em `archive/` (sem passar por `active/`) → rejeitado: contraria R.5 e `audit-docs.sh` pode bater

ID escolhido: `SPEC-20260519-2010-admin-promotions-crud` (timestamp do commit original `b1d13dc`, não da migração formal — fiel ao histórico).

## 2026-05-25 09:10 — [tentativa] Fix do merge de `main` (database.ts)

Conflito em `backend/src/config/database.ts`: HEAD tinha entities `Promotion` adicionada ao array; MERGE_HEAD (main) tinha bloco `BACKEND_SRC/MIGRATIONS_GLOB/SUBSCRIBERS_GLOB` com globs absolutos (SPEC-20260514-2012, necessário pra Vitest da raiz). Resolução: deduplicar bloco + manter `Promotion` no array final. Mesma forma da SPEC-20260518-1625 — padrão recorrente das resoluções automáticas quebradas.

## 2026-05-25 09:15 — [tentativa] Lint errors zerados

Removidos:
- `SelectQueryBuilder` import (`backend/src/repositories/promotion.repository.ts:1`) — nunca foi usado.
- `CACHE_TTL_SECONDS = 300` const (`backend/src/services/promotion.service.ts:7`) — declarado mas service só faz `invalidateByPattern` (não usa `cached()` na leitura). Mesma situação que `event.service.ts` na SPEC-20260518-1625.

Trade-off: poderia ter implementado leitura cacheada com `cached(...)`. Decisão de não-fazer pra manter escopo. Cache de leitura entra em SPEC futura se o portal público precisar.

`npm run lint -w backend` agora: 0 erros, 4 warnings (`any` em `Store.ts`, `store.repository.ts`, `promotion.service.ts:serializePromotion`) — todos pré-existentes ou herdados de main, fora do escopo.

## 2026-05-25 09:20 — [tentativa] Stub `promotionController` em test:isolation

`backend/src/app.ts` declara `promotionController: PromotionController` (não-opcional) em `AppDeps`. `tests/helpers/setup.ts` (vitest, suite de isolation) montava `createApp` sem ele → quebraria igual eventos/theater na SPEC anterior.

Adicionado stub inline 501 com os 7 métodos (`list, getById, create, update, delete, publish, archive`), cast `as unknown as Parameters<typeof createApp>[0]['promotionController']`. Suite de isolation só exercita stores — stub é suficiente.

Validações pós-fix:
- `npm run typecheck` ✅ nos 3 workspaces
- `npm run format:check` ✅
- `npm test -w backend` ✅ 78 passed + 1 todo (zero regressões)

## 2026-05-25 09:30 — [MARCO] [conclusão] SPEC concluída

Critério de aceite 100% marcado em `main.md`. R.7 aplicado em 5 features:
- `promotions-admin.md` (NOVA) — feature dedicada com estado vivo, decisões (expiração natural sem cron, sem sanitização HTML em `description`, defense-in-depth multitenant), gotchas, alternativas rejeitadas.
- `admin-stores-crud.md` — SPEC adicionada em "Concluídas" com nota: promotions tem FK pra store, cache de store é invalidado em mutação de promotion.
- `auth.md` — SPEC adicionada em "Concluídas", apenas consome `requireAuth`.
- `tenant-resolution.md` — SPEC adicionada em "Concluídas", apenas consome `withTenant`/`TenantSubscriber`.
- `infra-base.md` — SPEC adicionada em "Concluídas", apenas registra entity em `database.ts` e route em `app.ts`.

Arquivo informal `docs/SPEC-SQU-52-admin-crud-promocoes.md` removido (substituído por esta SPEC formal — conteúdo migrado).

Mover `docs/active/SPEC-20260519-2010-.../` → `docs/archive/`. Commit final pendente.
