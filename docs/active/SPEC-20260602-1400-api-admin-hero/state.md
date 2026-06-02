# State — SPEC-20260602-1400

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-06-02 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-06-02 13:40
**Onde tô:** SPEC RE-ESCOPADA (Next/Drizzle → Express+TypeORM) e desarquivada (`archive/` → `active/`). Código Drizzle da sessão 1 nunca foi commitado/aplicável. Começando a implementação real no backend.
**Próximo passo:** entity `Hero` (`tb_hero`, unique `tenant_id`) + migration + DTO manual + repo (upsert) + service (defaults no GET) + controller + routes (`requireAuth`) + wiring.
**Última decisão:** singleton por tenant via upsert; `overlay_opacity` numeric(4,2); `requireAuth` real (não stub); sem Zod (DTO manual, padrão do repo).
**Bloqueio atual:** nenhum (o stub de auth do desenho antigo não se aplica — backend tem `requireAuth` real).
**Se retomar, ler:** entrada `[MARCO] [decisão] re-escopo` de 2026-06-02 13:40 + Status snapshot.

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 0 | Sessão 1 (DESCARTADA): scaffolds Next/Drizzle, nunca commitados/aplicáveis | descartado | 2026-06-02 13:40 | — |
| 1 | Re-escopo (Next/Drizzle → Express+TypeORM) + desarquivar | concluído | 2026-06-02 13:40 | — |
| 2 | Entity `Hero` + migration + registro em database.ts | pendente | 2026-06-02 13:40 | — |
| 3 | DTO manual (`parseHeroInput`/`validateHeroInput` + `HERO_DEFAULTS`) | pendente | 2026-06-02 13:40 | — |
| 4 | Repository (upsert singleton por tenant) | pendente | 2026-06-02 13:40 | — |
| 5 | Service (GET defaults, PUT upsert, cache) + controller + routes (`requireAuth`) | pendente | 2026-06-02 13:40 | — |
| 6 | Wiring server.ts/app.ts + mock-deps | pendente | 2026-06-02 13:40 | — |
| 7 | Testes backend | pendente | 2026-06-02 13:40 | — |
| 8 | Remover features-fantasma + atualizar editorial-content | pendente | 2026-06-02 13:40 | — |
| 9 | Concluir e arquivar (§5.3) | pendente | 2026-06-02 13:40 | — |

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

## 2026-06-02 13:40 — [MARCO] [decisão] Re-escopo: Next.js+Drizzle → Express+TypeORM

Ao retomar, constatou-se que esta SPEC estava em `archive/` **indevidamente**: `main.md` com `Status: active`, 0 critérios marcados, e **nenhum código commitado** (a sessão 1 alegava 6 arquivos gerados, mas o commit `a77c072` da branch só adicionou docs — 5 .md, zero código). Além disso, todo o desenho (`portal/src/lib/db` Drizzle, `app/api/admin/hero/route.ts` no Next, stub de `getAdminSession`) é da arquitetura **descartada** no re-escopo geral do projeto (Next/Drizzle-no-portal → Express+TypeORM-no-backend).

Decisão do usuário (2026-06-02 13:40): **desarquivar e re-escopar a própria SPEC** (não criar nova), implementando de verdade no backend Express. Mudanças vs desenho antigo:
- **Local**: backend Express + TypeORM (não rotas Next no portal).
- **Persistência**: entity `Hero`/`tb_hero` com TypeORM (não schema Drizzle); upsert via lookup+save no repository (não `onConflictDoUpdate`).
- **Validação**: DTO manual `validateHeroInput` (não Zod — alinhado com a decisão "sem Zod" da feature [[editorial-content]]).
- **Auth**: `requireAuth` **real** (o backend já tem; cai o stub `getAdminSession` e o bloqueio de 401-sempre).
- **Feature**: passa de `admin-content-api`/`portal-home` (fantasmas Next/Drizzle) para [[editorial-content]] (onde banners/popup vivem). As 2 features-fantasma serão removidas (descreviam código inexistente).

Pasta movida `archive/` → `active/` (corrige a invariante R.2 / R.5 — era arquivamento por engano). Campos de contrato preservados: conjunto de campos do hero e regras de validação (title/subtitle/bg/cta/overlay) seguem iguais; só muda a stack.