# Memory — SPEC-20260601-1909-portal-paginas-publicas-conteudo

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-06-01 19:09

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-06-01 19:59 (sessão #1)
**Onde tô:** ✅ SPEC CONCLUÍDA em 2026-06-01 19:59, commit `eb9c23c`, arquivada. Portal com páginas de conteúdo + home (mock); verificação real verde.
**Próximo passo:** nenhum — SPEC fechada. Futuro: wiring com a API real (libs já no formato) + endpoints públicos de notícias/teatro no backend.
**Última decisão:** tudo mock no padrão lojas; CSS Modules; carousel self-contained; scratch removido.
**Bloqueio atual:** nenhum
**Se retomar, ler:** state.md entrada `[conclusão]` 2026-06-01 19:59.

---

## Contexto ativo

### O que está sendo feito AGORA

Páginas públicas de conteúdo (eventos/notícias/promoções/serviços/teatro lista+detalhe) + home no `portal/` (workspace real), mock-driven, no padrão de `lojas` (CSS Modules, server components, `lib/<resource>/api.ts`). Scratch `frontend/app-fase-2/3/4` removido.

### Hipóteses em jogo

- **Swap p/ API real trivial** (status: assumida) — libs mock já no formato do contrato (`_host` reservado).

### Decisões recentes que importam pra continuar

- [2026-06-01] Portar pro `portal/` (não consertar no scratch). Scratch removido via `git rm` (commit forward — já estava em origin/henrique).
- [2026-06-01] Tudo mock; CSS Modules; `BannerCarousel`/`Countdown` self-contained (Next 16 sem embla).
- [2026-06-01] Override eslint portal `argsIgnorePattern: ^_` (alinha backend) p/ `_host`.

### Respostas-chave do usuário

- [2026-06-01] Usuário: "Mas não é para ter essas pastas app-fase-2 / app-fase-3 e app-fase-4, certo?" → confirmou que o scratch não deveria ser o destino; o certo é o `portal/`.
- [2026-06-01] Usuário escolheu: portar pro portal, tudo mock, todas as 5 seções + home, feature `portal-stores-pages`.

### Tentativas que falharam (para NÃO repetir)

- [2026-06-01] 1ª tentativa: implementei dentro do scratch `frontend/app-fase-3/4` (corrigindo estrutura). ERRADO — "lugar certo" significava o workspace `portal/`, não polir o scratch. Revertido via `git reset` (2 commits não-pushados). Lição: quando algo está fora da arquitetura documentada (CLAUDE.md: portal = site público), questionar se deveria existir ANTES de implementar.

### Arquivos ativamente sendo tocados

- `portal/src/lib/{events,promotions,news,theater,services,home}/api.ts`
- `portal/src/app/{eventos,noticias,promocoes,servicos,teatro}/{page,[slug]/page}.tsx`
- `portal/src/app/page.tsx`, `content.module.css`, `home.module.css`, `_components/{BannerCarousel,Countdown}.tsx`
- `portal/eslint.config.mjs`

### Onde parei exatamente

Implementação + verificação real completas. Próximo: commits e conclusão da SPEC.

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-06-01 19:09 | — | ativação+implementação | Portar páginas de conteúdo p/ portal (mock); remover scratch; verificar build |
