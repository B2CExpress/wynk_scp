# Memory — SPEC-20260519-2010

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-19 20:10 (registro formal retroativo em 2026-05-25 09:00)

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-25 09:30 (sessão #2 — migração retroativa)
**Onde tô:** SPEC concluída e migrada pro formato v2. Pronta para archive + push.
**Próximo passo:** commit final + `git push origin feature/SQU-52-api-admin-crud-de-promocoes`
**Última decisão:** SPEC registrada com ID `SPEC-20260519-2010` (data do commit `b1d13dc`, não da migração) pra preservar histórico real
**Bloqueio atual:** nenhum
**Se retomar, ler:** `state.md` entradas 2026-05-25 09:00 em diante

---

## Contexto ativo

### O que está sendo feito AGORA

SPEC-20260519-2010 fechada após migração retroativa do formato livre pro SPEC-driven v2 e fix do merge de `main`.

Arquitetura final: entidade `Promotion` (FK obrigatória a `Store` + `Tenant`, unique `(tenant_id, slug)`); CRUD admin completo com 7 endpoints (`list, getById, create, update, delete, publish, archive`); isolamento multitenant em 3 camadas (`withTenant` em queries, `TenantSubscriber` global, `storeExistsForCurrentTenant` no service); cache invalidation cobre promotions list/detail + stores list/detail por tenant; expiração natural via filtro de query (`?expired=true|false`), **sem cron** — diferença chave em relação a Event/TheaterShow.

Validações: `valid_until > valid_from` estrita, `store_id` cross-tenant rejeitado com 422, slug único por tenant com 409, datas até 2 anos no futuro, ISO 8601 com timezone.

Próxima sessão: abrir PR.

### Hipóteses em jogo

_(nenhuma — todas resolvidas)_

### Decisões recentes que importam pra continuar

- [2026-05-19 20:10] **Expiração natural (sem cron)** — filtro `valid_until` na query, sem trigger background. Trade-off: status `published` permanece após expirar; consumer precisa filtrar.
- [2026-05-19 20:10] **Sem sanitização HTML em `description`** — só `trim()`. Diferente da SPEC-20260518-1625 (eventos/theater) que aplica `sanitizeRichTextHtml`. Decisão pode ser revisitada se promotions for renderizada como HTML no portal público.
- [2026-05-19 20:10] **Cache invalidation cobre stores** — mutação de promotion invalida `stores:detail:{tid}:{sid}:*` e `stores:list:{tid}:*` porque a página/listagem de loja exibe preview de promoções. Sem isso, criar promoção não aparece no detalhe da loja por até TTL.
- [2026-05-19 20:10] **Defense-in-depth multitenant** — 3 camadas distintas (`withTenant` na query, `TenantSubscriber` no save, `storeExistsForCurrentTenant` no service antes de criar). Aceita redundância pra evitar vazamento.
- [2026-05-25 09:00] **Migrar SPEC retroativamente** — não aceitar dívida processual. ID com timestamp do commit original.
- [2026-05-25 09:20] **Stub `promotionController` em test:isolation com cast `Parameters<typeof createApp>[0]['promotionController']`** — evita importar a classe do controller no setup vitest (workspace separado). Mesma forma usada para event/theater na SPEC-20260518-1625.

### Respostas-chave do usuário

- [2026-05-25 09:00] Usuário: "2"
  Contexto: ofereci 3 caminhos pra fechar a branch — (1) fechar só CI mantendo SPEC informal, (2) migrar pra formato v2, (3) híbrido com SPEC retrospectiva curta. Escolheu (2) — rigor processual.

### Tentativas que falharam (para NÃO repetir)

- [2026-05-19 20:10] Entrega original criada fora da estrutura SPEC-driven v2 (`docs/SPEC-SQU-52-admin-crud-promocoes.md` em vez de `docs/active/SPEC-<timestamp>-.../`). Lição: protocolo precisa rodar ANTES da implementação, mesmo quando o dev tem o desenho na cabeça.
- [2026-05-25 09:10] Resolução automática do merge `main` deixou `database.ts` com bloco `BACKEND_SRC/MIGRATIONS_GLOB/SUBSCRIBERS_GLOB` duplicado (mesma armadilha da SPEC-20260518-1625). Lição: sempre rodar `typecheck` + `lint` ANTES de commitar merge — "all conflicts fixed" do git só confirma ausência de markers, não validade do código.

### Arquivos ativamente sendo tocados

- `backend/src/entities/Promotion.ts`
- `backend/src/dtos/promotion.dto.ts`
- `backend/src/repositories/promotion.repository.ts`
- `backend/src/services/promotion.service.ts`
- `backend/src/controllers/promotion.controller.ts`
- `backend/src/routes/promotion.routes.ts`
- `backend/src/migrations/1746748500000-CreatePromotionTable.ts`
- `backend/src/config/database.ts` (Promotion entity + bloco BACKEND_SRC deduplicado)
- `backend/src/app.ts` (createPromotionRoutes)
- `backend/__tests__/helpers/mock-deps.ts` (makeStubPromotionController)
- `tests/helpers/setup.ts` (stub promotionController pra test:isolation)
- `docs/features/promotions-admin.md` (NOVA)
- `docs/features/{admin-stores-crud,auth,tenant-resolution,infra-base}.md` (R.7)

### Onde parei exatamente

SPEC criada em `docs/active/SPEC-20260519-2010-admin-promotions-crud/`, feature `promotions-admin.md` criada, R.7 aplicado em 4 features adicionais, arquivo informal `docs/SPEC-SQU-52-admin-crud-promocoes.md` apagado. Próximo: mover `active/ → archive/`, commit final, push.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-19 20:10 | ~único commit | implementação | Entrega completa em `b1d13dc` com SPEC em formato livre fora da estrutura |
| 2 | 2026-05-25 09:00 | ~30min | migração + conclusão | Merge fix → lint fix → stub isolation → migração SPEC-driven v2 → R.7 → archive |
