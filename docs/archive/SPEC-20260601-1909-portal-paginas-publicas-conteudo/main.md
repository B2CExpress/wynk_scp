# SPEC-20260601-1909: Páginas públicas de conteúdo no portal (mock-driven) + remoção do scratch frontend

**Status:** done
**Criada:** 2026-06-01 19:09
**Ativada:** 2026-06-01 19:09
**Concluída:** 2026-06-01 19:59
**Commit final:** `eb9c23c`
**Keywords:** portal, nextjs, eventos, noticias, promocoes, servicos, teatro, home, mocks, css-modules
**Features:** portal-stores-pages
**Branch:** henrique
**Depende de:** —
**Origem:** frontend commitado sem SPEC em `frontend/app-fase-3/4` (`7246fcf`/`8966b60`). Após análise, decidiu-se que o lugar certo é o workspace `portal/` (não o scratch). Pedido do usuário em 2026-06-01.
**Resumo:** Implementar no `portal/` (workspace Next.js real) as páginas públicas de eventos, notícias, promoções, serviços e teatro (lista + detalhe) e a home (hero + carrossel + seções), renderizáveis com dados mock, seguindo as convenções do portal (CSS Modules + theme vars + server components). Remover o scratch `frontend/app-fase-2/3/4`.

## Objetivo

Trazer as páginas públicas de conteúdo para o site real (`portal/`), onde buildam, typecheckam e passam no CI — em vez do scratch `frontend/app-fase-N/` (fora do workspace/build). Usar mocks (no formato do contrato real) para validar o visual sem depender do backend, deixando o swap para a API real trivial em SPEC futura.

## Escopo

**DENTRO:**
- Libs mock `portal/src/lib/{events,promotions,news,theater,services,home}/api.ts` (interfaces tipadas + `fetch*`/`fetch*Detail`, no padrão de `lib/stores/api.ts`).
- Páginas em `portal/src/app/{eventos,noticias,promocoes,servicos,teatro}/{page.tsx,[slug]/page.tsx}` (server components, CSS Modules, `notFound()` no detalhe).
- Home `portal/src/app/page.tsx` reescrita: hero + `BannerCarousel` (client, self-contained) + seções (lojas/promoções/eventos/notícias).
- CSS Modules `content.module.css` (compartilhado) + `home.module.css`. Componentes client `_components/{BannerCarousel,Countdown}.tsx`.
- Override de eslint no portal (`argsIgnorePattern: ^_`) alinhando com o backend.
- Remoção do scratch `frontend/app-fase-2/3/4` (`git rm`).

**FORA:**
- Wiring real com a API do backend (mocks por ora; libs já no formato para swap).
- Criar endpoints públicos de notícias/teatro/serviços no backend (hoje só eventos e promoções têm API pública).
- `frontend/app-fase-1` (permanece — decisão separada).
- Header/nav global do portal (não existe ainda; fora do escopo).

## Implementação

Modelo: `portal/src/app/lojas/*` + `portal/src/lib/stores/api.ts`. Páginas são server components async; detalhe usa `params: Promise<{slug}>` e `try/catch` no fetch → `notFound()` quando a lib lança `Error('not_found')`. Estilo via CSS Modules usando as vars do tema aplicadas pelo layout raiz. Imagens via `next/image` com `unoptimized` (mock usa picsum). `BannerCarousel` reescrito sem dependência externa (Next 16 não traz embla); `Countdown` (promoções) com tick deferido para não violar `react-hooks/set-state-in-effect`.

Mocks ficam em `lib/<resource>/api.ts` com `_host` reservado (assinatura idêntica à futura função real). Notícias/teatro/serviços não têm API pública (serviços nem existe no domínio) — mocks marcados explicitamente.

## Critério de aceite

- [x] Libs mock criadas (events, promotions, news, theater, services, home) tipadas, padrão `lib/stores/api.ts` (2026-06-01 19:59, commit `eb9c23c`)
- [x] 5 seções (lista + detalhe) em `portal/src/app/` renderizando os mocks; detalhe com `notFound()` (2026-06-01 19:59, commit `eb9c23c`)
- [x] Home reescrita: hero + carrossel self-contained + seções (2026-06-01 19:59, commit `eb9c23c`)
- [x] Scratch `frontend/app-fase-2/3/4` removido (`git rm`) (2026-06-01 19:59, commit `eb9c23c`)
- [x] **Verificação real**: `typecheck`, `lint`, `build` (13 rotas) e `format:check` verdes no portal (2026-06-01 19:58)
- [x] **Features tocadas (portal-stores-pages) atualizadas** com timestamp e referência a esta SPEC (2026-06-01 19:59)
- [x] `state.md` com entrada `[conclusão]` (2026-06-01 19:59)
- [x] `memory.md` com TL;DR final atualizado (2026-06-01 19:59)
