# SPEC-20260506-1000: Middleware de resolução de tenant

**Status:** draft
**Criada:** 2026-05-06 10:00
**Ativada:** —
**Concluída:** —
**Commit final:** —
**Keywords:** tenant, middleware, host, Next.js, multitenant, routing
**Features:** tenant-resolution
**Branch:** feature/tenant-resolution-middleware
**Depende de:** —
**Origem:** usuário em 2026-05-06
**Resumo:** Implementar o middleware Next.js que resolve o tenant a partir do header `Host`, injeta `x-tenant-id` e `x-tenant-slug` nos headers da requisição e redireciona para 404 customizado quando o tenant não existe ou está inativo.

## Objetivo

Toda requisição que chega ao portal precisa ser associada a um tenant antes de qualquer Server Component executar. Este middleware é a peça central do roteamento multitenant: sem ele, nenhuma feature do portal sabe a qual shopping a request pertence. O objetivo é implementar essa resolução de forma performática (com caminho para cache Redis em SPEC futura) e transparente para o restante da aplicação.

## Escopo

**DENTRO:**
- `middleware.ts` na raiz do projeto portal (Next.js App Router)
- `lib/tenant.ts`: funções `getTenantByHost(host)`, `getTenantBySlug(slug)` e helper `getCurrentTenant()` para Server Components
- `app/tenant-not-found/page.tsx`: página 404 customizada com mensagem amigável
- Fallback de dev via header `X-Tenant-Slug` (útil em Postman/curl sem configurar `/etc/hosts`)
- Matcher configurado para excluir `/_next/**`, `/api/cron`, e arquivos estáticos
- Documentação no README: como configurar `/etc/hosts` para dev local (`tenant1.local`, `tenant2.local`)
- Tratar `host` vs `hostname` (remover porta antes de consultar banco)
- Tenant com `status != 'active'` → mesma resposta de 404

**FORA:**
- Cache Redis da consulta de tenant (será SPEC separada — referenciada em CLAUDE.md como SPEC-20260503-1505)
- Criação da tabela `tenants` / migrations (pré-requisito assumido como existente)
- Qualquer lógica de autenticação JWT ou RBAC
- Backoffice ou API backend (escopo exclusivo do portal)

## Implementação

### Fluxo principal

```
Request chega
  ↓
middleware.ts intercepta
  ↓
Extrai hostname (host sem porta)
  ↓
Dev + header X-Tenant-Slug presente?
  ├── SIM → getTenantBySlug(slug)
  └── NÃO → getTenantByHost(hostname)
        ↓
    tenant null ou status != 'active'?
      ├── SIM → NextResponse.rewrite('/tenant-not-found') com status 404
      └── NÃO → NextResponse.next() com headers:
                  x-tenant-id: tenant.id
                  x-tenant-slug: tenant.slug
```

### Arquivos e responsabilidades

| Arquivo | Responsabilidade |
|---|---|
| `middleware.ts` (raiz) | Interceptação, lógica de resolução, injeção de headers |
| `lib/tenant.ts` | `getTenantByHost`, `getTenantBySlug`, `getCurrentTenant` |
| `app/tenant-not-found/page.tsx` | Página 404 com mensagem amigável |

### Consulta ao banco

`SELECT id, slug, status FROM tenants WHERE host = $1` — sem cache nesta SPEC (ver item FORA).

`getCurrentTenant()` em Server Components: lê `headers()` do Next, pega `x-tenant-id`, retorna config completa do tenant (nova query ou join — definir durante implementação).

### Armadilhas documentadas

- **host vs hostname**: `host` inclui porta (`tenant1.local:3000`); sempre fazer `host.split(':')[0]` antes de consultar.
- **Posição do middleware.ts**: DEVE ficar na raiz do projeto, não em `src/`. Next.js App Router não reconhece em `src/`.
- **Matcher obrigatório**: sem matcher, toda request de imagem/fonte/CSS executa query no banco — performance ruim.
- **Cache ausente (nesta SPEC)**: cada request faz query. Aceitável para MVP; SPEC de Redis resolve depois.
- **`/etc/hosts` não configurado**: `tenant1.local` não resolve sem entrada explícita. Documentar no README.

### Como testar manualmente

```bash
# 1. Tenant existente (requer /etc/hosts configurado)
curl -i http://tenant1.local:3000
# Esperado: x-tenant-id no header de resposta

# 2. Tenant inexistente
curl -i http://fake.local:3000
# Esperado: status 404, página tenant-not-found

# 3. Fallback dev
curl -i http://localhost:3000 -H 'X-Tenant-Slug: tenant1'
# Esperado: funciona como tenant1.local
```

## Critério de aceite

- [ ] `tenant1.local:3000` resolve tenant 1 (header `x-tenant-id` correto)
- [ ] `tenant2.local:3000` resolve tenant 2
- [ ] Domínio não cadastrado → 404 customizado (`/tenant-not-found`)
- [ ] `X-Tenant-Slug: tenant1` funciona como fallback em dev
- [ ] `getCurrentTenant()` retorna config do tenant em qualquer Server Component
- [ ] Tenant com `status='inactive'` resulta em 404
- [ ] Matcher exclui `/_next/**` e arquivos estáticos
- [ ] README documentado: como configurar `/etc/hosts` para dev local
- [ ] **Features tocadas (tenant-resolution) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado