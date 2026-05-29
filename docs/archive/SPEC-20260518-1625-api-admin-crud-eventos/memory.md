# Memory — SPEC-20260518-1625

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-05-18 16:25

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-25 08:55 (sessão #2 — SPEC concluída)
**Onde tô:** SPEC arquivada, commit final pendente. Todas as 4 features atualizadas (R.7). Critério 100% marcado.
**Próximo passo:** abrir/atualizar PR `feature/SQU-51-api-admin-crud-de-eventos` → `main` (commits: `e3bbd7d`, `42197eb`, próximo C2 com archive).
**Última decisão:** Cron via `setInterval` zero-dep (60s, unref) + `sanitizeRichTextHtml` como alias de `sanitizeStoreDescription` em `lib/sanitize.ts`.
**Bloqueio atual:** nenhum
**Se retomar, ler:** `state.md` entrada `[conclusão]` 2026-05-25 08:55

---

## Contexto ativo

### O que está sendo feito AGORA

SPEC-20260518-1625 concluída na sessão #2. Entregue tudo do critério de aceite mais hardening pós-merge: cron de publicação (`backend/src/jobs/publish-scheduled.ts`), sanitização HTML real em `body`/`synopsis` (`sanitizeRichTextHtml` em `lib/sanitize.ts`), correção das resoluções incorretas do merge `d5a4099` (database.ts duplicado, server.ts com vírgula órfã, event.service.ts com unused cache vars).

Arquitetura final: 3 entidades (Event, TheaterShow, TheaterSession) com isolamento multitenant via `withTenant()` + `TenantSubscriber`; validação manual sem Zod (decisão registrada); cache Redis por tenant com invalidação por SCAN pattern; cron cross-tenant via `setInterval(60s).unref()` rodando `UPDATE...RETURNING tenant_id` + invalidação por tenant afetado; sanitização HTML restritiva via `sanitize-html` (allowlist `p,br,strong,em,u,h2-h4,ul,ol,li,a,img,blockquote`).

Validações finais: typecheck ✅, lint ✅ (3 warnings de `any` em stores fora do escopo), `npm test -w backend` 78 testes + 1 todo ✅.

Próxima sessão: abrir PR.

### Hipóteses em jogo

_(nenhuma)_

### Decisões recentes que importam pra continuar

- [2026-05-18 16:26] Usar parser manual para DTOs (sem Zod instalado)
- [2026-05-18 16:30] Estrutura 3-camada: repositories → services → controllers
- [2026-05-18 16:31] Conflito de sessão < 90min = 409; validação rigorosa
- [2026-05-18 16:35] Criar feature documentation em editorial-content.md (SPEC toca 4 features)
- [2026-05-25 08:50] Cron via `setInterval(60s).unref()` em `backend/src/jobs/publish-scheduled.ts` — zero-dep, gated por `NODE_ENV !== 'test'`. Multi-réplica vai duplicar SCAN — aceitar até deploy de mais de 1 réplica.
- [2026-05-25 08:50] `sanitizeRichTextHtml` em `lib/sanitize.ts` (alias do `sanitizeStoreDescription`) aplicado em `body`/`synopsis` — antes era só `trim()`. Allowlist preserva HTML básico do editor mas remove `<script>`/`onerror`/`javascript:`.

### Respostas-chave do usuário

- [2026-05-18 16:25] Usuário: "LEIA A PASTA DOCS, FAÇA A SPEC E CRIE O CODIGO"
  Contexto: branch SQU-51-api-admin-crud-de-eventos ativa; pedido claro para implementação completa.

### Tentativas que falharam (para NÃO repetir)

- [2026-05-18 16:35] Erro TS: mock-deps.ts faltava stubs para novos controllers — corrigido adicionando makeStubEventController e makeStubTheaterController
- [2026-05-18 16:35] Erro TS: duration_minutes podia ser null — corrigido adicionando null check em parseTheaterShowInput
- [2026-05-18 16:35] Erro TS: showId faltava nas sessions retornadas — corrigido adicionando ao mapeamento da repository
- [2026-05-25 08:35] Merge `main` mergeado com resoluções incorretas e committado (`d5a4099`) antes da validação: `database.ts` com bloco `BACKEND_SRC` duplicado, `server.ts` com vírgula órfã em `createApp()`, `event.service.ts` com `cached`/`CACHE_TTL_SECONDS`/`buildCacheKey` declarados mas não-usados. Lição: sempre rodar `typecheck` + `lint` ANTES de commitar merge — `git status` "all conflicts fixed" só confirma que conflict markers sumiram, não que o código está válido.
- [2026-05-25 08:45] Auditoria inicial declarou ausente a validação de "starts_at 1h futuro em sessões" — na verdade JÁ existia em `validateTheaterSessionInput`. Lição: ao auditar critério de aceite, grep o validator nos DTOs antes de inferir do service.

### Arquivos ativamente sendo tocados

- `backend/src/entities/{Event,TheaterShow,TheaterSession}.ts` (criados)
- `backend/src/dtos/{event,theater}.dto.ts` (criados)
- `backend/src/repositories/{event,theater-show,theater-session}.repository.ts` (criados)
- `backend/src/services/{event,theater}.service.ts` (criados)
- `backend/src/controllers/{event,theater}.controller.ts` (criados)
- `backend/src/routes/{event,theater}.routes.ts` (criados)
- `backend/src/migrations/1726518000*.ts` (3 migrations criadas)
- `backend/src/{app,server}.ts` (integração)
- `backend/src/config/database.ts` (entidades registradas)
- `docs/features/editorial-content.md` (nova feature)
- `docs/active/SPEC-20260518-1625-api-admin-crud-eventos/{main,state,memory}.md` (SPEC-driven)

### Onde parei exatamente

Commits da branch: `3c48de1` (impl original), `45aa31c` (docs editorial-content), `d5a4099` (merge `main` com defeitos), `e3bbd7d` (fix das resoluções), `42197eb` (feat cron + sanitize). Próximo commit: archive + R.7 final. Push depois.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-05-18 16:25 | ~40min | implementação | Entidades → DTOs → Repos → Services → Controllers → Rotas → Migrations → Feature docs → Commit concluído |
| 2 | 2026-05-25 08:25 | ~30min | continuidade/conclusão | Fix merge → cron + sanitize HTML → R.7 nas 4 features → archive |
