# State — SPEC-20260506-1400

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-06 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-08 13:55
**Onde tô:** Estrutura SPEC re-bootstrapada e re-escopada para **listagem-only**. Dev confirmou que `[slug]/route.ts` subiu por engano em `96b5a33` e foi removido em `759eca5`. Detalhe vai para SPEC futura (path-based mantido).
**Próximo passo:** Aplicar correções de código apontadas na review — escape de wildcards no `search`, normalização da cache key, extração de helpers se valer a pena (com só 1 endpoint, talvez não).
**Última decisão:** Manter `GET /api/v1/stores/[slug]` como path-based em SPEC futura (não usar header). Trade-offs documentados na conversa: cache CDN, bookmarkability, fricção do cliente.
**Bloqueio atual:** Imports `@/lib/db` e `@/lib/schema` são placeholders — depende de SPEC externa que entregue base do `backend/`.
**Se retomar, ler:** entrada `[unblock] Escopo confirmado: listagem-only` (2026-05-08 13:50) + critério de aceite em `main.md`.

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Implementação inicial (listagem + detalhe + cache.ts) | concluído | 2026-05-06 14:00 | `96b5a33` |
| 2 | Remoção do endpoint detalhe + movimento errado do main.md para archive | concluído | 2026-05-08 11:06 | `759eca5` |
| 3 | Estrutura SPEC correta (active/ + state + memory + feature) | em progresso | 2026-05-08 13:55 | — |
| 4 | Re-escopo: SPEC vira listagem-only; detalhe vai para SPEC futura | concluído | 2026-05-08 13:50 | — |
| 5 | Correções de código apontadas na review (escape, normalização, testes) | pendente | 2026-05-08 13:55 | — |
| 6 | Schema Drizzle real disponível (substituir placeholders) | bloqueado | 2026-05-08 13:55 | — |
| 7 | Conclusão e arquivamento | pendente | 2026-05-08 13:55 | — |

### Próximos passos

- [ ] Aplicar correções da review na branch `feature/SQU-43-api-publica` (escape de `%`/`_` no `search`, normalização lowercase+trim para cache key)
- [ ] Decidir se vale extrair helpers (`requireTenantId`, `cacheHeaders`) — com só 1 endpoint, talvez não compense (avaliar quando detalhe voltar via SPEC futura)
- [ ] Confirmar com dev se SPEC depende de `SPEC-20260503-1505-base-plataforma-multitenant` (ou outra) para schema Drizzle
- [ ] Adicionar testes mínimos cobrindo isolamento por tenant, fallback Redis, cache HIT/MISS
- [x] Criar SPEC futura para endpoint detalhe `GET /api/v1/stores/[slug]` — `SPEC-20260508-1400-stores-public-detail` em `docs/future/` (2026-05-08 14:00)
- [ ] Marcar critérios de aceite com timestamp + commit conforme forem entregues

### Bloqueios ativos

- **Schema Drizzle real ausente** — imports `@/lib/db` e `@/lib/schema` apontam para módulos inexistentes. Bloqueio depende de SPEC externa que define a base da plataforma.

---

## Fatos confirmados

- [2026-05-06 14:00] PR #3 implementa GET /api/v1/stores e GET /api/v1/stores/[slug] com cache Redis. Fonte: `backend/app/api/v1/stores/route.ts`, `backend/app/api/v1/stores/[slug]/route.ts`, `backend/lib/cache.ts`. Commit `96b5a33`.
- [2026-05-08 13:35] `main.md` da SPEC estava em `backend/app/api/v1/stores/main.md` (lugar errado, viola R.2/R.3). Fonte: estrutura da branch antes do re-bootstrap.
- [2026-05-08 13:35] `docs/archive/SPEC-route-stories/main.md` é cópia idêntica do main mal-posicionado, com ID inválido (sem timestamp, viola R.1) e sem state/memory (viola R.3). É um falso-archive criado antes do re-bootstrap.
- [2026-05-08 13:35] Função `cacheHeaders(hit)` é byte-a-byte idêntica entre `route.ts` e `[slug]/route.ts`. Fonte: `route.ts:206-215` e `[slug]/route.ts:139-148`.
- [2026-05-08 13:35] `ilike(stores.name, \`%${search}%\`)` interpola `search` direto sem escapar `%` e `_`. Fonte: `backend/app/api/v1/stores/route.ts:108`.
- [2026-05-08 13:35] `invalidateAllStoresCaches(tenantId, slug?)` recebe um único slug — não cobre rename. Fonte: `backend/lib/cache.ts:120-128`.
- [2026-05-08 13:45] Commit `759eca5` ("feat: remove deprecated store detail API and documentation") DELETOU `backend/app/api/v1/stores/[slug]/route.ts` (148 linhas) e MOVEU `backend/app/api/v1/stores/main.md` → `docs/archive/SPEC-route-stories/main.md`. Fonte: `git show 759eca5`. Resultado: branch entrega só listagem, mas SPEC `main.md` (origem) ainda declara os 2 endpoints.

## Inferências prováveis

- [2026-05-08 13:35] PR depende de `SPEC-20260503-1505-base-plataforma-multitenant` (em `future/`) para schema Drizzle real e bootstrap do `backend/`. Validar com: confirmar com dev e, se confirmado, preencher `Depende de:` no `main.md`.
- [2026-05-08 13:35] Middleware que injeta `x-tenant-id` é entregue por outra SPEC (provavelmente também `SPEC-1505` ou afim). Validar com: ler main da SPEC-1505 sob confirmação do dev.

## Dúvidas em aberto

- [2026-05-08 13:35] Cache de listagem vazia (zero resultados) é desejável (anti-stampede) ou problema? Próxima ação: documentar como decisão consciente ou ajustar para não cachear array vazio.
- [2026-05-08 13:35] `featured` aceita só literal `'true'` (`'1'`, `'yes'` são silenciosamente ignorados). Comportamento intencional? Próxima ação: confirmar com dev e documentar no main.

## Dúvidas resolvidas

- [2026-05-08 13:50] ~~Endpoint `[slug]/route.ts` foi deletado em `759eca5` sem motivo registrado.~~ **Resolvido:** dev confirmou que subiu por engano em `96b5a33` e foi removido na sequência. Detalhe vai para SPEC futura, path-based.

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
