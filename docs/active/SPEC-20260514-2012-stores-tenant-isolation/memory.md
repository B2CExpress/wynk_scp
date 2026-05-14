# Memory - SPEC-20260514-2012

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-14 20:12

---

## TL;DR (sobrescrever ao fim de cada sessao)

**Ultima atualizacao:** 2026-05-14 20:35 (sessao #1)
**Onde to:** Backend minimo + harness Vitest + 8 cenarios + CI ja entregues. A unica pendencia real e executar a suite com Postgres/Redis disponiveis, porque esta maquina nao tem WSL, Docker nem servicos nas portas `5435`/`6382`.
**Proximo passo:** validar `npm run test:isolation` em ambiente com infra ativa e corrigir qualquer falha funcional restante.
**Ultima decisao:** manter o requisito de DB/Redis reais ate o fim; nao trocar para mocks so para "fechar verde" artificialmente.
**Bloqueio atual:** sem Postgres/Redis locais; `ECONNREFUSED` em `5435`.
**Se retomar, ler:** `state.md` entradas de 2026-05-14 20:22 em diante

---

## Contexto ativo

### O que esta sendo feito AGORA

Fase de isolamento multitenant para stores. A ordem pedida pelo usuario foi respeitada: docs inteira lida, backlog auditado, SPEC criada e so depois codigo. O delta real do backend foi fechado nesta sessao:
- detalhe publico por slug entregue;
- create/update admin de stores entregues;
- validacao cross-tenant de categorias entregue;
- harness Vitest com banco `scp_test` e Redis DB `15` entregue;
- 8 cenarios obrigatorios escritos;
- CI com services de Postgres/Redis entregue.

O unico ponto ainda nao concluido e a execucao local completa da suite, porque esta maquina nao oferece a infraestrutura exigida.

### Hipoteses em jogo

- **Harness em memoria com app Express + Postgres/Redis reais** (status: confirmada). 2026-05-14 20:27
- **Superadmin global nao sera necessario para os 8 cenarios** (status: confirmada). 2026-05-14 20:28

### Decisoes recentes que importam pra continuar

- [2026-05-14 20:12] A SPEC cobre "isolamento + abertura minima de backend", nao apenas testes.
- [2026-05-14 20:22] O backend ganhou somente a superficie minima necessaria ao backlog: detalhe por slug e create/update admin. Nao virou CRUD completo.
- [2026-05-14 20:27] Vitest foi configurado na raiz para uma suite de integracao fora do `backend/__tests__`.
- [2026-05-14 20:27] O banco de testes e `scp_test`; Redis da suite usa DB `15`.
- [2026-05-14 20:31] A CI roda a suite em job dedicado `isolation`, nao acoplado ao job `backend (test)`.
- [2026-05-14 20:35] Os cenarios continuam exigindo banco e Redis reais; nao houve downgrade para mocks.

### Respostas-chave do usuario

- [2026-05-14 20:12] Usuario: "primeiro leia toda a pasta docs depois leia o backlog que mandei, crie a SPEC e depois codifique"
  Contexto: ordem de execucao obrigatoria desta sessao.

### Tentativas que falharam (para NAO repetir)

- [2026-05-14 20:12] Tentar encaixar os 8 cenarios so em cima do backend atual falharia, porque tres rotas pressupostas pelo backlog ainda nao existem.
- [2026-05-14 20:28] Tentar validar a suite localmente sem checar a infraestrutura antes levou a `ECONNREFUSED` em `5435`. Licao: aqui o harness esta pronto; o gargalo e puramente runtime local.

### Arquivos ativamente sendo tocados

- `docs/active/SPEC-20260514-2012-stores-tenant-isolation/main.md`
- `docs/active/SPEC-20260514-2012-stores-tenant-isolation/state.md`
- `docs/active/SPEC-20260514-2012-stores-tenant-isolation/memory.md`
- `docs/features/stores-public-api.md`
- `docs/features/tenant-resolution.md`
- `docs/features/auth.md`
- `docs/features/infra-base.md`
- `.github/workflows/ci.yml`
- `docs/fase-2-isolacao.md`
- `package.json`
- `vitest.config.ts`
- `tests/helpers/vitest-env.ts`
- `tests/helpers/setup.ts`
- `tests/helpers/auth.ts`
- `tests/isolation/stores.test.ts`

### Onde parei exatamente

Tudo principal desta sessao foi entregue. Para retomar:
1. subir Postgres `:5435` e Redis `:6382`;
2. rodar `npm run test:isolation`;
3. se algo funcional falhar, corrigir o backend/testes;
4. atualizar `main.md`/features e arquivar a SPEC.

---

## Historico de sessoes

| # | Inicio | Duracao | Tipo | Sumario 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-14 20:12 | em curso | ativacao | Leitura completa de docs + backlog, auditoria do backend real e criacao da SPEC |
