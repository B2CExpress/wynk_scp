# State — SPEC-20260602-1400

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-06-02 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-06-02 14:00
**Onde tô:** Sessão 1 — arquivos gerados, aguardando validação do dev e Docker para testar
**Próximo passo:** Dev valida main.md, instala `zod` no workspace portal, roda migration SQL, implementa `getAdminSession` real quando auth SPEC estiver ativa
**Última decisão:** UPSERT via `onConflictDoUpdate` — evita lógica de "existe/não existe" no cliente
**Bloqueio atual:** `getAdminSession` retorna null (stub) até SPEC de auth — endpoints retornam 401 por enquanto
**Se retomar, ler:** entrada [ativação] abaixo + seção "Bloqueios ativos"

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Criar `lib/validators/hero.ts` | concluído | 2026-06-02 14:00 | — |
| 2 | Criar `app/api/admin/hero/route.ts` | concluído | 2026-06-02 14:00 | — |
| 3 | Criar `lib/db/schema.ts` (tabela tenant_hero) | concluído | 2026-06-02 14:00 | — |
| 4 | Criar `lib/db/index.ts` (singleton db) | concluído | 2026-06-02 14:00 | — |
| 5 | Criar `lib/auth/session.ts` (stub) | concluído | 2026-06-02 14:00 | — |
| 6 | Criar migration SQL | concluído | 2026-06-02 14:00 | — |
| 7 | Instalar `zod` no workspace portal | pendente | 2026-06-02 14:00 | — |
| 8 | Rodar migration no banco | pendente | 2026-06-02 14:00 | — |
| 9 | Implementar `getAdminSession` real | pendente | 2026-06-02 14:00 | — |
| 10 | Validar critérios de aceite manualmente | pendente | 2026-06-02 14:00 | — |
| 11 | Atualizar features tocadas | pendente | 2026-06-02 14:00 | — |

### Próximos passos

- [ ] Dev valida `main.md` (contrato humano-validado — R.3)
- [ ] `npm install zod -w portal`
- [ ] Rodar `0001_create_tenant_hero.sql` no banco (quando Docker disponível)
- [ ] Testar manualmente os 4 cenários do critério de aceite
- [ ] Implementar `getAdminSession` real (depende de SPEC auth)
- [ ] Atualizar `docs/features/admin-content-api.md` e `docs/features/portal-home.md`

### Bloqueios ativos

- **`getAdminSession` retorna null** — endpoints respondem 401 até SPEC de auth implementar JWT no portal. Testes manuais requerem implementar o stub temporariamente ou mockar a sessão.

---

## Fatos confirmados

- [2026-06-02 14:00] Portal não possui `src/lib/db/` nem `src/lib/auth/` — ambos criados do zero nesta SPEC. Fonte: listagem do filesystem do projeto.
- [2026-06-02 14:00] `portal/package.json` não inclui `zod` nas dependências. Precisa ser instalado.
- [2026-06-02 14:00] Projeto usa Drizzle + Postgres conforme SPEC-20260518-1915 (drizzle-setup). `onConflictDoUpdate` disponível.
- [2026-06-02 14:00] `DATABASE_URL=postgres://scp:scp@localhost:5435/scp` já configurado em `portal/.env`.
- [2026-06-02 14:00] Padrão `server-only` + singleton com `globalThis` é o padrão das libs existentes (`lib/tenant/resolve.ts`, `lib/theme/load.ts`).

## Inferências prováveis

- [2026-06-02 14:00] Feature `admin-content-api` ainda não existe em `docs/features/` — provavelmente precisa ser criada junto com esta SPEC. Validar com dev.
- [2026-06-02 14:00] Feature `portal-home` pode não existir ainda — mesma situação. Validar.

## Dúvidas em aberto

- [2026-06-02 14:00] As features `admin-content-api` e `portal-home` já existem em `docs/features/`? Se não, precisam ser criadas (R.4). Próxima ação: dev confirmar.

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-06-02 14:00 — [ativação]

SPEC criada a partir de prompt do usuário descrevendo o endpoint `GET + PUT /api/admin/hero` para o portal Next.js. Classificado como **nova SPEC** (entregável novo, sem SPEC prévia).

Arquivos identificados como relevantes para contexto:
- `portal/src/lib/tenant/resolve.ts` (padrão server-only + fetch)
- `portal/src/lib/theme/load.ts` (padrão server-only + singleton)
- `portal/package.json` (dependências existentes)
- `portal/src/app/layout.tsx` e `page.tsx` (padrão de uso do portal)

Branch criada: `SCU-59-api-admin-hero`.

Todos os 6 arquivos gerados na sessão 1. Aguardando validação do dev no `main.md` antes de considerar SPEC ativa (R.3 — main.md é contrato humano-validado).

## 2026-06-02 14:00 — [MARCO] [decisão] UPSERT via onConflictDoUpdate — sem GET-before-PUT

Admin não precisa verificar se hero existe antes de salvar. `INSERT ... ON CONFLICT (tenant_id) DO UPDATE SET` garante idempotência. Alternativa rejeitada: POST para criar + PATCH para atualizar (exige que o cliente saiba o estado atual, UX ruim conforme spec).

## 2026-06-02 14:00 — [decisão] GET retorna defaults, nunca 404

Requisito explícito do spec: "GET deve retornar 200 com defaults se não existir — nunca 404". Motivo: UI não precisa tratar dois estados (existe vs não existe). `HERO_DEFAULTS` exportado pelo validator como constante.

## 2026-06-02 14:00 — [decisão] overlay_opacity como NUMERIC(4,2) no banco

Float64 não representa 0.4 exatamente. NUMERIC(4,2) garante precisão sem jitter. Convertido para `number` JS ao serializar para JSON (suficientemente preciso para UI). Alternativa rejeitada: TEXT (perderia constraint numérico no banco).

## 2026-06-02 14:00 — [nota] getAdminSession é stub

Auth real (JWT no portal) depende de SPEC futura. O stub retorna `null` — endpoints respondem 401. Interface `AdminSession` já definida com os campos corretos para quando a implementação real chegar: `user_id`, `tenant_id`, `role`.