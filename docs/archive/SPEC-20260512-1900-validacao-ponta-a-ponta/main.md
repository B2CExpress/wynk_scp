# SPEC-20260512-1900: Validação ponta-a-ponta da Fase 1 Multitenant

**Status:** done  
**Criada:** 2026-05-12 19:00  
**Ativada:** 2026-05-12 19:00  
**Concluída:** 2026-05-13  
**Commit final:** `43424f3`  
**Keywords:** fase-1, multitenant, validacao, ponta-a-ponta, tenants, auth, redis, theme, tenant-resolution, seed, flavors  
**Features:** infra-base, tenant-resolution, theme-system  
**Branch:** feature/validacao-ponta-a-ponta-fase-1  
**Depende de:** —  
**Origem:** usuário em 2026-05-12 19:00  
**Resumo:** Validação ponta-a-ponta da Fase 1 da plataforma multitenant — garantir que múltiplos tenants de teste coexistam em uma mesma instalação com domínio, identidade visual, autenticação, cache e isolamento próprios, registrando o resultado em `docs/fase-1-validacao.md`.

---

## Objetivo

Validar ponta-a-ponta a base técnica multitenant da Fase 1, garantindo que tenants de teste coexistam na mesma instalação com domínio, identidade visual, autenticação, cache e isolamento próprios.

Esta SPEC usa como referência o arquivo `seeds/tenants.json`, que deve conter os tenants de teste, e os assets versionados em `portal/public/flavors/`.

O objetivo principal é confirmar que a plataforma consegue resolver tenants por host, aplicar o flavor correto, manter isolamento entre tenants e registrar a validação manual em `docs/fase-1-validacao.md`.

---

## Escopo

### Dentro do escopo

- Validar a estrutura base do repositório.
- Validar TypeScript e ferramentas de qualidade.
- Validar Postgres via Docker Compose, quando o ambiente local permitir.
- Validar TypeORM e migrations, quando o ambiente local permitir.
- Validar tabela `tenants` com campos necessários para resolução e identidade visual.
- Validar helper `withTenant`, se já existir.
- Validar middleware de resolução de tenant por host.
- Validar Redis para cache da resolução de tenant, quando o ambiente local permitir.
- Validar tema do tenant no layout raiz do portal.
- Validar flavors visuais em `portal/public/flavors/`.
- Validar `seeds/tenants.json` com tenant existente e tenant específico desta SPEC.
- Validar autenticação JWT com access token e refresh token, se auth estiver implementado.
- Validar cookies HttpOnly, Secure e SameSite, se auth estiver implementado.
- Validar um admin para cada tenant, se o seed de usuários já existir.
- Validar um superadmin sem tenant, se o seed de usuários já existir.
- Documentar a validação em `docs/fase-1-validacao.md`.
- Atualizar as features tocadas: `infra-base`, `tenant-resolution` e `theme-system`.

### Fora do escopo

- Funcionalidades finais de lojas.
- Catálogo completo.
- Backoffice completo.
- Gestão visual dinâmica por painel.
- Upload de imagens.
- Pagamentos.
- Deploy em produção.
- Automação completa de testes e2e além da validação manual documentada.
- Correções grandes fora da Fase 1 sem abrir SPEC própria.
- Alterar completamente o conteúdo de `seeds/tenants.json`.
- Duplicar JSON de seed dentro dos arquivos da SPEC.
- Apagar ou substituir tenant já existente no seed da empresa.

---

## Implementação

### Arquivos afetados

- `docs/active/SPEC-20260512-1900-validacao-ponta-a-ponta/main.md`
- `docs/active/SPEC-20260512-1900-validacao-ponta-a-ponta/state.md`
- `docs/active/SPEC-20260512-1900-validacao-ponta-a-ponta/memory.md`
- `docs/fase-1-validacao.md`
- `seeds/tenants.json`
- `portal/public/flavors/shopping-x/theme.json`
- `portal/public/flavors/shopping-x/logo.svg`
- `portal/public/flavors/shopping-x/favicon.ico`

### Diretrizes de implementação

- Manter a SPEC ativa em `docs/active/SPEC-20260512-1900-validacao-ponta-a-ponta/`.
- Manter dentro da pasta da SPEC apenas:
  - `main.md`
  - `memory.md`
  - `state.md`
- Manter o documento de validação manual em `docs/fase-1-validacao.md`.
- Usar `seeds/tenants.json` como fonte única dos tenants de teste.
- Não duplicar o conteúdo completo de `seeds/tenants.json` dentro dos documentos da SPEC.
- Não editar `docs/INDEX.md` manualmente.
- Não apagar tenant existente no seed da empresa.
- Adicionar apenas um tenant específico para esta SPEC, mantendo o tenant existente.
- Usar um `flavor_slug` que aponte para uma pasta real existente em `portal/public/flavors/`.
- Registrar no documento de validação o que foi confirmado, o que ficou pendente e o que ficou bloqueado.
- Caso Docker não funcione no ambiente local, registrar o bloqueio em `docs/fase-1-validacao.md` e manter os itens de execução como pendentes ou bloqueados.

### Tenant específico desta SPEC

O tenant específico desta validação deve ser adicionado ao arquivo real `seeds/tenants.json`, sem substituir o tenant já existente.

Tenant sugerido para esta SPEC:

- `slug`: `validacao-fase-1`
- `host`: `validacao-fase-1.local`
- `flavor_slug`: `shopping-x`
- `name`: `Validação Fase 1`

Esse tenant usa o flavor `shopping-x`, porque a pasta `portal/public/flavors/shopping-x/` já existe no projeto.

---

## Critério de aceite

- [x] A pasta `docs/active/SPEC-20260512-1900-validacao-ponta-a-ponta/` existe com `main.md`, `memory.md` e `state.md`. (2026-05-13, commit `43424f3`)
- [x] O arquivo `docs/fase-1-validacao.md` existe fora da pasta da SPEC. (2026-05-13, commit `43424f3`)
- [x] O arquivo `seeds/tenants.json` mantém o tenant existente da empresa. (2026-05-13, commit `43424f3`)
- [x] O arquivo `seeds/tenants.json` adiciona um tenant específico para esta SPEC. (2026-05-13, commit `43424f3`)
- [x] O conteúdo completo de `seeds/tenants.json` não está duplicado dentro dos documentos da SPEC. (2026-05-13, commit `43424f3`)
- [x] O tenant específico da SPEC aponta para um `flavor_slug` existente em `portal/public/flavors/`. (2026-05-13, commit `43424f3`)
- [x] Os assets do flavor `shopping-x` existem em `portal/public/flavors/shopping-x/`. (2026-05-13, commit `43424f3`)
- [ ] A validação manual foi documentada em `docs/fase-1-validacao.md`. — **parcial**: `fase-1-validacao.md` registra apenas o bloqueio do Docker; a validação efetiva ficou pendente (ver `state.md`).
- [x] Features tocadas (`infra-base`, `tenant-resolution`, `theme-system`) atualizadas com referência a esta SPEC e timestamp. (2026-05-18 — arquivamento R.7)
- [x] O `state.md` foi atualizado com o andamento real da validação. (2026-05-18 — arquivamento R.7, entrada `[conclusão]`)
- [x] O `memory.md` foi atualizado com o TL;DR final da sessão. (2026-05-18 — arquivamento R.7)
- [x] PR aberto na branch `feature/validacao-ponta-a-ponta-fase-1`. (PR #12 mergeado em `496b882`)

---

## Observações

Se o Docker não carregar no ambiente local, a SPEC ainda pode documentar a validação estrutural dos arquivos, deixando a execução de banco, Redis, migrations e seed como bloqueada.

Nesse caso, o bloqueio deve ser registrado em `docs/fase-1-validacao.md` e em `state.md`.