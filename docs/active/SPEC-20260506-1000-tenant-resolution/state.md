# State — SPEC-20260506-1000

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-06 10:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-06 10:00
**Onde tô:** SPEC criada, main.md validado pelo dev — aguardando ativação para implementação
**Próximo passo:** Dev valida main.md → ativa SPEC → implementar `lib/tenant.ts` primeiro, depois `middleware.ts`, depois `app/tenant-not-found/page.tsx`
**Última decisão:** —
**Bloqueio atual:** nenhum
**Se retomar, ler:** entrada de ativação neste state + memory.md TL;DR

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Criar `lib/tenant.ts` (getTenantByHost, getTenantBySlug, getCurrentTenant) | pendente | 2026-05-06 10:00 | — |
| 2 | Criar `middleware.ts` com lógica de resolução e matcher | pendente | 2026-05-06 10:00 | — |
| 3 | Criar `app/tenant-not-found/page.tsx` | pendente | 2026-05-06 10:00 | — |
| 4 | Documentar README (dev local + /etc/hosts) | pendente | 2026-05-06 10:00 | — |
| 5 | Atualizar feature `tenant-resolution` e arquivar SPEC | pendente | 2026-05-06 10:00 | — |

Status permitidos: `pendente` | `em progresso` | `concluído` | `bloqueado` | `descartado`.

### Próximos passos

- [ ] Dev valida e assina main.md (status draft → active)
- [ ] Implementar fase 1: `lib/tenant.ts`
- [ ] Implementar fase 2: `middleware.ts`
- [ ] Implementar fase 3: `app/tenant-not-found/page.tsx`
- [ ] Implementar fase 4: README
- [ ] Concluir SPEC: atualizar feature + arquivar

### Bloqueios ativos

nenhum

---

## Fatos confirmados

- [2026-05-06 10:00] Projeto usa Next.js App Router no portal. Fonte: CLAUDE.md (stack).
- [2026-05-06 10:00] `middleware.ts` deve ficar na raiz do projeto portal, não em `src/`. Fonte: especificação do usuário.
- [2026-05-06 10:00] Tabela `tenants` com coluna `host` e `status` é pré-requisito assumido (fora do escopo desta SPEC). Fonte: especificação do usuário.
- [2026-05-06 10:00] Cache Redis está fora do escopo desta SPEC (será SPEC separada, referenciada como SPEC-20260503-1505 em CLAUDE.md). Fonte: especificação do usuário.

## Inferências prováveis

- [2026-05-06 10:00] `getCurrentTenant()` provavelmente precisará de uma segunda query ao banco para retornar a config completa do tenant (além de id/slug). Validar: quais campos de `tenants` são necessários nos Server Components. Confirmar durante implementação da fase 1.
- [2026-05-06 10:00] Framework backend (Express/Fastify/Nest) ainda não definido — mas esta SPEC é exclusiva do portal Next.js, sem dependência do backend. Não bloqueia.

## Dúvidas em aberto

- [2026-05-06 10:00] Quais colunas `getCurrentTenant()` deve retornar da tabela `tenants`? (ex: só id+slug, ou também name, logo_url, theme_config, etc.) Próxima ação: perguntar ao dev antes de implementar fase 1.

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-05-06 10:00 — [ativação]

SPEC criada a partir de especificação técnica detalhada fornecida pelo usuário. Arquivos identificados como relevantes: `middleware.ts` (raiz portal), `lib/tenant.ts`, `app/tenant-not-found/page.tsx`. Feature `tenant-resolution` criada junto (nova — não existia). Estrutura de docs inicializada (primeira SPEC do projeto). Dev optou por validar main.md antes de implementar (opção B).