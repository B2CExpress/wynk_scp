# State — SPEC-20260506-1400

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-06 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-11 17:24
**Onde tô:** Re-escopo radical aplicado após merge de `main` em `c789654` (SPEC-1505 concluída mudou backend para Express + TypeORM, invalidando código Next.js+Drizzle). `main.md` reescrito; código antigo (`backend/lib/cache.ts`, `backend/app/api/v1/stores/route.ts`) deletado.
**Próximo passo:** Aguardar ativação da SPEC-20260503-1506-modulo-lojas, que entrega o schema `tb_store`/`tb_category`/`tb_store_category`. Sem isso, a re-implementação em Express+TypeORM não tem alvo.
**Última decisão:** Re-escopo radical (vs pausa em `future/` ou descarte) — preserva intenção, gotchas e SPEC futura vinculada, ao custo de manter ativa enquanto bloqueada.
**Bloqueio atual:** Schema das tabelas de loja (`tb_store`, `tb_category`, `tb_store_category`) ainda não existe. Bloqueio resolvido quando SPEC-1506 entregar entities TypeORM e migrations.
**Se retomar, ler:** entrada `[MARCO] [decisão] Re-escopo radical pós-merge SPEC-1505` em 2026-05-11 17:24 + critério de aceite atualizado em `main.md`.

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
| 7 | Schema `tb_store`/`tb_category`/`tb_store_category` disponível via SPEC-1506 | bloqueado | 2026-05-11 17:24 | — |
| 8 | Re-implementação em Express+TypeORM (controller + service + repository + routes + dtos) | bloqueado | 2026-05-11 17:24 | — |
| 9 | Re-entrega das correções de review (escape LIKE + normalize search) sobre TypeORM | bloqueado | 2026-05-11 17:24 | — |
| 10 | Testes mínimos (isolamento por tenant, fallback Redis, cache HIT/MISS) | bloqueado | 2026-05-11 17:24 | — |
| 11 | Conclusão e arquivamento | pendente | 2026-05-11 17:24 | — |

### Próximos passos

- [x] Aplicar correções da review na branch `feature/SQU-43-api-publica` — escape de `%`/`_` no `search` + normalização lowercase+trim para cache key (2026-05-08 14:10, commit `bf21c78` — código depois deletado em 2026-05-11 17:24)
- [x] Confirmar com dev se SPEC depende de `SPEC-20260503-1505-base-plataforma-multitenant` (ou outra) para schema Drizzle e bootstrap do backend (2026-05-11 17:24 — confirmado pós-merge: depende da SPEC-1506 para schema; SPEC-1505 já entregue)
- [x] Criar SPEC futura para endpoint detalhe `GET /api/v1/stores/[slug]` — `SPEC-20260508-1400-stores-public-detail` em `docs/future/` (2026-05-08 14:00)
- [x] Re-escrever `main.md` para nova stack (Express + TypeORM) + nova dependência (SPEC-1506) + arquivos novos (controller/service/repository/routes/dtos) (2026-05-11 17:24)
- [x] Deletar código antigo Next.js+Drizzle (`backend/lib/cache.ts`, `backend/app/api/v1/stores/route.ts`) (2026-05-11 17:24)
- [ ] Aguardar ativação/conclusão da SPEC-20260503-1506-modulo-lojas (schema das tabelas)
- [ ] Re-implementar `GET /api/v1/stores` em Express+TypeORM seguindo nova `main.md`
- [ ] Re-entregar correções de review (escape LIKE + normalize search) sobre o novo código
- [ ] Adicionar testes mínimos cobrindo isolamento por tenant, fallback Redis, cache HIT/MISS
- [ ] Marcar critérios restantes de aceite conforme forem entregues e arquivar SPEC

### Bloqueios ativos

- **Schema das tabelas de loja ausente** — `tb_store`, `tb_category`, `tb_store_category` (com naming `store_*`, `category_*`) ainda não existem. Entrega depende da `SPEC-20260503-1506-modulo-lojas` (em `future/`, draft). Sem o schema, repositories/services da listagem não têm alvo.

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

## Inferências prováveis

_(nenhuma ativa após o merge — todas as anteriores foram resolvidas)_

## Dúvidas em aberto

- [2026-05-08 13:35] Cache de listagem vazia (zero resultados) é desejável (anti-stampede) ou problema? Próxima ação: documentar como decisão consciente ou ajustar para não cachear array vazio. **Re-avaliar na re-implementação.**
- [2026-05-08 13:35] `featured` aceita só literal `'true'` (`'1'`, `'yes'` são silenciosamente ignorados). Comportamento intencional? Próxima ação: confirmar com dev e documentar no main. **Re-avaliar na re-implementação.**
- [2026-05-11 17:24] Caminho exato do helper de cache na nova estrutura: `backend/src/utils/cache.ts` vs `backend/src/services/cache.service.ts`? Verificar se já há helper genérico de cache (a SPEC-1505 implementou cache de `/tenant/resolve`, pode ter deixado utilitário). Próxima ação: inspecionar `backend/src/` na re-implementação.
- [2026-05-11 17:24] Header `Vary` correto pós-tenant-resolution-por-host: `x-forwarded-host`? `host`? Confirmar olhando o que o middleware da SPEC-1505 lê de fato.

## Dúvidas resolvidas

- [2026-05-08 13:50] ~~Endpoint `[slug]/route.ts` foi deletado em `759eca5` sem motivo registrado.~~ **Resolvido:** dev confirmou que subiu por engano em `96b5a33` e foi removido na sequência. Detalhe vai para SPEC futura, path-based.
- [2026-05-11 17:24] ~~PR depende de SPEC-1505 para schema Drizzle e bootstrap.~~ **Resolvido:** SPEC-1505 entregou bootstrap real mas mudou ORM (Drizzle → TypeORM); schema das tabelas de loja é da SPEC-1506.
- [2026-05-11 17:24] ~~Middleware que injeta `x-tenant-id` vem de outra SPEC.~~ **Refutado:** plataforma não usa header `x-tenant-id`; tenant resolution é por `host` + `AsyncLocalStorage`.

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
