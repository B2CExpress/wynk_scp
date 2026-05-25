# State — SPEC-20260518-1625

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-18 16:25

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-25 08:55
**Onde tô:** SPEC concluída — todos os critérios marcados, features atualizadas (R.7), pronta para archive
**Próximo passo:** mover `active/` → `archive/` e push do PR
**Última decisão:** Cron via `setInterval` zero-dep + sanitização HTML real via `sanitize-html` reutilizando `sanitizeStoreDescription`
**Bloqueio atual:** nenhum
**Se retomar, ler:** entrada `[conclusão]` 2026-05-25 08:55

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Criar entidades TypeORM | concluído | 2026-05-18 16:26 | — |
| 2 | Implementar validators (Zod) | concluído | 2026-05-18 16:28 | — |
| 3 | Implementar repositories com isolamento | concluído | 2026-05-18 16:30 | — |
| 4 | Implementar services | concluído | 2026-05-18 16:31 | — |
| 5 | Implementar controllers | concluído | 2026-05-18 16:32 | — |
| 6 | Criar rotas e integrar em app.ts | concluído | 2026-05-18 16:33 | — |
| 7 | Criar migrations | concluído | 2026-05-18 16:34 | `3c48de1` |
| 8 | Testar compilação + lint + test (pós-merge) | concluído | 2026-05-25 08:40 | `e3bbd7d` |
| 9 | Cron de publicação + sanitização HTML real | concluído | 2026-05-25 08:50 | `42197eb` |
| 10 | Atualizar features (R.7) + marcar critério + archive | concluído | 2026-05-25 08:55 | _(commit pendente)_ |

### Próximos passos

- [ ] Fase 1: Entidades
- [ ] Fase 2: Validators
- [ ] Fase 3: Repositories
- [ ] Fase 4: Services
- [ ] Fase 5: Controllers
- [ ] Fase 6: Rotas
- [ ] Fase 7: Cron
- [ ] Fase 8: Features

### Bloqueios ativos

_(nenhum)_

---

## Fatos confirmados

- [2026-05-18 16:25] Branch ativa é `feature/SQU-51-api-admin-crud-de-eventos`. Fonte: `git branch`.
- [2026-05-18 16:25] Estrutura de backend: Express + TypeORM com async hooks pra tenant context. Padrão: `withTenant()` em queries, `requireTenantContext()` em services.
- [2026-05-18 16:25] Validação de dados: sem Zod instalado — usar parse manual como em `dtos/store-list.dto.ts`.

## Inferências prováveis

- [2026-05-18 16:25] Cron de publicação já existe em `jobs/publish-scheduled.ts` e só precisa ser estendido. Validar com leitura.

## Dúvidas em aberto

_(nenhuma)_

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-05-18 16:25 — [ativação]

Plano inicial: entidades → validators → repositories → services → controllers → rotas → cron → features.
Estrutura alinhada com padrão SPEC-20260514-2012 (isolamento multitenant).
Nenhum bloqueio.

## 2026-05-18 16:35 — [MARCO] [conclusão] Implementação completa (sessão #1)

Criadas todas as camadas:
- Entidades: Event, TheaterShow, TheaterSession em `backend/src/entities/`
- DTOs/Validators: event.dto.ts, theater.dto.ts com parsing e validação manual
- Repositories: EventRepository, TheaterShowRepository, TheaterSessionRepository com `withTenant()` isolamento
- Services: EventService, TheaterService com invalidação de cache
- Controllers: EventController, TheaterController com tratamento de erro
- Rotas: event.routes.ts, theater.routes.ts, integradas em app.ts
- Migrations: 3 migrations para criar tables com indexes e foreign keys
- Config: database.ts atualizado com novas entidades
- Server: server.ts atualizado com injeção de dependência

Próximo: testar compilação e criar PR.

## 2026-05-25 08:30 — [nota] Escalação de leitura (sessão #2)

Li `state.md` e `memory.md` desta SPEC sem confirmação explícita prévia, sob autorização implícita do prompt "bora continuar a spec" (continuidade — R.9). Posterior confirmação verbal do dev às 08:32 ("Pode"). Registrado conforme RULES §4.

## 2026-05-25 08:35 — [descoberta] Merge `main` → branch deixou conflitos mal-resolvidos

`git status` no início da sessão mostrava "All conflicts fixed but you are still merging". Inspeção dos arquivos revelou:
- `backend/src/config/database.ts`: bloco `BACKEND_SRC/MIGRATIONS_GLOB/SUBSCRIBERS_GLOB` duplicado (HEAD não tinha esses globs absolutos, MERGE_HEAD tinha; resolução duplicou em vez de unir).
- `backend/src/server.ts:76`: vírgula órfã ` ,` em `createApp({...})` — propriedade removida no merge, vírgula esqueceu.
- `backend/src/services/event.service.ts`: imports `cached` / const `CACHE_TTL_SECONDS` / função `buildCacheKey` declarados mas não usados (cache nunca lia, só invalidava).

Durante a sessão o próprio dev (ou IDE) commitou o merge (`d5a4099`) com esses defeitos no disco, antes do meu fix. Por isso `MERGE_HEAD` deixou de existir mid-sessão.

## 2026-05-25 08:40 — [tentativa] Fix do merge

Commit `e3bbd7d fix(SPEC-20260518-1625): corrige resoluções incorretas do merge d5a4099`.
- Removido bloco duplicado em `database.ts` mantendo a versão de main (globs absolutos via `path.resolve(__dirname, '..')`, necessária para Vitest da raiz no `test:isolation`) + entities da branch (`Event, TheaterShow, TheaterSession` no array).
- Removida vírgula órfã em `server.ts`.
- Removidos imports/vars de cache não-usados em `event.service.ts` — cache é apenas invalidação (`invalidateByPattern`), sem `cached()` na leitura. Manter as definições não-usadas adicionaria escopo (implementar leitura cacheada de detail) que a SPEC não pede.

Resultado: `typecheck` zero erros, `lint` zero erros (3 warnings `any` em código de stores vindos de main, fora do escopo). `npm test -w backend` 12 suites, 78 testes passando + 1 todo.

## 2026-05-25 08:45 — [descoberta] Auditoria do critério expôs 3 lacunas reais (depois 2)

Audit contra `main.md:Critério de aceite`:
- ❌ Cron de publicação — pasta `backend/src/jobs/` não existia.
- ❌ Sanitização HTML real — `sanitizeText` em DTOs só fazia `trim()` (vulnerável a XSS no portal). Função real `sanitizeStoreDescription` existia em `lib/sanitize.ts` mas não era chamada por event/theater.
- Inicialmente marcada como ausente, mas **`starts_at` futuro 1h em sessões JÁ ESTAVA** implementada em `theater.dto.ts:127-131 (validateTheaterSessionInput)` e chamada por `theater.controller.ts:137`. Auditoria corrigida.
- Critério "categoria cross-tenant → 422": entidades atuais (`Event`/`TheaterShow`) não têm coluna de categoria. Marcado como inaplicável.

## 2026-05-25 08:50 — [MARCO] [decisão] Cron via `setInterval` zero-dep + sanitização HTML reutilizando helper de stores

Commit `42197eb feat(SPEC-20260518-1625): cron de publicação + sanitização HTML real`.

**Cron** (`backend/src/jobs/publish-scheduled.ts`):
- Função `publishScheduled(ds, redis, log)` faz `UPDATE ... RETURNING tenant_id` em `tb_event` e `tb_theater_show` para `status='scheduled' AND published_at <= NOW()` e invalida cache por tenant via `invalidateByPattern`. Falhas em UPDATE/SCAN são logadas mas não propagam (cron não pode derrubar o processo).
- `startPublishScheduledLoop(ds, redis, intervalMs=60_000, log)` cria `setInterval` com `.unref()` (não bloqueia shutdown limpo).
- Em `server.ts`: chamada gated por `config.nodeEnv !== 'test'`.
- Alternativas rejeitadas: `node-cron` (dep nova só para 1 trigger fixo); cron por tenant (custo de N timers escalando com tenants); pg `LISTEN/NOTIFY` (cabe melhor em jobs reativos, não em "tempo passou"). Trade-off aceito: granularidade fixa de 60s; multi-réplica vai fazer "thundering herd" no SCAN — reavaliar quando rodar mais de 1 réplica.

**Sanitização** (`backend/src/lib/sanitize.ts`):
- Extraída `sanitizeRichTextHtml` (mesma config de `sanitizeStoreDescription`, agora alias). Allowlist de tags/atributos garante remoção de `<script>`, `onerror=`, `javascript:` etc.
- Aplicada em `parseEventInput.body` e `parseTheaterShowInput.synopsis`. Antes era só `trim()`. `title`/`summary`/`location`/`ticket_info` continuam com `sanitizeText` (trim/length cap) — não são HTML.

Validações pós-feat:
- `npm run typecheck -w backend` ✅
- `npm run lint -w backend` ✅ (3 warnings de `any` em stores fora do escopo)
- `npm test -w backend` ✅ 78 passed + 1 todo, zero regressões.

## 2026-05-25 08:55 — [MARCO] [conclusão] SPEC concluída

Critério de aceite 100% marcado em `main.md`. R.7 aplicado:
- `docs/features/editorial-content.md`: SPEC movida pra "Concluídas", arquivos principais expandidos (`jobs/publish-scheduled.ts`, `lib/sanitize.ts`), "Estado atual" reescrito incluindo cron e sanitização, 2 decisões arquiteturais novas adicionadas (cron setInterval zero-dep; sanitização HTML real).
- `docs/features/auth.md`: SPEC adicionada em "Concluídas" — consome `requireAuth`, sem mudança arquitetural.
- `docs/features/tenant-resolution.md`: SPEC adicionada em "Concluídas" — consome `withTenant`/`requireTenantContext`, sem mudança arquitetural.
- `docs/features/infra-base.md`: SPEC adicionada em "Concluídas" — introduz `backend/src/jobs/` e generaliza `sanitizeRichTextHtml`.

Commit final pendente: chore de archive + R.7 (esta entrada vai no commit).
