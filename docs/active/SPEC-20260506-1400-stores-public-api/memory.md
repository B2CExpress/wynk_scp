# Memory — SPEC-20260506-1400

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-06 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-12 13:24 (sessão #4 — extensa)
**Onde tô:** Implementação técnica completa. 3 entidades + 1 migration + helper de cache + camadas controller/service/repository/routes/DTO. SPEC-1506 descartada formalmente (movida para `discard/`). Critérios técnicos do `main.md` quase todos marcados; E2E (migration:run/revert + smoke da rota com DB+Redis reais) explicitamente pendentes. Typecheck/lint verdes, **71 testes passando** (50 antigos + 21 novos).
**Próximo passo:** Validar contra DB+Redis reais (rodar migrations + smoke test); subir PR; pós-merge mover SPEC pra `archive/`.
**Última decisão:** Marcar critérios técnicos baseados em cobertura unit, deixando E2E explicitamente pendentes em vez de mascarar. SPEC fica honest sobre o que está atestado vs precisa de DB real.
**Bloqueio atual:** nenhum. Pendente: testes E2E + revisão do PR pelo dev.
**Se retomar, ler:** `state.md` entradas `[MARCO] [decisão] Re-escopo #2` (2026-05-12 12:42), `[MARCO] [decisão] SPEC-1506 descartada` (2026-05-12 12:42) e `[MARCO] [implementação] Schema + API + testes unit entregues` (2026-05-12 13:24) — esta última lista exatamente o que falta validar com DB real antes do merge.

---

## Contexto ativo

### O que está sendo feito AGORA

Sessão #4 longa: começou retomando após dev fechar outros PRs, evoluiu pra (1) descobrir que SPEC-1506 foi adiada, (2) re-escopar SPEC-1400 absorvendo schema mínimo, (3) descartar formalmente SPEC-1506, (4) implementar 100% das camadas técnicas (entidades, migration, cache util, repository, service, controller, routes, DTO, deps wiring em app.ts/server.ts) e (5) escrever 21 testes unit.

71 testes verdes, typecheck/lint limpos. Critérios técnicos do `main.md` quase todos marcados — exceto os que exigem DB+Redis reais (migration:run/revert, smoke da rota), que ficaram explicitamente pendentes em "Critério de aceite" e em "Próximos passos" do `state.md`. SPEC continua `active` até o E2E rodar + PR ser mergeado.

### Hipóteses em jogo

- ~~**SPEC-1506 vai entregar o schema**~~ (status: **refutada**, 2026-05-12 12:42) — dev confirmou adiada; SPEC-1506 descartada formalmente nesta sessão.
- ~~**Helper genérico de cache pode já existir no backend**~~ (status: **refutada**, 2026-05-12 13:00) — `TenantResolverService` faz cache inline com `redis.get`/`set`. Criei `backend/src/utils/cache.ts` com `cached()` + `invalidateByPattern()`.
- ~~**`pg_trgm` pode já estar habilitado**~~ (status: **refutada**, 2026-05-12 13:00) — `InitialSchema` só habilita `pgcrypto`. Decisão: `ILIKE` linear no MVP; gotcha registrada na feature.
- ~~**Helper `withTenant(qb)` e arquivo `tenant-context.ts` existem com esses nomes exatos**~~ (status: **confirmada**, 2026-05-12 13:00) — APIs reais: `withTenant<T>(qb)` deduz alias e injeta `andWhere(alias.tenant_id = :__tenantId)`; `requireTenantContext()` lança se sem ctx; `runWithTenantContext(ctx, fn)` útil em testes.
- ~~**Header `Vary` correto**~~ (status: **confirmada**, 2026-05-12 13:00) — `app.set('trust proxy', true)` ativo + commit `218d016` confirmam que `req.hostname` reflete `X-Forwarded-Host`. Controller seta `Vary: X-Forwarded-Host`.

### Decisões recentes que importam pra continuar

- [2026-05-12 13:24] Critérios E2E (migration:run/revert, smoke do `/api/v1/stores` com DB+Redis reais) ficam explicitamente pendentes no `main.md` — não mascarar com cobertura unit. Decisão por honestidade do contrato.
- [2026-05-12 13:18] `escapeLikePattern` exportada do repository (não privada) — facilita teste unit direto. Mantém função onde é usada (mesmo módulo) em vez de espalhar pra `utils/`.
- [2026-05-12 13:15] Response da listagem **não inclui categorias por loja** (`StoreListItem` mínimo). Critério de aceite não exige; adicionar em SPEC futura quando admin/UX precisar. Reduz complexidade da query (sem `array_agg`/sub-select).
- [2026-05-12 13:15] `featured` e `is_restaurant` aceitam APENAS `'true'`/`'false'` (case-insensitive). Valores `'1'`/`'yes'`/etc. são silenciosamente ignorados (não 400). Decisão consciente — comportamento estrito e previsível.
- [2026-05-12 13:00] Header `Vary` correto: `X-Forwarded-Host` (confirmado pelo `trust proxy` ativo em `app.ts`).
- [2026-05-12 13:00] Não habilitar `pg_trgm` nesta SPEC — escopo cresceria. `ILIKE` linear no MVP; gotcha de performance futura registrada.
- [2026-05-12 12:42] SPEC-1506 descartada formalmente (movida para `discard/`). Quebra em SPECs menores quando admin/upload/etc. for prioridade.
- [2026-05-12 12:42] Schema mínimo de lojas entra nesta SPEC (Opção A). Não há SPEC-1506 antes — desbloqueio é fazer aqui.
- [2026-05-12 12:42] Schema deliberadamente mínimo: só o necessário pra listagem pública. Campos como horário, geo, avaliações ficam pra SPECs futuras quando admin/UX exigirem. NÃO adicionar especulativamente.
- [2026-05-12 12:42] `store_status` é `varchar(20)` com validação no service, não enum DB — permite evolução sem migration.
- [2026-05-12 12:42] Constraints únicas: `(tenant_id, store_slug)` e `(tenant_id, category_slug)`. Garante que 2 tenants podem ter o mesmo slug.
- [2026-05-12 12:42] `tb_store_category` tem PK composta `(store_id, category_id)` + `tenant_id` redundante pra defesa em profundidade.
- [2026-05-12 12:42] Migration única (`CreateStoreTables`) cria as 3 tabelas em ordem correta (FK). `migration:revert` precisa derrubar limpo — critério de aceite.
- [2026-05-12 12:42] Helper `invalidateStoresCache(tenantId)` é exportado mesmo sem caller nesta SPEC. Preparado para SPEC futura de admin. TTL de 5 min cobre o gap.
- [2026-05-11 17:24] Re-escopo radical (em vez de pausa ou descarte) preservou intenção + gotchas + vínculo com SPEC-futura `SPEC-20260508-1400-stores-public-detail`. Custo: SPEC ativa bloqueada. (Bloqueio agora removido pelo re-escopo #2.)
- [2026-05-11 17:24] Código antigo (`backend/lib/cache.ts`, `backend/app/api/v1/stores/route.ts`) deletado. Pensamento preservado em log + main.md + gotchas da feature.
- [2026-05-11 17:24] Critérios `[x] Wildcards SQL escapados` e `[x] search normalizado` (commit `bf21c78`) desmarcados — código foi deletado. Re-entregar sobre TypeORM.

### Respostas-chave do usuário

- [2026-05-12 12:55] Usuário: *"Então manda bala"*
  Contexto: autorização para descartar formalmente a SPEC-1506 (vs atualizá-la pra cobrir só admin) após análise apresentada (stack obsoleta, escopo monstro, sobreposição com SPECs existentes).

- [2026-05-12 12:50] Usuário: *"Pode ler a main"* (referente ao `main.md` da SPEC-1506)
  Contexto: autorização Nível 1 para ler SPEC em `future/` antes de decidir destino.

- [2026-05-12 12:42] Usuário: *"Manda bala!"*
  Contexto: autorização explícita pra aplicar o re-escopo #2 (schema mínimo entra nesta SPEC) nos 3 arquivos de controle.

- [2026-05-12 12:40] Usuário: *"Podemos faze-lo nesta spec?"*
  Contexto: escolha entre Opção A (re-escopar 1400 pra incluir schema) e Opção B (criar SPEC-base separada). Opção A.

- [2026-05-12 12:35] Usuário: *"Mas estão pronto mesmo?"*
  Contexto: dev questionou minha afirmação de que SPEC-1506 não estava em main. Confirmei via `find backend/src/entities/` — só existem `Tenant`, `User`, `RefreshToken`.

- [2026-05-12 12:33] Usuário (via questionnaire): *"Foi descartada/adiada"*
  Contexto: status da SPEC-1506. Habilitou o re-escopo desta sessão.

- [2026-05-11 17:24] Usuário: *"a"*
  Contexto: opção (a) "re-escopo radical + deletar código antigo agora" vs (b) "só doc agora, deletar depois". Habilitou re-escopo #1.

- [2026-05-11 17:00] Usuário: *"1 Re-escopo radica"* (sic)
  Contexto: escolha entre 3 caminhos (re-escopo radical, pausa, descarte) após diagnóstico do conflito pós-merge. Caminho que preserva mais pensamento.

- [2026-05-08 13:50] Usuário: *"Eu sei porque, subiu por engano."*
  Contexto: explicando a remoção do `[slug]/route.ts` em `759eca5`. Habilitou re-escopo de listagem-only.

- [2026-05-08 13:52] Usuário: *"Ok, mantemos."*
  Contexto: confirmação de manter path-based (`/[slug]`) para o endpoint de detalhe na SPEC futura.

### Tentativas que falharam (para NÃO repetir)

- [2026-05-06 ~14:00] PR original colocou `main.md` em `backend/app/api/v1/stores/main.md` e criou `docs/archive/SPEC-route-stories/` sem timestamp no ID. Falhou por desconhecimento do RULES.md. Lição: contributors externos precisam ser direcionados ao `docs/CLAUDE.md` antes de abrir PR.
- [2026-05-06 ~14:00] Implementação inicial assumiu Next.js App Router + Drizzle, antes da SPEC-1505 fixar a stack final. Resultou em código todo reescrito quando 1505 escolheu Express + TypeORM. Lição: SPEC dependente de base não definida deve declarar `Depende de:` desde o início e aguardar — ou ser explícita sobre risco de re-escopo se a base mudar.
- [2026-05-11 17:24] Re-escopo #1 manteve `Depende de: SPEC-1506`, assumindo que 1506 ia ser priorizada em breve. Resultado: SPEC ficou ativa bloqueada por ~1 dia até dev decidir adiar 1506. Lição: dependência hard pra SPEC ainda não ativada é frágil — vale considerar absorção desde o início se o desbloqueio é incerto.

### Arquivos ativamente sendo tocados

Tocados nesta sessão #4 (todos uncommitted):

Doc/controle:
- `docs/active/SPEC-20260506-1400-stores-public-api/main.md` (reescrito + critérios marcados)
- `docs/active/SPEC-20260506-1400-stores-public-api/state.md` (TL;DR + snapshot + 2 entradas `[MARCO]`)
- `docs/active/SPEC-20260506-1400-stores-public-api/memory.md` (sobrescrito — este arquivo)
- `docs/features/stores-public-api.md` (estado atual reescrito + decisões/gotchas novos)
- `docs/discard/SPEC-20260503-1506-modulo-lojas/main.md` (Status: discarded + Justificativa)
- Pasta movida: `docs/future/SPEC-20260503-1506-modulo-lojas/` → `docs/discard/`

Código novo:
- `backend/src/entities/Store.ts`
- `backend/src/entities/Category.ts`
- `backend/src/entities/StoreCategory.ts`
- `backend/src/migrations/1746748400000-CreateStoreTables.ts`
- `backend/src/utils/cache.ts`
- `backend/src/dtos/store-list.dto.ts`
- `backend/src/repositories/store.repository.ts`
- `backend/src/services/store.service.ts`
- `backend/src/controllers/store.controller.ts`
- `backend/src/routes/store.routes.ts`
- `backend/__tests__/store-list.dto.test.ts`
- `backend/__tests__/store.repository.test.ts`
- `backend/__tests__/store.service.test.ts`

Código modificado:
- `backend/src/config/database.ts` (3 entidades novas no DataSource)
- `backend/src/app.ts` (rota montada + `storeController` em `AppDeps`)
- `backend/src/server.ts` (instancia + injeta deps de store)
- `backend/__tests__/helpers/mock-deps.ts` (stub do `storeController`)
- `backend/__tests__/auth.e2e.test.ts` (usa `makeAppDeps`)

### Onde parei exatamente

Implementação técnica completa. 71 testes verdes, typecheck/lint limpos. Próximos passos concretos:
1. **Antes de commitar:** revisar os arquivos com o dev se quiser.
2. **Antes do merge:** rodar `docker-compose up` (ou equivalente), executar `npm run migration:run -w backend`, validar que sobe; reverter e validar que desce; smoke test do `curl /api/v1/stores -H 'Host: <tenant_host>'` em 2 tenants diferentes confirmando isolamento + HIT/MISS no header `X-Cache`.
3. **Pós-merge:** mover `docs/active/SPEC-...-stores-public-api/` → `docs/archive/`; atualizar `docs/features/stores-public-api.md` movendo SPEC pra "Concluídas" (com data + commit final); marcar últimos 3 checkboxes do critério de aceite (R.7 + state[conclusão] + memory final).

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-06 14:00 | ~4h | ativação | Implementação inicial Next.js+Drizzle (commit `96b5a33`); estrutura SPEC fora do lugar |
| 2 | 2026-05-08 13:25 | ~1h | continuidade | Re-bootstrap da estrutura SPEC + re-escopo listagem-only + escape LIKE/normalize (commit `bf21c78`) |
| 3 | 2026-05-11 16:50 | ~40min | continuidade | Verificação pós-merge `c789654` + re-escopo radical (stack Next.js→Express, Drizzle→TypeORM, deps adicionadas, código antigo deletado) |
| 4 | 2026-05-12 12:30 | ~3h | continuidade | Re-escopo #2 + descarte formal da SPEC-1506 + implementação completa (3 entidades + migration + cache util + 5 camadas API + 21 testes unit). 71 testes verdes. E2E ainda pendente. |
