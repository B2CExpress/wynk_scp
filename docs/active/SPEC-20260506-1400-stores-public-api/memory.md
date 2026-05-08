# Memory — SPEC-20260506-1400

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-06 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-08 14:10 (sessão #2)
**Onde tô:** Re-bootstrap + re-escopo concluídos. Correções de código entregues em `bf21c78` (escape de `%`/`_` no `search` + normalização lowercase+trim). Restam testes mínimos para fechar a SPEC.
**Próximo passo:** Testes mínimos (isolamento por tenant, fallback Redis, cache HIT/MISS) — bloqueado pela ausência de bootstrap do `backend/` (sem package.json, sem jest/vitest).
**Última decisão:** Normalização do `search` foi colocada no handler (não em `buildStoreListCacheKey`) para garantir que cache key e query usem o mesmo valor. Escape do `%`/`_` foi feito SÓ na query — cache key documenta o input, escape é tradução para o protocolo LIKE.
**Bloqueio atual:** Bootstrap do `backend/` ausente (sem `package.json`, sem schema Drizzle real). Entrega de testes e validação dos imports `@/lib/db` / `@/lib/schema` dependem de SPEC externa.
**Se retomar, ler:** `state.md` entrada `[MARCO] [refactor]` em 2026-05-08 14:10 + critérios marcados em `main.md`.

---

## Contexto ativo

### O que está sendo feito AGORA

Sessão de revisão da PR #3 ("feat: implement public API endpoints for stores with Redis caching"). A revisão identificou problemas de processo (estrutura SPEC fora do lugar) e de código (wildcards SQL não escapados, cache key não normalizada, sem testes).

**Twist descoberto e resolvido nesta sessão:** commit `759eca5` havia removido o endpoint detalhe (subiu por engano em `96b5a33`). SPEC re-escopada para **listagem-only**; detalhe vai para SPEC futura, path-based mantido.

A sessão corrigiu a estrutura SPEC e o escopo do contrato. Restam: correções de código (escape, normalização) + testes mínimos. Bloqueio externo: schema Drizzle real ainda não existe.

### Hipóteses em jogo

- **PR depende de SPEC-20260503-1505-base-plataforma-multitenant** (status: testando). Schema Drizzle (`@/lib/db`, `@/lib/schema`) e bootstrap do `backend/` (package.json, tsconfig) provavelmente vêm de lá. Validar com dev.
- **Middleware que injeta `x-tenant-id` não está nesta SPEC** (status: testando). Header é assumido pelos handlers; alguma SPEC paralela ou futura entrega o middleware. Validar com dev.
- ~~**Endpoint detalhe foi removido por decisão de escopo intencional**~~ (status: **descartada**, 2026-05-08 13:50) — dev confirmou que foi por engano, não escopo intencional. SPEC re-escopada.

### Decisões recentes que importam pra continuar

- [2026-05-08 13:35] Falso-archive `docs/archive/SPEC-route-stories/` deletado em vez de mantido com nota — foi nunca-válido (ID inválido, sem state/memory). R.5 permite "correção de erro em minutos".
- [2026-05-08 13:50] SPEC re-escopada para listagem-only após confirmação do dev. Detalhe (`/[slug]`) sai do "DENTRO" e entra no "FORA" com nota explicativa.
- [2026-05-08 13:52] Endpoint de detalhe (SPEC futura) **mantém path-based** (`GET /api/v1/stores/[slug]`). Header foi avaliado e descartado por (a) `Vary` explode chaves de CDN, (b) não-bookmarkável/debugável, (c) fricção com clientes HTTP. "Limpeza" de duplicação resolve via helpers, não via fusão de endpoints.
- [2026-05-08 14:00] Criada `SPEC-20260508-1400-stores-public-detail` em `docs/future/`. Captura: 404 unificado (segurança contra enumeração), invalidação cobrindo rename, extração de helpers compartilhados. `Depende de: SPEC-20260506-1400`. Feature atualizada com link.
- [2026-05-08 14:10] Correções aplicadas em `route.ts` (commit `bf21c78`): `escapeLikePattern` (escapa `\`, `%`, `_`) usado dentro do `ilike`; `search` normalizado (lowercase+trim) ANTES de virar `params` para alinhar cache key e query. Critérios correspondentes marcados em `main.md`.
- [2026-05-08 13:35] Não foi adicionada dependência formal (`Depende de:`) à SPEC-1505 sem confirmar com dev — preservou §R.8 (não ler future/ por iniciativa).

### Respostas-chave do usuário

- [2026-05-08 13:50] Usuário: *"Eu sei porque, subiu por engano."*
  Contexto: explicando a remoção do `[slug]/route.ts` em `759eca5`. Resolveu a dúvida de escopo divergente — habilitou re-escopo da SPEC para listagem-only.

- [2026-05-08 13:52] Usuário: *"Ok, mantemos."*
  Contexto: confirmação de manter path-based (`/[slug]`) para o endpoint de detalhe na SPEC futura, após apresentação dos trade-offs de header vs path.

- [2026-05-08 13:30] Usuário: *"Sim, essa é a ideia mesmo, fazer essas correções"*
  Contexto: confirmação do plano de re-bootstrap apresentado (criar 4 arquivos novos, remover 2 caminhos errados, opção (a) de deletar o falso-archive).

- [2026-05-08 13:25] Usuário: *"Porque o main.md esta em backend/app/api/v1/stores/main.md?"*
  Contexto: usuário identificou o erro de processo sem precisar de explicação técnica adicional — sinal de que ele conhece o RULES.md a fundo.

### Tentativas que falharam (para NÃO repetir)

- [2026-05-06 ~14:00] Autor da PR colocou `main.md` em `backend/app/api/v1/stores/main.md` e criou `docs/archive/SPEC-route-stories/` sem timestamp no ID. Falhou por desconhecimento do RULES.md (provavelmente não leu Nível 0). Lição: contributors externos precisam ser direcionados ao `docs/CLAUDE.md` antes de abrir PR.

### Arquivos ativamente sendo tocados

- `docs/active/SPEC-20260506-1400-stores-public-api/main.md` (criado + re-escopado nesta sessão)
- `docs/active/SPEC-20260506-1400-stores-public-api/state.md` (criado + atualizado nesta sessão)
- `docs/active/SPEC-20260506-1400-stores-public-api/memory.md` (criado + atualizado nesta sessão — este arquivo)
- `docs/features/stores-public-api.md` (criado + atualizado nesta sessão)
- ~~`backend/app/api/v1/stores/main.md`~~ (já removido em `759eca5`)
- ~~`docs/archive/SPEC-route-stories/`~~ (removido nesta sessão)

Em sessão futura (correções de código):
- `backend/app/api/v1/stores/route.ts` (escape de `%`/`_` no `search`, normalização da cache key)
- `backend/lib/cache.ts` (limpeza eventual com base no escopo final)
- testes mínimos (caminho a definir — depende da SPEC-1505 entregar bootstrap do `backend/`)

Em SPEC futura (a criar): endpoint `GET /api/v1/stores/[slug]`, path-based.

### Onde parei exatamente

Correções de código entregues em `bf21c78`. Critérios correspondentes marcados em `main.md`. Faltam testes mínimos para fechar a SPEC — bloqueados pela ausência de bootstrap do `backend/`. Próxima ação: confirmar com dev se a SPEC pode ficar bloqueada aguardando bootstrap, ou se vale destravar via `SPEC-20260503-1505-base-plataforma-multitenant`.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-06 14:00 | ~4h | ativação | Implementação inicial das rotas + cache.ts (commit `96b5a33`); estrutura SPEC ficou no lugar errado |
| 2 | 2026-05-08 13:25 | em andamento | continuidade | Review da PR #3 + re-bootstrap da estrutura SPEC para conformidade com RULES v2 + correções de código (commit `bf21c78`) |
