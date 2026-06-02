# State — SPEC-20260602-1057

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-06-02 10:57

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-06-02 12:46
**Onde tô:** SPEC CONCLUÍDA e arquivada. Código commitado (`ca09b53`/`c13b23e`/`3317420`) e pushado. Tudo verde (backend typecheck/lint/102 testes; portal typecheck/lint/build).
**Próximo passo:** nenhum — SPEC done. Pendência futura (fora do escopo): swap do mock `lib/popup/api.ts` pelo `GET /api/v1/popups/active` real; UI de admin no backoffice.
**Última decisão:** entity/repository/service realinhados ao padrão Banner (camelCase props → colunas `popup_*`); invalidação de cache passou a incluir a chave `popup:active`.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** entrada `[conclusão]` de 2026-06-02 12:46.

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Análise do rascunho existente + decisões (rota, past-date, cookie) | concluído | 2026-06-02 10:57 | — |
| 2 | Lint fix (`any` em dto + service) | concluído | 2026-06-02 10:57 | — |
| 3 | Entity `Popup` + migration + registro em database.ts | concluído | 2026-06-02 11:40 | — |
| 4 | Wiring server.ts/app.ts + rota pública `/api/v1/popups/active` | concluído | 2026-06-02 11:40 | — |
| 5 | Remover `PopupStartDateInPastError` | concluído | 2026-06-02 11:40 | — |
| 6 | Testes backend (23 popup + suíte 102 verdes) | concluído | 2026-06-02 11:40 | — |
| 7 | Frontend: css module + montar no layout + show_on_pages + cookie 30d | concluído | 2026-06-02 11:40 | — |
| 8 | Commit + arquivamento (R.5.3/R.7) | concluído | 2026-06-02 12:46 | `3317420` |

### Próximos passos

- [ ] Commit das mudanças (gera hashes pro critério de aceite)
- [ ] Marcar critério de aceite em main.md + atualizar feature `editorial-content` (R.7)
- [ ] Mover SPEC para `archive/` (R.5.3)
- [ ] (Opcional) validação manual: `migration:run` + fluxo real de ativação/cookie

### Bloqueios ativos

_nenhum_

---

## Fatos confirmados

- [2026-06-02 10:57] Backend popup (dto/repo/service/controller/routes) existe na branch mas **não compila**: `popup.repository.ts:2` importa `../entities/Popup` que não existe. Fonte: `find backend -iname '*opup*'` + leitura dos arquivos.
- [2026-06-02 10:57] Rotas popup **não estão plugadas** em `app.ts`/`server.ts` (nenhuma referência a popup). Fonte: `grep -rn -i popup backend/src/app.ts backend/src/server.ts`.
- [2026-06-02 10:57] Endpoints públicos do repo seguem `/api/v1/<recurso>` (stores, events, promotions, store-categories). `/api/popups/active` é o único fora do padrão. Fonte: `grep router.get *.routes.ts`.
- [2026-06-02 10:57] Frontend `Popup.tsx` importa `./popup.module.css` inexistente e não está montado no `layout.tsx`; `lib/popup/api.ts` é mock fixo. Fonte: leitura + `ls`.
- [2026-06-02 10:57] Feature correta = `editorial-content` (onde banners moram: `Banner.ts` + banner.* listados nos arquivos principais). Fonte: `docs/features/editorial-content.md`.

## Inferências prováveis

- [2026-06-02 10:57] Tornar `starts_at`/`ends_at` NOT NULL simplifica `findActiveForCurrentTenant` (filtro já assume não-null) e a validação já exige ambos. Validar com: revisão do ticket ("IS NULL OR ...") vs. realidade do código.

## Dúvidas em aberto

- [2026-06-02 10:57] `show_after_seconds` na entity: default 3 no DTO — replicar default na coluna? Próxima ação: decidir ao criar a migration.

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-06-02 10:57 — [ativação]

SPEC criada a partir de análise do rascunho de popup já presente na branch `feature/SQU-60/44-api-admin-popup-com-regras-de-exibicao` (commits `ac7b9ef`/`63fa6f9`). Ticket SQU-60/#44, originalmente escrito em vocabulário Next.js, adaptado para Express+TypeORM.

Decisões iniciais com o usuário:
- **Rota pública**: `/api/v1/popups/active` (segue padrão `/api/v1/...` dos outros públicos; `/api/popups/active` atual é o outlier). Plural + sub-path `active`.
- **`starts_at` no passado**: remover `PopupStartDateInPastError` (quebra agendamento retroativo, não está no ticket).
- **`show_only_once`**: cookie 30d (TTL nativo via `Max-Age`) em vez de localStorage (sem expiração nativa; exigiria timestamp manual). Ticket também descreve teste via DevTools > Cookies.
- **Feature**: `editorial-content` (precedente dos banners, SQU-58).

Arquivos relevantes identificados: `backend/src/{dtos,repositories,services,controllers,routes}/popup.*`, `backend/src/entities/Banner.ts` (modelo), `backend/src/config/database.ts`, `backend/src/{app,server}.ts`, `portal/src/app/_components/Popup.tsx`, `portal/src/app/layout.tsx`, `portal/src/lib/popup/api.ts`.

## 2026-06-02 10:57 — [refactor] Lint fix dos `any`

CI apontou `no-explicit-any` em `popup.dto.ts:36` e `popup.service.ts:40`. Corrigido: `parsePopupInput(input: Record<string, unknown>)` (narrowing por typeof já cobre) e `serializePopup(popup: Popup)` com `import type { Popup }`. Não fecha o CI sozinho — typecheck ainda quebra pela entity ausente (escopo fase 3).

## 2026-06-02 11:40 — [MARCO] [descoberta] Rascunho do repository estava com SQL cru inconsistente

Ao criar a entity descobri que `popup.repository.ts` usava nomes de coluna que não batiam com a convenção `popup_*` do repo: SQL cru `popup.starts_at`, `popup.isActive`, `popup.id` (e `.create()` com props snake_case `image_url`/`html_content`). Isso jamais funcionaria com uma entity no padrão Banner. Decisão: realinhar entity + repository + service juntos ao padrão Banner (props camelCase → colunas `popup_*`; SQL cru com nome de coluna completo `popup.popup_*`). Fonte: `backend/src/entities/Banner.ts`, `repositories/banner.repository.ts`.

## 2026-06-02 11:40 — [decisão] Invalidação de cache passou a incluir `popup:active`

O service rascunho invalidava só `popup:list:*` e `popup:detail` nas mutações, mas NUNCA a chave `popup:active:{tenant}` (cache 300s do endpoint público). Resultado: após activate/deactivate, o público serviria popup obsoleto por até 5 min. Centralizei em `invalidateCaches(tenantId, id?)` chamado em create/update/delete/activate/deactivate. Coberto por teste (`activate` → `del('popup:active:tenant-a')`).

## 2026-06-02 11:40 — [nota] Implementação concluída — verificação real

Backend: entity `Popup` (`tb_popup`, índice tenant+active+schedule), migration `1746931200000`, registro em `database.ts`, wiring em `server.ts`/`app.ts` + `mock-deps.ts` (stub), rota pública `/api/v1/popups/active`, `PopupStartDateInPastError` removido. Testes: `popup.dto.test.ts` (validação campo-a-campo) + `popup.service.test.ts` (ativação exclusiva em transação, 404, create mapeia/defaults, rejeita ends<=starts, público ativo/null) → 23 testes.

Verificação (2026-06-02 11:40):
- `typecheck -w backend` ✓ | `lint -w backend` ✓ (0 erros; 7 warnings pré-existentes, nenhum em popup)
- `test -w backend` ✓ 14 suites, 102 passed, 1 todo
- `typecheck -w portal` ✓ | `lint -w portal` ✓ | `build -w portal` ✓ (13 rotas)

Frontend: `popup.module.css` criado, `<Popup>` montado no `layout.tsx`, regra `show_on_pages` via `usePathname()`, cookie `popup-seen-{id}` (`max-age` 30d) setado no fechar e no clique do link; `setIsVisible` só em setTimeout (evita `react-hooks/set-state-in-effect`). Mock `lib/popup/api.ts` alinhado ao shape camelCase do backend.

## 2026-06-02 12:46 — [conclusão] SPEC concluída e arquivada

Implementação completa, commitada e pushada na branch `feature/SQU-60/44-api-admin-popup-com-regras-de-exibicao`:
- `ca09b53` feat: implement popup overlay admin with display rules (backend completo + frontend)
- `c13b23e` feat: add demo setup script for shopping-x tenant (`run-demo-shopping-x.sh`, tooling)
- `3317420` feat: capture input in createForCurrentTenant test (fix do `tsc` da CI — `mock.calls[0][0]` em tupla vazia → captura tipada)

Pós-implementação nesta sessão (devex + fixes da CI):
- `prettier --write` em `popup.controller.ts` e na migration (format:check estava vermelho).
- Fix do typecheck da CI no teste (ts-jest era leniente; `tsc --noEmit` pegou). **Lição:** rodar `tsc --noEmit` após escrever testes, não só `jest`.
- Diagnóstico do ambiente local do usuário: o `seed` básico só cria tenants (não lojas) — quem popula conteúdo é `seed:demo`; `/lojas` é dado real do backend (não mock). Bug no `run.sh` (`ok: command not found` no caminho `--seed`, função `ok()` não definida lá) — NÃO corrigido (fora de escopo; `run-demo-shopping-x.sh` evita o caminho `--seed`).

Critério de aceite 100% marcado em `main.md`. Feature `editorial-content` atualizada (R.7): linha em Concluídas, Estado atual com a seção de popups, 4 decisões arquiteturais novas, 5 gotchas novos, arquivos principais + keywords. `main.md` Status=done, Commit final=`3317420`. Pasta movida `active/` → `archive/`.

**FORA do escopo (pendências futuras):** swap do mock `portal/src/lib/popup/api.ts` pelo `GET /api/v1/popups/active` real; UI de admin no backoffice (formulário CRUD do popup); correção do bug `ok()` no `run.sh`.
