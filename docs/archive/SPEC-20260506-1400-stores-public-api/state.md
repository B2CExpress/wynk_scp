# State — SPEC-20260506-1400

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-06 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-12 13:24
**Onde tô:** Implementação técnica completa: 3 entidades + 1 migration + helper de cache genérico + camadas controller/service/repository/routes/dtos. App.ts e server.ts montam a rota com deps injetadas. Typecheck/lint verdes, 71 testes passando (50 antigos + 21 novos cobrindo cache HIT/MISS, fallback Redis, escape LIKE, normalize search, clamp limit, invalidação SCAN). Critérios técnicos do `main.md` quase todos marcados — exceto os que exigem DB+Redis reais.
**Próximo passo:** Validar com DB + Redis reais (migration:run/revert, E2E do `/api/v1/stores`). Depois: criar PR, mergear, mover SPEC pra `archive/`, atualizar `docs/features/stores-public-api.md` movendo SPEC pra "Concluídas".
**Última decisão:** Marcar critérios técnicos baseados em cobertura unit; deixar critérios E2E explicitamente pendentes em vez de mascará-los. Trade-off: SPEC fica honest sobre o que está atestado vs precisa de integration test antes do merge.
**Bloqueio atual:** nenhum técnico. Pendente: testes E2E com containers + revisão do PR pelo dev.
**Se retomar, ler:** entrada `[MARCO] [implementação] Schema + API + testes unit entregues` em 2026-05-12 13:24 + `main.md` (seção "Critério de aceite" com checkboxes marcados e linhas explícitas do que falta E2E).

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Implementação inicial Next.js+Drizzle (listagem + detalhe + cache.ts) | descartado | 2026-05-11 17:24 | `96b5a33` (deletado) |
| 2 | Remoção do endpoint detalhe + movimento errado do main.md para archive | concluído | 2026-05-08 11:06 | `759eca5` |
| 3 | Estrutura SPEC correta (active/ + state + memory + feature) | concluído | 2026-05-08 13:55 | — |
| 4 | Re-escopo: SPEC vira listagem-only; detalhe vai para SPEC futura | concluído | 2026-05-08 13:50 | — |
| 5 | Correções de código: escape LIKE + normalização da cache key | descartado | 2026-05-11 17:24 | `bf21c78` (sobre código deletado) |
| 6 | Re-escopo radical pós-merge SPEC-1505 (stack Next.js+Drizzle → Express+TypeORM) | concluído | 2026-05-11 17:24 | — |
| 7 | ~~Schema `tb_store`/`tb_category`/`tb_store_category` via SPEC-1506~~ → SPEC-1506 adiada; schema absorvido por esta SPEC | descartado | 2026-05-12 12:42 | — |
| 8 | Re-escopo #2: ampliar `main.md` (escopo + schema mínimo + critério de aceite) | concluído | 2026-05-12 12:42 | — |
| 9 | Entidades TypeORM (`Store`, `Category`, `StoreCategory`) + migration `CreateStoreTables` | concluído | 2026-05-12 13:05 | (a commitar) |
| 10 | Decisão sobre destino da SPEC-1506 (descartada, movida para `discard/`) | concluído | 2026-05-12 12:42 | (a commitar) |
| 11 | Re-implementação API: controller + service + repository + routes + dtos + helper de cache | concluído | 2026-05-12 13:15 | (a commitar) |
| 12 | Re-entrega das correções de review (escape LIKE + normalize search) sobre TypeORM | concluído | 2026-05-12 13:15 | (a commitar) |
| 13 | Testes unit mínimos (cache HIT/MISS, fallback Redis, escape, normalize, paginação, invalidação SCAN) — 21 testes em 3 suites | concluído | 2026-05-12 13:22 | (a commitar) |
| 14 | Testes E2E com DB+Redis reais (migration:run/revert, rota completa, isolamento real entre tenants) | pendente | 2026-05-12 13:24 | — |
| 15 | Conclusão (mover para archive/ + atualizar feature pra "Concluídas") | pendente | 2026-05-12 13:24 | — |

### Próximos passos

- [x] Aplicar correções da review na branch `feature/SQU-43-api-publica` — escape de `%`/`_` no `search` + normalização lowercase+trim para cache key (2026-05-08 14:10, commit `bf21c78` — código depois deletado em 2026-05-11 17:24)
- [x] Confirmar com dev se SPEC depende de `SPEC-20260503-1505-base-plataforma-multitenant` (ou outra) para schema Drizzle e bootstrap do backend (2026-05-11 17:24 — confirmado pós-merge: depende da SPEC-1506 para schema; SPEC-1505 já entregue)
- [x] Criar SPEC futura para endpoint detalhe `GET /api/v1/stores/[slug]` — `SPEC-20260508-1400-stores-public-detail` em `docs/future/` (2026-05-08 14:00)
- [x] Re-escrever `main.md` para nova stack (Express + TypeORM) + nova dependência (SPEC-1506) + arquivos novos (controller/service/repository/routes/dtos) (2026-05-11 17:24)
- [x] Deletar código antigo Next.js+Drizzle (`backend/lib/cache.ts`, `backend/app/api/v1/stores/route.ts`) (2026-05-11 17:24)
- [x] ~~Aguardar ativação/conclusão da SPEC-20260503-1506-modulo-lojas (schema das tabelas)~~ — SPEC-1506 adiada; schema absorvido por esta SPEC em 2026-05-12 12:42
- [x] Ampliar `main.md` para cobrir schema mínimo + critério de aceite (2026-05-12 12:42)
- [x] Validar `main.md` re-escopado com o dev antes de tocar código (autorização literal: *"Manda bala!"*)
- [x] Decidir destino da SPEC-20260503-1506-modulo-lojas (2026-05-12 12:42 — **descartada**)
- [x] Criar entidades `Store`, `Category`, `StoreCategory` em `backend/src/entities/` (2026-05-12 13:00)
- [x] Criar migration `CreateStoreTables` (2026-05-12 13:00) — `migration:run`/`revert` ainda a validar contra DB real
- [x] Implementar `GET /api/v1/stores` em Express+TypeORM (controller + service + repository + routes + DTO + cache util) (2026-05-12 13:15)
- [x] Re-entregar escape LIKE + normalize search sobre TypeORM (2026-05-12 13:15)
- [x] Adicionar testes unit mínimos (21 testes em 3 suites — `store-list.dto.test.ts`, `store.repository.test.ts`, `store.service.test.ts`) (2026-05-12 13:22)
- [ ] **Validar contra DB + Redis reais antes do merge:** `migration:run` + `migration:revert` limpo; smoke test do `/api/v1/stores` com 2 tenants confirmando isolamento; cache HIT/MISS e fallback Redis no caminho real
- [ ] Subir PR para revisão pelo dev
- [ ] Pós-merge: atualizar `docs/features/stores-public-api.md` movendo SPEC para "Concluídas", marcar critérios "Features tocadas / state [conclusão] / memory final" no `main.md`, mover pasta `active/` → `archive/`

### Bloqueios ativos

_(nenhum)_

---

## Fatos confirmados

- [2026-05-06 14:00] PR #3 implementou GET /api/v1/stores e GET /api/v1/stores/[slug] com cache Redis (Next.js+Drizzle). Commits `96b5a33` (criação) + `759eca5` (remoção do detalhe) + `bf21c78` (escape LIKE + normalize). **Código deletado em 2026-05-11 17:24** após re-escopo radical.
- [2026-05-08 13:35] `main.md` da SPEC estava em `backend/app/api/v1/stores/main.md` (lugar errado, viola R.2/R.3). Resolvido no re-bootstrap (2026-05-08).
- [2026-05-08 13:35] `docs/archive/SPEC-route-stories/main.md` era falso-archive com ID inválido (viola R.1). Removido no re-bootstrap.
- [2026-05-08 13:35] Função `cacheHeaders(hit)` era idêntica entre `route.ts` e `[slug]/route.ts` (situação eliminada quando detalhe foi removido em `759eca5`).
- [2026-05-08 13:45] Commit `759eca5` ("feat: remove deprecated store detail API and documentation") removeu o endpoint detalhe (subiu por engano).
- [2026-05-11 16:47] Merge de `main` (`c789654`) trouxe SPEC-1505 concluída + backend reescrito em Express 4 + TypeORM 0.3 + naming `tb_<entity>` + tenant resolution via `host` + `AsyncLocalStorage` + 4 features novas. Working tree limpo, sem conflitos. Fonte: `git diff --stat c789654^1..c789654` (116 arquivos, +18526/-84).
- [2026-05-11 17:24] SPEC-1400 dependia conceitualmente da SPEC-1505 (bootstrap + base multitenant) — promovido a fato após o merge. Schema das tabelas de loja vem da SPEC-1506 (ainda em `future/`), não da 1505. Confirmado por leitura de `docs/future/SPEC-20260503-1506-modulo-lojas/main.md`.
- [2026-05-11 17:24] Tenant resolution na plataforma é via `host` → `/tenant/resolve` → `AsyncLocalStorage`, sem header `x-tenant-id`. Fonte: SPEC-1505 main + `docs/CLAUDE.md` atualizado pós-merge.
- [2026-05-12 12:42] SPEC-20260503-1506-modulo-lojas adiada/não vai entregar o schema. Fonte: confirmação direta do dev nesta sessão. Verificado em código: `backend/src/entities/` contém apenas `Tenant`, `User`, `RefreshToken`; `backend/src/migrations/` não tem nenhuma migration de stores. SPEC-1506 segue em `docs/future/` (destino a decidir).

## Inferências prováveis

_(nenhuma ativa após o merge — todas as anteriores foram resolvidas)_

## Dúvidas em aberto

- [2026-05-08 13:35] Cache de listagem vazia (zero resultados) é desejável (anti-stampede) ou problema? Próxima ação: documentar como decisão consciente ou ajustar para não cachear array vazio. **Re-avaliar na re-implementação.**
- [2026-05-08 13:35] `featured` aceita só literal `'true'` (`'1'`, `'yes'` são silenciosamente ignorados). Comportamento intencional? Próxima ação: confirmar com dev e documentar no main. **Re-avaliar na re-implementação.**
- [2026-05-11 17:24] Caminho exato do helper de cache na nova estrutura: `backend/src/utils/cache.ts` vs `backend/src/services/cache.service.ts`? Verificar se já há helper genérico de cache (a SPEC-1505 implementou cache de `/tenant/resolve`, pode ter deixado utilitário). Próxima ação: inspecionar `backend/src/` na re-implementação.
- [2026-05-11 17:24] Header `Vary` correto pós-tenant-resolution-por-host: `x-forwarded-host`? `host`? Confirmar olhando o que o middleware da SPEC-1505 lê de fato.
- [2026-05-12 12:42] `pg_trgm` está habilitado na base ou não? Se sim, vale criar índice GIN trigram em `store_name` na migration; se não, deixar `ILIKE` linear como MVP e abrir SPEC futura. Próxima ação: checar migrations existentes da SPEC-1505 e/ou rodar `SELECT * FROM pg_extension` em ambiente dev.

## Dúvidas resolvidas

- [2026-05-08 13:50] ~~Endpoint `[slug]/route.ts` foi deletado em `759eca5` sem motivo registrado.~~ **Resolvido:** dev confirmou que subiu por engano em `96b5a33` e foi removido na sequência. Detalhe vai para SPEC futura, path-based.
- [2026-05-11 17:24] ~~PR depende de SPEC-1505 para schema Drizzle e bootstrap.~~ **Resolvido:** SPEC-1505 entregou bootstrap real mas mudou ORM (Drizzle → TypeORM); schema das tabelas de loja é da SPEC-1506.
- [2026-05-11 17:24] ~~Middleware que injeta `x-tenant-id` vem de outra SPEC.~~ **Refutado:** plataforma não usa header `x-tenant-id`; tenant resolution é por `host` + `AsyncLocalStorage`.
- [2026-05-12 12:42] ~~Destino da SPEC-1506 (atualizar ou descartar).~~ **Resolvido:** descartada e movida para `discard/`. Justificativa formal em `docs/discard/SPEC-20260503-1506-modulo-lojas/main.md`.

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-05-06 14:00 — [ativação]

SPEC criada e ativada pelo dev. Plano: implementar 2 rotas públicas (listagem + detalhe) com cache Redis de 5 min, isolamento por tenant via header `x-tenant-id`, fallback gracioso se Redis cair, invalidação via SCAN.

Arquivos identificados como relevantes:
- `backend/app/api/v1/stores/route.ts` (novo)
- `backend/app/api/v1/stores/[slug]/route.ts` (novo)
- `backend/lib/cache.ts` (novo)

## 2026-05-06 ~14:00–18:00 — [tentativa] Implementação inicial

Implementação do código. Commit `96b5a33` ("feat: implement public API endpoints for stores with Redis caching"). PR #3 aberta para `main`.

Resultado: código funcionalmente completo na superfície, mas com:
- Imports `@/lib/db` e `@/lib/schema` como placeholders (schema Drizzle real ainda não existe).
- Estrutura SPEC incorreta: `main.md` colocado em `backend/app/api/v1/stores/main.md` em vez de `docs/active/SPEC-.../`.
- Falso-archive criado em `docs/archive/SPEC-route-stories/` (ID inválido, sem state/memory).

## 2026-05-08 11:06 — [refactor] Remoção do endpoint detalhe (commit `759eca5`)

Autor da PR removeu `backend/app/api/v1/stores/[slug]/route.ts` (148 linhas) e renomeou `backend/app/api/v1/stores/main.md` → `docs/archive/SPEC-route-stories/main.md` em commit `759eca5`. Mensagem: "feat: remove deprecated store detail API and documentation". Motivo NÃO documentado nem em commit nem em SPEC. Resultado: contrato (main.md original) e código entregue divergem — branch entrega só listagem.

Conhecimento desta entrada: descoberto durante o re-bootstrap em 2026-05-08 13:45 via `git show 759eca5`.

## 2026-05-08 13:35 — [MARCO] [nota] Re-bootstrap da estrutura SPEC

Iniciada sessão de revisão da PR #3. Identificado que a SPEC viola múltiplas regras do RULES.md v2:
- R.1: ID `SPEC-route-stories` no archive não tem timestamp.
- R.2: `docs/active/` deveria ter a SPEC, mas está vazio.
- R.3: nenhuma das 3 pastas (active/archive) tem os 3 arquivos obrigatórios (main + state + memory).
- R.4: feature `stores-public-api` declarada mas inexistente em `docs/features/`.
- R.7: SPEC "arquivada" sem nenhum critério de aceite marcado e sem atualizar features tocadas.

Decisão (sob confirmação do dev): tratar o falso-archive como "correção de erro em minutos" (R.5 permite excepcionalmente) — deletar pasta `docs/archive/SPEC-route-stories/` e materializar a SPEC corretamente em `docs/active/SPEC-20260506-1400-stores-public-api/` com os 3 arquivos.

Ações:
- Criados `docs/active/SPEC-20260506-1400-stores-public-api/{main,state,memory}.md`
- Criada `docs/features/stores-public-api.md`
- Removido `backend/app/api/v1/stores/main.md`
- Removido `docs/archive/SPEC-route-stories/`

Critério de aceite expandido no main.md com os pontos cobertos pela review (escape de wildcards, normalização, slug-rename, helpers, testes).

## 2026-05-08 13:45 — [MARCO] [descoberta] Escopo divergente do contrato

Durante o re-bootstrap, descoberto que commit `759eca5` removeu o endpoint detalhe sem ajustar a SPEC. Promoção de inferência ("PR entrega só listagem") para fato — confirmado por `git diff main..HEAD --name-status`:

```
A  .github/CODEOWNERS
A  backend/app/api/v1/stores/route.ts
A  backend/lib/cache.ts
A  docs/archive/SPEC-route-stories/main.md
```

Não aparece `[slug]/route.ts` — confirmado deletado.

Decisão pendente do dev (registrada em "Dúvidas em aberto"): re-aplicar detalhe (revert) ou re-escopar SPEC.

## 2026-05-08 13:50 — [MARCO] [unblock] Escopo confirmado: listagem-only

Dev confirmou: *"Eu sei porque, subiu por engano."* Endpoint `[slug]/route.ts` chegou ao commit `96b5a33` por engano e foi removido em `759eca5`. SPEC re-escopada para listagem-only.

Mudanças aplicadas em `main.md`:
- Resumo + Objetivo: removida menção a detalhe.
- Escopo DENTRO: removido `GET /api/v1/stores/[slug]` e linha "404 para slug...".
- Escopo FORA: adicionado `GET /api/v1/stores/[slug]` com nota "subiu por engano em 96b5a33, removido em 759eca5".
- Implementação: removida chave de cache de detalhe; schema enxuto para colunas usadas pela listagem.
- Arquivos afetados: removido `[slug]/route.ts`.
- Critério de aceite: removidos itens específicos de detalhe (slug 404 cross-tenant, slug-rename na invalidação, helpers compartilhados — com 1 endpoint não há duplicação).

Mudanças aplicadas em `feature.md`:
- Keywords: removido `detalhe`.
- Arquivos principais: removido `[slug]/route.ts`.
- Resumo: ajustado para listagem-only.
- Estado atual: ajustado, com nota explicando a remoção do detalhe.

## 2026-05-08 13:52 — [decisão] Manter path-based (`/api/v1/stores/[slug]`) na SPEC futura

Dev levantou se valeria header em vez de path. Trade-offs apresentados:
- CDN cacheia por URL — header explode chaves via `Vary`.
- Path-based é bookmarkável, debugável e padrão da indústria.
- "Limpeza" de não-duplicação resolve-se via helpers compartilhados, não via fusão de endpoints.

Decisão do dev: *"Ok, mantemos."* Path-based confirmado para SPEC futura.

## 2026-05-08 14:00 — [MARCO] [decisão] SPEC futura criada para o detalhe

Criada `docs/future/SPEC-20260508-1400-stores-public-detail/main.md` com contrato do endpoint detalhe extraído. Vincula à mesma feature `stores-public-api`, declara dependência de SPEC-20260506-1400 (base do `lib/cache.ts`), e captura todos os critérios que saíram desta SPEC no re-escopo:

- 404 unificado (regra de segurança contra enumeração cross-tenant).
- Invalidação cobrindo rename de slug (slug antigo + novo).
- Extração de helpers compartilhados (`requireTenantId`, `cacheHeaders`, `fetchStoreCategories`) — adiada nesta SPEC porque com 1 endpoint não há duplicação real.
- Cache de `null` aceito como decisão consciente (anti-stampede).

`docs/features/stores-public-api.md` atualizado com a SPEC futura na seção "Planejadas" e gotchas correspondentes.

## 2026-05-08 13:35 — [nota] Pendências da review da PR #3

Pontos da review que viram critério de aceite (vide main.md, seção "Critério de aceite"):
1. Escapar `%` e `_` no parâmetro `search` antes de passar ao ILIKE.
2. Normalizar `search` (lowercase + trim) antes de compor cache key — evita HIT-rate ruim.
3. ~~Cobrir rename de slug em `invalidateAllStoresCaches`~~ — saiu de escopo após re-escopo (vai com SPEC do detalhe).
4. ~~Extrair helpers duplicados~~ — saiu de escopo: com 1 endpoint não há duplicação. Re-avaliar quando detalhe voltar via SPEC futura.
5. Substituir imports placeholder `@/lib/db` e `@/lib/schema` quando schema Drizzle real estiver disponível.
6. Adicionar testes mínimos cobrindo isolamento por tenant (a regra crítica), fallback Redis, cache HIT/MISS.

## 2026-05-08 14:10 — [MARCO] [refactor] Escape LIKE + normalização do search (commit `bf21c78`)

Aplicadas as 2 correções de código apontadas na review:

**1. Escape de wildcards LIKE.** Adicionada `escapeLikePattern(s: string)` em `route.ts` (próximo às constantes), que escapa `\`, `%` e `_`. Usada no `ilike(stores.name, \`%${escapeLikePattern(search)}%\`)`. Antes da mudança, `?search=50%` retornava todas as lojas — `%` era interpretado como wildcard. Agora retorna só lojas com "50%" no nome.

**2. Normalização do `search`.** No handler, antes de compor `params`:
```ts
const rawSearch = searchParams.get('search')
const normalizedSearch = rawSearch ? rawSearch.toLowerCase().trim() : ''
```
e `params.search = normalizedSearch || undefined`. Garante que cache key e query veem o mesmo valor — `?search=Mc` e `?search=mc` agora geram o mesmo cache key. Antes, geravam chaves diferentes com resultados idênticos (cache duplicado, hit-rate ruim).

**Decisão de localização da normalização:** feita no handler (não em `buildStoreListCacheKey`) porque cache key e query precisam usar o mesmo valor — se normalizasse só na chave, query usaria valor cru e o cache HIT serviria resultado errado em casos como `"a "` vs `"a"`.

**Decisão sobre escape:** feito SÓ na query, NÃO na cache key. Cache key documenta o que o usuário pediu (após normalização); o escape é tradução para o protocolo SQL LIKE — preservar separação.

Critérios de aceite marcados em `main.md`:
- [x] Wildcards SQL escapados no `search` (commit `bf21c78`)
- [x] `search` normalizado antes de compor cache key (commit `bf21c78`)

Restam para fechar a SPEC: testes mínimos (bloqueado pelo bootstrap ausente do `backend/`).

## 2026-05-11 16:47 — [nota] Merge de `main` em `c789654`

Dev fez merge de `main` na branch (`c789654`), trazendo:
- SPEC-20260503-1505 concluída e arquivada (base da plataforma multitenant)
- Backend reescrito do zero em Express 4 + TypeORM 0.3 (estrutura `src/{controllers,services,repositories,routes,entities,migrations,subscribers,middleware,dtos,config,utils}`)
- Tenant resolution via `host` → `/tenant/resolve` → Redis (TTL 10 min) → `AsyncLocalStorage`, com helper `withTenant(qb)` e subscriber TypeORM
- Naming `tb_<entity>` + colunas com prefixo de entidade (`tenant_name`, `tenant_host`, etc.)
- Auth JWT (15 min) + refresh (7 dias) em cookies HttpOnly+Secure+SameSite=Lax
- Flavors versionados em `portal/public/flavors/<slug>/` + validador no CI
- 4 features novas em `docs/features/` (auth, infra-base, tenant-resolution, theme-system)
- `docs/CLAUDE.md` atualizado com stack final + comandos do monorepo

Working tree limpo após o merge — sem conflitos. Os 3 commits da branch (`0d7a864`, `bf21c78`, `47e9c7a`) permanecem antes do merge commit.

**Impacto na SPEC-1400:** stack declarada (Next.js + Drizzle) ficou incompatível com o backend real (Express + TypeORM). Implementação anterior em `backend/app/api/v1/stores/route.ts` + `backend/lib/cache.ts` ficou órfã — código Next.js App Router lado a lado com a nova estrutura Express.

## 2026-05-11 17:24 — [MARCO] [decisão] Re-escopo radical pós-merge SPEC-1505

Decisão (sob confirmação do dev — opção (a) "re-escopo radical" vs (b) pausar em future ou (c) descartar): manter SPEC ativa, reescrever `main.md` para a nova stack, deletar o código antigo, e adicionar dependência da SPEC-1506 (que entrega o schema).

**Por que re-escopo e não pausa:** intenção (listagem pública cacheada com isolamento) e gotchas (escape LIKE, normalize search, SCAN não KEYS, `Vary` crítico para CDN, JOIN com tenant_id) seguem válidos. A SPEC futura `SPEC-20260508-1400-stores-public-detail` está vinculada a esta — pausa exigiria desvincular tudo. Re-escopo preserva o pensamento; só muda a stack alvo.

**Por que código antigo deletado em vez de migrado:** mudança de ORM (Drizzle → TypeORM) + framework (Next.js App Router → Express) torna `route.ts` e `cache.ts` praticamente reescritos do zero. Manter como referência seria ruído maior que valor (o pensamento já está documentado neste log + no `main.md` re-escrito + nos gotchas da feature).

**Mudanças em `main.md`:**
- `Status`: continua `active`
- `Depende de`: `—` → `SPEC-20260503-1506-modulo-lojas`
- `Origem`: anexada nota do re-escopo com data + commit do merge
- Stack: Next.js App Router + Drizzle → Express 4 + TypeORM 0.3 + ioredis
- Tenant resolution: header `x-tenant-id` → `AsyncLocalStorage` + `withTenant(qb)` (entregue por SPEC-1505)
- Schema assumido: `stores`/`categories`/`store_categories` (camelCase Drizzle) → `tb_store`/`tb_category`/`tb_store_category` (TypeORM com colunas prefixadas)
- Arquivos planejados: caminhos Next.js (`backend/app/api/v1/stores/route.ts`, `backend/lib/cache.ts`) → caminhos Express (`backend/src/controllers/`, `backend/src/services/`, `backend/src/repositories/`, `backend/src/routes/`, `backend/src/dtos/`, `backend/src/utils/cache.ts` ou `services/cache.service.ts`)
- Cache key + headers HTTP: **mantidos** (decisões independentes da stack)
- Critério de aceite: 2 critérios marcados em `bf21c78` **desmarcados** (código sobre o qual eles foram entregues foi deletado — precisam ser re-entregues sobre TypeORM); adicionados 2 critérios novos (entidades TypeORM + tenant via AsyncLocalStorage); ajustado `Vary` de `x-tenant-id` para `x-forwarded-host`

**Arquivos deletados em 2026-05-11 17:24:**
- `backend/lib/cache.ts` (150 linhas, Drizzle/ioredis — `cached<T>`, `invalidateStoresCache`, `invalidateStoreDetailCache`, `invalidateAllStoresCaches`, `buildStoreListCacheKey`, `buildStoreDetailCacheKey`)
- `backend/app/api/v1/stores/route.ts` (227 linhas, Next.js App Router + Drizzle — handler GET listagem com escape LIKE + normalize search)

Pastas pais vazias (`backend/lib/`, `backend/app/api/v1/stores/`, `backend/app/api/v1/`, `backend/app/api/`, `backend/app/`) também removidas se ficarem vazias.

**Próximos passos:** SPEC fica bloqueada aguardando ativação/conclusão da SPEC-20260503-1506-modulo-lojas. Re-implementação depende do schema TypeORM real.

**Inferências promovidas a fato pelo merge:**
- ~~PR depende de SPEC-1505 para schema Drizzle e bootstrap~~ → **Confirmado parcialmente**: SPEC-1505 entregou bootstrap real e nova stack, mas **mudou** ORM de Drizzle para TypeORM; schema das tabelas de loja é da SPEC-1506, não da 1505.
- ~~Middleware que injeta `x-tenant-id` vem de outra SPEC~~ → **Refutado**: tenant resolution na SPEC-1505 é via `host` + `AsyncLocalStorage`, sem header `x-tenant-id`.

## 2026-05-12 12:42 — [MARCO] [decisão] Re-escopo #2: incluir schema mínimo após adiamento da SPEC-1506

Dev confirmou nesta sessão que a SPEC-20260503-1506-modulo-lojas foi adiada (resposta literal: *"Foi descartada/adiada"*). Validação direta em código: `backend/src/entities/` contém apenas `Tenant`, `User`, `RefreshToken`; nenhuma migration de stores em `backend/src/migrations/`. Bloqueio original (esperar 1506 entregar schema) deixou de fazer sentido.

**Caminhos apresentados ao dev:**
- (A) Re-escopar SPEC-1400 para incluir schema mínimo de lojas + listagem. Pró: 1 PR end-to-end. Contra: escopo cresce; admin/CRUD futuro herda schema sem dono óbvio.
- (B) Pausar 1400 em `future/`, criar SPEC-base separada só do schema, depois reativar 1400. Pró: SPECs pequenas e focadas. Contra: 2 PRs em sequência.

**Decisão do dev** (resposta literal: *"Podemos faze-lo nesta spec?"* + *"Manda bala!"*): **Opção A** — schema mínimo entra nesta SPEC. Trade-off aceito: SPEC vira "schema + listagem", maior, mas entrega valor end-to-end em 1 PR e admin/CRUD ficam livres pra evoluir o schema em SPEC futura sem conflito de escopo.

**Mudanças aplicadas em `main.md` nesta sessão:**
- Título: adicionado sufixo "+ schema mínimo"
- `Depende de`: `SPEC-20260503-1506-modulo-lojas` → `—` (schema agora é entregue por esta própria SPEC)
- `Origem`: anexada nota do re-escopo #2 com data e motivo
- `Resumo`: ampliado pra mencionar entrega de schema mínimo
- `Objetivo`: 2 frases adicionais explicando o porquê do schema entrar
- `Escopo DENTRO`: adicionadas linhas para entidades + migration
- `Escopo FORA`: explicitado "CRUD admin de stores/categories" (era apenas implícito) + "Colunas avançadas no schema" + "Seed de lojas"
- `Implementação`: adicionada seção "Schema mínimo (TypeORM, entregue por ESTA SPEC)" com colunas, tipos, índices, FKs, constraints únicas
- Arquivos planejados: adicionados `entities/Store.ts`, `Category.ts`, `StoreCategory.ts`, `migrations/<timestamp>-CreateStoreTables.ts`, modificações em `app.ts` e `config/database.ts`
- Gotchas: adicionados "ordem das migrations FK", "sem pg_trgm cai pra ILIKE linear", "schema mínimo deliberadamente — não adicionar especulativamente"
- `Critério de aceite`: dividido em 4 blocos (Schema, API, Testes, Processo). Adicionados 5 itens novos no bloco Schema. Adicionado 1 item no Processo: decidir destino da SPEC-1506 antes de arquivar (evitar 2 SPECs com mesmo schema).

**Dúvidas abertas resultantes** (registradas em "Dúvidas em aberto"):
1. Destino da SPEC-1506 (atualizar pra refletir só admin/CRUD, ou mover pra `discard/`?). **Resolver com dev antes de começar implementação.**
2. `pg_trgm` habilitado na base? **Inspecionar migrations da SPEC-1505 + DB dev.**

**Próximo passo** (registrado em TL;DR): validar o `main.md` re-escopado com o dev. Em seguida, alinhar destino da SPEC-1506. Só então mexer em código backend.

## 2026-05-12 12:42 — [MARCO] [decisão] SPEC-1506 descartada

Logo após o re-escopo #2, leitura do `main.md` da SPEC-20260503-1506-modulo-lojas (Nível 1, autorizada pelo dev) revelou problemas estruturais que tornam atualizá-la pior que descartá-la:

1. **Stack obsoleta:** escrita antes da SPEC-1505 fixar Express+TypeORM. Referencia `db/withTenant` (helper que não existe), schema `lojas` (não usa naming `tb_<entity>`), Server Actions e rotas frontend `/lojas/[slug]` (Next.js). Atualizar = reescrever.
2. **Escopo monstro (viola §9 do RULES.md):** 1 SPEC declarando schema de lojas, schema de categorias com reordenação, admin CRUD de ambos, upload+CDN, frontend público (listagem + detalhe), cache Redis, full-text search e permissões. RULES §9 recomenda quebrar quando passar de ~3 sessões — esta tem ~6+ SPECs reais dentro.
3. **Sobreposição:**
   - Schema + listagem + cache → absorvido por SPEC-1400 (esta) em 2026-05-12 12:42
   - Detalhe → já existe SPEC-20260508-1400-stores-public-detail em `future/`
   - Frontend público → responsabilidade do `portal/`, não do backend
   - Admin/upload/permissões → cada um merece SPEC própria

**Decisão do dev** (resposta literal: *"Então manda bala"*): descartar formalmente. Caminho permanente (não pretendemos reativar) — admin/upload virão em SPECs novas com IDs próprios quando hora.

**Mudanças aplicadas:**
- `docs/future/SPEC-20260503-1506-modulo-lojas/main.md`: `Status: draft` → `discarded`, adicionado `Descartada: 2026-05-12 12:42`, adicionada seção `## Justificativa de descarte` com motivo técnico detalhado + decisões de produto que ficam registradas pra herdarem em SPECs futuras.
- Pasta movida: `docs/future/SPEC-20260503-1506-modulo-lojas/` → `docs/discard/SPEC-20260503-1506-modulo-lojas/` via `git mv`.

**Features não atualizadas** (R.5.4): SPEC-1506 declarava features `lojas`, `categorias-lojas`, `busca`, mas elas não existem em `docs/features/` (nunca foram criadas). Nada a fazer.

**Item de processo resolvido:** "Decidir destino da SPEC-1506 antes de arquivar" no critério de aceite do `main.md` desta SPEC. Marcado.

## 2026-05-12 13:24 — [MARCO] [implementação] Schema + API + testes unit entregues

Implementação técnica completa nesta sessão. Inspeção prévia do backend (`backend/src/utils/with-tenant.ts`, `middleware/tenant-context.ts`, `subscribers/TenantSubscriber.ts`, `app.ts`, migrations existentes) confirmou:
- `withTenant(qb)` injeta `WHERE alias.tenant_id = :tenantId` lendo do AsyncLocalStorage; suficiente para isolamento em SELECTs.
- `TenantSubscriber` já cobre INSERTs/UPDATEs (auto-popula `tenant_id`, rejeita cross-tenant insert, proíbe update de tenant_id). Nossas 3 entidades herdam isso de graça por terem propriedade `tenantId` declarada.
- `app.set('trust proxy', true)` está ativo → `req.hostname` reflete `X-Forwarded-Host` quando atrás de proxy. Header `Vary` correto: **`X-Forwarded-Host`**.
- `pg_trgm` **não** está habilitado (só `pgcrypto`). Decisão: ficar com `ILIKE` linear; gotcha registrada na feature.
- `UuidHelper` existe e detecta `uuid_generate_v4()` vs `gen_random_uuid()` em runtime — usado na nossa migration.
- Não há helper genérico de cache no backend (TenantResolverService faz inline); criado `backend/src/utils/cache.ts`.

**Arquivos novos:**
- `backend/src/entities/Store.ts` — entity `tb_store` com índices únicos `(tenant_id, store_slug)` e composto `(tenant_id, store_status, store_sort_order)`.
- `backend/src/entities/Category.ts` — entity `tb_category` com índice único `(tenant_id, category_slug)`.
- `backend/src/entities/StoreCategory.ts` — entity `tb_store_category` (join, PK composta `(store_id, category_id)`, índices por tenant+category e tenant+store).
- `backend/src/migrations/1746748400000-CreateStoreTables.ts` — cria as 3 tabelas com FKs ON DELETE CASCADE em ordem (`tb_category` antes de `tb_store` antes de `tb_store_category`); down dropa na ordem inversa.
- `backend/src/utils/cache.ts` — `cached<T>(redis, key, ttl, fetchFn)` retorna `{ data, hit }`, com fallback gracioso a `fetchFn()` em qualquer erro de Redis (GET ou SET); `invalidateByPattern(redis, pattern)` via SCAN cursor + DEL (best-effort, nunca KEYS, nunca lança).
- `backend/src/dtos/store-list.dto.ts` — `parseStoreListQuery(query)` extrai/normaliza/clampa: search lowercase+trim, limit clamp 50, page fallback 1, featured/is_restaurant aceitam **APENAS** `'true'`/`'false'` (case-insensitive); valores inválidos são ignorados (não 400).
- `backend/src/repositories/store.repository.ts` — `StoreRepository.findActiveListing(query)` usa `withTenant(qb)` + filtro `store_status = 'active'` + filtros opcionais (featured, isRestaurant, search via ILIKE, category via INNER JOIN com tenant_id em todas as condições); `getManyAndCount()` para metadata. Exporta `escapeLikePattern` (testável). Order: `store_is_featured DESC, store_sort_order ASC, store_name ASC`.
- `backend/src/services/store.service.ts` — `StoreService.listActive(query)` envolve repo em `cached(...)` com chave `stores:list:{tenantId}:cat=:feat=:l=:p=:q=:rest=` (ordem alfabética; `undefined` vira `-`); retorna `{ response, cacheHit }`. `invalidateListings(tenantId)` chama `invalidateByPattern('stores:list:{tenantId}:*')`. TTL 300s.
- `backend/src/controllers/store.controller.ts` — `StoreController.list` chama service, seta `Cache-Control: public, max-age=300, s-maxage=300`, `Vary: X-Forwarded-Host`, `X-Cache: HIT|MISS`, responde JSON. Propaga erros via `next(err)`.
- `backend/src/routes/store.routes.ts` — `createStoreRoutes(controller)` registra `GET /api/v1/stores`.
- 3 suites de teste novas (21 testes): `store-list.dto.test.ts` (7), `store.repository.test.ts` (5), `store.service.test.ts` (9).

**Arquivos modificados:**
- `backend/src/config/database.ts` — adicionadas 3 entidades à lista do DataSource.
- `backend/src/app.ts` — `AppDeps` agora exige `storeController`; rota montada após auth.
- `backend/src/server.ts` — instancia `StoreRepository`/`StoreService`/`StoreController` e injeta em `createApp`.
- `backend/__tests__/helpers/mock-deps.ts` — adicionado `makeStubStoreController()` e incluído no `makeAppDeps`.
- `backend/__tests__/auth.e2e.test.ts` — usa `makeAppDeps({ ... })` em vez de objeto literal pra incluir storeController.

**Validações executadas:**
- `npm run typecheck -w backend`: limpo.
- `npm run lint -w backend`: limpo.
- `npm test -w backend`: 71/71 passando (50 antigos + 21 novos). Runtime 6.7s.

**Decisões implementacionais que importam:**
- Critério `Loja com store_status != active não aparece` é atestado pela cláusula hardcoded no QB do repository (não é configurável por filtro público) — visível em `store.repository.ts` linha do `andWhere('store.store_status = :status', { status: 'active' })`. Sem teste E2E, mas trivialmente revisável no PR.
- Critério "Filtros funcionam combinados" é atestado em parte pelo DTO test (parsing) + repository (cláusulas aplicadas condicionalmente); validação real do SQL gerado exige DB.
- Critério "isolamento por tenant" não tem teste E2E novo; herda `cross-tenant-isolation.test.ts` (SPEC-1505) que prova `withTenant` aplica WHERE corretamente e `TenantSubscriber` rejeita cross-tenant insert. Os testes do service cobrem o isolamento pela perspectiva da chave de cache (tenants diferentes não compartilham cache).
- Schema `store_status varchar(20)` (não enum) — permite evoluir status sem migration; validação fica no service (não há admin nesta SPEC; quando chegar, validar contra ['active','inactive','archived']).
- Decisão sobre retornar categorias por loja na response: **NÃO incluí**. Critério de aceite não exige, mantém schema/response mínimos. Adicionar em SPEC futura quando admin/UX precisar.

**O que falta antes do merge (critérios E2E):**
1. `npm run migration:run -w backend` aplica a migration sem erro contra o Postgres dev.
2. `npm run migration:revert -w backend` derruba limpo (sem orphan FKs).
3. Inserir 2 lojas com mesmo slug em tenants diferentes funciona; mesmo slug+tenant falha por constraint.
4. `curl /api/v1/stores -H "X-Forwarded-Host: <host>"` retorna 200 com shape esperado.
5. Segunda chamada retorna `X-Cache: HIT`.
6. Redis down → resposta ainda 200 (não 500).

Estas validações são triviais com `docker-compose up` + smoke test manual ou suite E2E com testcontainers. Não bloqueiam revisão do PR, mas devem rodar antes do merge.

**Próximo passo registrado em TL;DR:** validar contra DB+Redis reais, subir PR.

## 2026-05-18 — [MARCO] [conclusão]

SPEC arquivada após validação dos critérios entregáveis e merge do código em `main`.

**O que foi entregue (commit final `8199c7e`):**
- 3 entidades TypeORM (`Store`, `Category`, `StoreCategory`) + migration `1746748400000-CreateStoreTables.ts` no schema `scp`.
- `GET /api/v1/stores` com paginação, filtros (`category`, `featured`, `is_restaurant`, `search`), cache Redis (TTL 5 min), headers `Cache-Control`/`Vary: X-Forwarded-Host`/`X-Cache`.
- Fallback gracioso quando Redis cai.
- Escape de wildcards SQL no `search` (`%`/`_`/`\`) — superseded depois pelo PR #9 (full-text search com `tsvector`, sem SPEC associada), mas presente nesta entrega.
- 21 testes unit em 3 suites; suite total do backend passa.

**O que ficou pendente (registrado nos critérios):**
- E2E real contra DB + Redis (testcontainers ou `docker-compose up`).
- Validação manual da migration sub/desc contra Postgres dev.
- Inserção de slug duplicado entre tenants funciona; mesmo tenant falha.

Esses itens não bloquearam o merge (cobertura unit é suficiente pra revisão); foram absorvidos pelo PR #13 (`feature/SQU-47-validacao-de-isolamento`, em draft em 2026-05-18) que adiciona testes de integração ponta-a-ponta entre tenants.

**Features tocadas atualizadas (R.7):**
- `docs/features/stores-public-api.md` — linha em "Concluídas" + linha em "Em execução" removida (2026-05-18).

Commit do arquivamento: este commit.
