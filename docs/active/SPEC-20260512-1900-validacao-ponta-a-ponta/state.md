
# State — SPEC-20260512-1900-validacao-ponta-a-ponta

> Main: [main.md](./main.md)  
> Memory: [memory.md](./memory.md)  
> Criado: 2026-05-12 19:00

---

## TL;DR

**Última atualização:** 2026-05-13 16:29  
**Onde tô:** SPEC criada para validar ponta-a-ponta a Fase 1 — Base da Plataforma Multitenant, usando ID real `SPEC-20260512-1900-validacao-ponta-a-ponta`. A estrutura dos arquivos foi corrigida e o tenant específico da SPEC deve ser adicionado ao `seeds/tenants.json` sem apagar o tenant existente da empresa.  
**Próximo passo:** Colar os arquivos corrigidos, ajustar `seeds/tenants.json`, revisar `git status`, commitar e enviar a branch.  
**Última decisão:** O conteúdo completo de `seeds/tenants.json` não será duplicado nos documentos; será apenas referenciado.  
**Bloqueio atual:** Docker Desktop não carrega corretamente no ambiente local, impedindo validação real de Postgres, Redis, migrations e seed.  
**Se retomar, ler:** `main.md` inteiro e este TL;DR.

---

## Status snapshot

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|---|---|---|---|
| 1 | Criar SPEC de validação ponta-a-ponta | em progresso | 2026-05-12 19:00 | — |
| 2 | Corrigir ID real da SPEC para `SPEC-20260512-1900-validacao-ponta-a-ponta` | concluído | 2026-05-12 19:00 | — |
| 3 | Confirmar estrutura da pasta da SPEC | concluído | 2026-05-13 16:29 | — |
| 4 | Confirmar `docs/fase-1-validacao.md` fora da pasta da SPEC | concluído | 2026-05-13 16:29 | — |
| 5 | Validar subtarefa 1.1 — repositório + TypeScript + qualidade | pendente | 2026-05-12 19:00 | — |
| 6 | Validar subtarefa 1.2 — Postgres + TypeORM + migrations | bloqueado | 2026-05-13 16:29 | — |
| 7 | Validar subtarefa 1.3 — tabela tenants | pendente | 2026-05-12 19:00 | — |
| 8 | Validar subtarefa 1.4 — helper withTenant | pendente | 2026-05-12 19:00 | — |
| 9 | Validar subtarefa 1.5 — resolução por host | pendente | 2026-05-12 19:00 | — |
| 10 | Validar subtarefa 1.6 — Redis cache | bloqueado | 2026-05-13 16:29 | — |
| 11 | Validar subtarefa 1.7 — layout com CSS variables e assets | pendente | 2026-05-12 19:00 | — |
| 12 | Validar subtarefa 1.8 — autenticação JWT | pendente | 2026-05-12 19:00 | — |
| 13 | Validar subtarefa 1.9 — validação ponta-a-ponta | bloqueado | 2026-05-13 16:29 | — |
| 14 | Validar `seeds/tenants.json` mantendo tenant existente | em progresso | 2026-05-13 16:29 | — |
| 15 | Adicionar tenant específico da SPEC em `seeds/tenants.json` | em progresso | 2026-05-13 16:29 | — |
| 16 | Validar assets em `portal/public/flavors/shopping-x/` | pendente | 2026-05-12 19:00 | — |
| 17 | Criar/preencher `docs/fase-1-validacao.md` | em progresso | 2026-05-13 16:29 | — |
| 18 | Atualizar `docs/features/infra-base.md` | pendente | 2026-05-12 19:00 | — |
| 19 | Atualizar `docs/features/tenant-resolution.md` | pendente | 2026-05-12 19:00 | — |
| 20 | Atualizar `docs/features/theme-system.md` | pendente | 2026-05-12 19:00 | — |
| 21 | Abrir PR e coletar revisões | pendente | 2026-05-12 19:00 | — |

Status permitidos: `pendente` | `em progresso` | `concluído` | `bloqueado` | `descartado`.

---

## Próximos passos

- [ ] Confirmar branch `feature/validacao-ponta-a-ponta-fase-1`. (2026-05-13 16:29)
- [ ] Confirmar pasta `docs/active/SPEC-20260512-1900-validacao-ponta-a-ponta/`. (2026-05-13 16:29)
- [ ] Confirmar arquivos `main.md`, `state.md` e `memory.md`. (2026-05-13 16:29)
- [ ] Confirmar `docs/fase-1-validacao.md` fora da pasta da SPEC. (2026-05-13 16:29)
- [ ] Confirmar que `seeds/tenants.json` mantém o tenant existente da empresa. (2026-05-13 16:29)
- [ ] Adicionar tenant específico da SPEC em `seeds/tenants.json`. (2026-05-13 16:29)
- [ ] Confirmar assets do flavor `shopping-x` em `portal/public/flavors/shopping-x/`. (2026-05-13 16:29)
- [ ] Revisar `docs/features/infra-base.md`. (2026-05-13 16:29)
- [ ] Revisar `docs/features/tenant-resolution.md`. (2026-05-13 16:29)
- [ ] Revisar `docs/features/theme-system.md`. (2026-05-13 16:29)
- [ ] Atualizar features tocadas com referência à SPEC. (2026-05-13 16:29)
- [ ] Registrar bloqueio do Docker em `docs/fase-1-validacao.md`, se persistir. (2026-05-13 16:29)
- [ ] Executar reset completo, se Docker voltar a funcionar. (2026-05-13 16:29)
- [ ] Rodar migrations, se Docker voltar a funcionar. (2026-05-13 16:29)
- [ ] Rodar seed, se Docker voltar a funcionar. (2026-05-13 16:29)
- [ ] Validar host `shopping-x.local`, se ambiente permitir. (2026-05-13 16:29)
- [ ] Validar host `validacao-fase-1.local`, se ambiente permitir. (2026-05-13 16:29)
- [ ] Validar Redis, se ambiente permitir. (2026-05-13 16:29)
- [ ] Validar autenticação, se implementada e se ambiente permitir. (2026-05-13 16:29)
- [ ] Preencher `docs/fase-1-validacao.md` com evidências reais ou bloqueios. (2026-05-13 16:29)
- [ ] Fazer commit. (2026-05-13 16:29)
- [ ] Enviar branch para o GitHub. (2026-05-13 16:29)
- [ ] Abrir PR. (2026-05-13 16:29)

---

## Bloqueios ativos

- [2026-05-13 16:29] Docker Desktop não carrega corretamente no ambiente local.
  - Impacto: impede validação real de Postgres, Redis, migrations, seed e validação ponta-a-ponta.
  - Status: bloqueado.
  - Ação: registrar bloqueio em `docs/fase-1-validacao.md` e manter validações dependentes do Docker como pendentes ou bloqueadas.

---

## Fatos confirmados

- [2026-05-12 19:00] O ID real da SPEC é `SPEC-20260512-1900-validacao-ponta-a-ponta`.
- [2026-05-12 19:00] A pasta da SPEC ativa é `docs/active/SPEC-20260512-1900-validacao-ponta-a-ponta/`.
- [2026-05-12 19:00] A SPEC ativa deve conter `main.md`, `state.md` e `memory.md`.
- [2026-05-12 19:00] O documento de validação fica em `docs/fase-1-validacao.md`.
- [2026-05-12 19:00] O arquivo `seeds/tenants.json` existe no projeto.
- [2026-05-12 19:00] O conteúdo completo de `seeds/tenants.json` não deve ser duplicado dentro dos documentos da SPEC.
- [2026-05-12 19:00] Os assets dos flavors ficam em `portal/public/flavors/`.
- [2026-05-12 19:00] Existe flavor `shopping-x` em `portal/public/flavors/shopping-x/`.
- [2026-05-12 19:00] O flavor `shopping-x` possui `theme.json`, `logo.svg` e `favicon.ico`, conforme prints enviados pelo usuário.
- [2026-05-12 19:00] A SPEC toca as features `infra-base`, `tenant-resolution` e `theme-system`.
- [2026-05-13 16:29] O arquivo `seeds/tenants.json` já possui um tenant da empresa com `slug` `shopping-x`.
- [2026-05-13 16:29] O tenant existente não deve ser apagado nem substituído.
- [2026-05-13 16:29] A SPEC deve adicionar um tenant próprio para validação.

---

## Inferências prováveis

- [2026-05-12 19:00] Fase 1 deve validar monorepo, backend, portal, banco, Redis, tenant resolution, theme system e auth. Status: testando.
- [2026-05-12 19:00] O projeto usa TypeORM. Status: confirmado anteriormente.
- [2026-05-12 19:00] A validação visual depende diretamente da correspondência entre `flavor_slug` do seed e pasta existente em `portal/public/flavors/`. Status: testando.
- [2026-05-12 19:00] A validação de auth pode exigir feature própria futura se ainda não houver implementação suficiente. Status: testando.
- [2026-05-12 19:00] O seed de admins e superadmin pode ainda não existir. Status: testando.
- [2026-05-13 16:29] Como Docker está bloqueado, a validação estrutural pode ser enviada, mas a validação real deve ficar marcada como bloqueada. Status: provável.

---

## Dúvidas em aberto

- [2026-05-12 19:00] Existe seed de usuários/admins separado do `seeds/tenants.json`?
- [2026-05-12 19:00] O endpoint `/api/auth/login` está no portal, no backend ou proxyado pelo Next?
- [2026-05-12 19:00] O helper `withTenant` já existe ou precisa ser criado?
- [2026-05-12 19:00] O Redis já possui logs ou comando simples para confirmar cache de tenant?
- [2026-05-12 19:00] O arquivo `docs/features/auth.md` deve ser tocado nesta SPEC ou auth ainda está dentro de `infra-base`?
- [2026-05-13 16:29] O Docker será corrigido neste ambiente ou a validação real ficará para outro ambiente?

---

## Log cronológico

### 2026-05-12 19:00 — [ativação]

Criada SPEC para validar ponta-a-ponta a Fase 1 — Base da Plataforma Multitenant.

ID real confirmado:

```txt
SPEC-20260512-1900-validacao-ponta-a-ponta