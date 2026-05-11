# Memory — SPEC-20260506-1400

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-06 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-11 17:24 (sessão #3)
**Onde tô:** Re-escopo radical aplicado após merge de `main` (`c789654`) que trouxe SPEC-1505 concluída. Backend mudou de Next.js+Drizzle para Express+TypeORM, invalidando a implementação anterior. `main.md` reescrito, código antigo deletado, dependência da SPEC-1506 adicionada. SPEC permanece `active` mas bloqueada até a 1506 entregar o schema.
**Próximo passo:** Ativar/concluir SPEC-20260503-1506-modulo-lojas em sessão dedicada — ela entrega `tb_store`, `tb_category`, `tb_store_category` e os endpoints admin. Sem isso, esta SPEC não tem alvo para re-implementação.
**Última decisão:** Re-escopo radical em vez de pausa ou descarte. Preserva intenção + gotchas + vínculo com a SPEC-futura `SPEC-20260508-1400-stores-public-detail`. Trade-off: SPEC fica ativa enquanto bloqueada, mas o contrato (main.md) já reflete a stack correta.
**Bloqueio atual:** Schema das tabelas de loja (`tb_store`, `tb_category`, `tb_store_category`) ainda não existe. Resolvido quando SPEC-1506 entregar entities TypeORM + migrations.
**Se retomar, ler:** `state.md` entrada `[MARCO] [decisão] Re-escopo radical pós-merge SPEC-1505` em 2026-05-11 17:24 + `main.md` reescrito (especialmente seções `Implementação` e `Critério de aceite`).

---

## Contexto ativo

### O que está sendo feito AGORA

Sessão #3: dev fez merge de `main` na branch `feature/SQU-43-api-publica` (commit `c789654`), trazendo a SPEC-1505 concluída — base da plataforma multitenant em Express 4 + TypeORM 0.3, com tenant resolution por `host` e `AsyncLocalStorage`. Isso invalidou completamente o contrato da SPEC-1400 (que assumia Next.js App Router + Drizzle + header `x-tenant-id`).

Caminho escolhido (sob confirmação do dev — opção "a" do menu apresentado): **re-escopo radical**. Reescrita pesada de `main.md` (stack, dependência, arquivos planejados, critério de aceite), deleção do código antigo (`backend/lib/cache.ts` + `backend/app/api/v1/stores/route.ts`), e atualização do `state.md`/`memory.md`/feature.

SPEC continua `active` mas **bloqueada** até a SPEC-20260503-1506-modulo-lojas ser ativada/concluída — ela entrega o schema TypeORM das tabelas de loja (`tb_store`, `tb_category`, `tb_store_category`).

### Hipóteses em jogo

- ~~**PR depende de SPEC-20260503-1505**~~ (status: **confirmada parcialmente**, 2026-05-11 17:24) — 1505 entregou bootstrap, mas mudou ORM (Drizzle → TypeORM) e tenant resolution (header → host); schema das tabelas de loja é da 1506.
- ~~**Middleware injeta `x-tenant-id`**~~ (status: **refutada**, 2026-05-11 17:24) — tenant resolution na plataforma é via `host` + `AsyncLocalStorage`, sem header `x-tenant-id`.
- **Helper genérico de cache pode já existir no backend** (status: testando) — SPEC-1505 implementou cache de `/tenant/resolve`. Validar lendo `backend/src/` ao desbloquear; reusar antes de criar novo helper.

### Decisões recentes que importam pra continuar

- [2026-05-11 17:24] Re-escopo radical (em vez de pausa ou descarte). Preserva intenção + gotchas + vínculo com SPEC-futura `SPEC-20260508-1400-stores-public-detail`. Custo: SPEC ativa bloqueada.
- [2026-05-11 17:24] Código antigo (`backend/lib/cache.ts`, `backend/app/api/v1/stores/route.ts`) deletado. Mudança de framework + ORM tornaria "migração" igual a "reescrita do zero". Pensamento preservado em log + main.md + gotchas da feature.
- [2026-05-11 17:24] Critérios `[x] Wildcards SQL escapados` e `[x] search normalizado` (commit `bf21c78`) **desmarcados** porque o código sobre o qual foram entregues foi deletado. Precisam ser re-entregues sobre TypeORM. Decisão técnica permanece registrada no log (state) — não vai ser redescoberta.
- [2026-05-11 17:24] Dependência formal adicionada no `main.md`: `Depende de: SPEC-20260503-1506-modulo-lojas`. Antes era `—`.
- [2026-05-11 17:24] `Vary` ajustado de `x-tenant-id` para `x-forwarded-host` (ou equivalente lido pelo middleware tenant) — confirmar valor exato na re-implementação.

### Respostas-chave do usuário

- [2026-05-11 17:24] Usuário: *"a"*
  Contexto: opção (a) "re-escopo radical + deletar código antigo agora" vs (b) "só doc agora, deletar depois". Habilitou o trabalho desta sessão.

- [2026-05-11 17:00] Usuário: *"1 Re-escopo radica"* (sic)
  Contexto: escolha entre 3 caminhos (re-escopo radical, pausa, descarte) após diagnóstico do conflito pós-merge. Caminho que preserva mais pensamento.

- [2026-05-11 16:50] Usuário: *"Espera, e que eu fiz merge com a main e não sei se alterou alguma coisa. Podes conferir"*
  Contexto: gatilho da sessão — dev pediu verificação pós-merge antes de qualquer ação na SPEC.

- [2026-05-08 13:50] Usuário: *"Eu sei porque, subiu por engano."*
  Contexto: explicando a remoção do `[slug]/route.ts` em `759eca5`. Habilitou re-escopo de listagem-only.

- [2026-05-08 13:52] Usuário: *"Ok, mantemos."*
  Contexto: confirmação de manter path-based (`/[slug]`) para o endpoint de detalhe na SPEC futura.

### Tentativas que falharam (para NÃO repetir)

- [2026-05-06 ~14:00] PR original colocou `main.md` em `backend/app/api/v1/stores/main.md` e criou `docs/archive/SPEC-route-stories/` sem timestamp no ID. Falhou por desconhecimento do RULES.md. Lição: contributors externos precisam ser direcionados ao `docs/CLAUDE.md` antes de abrir PR.
- [2026-05-06 ~14:00] Implementação inicial assumiu Next.js App Router + Drizzle, antes da SPEC-1505 fixar a stack final. Resultou em código todo reescrito quando 1505 escolheu Express + TypeORM. Lição: SPEC dependente de base não definida deve declarar `Depende de:` desde o início e aguardar — ou ser explícita sobre risco de re-escopo se a base mudar.

### Arquivos ativamente sendo tocados

Nesta sessão (re-escopo):
- `docs/active/SPEC-20260506-1400-stores-public-api/main.md` (reescrito)
- `docs/active/SPEC-20260506-1400-stores-public-api/state.md` (TL;DR + snapshot atualizados + nova entrada de log)
- `docs/active/SPEC-20260506-1400-stores-public-api/memory.md` (sobrescrito — este arquivo)
- `docs/features/stores-public-api.md` (estado atual + dependência 1506)
- `backend/lib/cache.ts` (deletado)
- `backend/app/api/v1/stores/route.ts` (deletado)

Em sessão futura (re-implementação, quando 1506 desbloquear):
- `backend/src/controllers/store.controller.ts` (novo)
- `backend/src/services/store.service.ts` (novo)
- `backend/src/repositories/store.repository.ts` (novo)
- `backend/src/routes/store.routes.ts` (novo)
- `backend/src/dtos/store-list.dto.ts` (novo)
- `backend/src/utils/cache.ts` ou `services/cache.service.ts` (novo, ou reuso de helper existente)
- Testes correspondentes

### Onde parei exatamente

Re-escopo radical concluído. SPEC bloqueada esperando SPEC-20260503-1506-modulo-lojas ser ativada. Não há mais nada a fazer neste SPEC enquanto a 1506 não entregar o schema. Próxima sessão neste código será a re-implementação completa em Express+TypeORM seguindo o `main.md` atualizado.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-06 14:00 | ~4h | ativação | Implementação inicial Next.js+Drizzle (commit `96b5a33`); estrutura SPEC fora do lugar |
| 2 | 2026-05-08 13:25 | ~1h | continuidade | Re-bootstrap da estrutura SPEC + re-escopo listagem-only + escape LIKE/normalize (commit `bf21c78`) |
| 3 | 2026-05-11 16:50 | ~40min | continuidade | Verificação pós-merge `c789654` + re-escopo radical (stack Next.js→Express, Drizzle→TypeORM, deps adicionadas, código antigo deletado) |
