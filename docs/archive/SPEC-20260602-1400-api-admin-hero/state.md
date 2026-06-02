# State — SPEC-20260602-1400

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-06-02 14:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-06-02 13:55
**Onde tô:** SPEC CONCLUÍDA (re-escopada + implementada + arquivada). Backend hero entregue (commit `57190fe`), tudo verde (117 testes).
**Próximo passo:** nenhum. Futuro (fora do escopo): endpoint público `GET /api/v1/hero`; UI no backoffice; render do hero na home.
**Última decisão:** singleton por tenant via upsert; `overlay_opacity` numeric(4,2) com transformer; `requireAuth` real; sem Zod.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** entrada `[conclusão]` de 2026-06-02 13:55.

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 0 | Sessão 1 (DESCARTADA): scaffolds Next/Drizzle, nunca commitados/aplicáveis | descartado | 2026-06-02 13:40 | — |
| 1 | Re-escopo (Next/Drizzle → Express+TypeORM) + desarquivar | concluído | 2026-06-02 13:40 | — |
| 2 | Entity `Hero` + migration + registro em database.ts | concluído | 2026-06-02 13:55 | `57190fe` |
| 3 | DTO manual (`parseHeroInput`/`validateHeroInput` + `HERO_DEFAULTS`) | concluído | 2026-06-02 13:55 | `57190fe` |
| 4 | Repository (upsert singleton por tenant) | concluído | 2026-06-02 13:55 | `57190fe` |
| 5 | Service (GET defaults, PUT upsert, cache) + controller + routes (`requireAuth`) | concluído | 2026-06-02 13:55 | `57190fe` |
| 6 | Wiring server.ts/app.ts + mock-deps | concluído | 2026-06-02 13:55 | `57190fe` |
| 7 | Testes backend (15 hero; suíte 117) | concluído | 2026-06-02 13:55 | `57190fe` |
| 8 | Remover features-fantasma + atualizar editorial-content | concluído | 2026-06-02 13:55 | — |
| 9 | Concluir e arquivar (§5.3) | concluído | 2026-06-02 13:55 | — |

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

## 2026-06-02 13:55 — [conclusão] SPEC re-escopada, implementada e arquivada

Implementação real entregue no backend (commit `57190fe`):
- entity `Hero` (`tb_hero`, unique `tenant_id`, `overlay_opacity` numeric(4,2) com transformer) + migration `1747017600000` + registro em `database.ts`
- `dtos/hero.dto.ts` (parse + validate manual + `HERO_DEFAULTS` + tipos), `repositories/hero.repository.ts` (upsert singleton), `services/hero.service.ts` (GET defaults / PUT upsert + cache `hero:{tenant}`), `controllers/hero.controller.ts`, `routes/hero.routes.ts` (`requireAuth`)
- wiring `server.ts`/`app.ts` + stub `mock-deps.ts`
- testes: `hero.dto.test.ts` + `hero.service.test.ts` (15 testes — defaults no GET, hero existente, upsert mapeia/invalida cache, isolamento de `tenant_id`, validação campo-a-campo)

Verificação (2026-06-02 13:55): `typecheck -w backend` ✓ · `lint -w backend` ✓ (0 erros) · `test -w backend` ✓ 16 suites, 117 passed · `format:check` ✓.

Correção de processo: features-fantasma `admin-content-api.md` + `portal-home.md` removidas (`git rm`); feature `editorial-content` atualizada (R.7) com hero em Concluídas, Estado atual, 3 decisões, 3 gotchas, arquivos + keywords. `main.md` Status=done, Commit final=`57190fe`, critérios 100% marcados. Pasta `active/` → `archive/`.

**FORA do escopo (futuro):** endpoint público `GET /api/v1/hero` (cache 5min); UI de admin no backoffice; render do hero na home pública do portal.