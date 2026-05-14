# State - SPEC-20260514-2012

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-14 20:12

---

## TL;DR (sobrescrever ao fim de cada sessao)

**Ultima atualizacao:** 2026-05-14 20:35
**Onde to:** Backend minimo entregue (`GET /api/v1/stores/:slug`, `POST/PUT /api/admin/stores`), harness Vitest com `scp_test` + Redis DB 15 criado, 8 cenarios escritos e CI ligada. Regressao existente do backend segue verde (`npm test -w backend`: 71/71). O unico bloqueio remanescente e infraestrutura local ausente: `ECONNREFUSED` em Postgres/Redis.
**Proximo passo:** rodar `npm run test:isolation` em ambiente com Postgres `:5435` e Redis `:6382` ativos, corrigir qualquer falha funcional que aparecer e entao concluir/arquivar.
**Ultima decisao:** manter a suite em Vitest real e registrar honestamente o bloqueio de infraestrutura em vez de trocar para mocks ou rebaixar o escopo.
**Bloqueio atual:** sem Postgres/Redis locais nesta maquina (`5435` e `6382` fechadas; sem WSL e sem Docker)
**Se retomar, ler:** fatos confirmados desta sessao + entradas `[implementacao]`, `[tentativa]` e `[nota]` de 2026-05-14

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descricao | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Ler docs inteira + backlog + estado real do backend | concluido | 2026-05-14 20:12 | - |
| 2 | Criar SPEC e registrar nas features tocadas | concluido | 2026-05-14 20:12 | - |
| 3 | Implementar rotas/store services minimos para os cenarios obrigatorios | concluido | 2026-05-14 20:22 | - |
| 4 | Configurar Vitest + helpers de integracao + reset de DB/Redis | concluido | 2026-05-14 20:27 | - |
| 5 | Implementar os 8 cenarios de isolamento | concluido | 2026-05-14 20:28 | - |
| 6 | Rodar suite local + corrigir falhas ate ficar verde | bloqueado | 2026-05-14 20:28 | - |
| 7 | Atualizar CI + documentacao `docs/fase-2-isolacao.md` | concluido | 2026-05-14 20:31 | - |
| 8 | Conclusao e arquivamento | pendente | 2026-05-14 20:12 | - |

### Proximos passos

- [x] Ler a pasta `docs/` inteira por pedido explicito do usuario (2026-05-14 20:12)
- [x] Comparar backlog com o estado real do backend (2026-05-14 20:12)
- [x] Criar a SPEC desta fase (2026-05-14 20:12)
- [x] Implementar backend minimo para detalhe/admin de stores (2026-05-14 20:22)
- [x] Configurar Vitest para integracao com Postgres/Redis reais (2026-05-14 20:27)
- [x] Escrever a suite `tests/isolation/stores.test.ts` (2026-05-14 20:28)
- [x] Ligar `test:isolation` na CI (2026-05-14 20:31)
- [x] Documentar resultados em `docs/fase-2-isolacao.md` (2026-05-14 20:31)
- [ ] Validar a suite com infraestrutura local ou CI e corrigir falhas funcionais restantes

### Bloqueios ativos

- [2026-05-14 20:28] Postgres e Redis nao estao disponiveis nesta maquina. Evidencia: `npm run test:isolation` falhou com `ECONNREFUSED 127.0.0.1:5435`; `Test-NetConnection` confirmou `5435` e `6382` fechadas; `wsl --status` informou que WSL nao esta instalado; `docker` nao existe no PATH.

---

## Fatos confirmados

- [2026-05-14 20:12] O backend atual so expoe `GET /api/v1/stores`. Fonte: `backend/src/routes/store.routes.ts`.
- [2026-05-14 20:12] Nao existe rota publica de detalhe por slug nem rotas admin de stores no codigo atual. Fonte: `backend/src/routes/store.routes.ts`, `backend/src/app.ts`, busca global com `rg`.
- [2026-05-14 20:12] O backlog obrigatorio pressupoe `GET /api/v1/stores/:slug`, `POST /api/admin/stores` e `PUT /api/admin/stores/:id`, que ainda nao existem. Fonte: prompt do usuario + codigo atual.
- [2026-05-14 20:12] Os testes e2e atuais de auth/tenant usam stubs/repos fake e nao banco/Redis reais. Fonte: `backend/__tests__/auth.e2e.test.ts`, `backend/__tests__/tenant-resolve.e2e.test.ts`, `backend/__tests__/helpers/mock-deps.ts`.
- [2026-05-14 20:12] O projeto ainda nao tem Vitest configurado. Fonte: `package.json`, `backend/package.json`, ausencia de `vitest.config.ts`.
- [2026-05-14 20:22] O backend agora expoe `GET /api/v1/stores/:slug`, `POST /api/admin/stores` e `PUT /api/admin/stores/:id`. Fonte: `backend/src/routes/store.routes.ts`.
- [2026-05-14 20:27] A suite de isolamento usa banco de teste dedicado `scp_test` e Redis DB logico `15`. Fonte: `tests/helpers/vitest-env.ts`, `tests/helpers/setup.ts`.
- [2026-05-14 20:28] `npm run test:isolation` carrega a suite e entra no `beforeAll`, mas falha por conexao recusada ao Postgres antes de executar os cenarios. Fonte: saida do comando nesta sessao.
- [2026-05-14 20:29] A regressao existente do backend segue verde apos as mudancas de stores. Fonte: `npm test -w backend` -> `71/71`.
- [2026-05-14 20:30] WSL nao esta instalado nesta maquina e `docker` nao existe no PATH. Fonte: `wsl --status`, `docker ps`, `Test-Path` em caminhos comuns do Docker.

## Inferencias provaveis

- [2026-05-14 20:12] A forma mais barata e fiel de testar isolamento e subir o app Express em memoria, mas com `AppDataSource` e Redis reais. Validar com: implementar harness e medir estabilidade.
- [2026-05-14 20:12] O "superadmin" citado no backlog nao existe como papel global na base atual; talvez o helper `setupTenants()` nao precise dele para os 8 cenarios obrigatorios. Validar com: abrir os testes e ver se algum cenario depende mesmo desse papel.
- [2026-05-14 20:35] A CI com services de Postgres e Redis provavelmente vai conseguir executar a suite mesmo antes de a maquina local estar pronta, porque a conexao recusada foi puramente de infraestrutura local. Validar com: primeiro PR/primeira execucao do workflow `isolation`.

## Duvidas em aberto

- [2026-05-14 20:35] Nenhuma duvida funcional aberta no codigo. Falta apenas validar a suite em ambiente com infraestrutura disponivel.

---

## Log cronologico (APPEND-ONLY - NUNCA editar entradas antigas)

## 2026-05-14 20:12 - [ativacao]

Usuario pediu explicitamente: ler toda a pasta `docs`, depois ler o backlog enviado, criar a SPEC e so entao codificar. Documentacao inteira lida (features, SPEC ativa, futuras, arquivo descartado e arquivos arquivados). Comparacao com o backend confirmou um delta importante: o backlog assume rotas de detalhe/admin que ainda nao existem.

Plano inicial:
- criar uma SPEC nova focada em isolamento multitenant de stores;
- abrir a superficie minima do backend para os cenarios obrigatorios;
- configurar Vitest com Postgres/Redis reais;
- implementar os 8 cenarios;
- ligar a suite na CI e documentar os resultados.

## 2026-05-14 20:22 - [implementacao] Backend minimo para os cenarios obrigatorios

Foram abertas as rotas e regras minimas para que o backlog exista no codigo real:
- `GET /api/v1/stores/:slug`
- `POST /api/admin/stores`
- `PUT /api/admin/stores/:id`

Regras implementadas:
- `tenant_id` do payload e ignorado;
- create/update admin usam sempre o tenant da sessao/JWT;
- update de store de outro tenant responde `404`;
- `category_ids` de outro tenant respondem `422`;
- create/update invalidam cache de listagem do tenant atual.

Arquivos principais:
- `backend/src/routes/store.routes.ts`
- `backend/src/controllers/store.controller.ts`
- `backend/src/services/store.service.ts`
- `backend/src/repositories/store.repository.ts`

## 2026-05-14 20:27 - [implementacao] Harness Vitest de integracao criado

Infra entregue:
- `vitest.config.ts`
- `tests/helpers/vitest-env.ts`
- `tests/helpers/setup.ts`
- `tests/helpers/auth.ts`
- `tests/isolation/stores.test.ts`

Decisoes praticas:
- banco dedicado `scp_test` criado sob demanda via `pg`;
- Redis da suite usa DB logico `15` para nao misturar com outros fluxos;
- app Express sobe em memoria, mas com `AppDataSource` e Redis reais;
- reset entre testes faz `FLUSHDB` + `TRUNCATE ... CASCADE`.

## 2026-05-14 20:28 - [tentativa] Primeira execucao da suite

Comando executado:

```text
npm run test:isolation
```

Resultado:
- suite foi encontrada pelo Vitest;
- `beforeAll` tentou criar/usar `scp_test`;
- a execucao parou em `ECONNREFUSED` para `127.0.0.1:5435` e `::1:5435`.

Interpretacao: o harness esta sendo carregado, mas a maquina atual nao tem Postgres/Redis ativos nas portas esperadas.

## 2026-05-14 20:30 - [nota] Diagnostico de infraestrutura local

Validacoes executadas:
- `wsl --status` -> WSL nao instalado
- `docker ps` -> comando inexistente
- `Test-NetConnection localhost:5435` -> porta fechada
- `Test-NetConnection localhost:6382` -> porta fechada

Conclusao: o bloqueio nao e de codigo; e falta de runtime local para Postgres/Redis.

## 2026-05-14 20:31 - [implementacao] CI e documento da fase atualizados

Entregue:
- script raiz `test:isolation`
- job `isolation` no GitHub Actions com services de Postgres 15 e Redis 7
- documento `docs/fase-2-isolacao.md` com cenarios, infra, comando, falha proposital e status da sessao

## 2026-05-14 20:29 - [nota] Regressao existente do backend preservada

Comandos executados:
- `npm run typecheck -w backend`
- `npm run lint -w backend`
- `npm test -w backend`

Resultado: tudo verde; Jest segue em `71/71`.
