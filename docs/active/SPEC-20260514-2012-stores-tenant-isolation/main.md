# SPEC-20260514-2012: Isolamento multitenant de stores com testes reais

**Status:** active
**Criada:** 2026-05-14 20:12
**Ativada:** 2026-05-14 20:12
**Concluida:** -
**Commit final:** -
**Keywords:** stores, isolation, multitenant, vitest, redis, auth, ci, integration-tests
**Features:** stores-public-api, tenant-resolution, auth, infra-base
**Branch:** feature/SQU-47-validacao-de-isolamento
**Depende de:** SPEC-20260506-1400
**Origem:** usuario em 2026-05-14 20:12
**Resumo:** Validar com testes automatizados reais que stores, categories, cookies e cache Redis nao vazam entre tenants, abrindo as rotas minimas que ainda faltam para os cenarios obrigatorios existirem no backend atual.

## Objetivo

Entregar uma suite de isolamento com banco e Redis reais cobrindo os fluxos mais perigosos do modulo de stores. O backlog parte de um estado mais avancado do que o codigo atual, entao esta SPEC tambem inclui a abertura minima das rotas de detalhe/admin e das validacoes cross-tenant necessarias para que os testes exercitem comportamento real, nao mocks.

## Escopo

**DENTRO:**
- Suite Vitest em `tests/isolation/stores.test.ts` com 8 cenarios obrigatorios do backlog.
- Helpers reais para setup/reset de banco, tenants, usuarios, login por cookie e acesso HTTP em ambiente de teste.
- Configuracao Vitest para integracao usando o mesmo Postgres/Redis local do projeto.
- Abertura minima de backend para suportar os cenarios:
  - `GET /api/v1/stores/:slug`
  - `POST /api/admin/stores`
  - `PUT /api/admin/stores/:id`
  - validacao de `category_ids` cross-tenant
  - ignorar `tenant_id` vindo do payload e sempre usar o tenant da sessao
- Verificacao de cache Redis separada por tenant para listagem de stores.
- Script `test:isolation` e execucao no GitHub Actions em todo PR.
- Documento `docs/fase-2-isolacao.md` com resultados, comandos e evidencias textuais.

**FORA:**
- CRUD admin completo de categories.
- Backoffice UI para stores/categories.
- Testes de frontend portal/backoffice.
- Refactor amplo do modulo de auth alem do necessario para login helper e protecao das rotas admin.
- Testcontainers ou stack Docker dedicada so para testes; esta SPEC reutiliza o Postgres/Redis local ja previstos no projeto.

## Implementação

Estado real antes desta SPEC:
- existe apenas `GET /api/v1/stores`;
- nao existe `GET /api/v1/stores/:slug`;
- nao existem rotas admin de stores;
- os testes atuais de auth/tenant usam stubs ou repos fake, nao banco/Redis reais;
- a CI roda `npm test -w backend`, mas nao executa uma suite de isolamento dedicada.

Implementacao planejada:

1. Backend
- Expandir as camadas de `store` para suportar leitura por slug e mutacoes admin minimas.
- Reusar `requireAuth` para obter tenant da sessao/JWT e `runWithTenantContext`.
- Adicionar verificacoes de ownership com comportamento anti-enumeracao:
  - recurso de outro tenant responde `404`, nao `403`;
  - categoria de outro tenant em payload responde `422`;
  - `tenant_id` no payload e ignorado; o tenant da sessao vence sempre.
- Manter cache de listagem no padrao `stores:list:{tenantId}:...`, garantindo que testes possam inspecionar as chaves.

2. Test harness
- `vitest.config.ts` na raiz.
- `tests/helpers/setup.ts` cria app real em memoria com `AppDataSource`, repos e Redis reais.
- `tests/helpers/auth.ts` faz login em `/auth/:slug/login` e retorna header `Cookie` reaproveitavel em `fetch`.
- `beforeEach` limpa `tb_store_category`, `tb_store`, `tb_category`, `tb_refresh_token`, `tb_user`, `tb_tenant` e limpa Redis para garantir independencia entre casos.
- `setupTenants()` cria 2 tenants, 2 admins e, se necessario para compatibilidade do backlog, 1 usuario com papel global documentado no teste.

3. Suite de isolamento
- Cenario 1: listagem publica nao cruza tenants.
- Cenario 2: detalhe por slug de outro tenant retorna 404.
- Cenario 3: create admin ignora `tenant_id` do payload.
- Cenario 4: slug duplicado em tenants diferentes e permitido.
- Cenario 5: delete em `tb_tenant` remove stores em cascata.
- Cenario 6: update admin em store de outro tenant retorna 404.
- Cenario 7: vincular categoria de outro tenant retorna 422.
- Cenario 8: cache Redis de listagem fica separado por tenant.

4. Processo
- Adicionar `test:isolation` no `package.json` raiz.
- Atualizar `.github/workflows/ci.yml` para rodar essa suite em PR.
- Documentar a validacao em `docs/fase-2-isolacao.md`.

## Critério de aceite

- [ ] `tests/isolation/stores.test.ts` cobre os 8 cenarios obrigatorios
- [ ] Suite usa banco e Redis reais, sem stubs de repositorio
- [ ] `GET /api/v1/stores/:slug` existe e retorna `404` para slug de outro tenant
- [ ] `POST /api/admin/stores` ignora `tenant_id` do payload e usa o tenant da sessao
- [ ] `PUT /api/admin/stores/:id` retorna `404` para store de outro tenant
- [ ] Validacao de `category_ids` cross-tenant retorna `422`
- [ ] `test:isolation` adicionado ao projeto e verde localmente
- [ ] CI executa `test:isolation` em todo PR
- [ ] `docs/fase-2-isolacao.md` commitado com resultados
- [ ] Falha proposital ao remover `withTenant` e detectada por pelo menos um teste desta suite
- [ ] **Features tocadas (stores-public-api, tenant-resolution, auth, infra-base) atualizadas** com timestamp e referencia a esta SPEC
- [ ] `state.md` com entrada `[conclusao]`
- [ ] `memory.md` com TL;DR final atualizado
