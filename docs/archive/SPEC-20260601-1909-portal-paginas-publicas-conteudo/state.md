# State — SPEC-20260601-1909-portal-paginas-publicas-conteudo

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-06-01 19:09

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-06-01 19:59
**Onde tô:** ✅ SPEC CONCLUÍDA e arquivada. Portal com páginas de conteúdo + home (mock); verificação real verde; scratch removido.
**Próximo passo:** nenhum — SPEC fechada. Push + (futuro) wiring com API real ficam com o dev.
**Última decisão:** tudo mock no padrão lojas; CSS Modules; carousel self-contained; scratch removido.
**Bloqueio atual:** nenhum
**Se retomar, ler:** entrada `[conclusão]` 2026-06-01 19:59.

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | SPEC + decisão (portar p/ portal) | concluído | 2026-06-01 19:09 | — |
| 2 | Remover scratch frontend/app-fase-2/3/4 | concluído | 2026-06-01 19:58 | — |
| 3 | Libs mock + páginas + home no portal | concluído | 2026-06-01 19:58 | — |
| 4 | Verificação (typecheck/lint/build/format) | concluído | 2026-06-01 19:58 | — |
| 5 | Conclusão + arquivamento | concluído | 2026-06-01 19:59 | `eb9c23c` |

### Próximos passos

- [x] implementação commitada pelo dev em `eb9c23c` (2026-06-01 19:59)
- [x] conclusão R.7 + archive (2026-06-01 19:59)

### Bloqueios ativos

_(nenhum)_

---

## Fatos confirmados

- [2026-06-01 19:30] `portal/` é workspace Next 16 / React 19; `@/*`→`./src/*`; lojas usa CSS Modules + `lib/stores/api.ts` (fetch `X-Forwarded-Host`, `cache:'no-store'`, erro `not_found`). Fonte: `portal/src/app/lojas`, `portal/tsconfig.json`.
- [2026-06-01 19:30] Backend público: eventos (`/api/v1/events` + `/:slug`) e promoções (`/api/v1/promotions`, só lista). Notícias/teatro só admin; serviços não existe. Fonte: `backend/src/routes/*`.
- [2026-06-01 19:58] Verificação real verde: typecheck, lint, build (todas as rotas novas compiladas como dinâmicas), format. Fonte: `npm run {typecheck,lint,build} -w portal`, `npm run format:check`.

## Inferências prováveis

- [2026-06-01 19:30] Swap futuro para API real será trivial (libs já no formato). Validar quando houver SPEC de integração.

## Dúvidas em aberto

- [2026-06-01 19:30] Endpoints públicos de notícias/teatro e domínio de serviços — backend não tem. Candidato a SPEC futura.

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

### 2026-06-01 19:09 — [ativação]

SPEC criada após reverter (`git reset`) a 1ª tentativa que implementava dentro do scratch `frontend/`. Decisão do usuário: portar para `portal/` (site real), tudo mock, todas as 5 seções + home, feature `portal-stores-pages`.

### 2026-06-01 19:58 — [MARCO] [implementação] Portal + remoção do scratch

- `git rm` de `frontend/app-fase-2/3/4` (scratch; `app-fase-1` mantido).
- Libs mock: `portal/src/lib/{events,promotions,news,theater,services,home}/api.ts`.
- Páginas: `app/{eventos,noticias,promocoes,servicos,teatro}/{page,[slug]/page}.tsx`.
- Home reescrita (`app/page.tsx`): hero + `BannerCarousel` (client, self-contained) + seções.
- CSS Modules `content.module.css` + `home.module.css`; `_components/{BannerCarousel,Countdown}.tsx`.
- Override eslint portal (`argsIgnorePattern: ^_`) p/ `_host`.
- Fix `Countdown`: tick inicial deferido (`react-hooks/set-state-in-effect`).

Verificação real (portal é workspace): `typecheck` ✅, `lint` ✅, `build` ✅ (13 rotas, novas como dinâmicas ƒ), `format:check` ✅.

### 2026-06-01 19:59 — [MARCO] [conclusão] SPEC arquivada

Implementação commitada pelo dev como `eb9c23c` (remoção do scratch `frontend/app-fase-2/3/4` + todo o portal: libs mock, 10 páginas, home, CSS Modules, componentes, eslint override). Verificação real verde (typecheck/lint/build/format).

R.7: `features/portal-stores-pages.md` atualizada (escopo ampliado p/ páginas de conteúdo; SPEC em Concluídas; decisões mock-libs + carousel self-contained; gotchas sobre ausência de API pública de notícias/teatro/serviços). Critérios de aceite marcados. Pasta movida `active/` → `archive/`. Commit final: `eb9c23c`.

Nota de processo: a 1ª tentativa (dentro do scratch `frontend/`) foi revertida via `git reset` após o usuário apontar que o destino certo era o `portal/`. Lição registrada no memory.
