# Memory — SPEC-20260602-1057

> Main: [main.md](./main.md)
> State: [state.md](./state.md)
> Criado: 2026-06-02 10:57

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-06-02 11:40 (sessão #1)
**Onde tô:** Implementação 100% feita e verificada local (backend typecheck/lint/102 testes; portal typecheck/lint/build 13 rotas). Falta só commit + bookkeeping de conclusão.
**Próximo passo:** commitar; preencher hashes no critério de aceite do main.md; atualizar feature `editorial-content` (R.7); mover SPEC para `archive/` (R.5.3).
**Última decisão:** realinhar entity/repository/service ao padrão Banner (camelCase→`popup_*`); incluir `popup:active` na invalidação de cache.
**Bloqueio atual:** nenhum.
**Se retomar, ler:** este TL;DR + state.md (log de 2026-06-02 11:40 + Status snapshot).

---

## Contexto ativo

### O que está sendo feito AGORA

Completar e integrar o feature de popup que já existe pela metade na branch. O backend tem todas as camadas (dto/repo/service/controller/routes) mas falta a entity (logo não compila) e o wiring (logo as rotas nunca sobem). O frontend tem `Popup.tsx` mas falta o css module e não está montado, e ignora `show_on_pages`. Modelo a seguir: banners (mesma feature `editorial-content`).

### Hipóteses em jogo

- **`starts_at`/`ends_at` NOT NULL** (status: testando) — simplifica `findActiveForCurrentTenant`; validação já exige ambos. 2026-06-02 10:57

### Decisões recentes que importam pra continuar

- [2026-06-02 10:57] Rota pública `/api/v1/popups/active` (padrão do repo).
- [2026-06-02 10:57] Remover `PopupStartDateInPastError` (create e update).
- [2026-06-02 10:57] Cookie 30d (`popup-seen-{id}`, `Max-Age=2592000`) no fechar e no clique do link.
- [2026-06-02 10:57] Feature de vínculo: `editorial-content`.

### Respostas-chave do usuário

- [2026-06-02 10:57] Usuário sobre rota: "qual o padrão atual, temos v1 no path nos outros endpoints? Seguir padrão atual". Contexto: confirmou seguir `/api/v1/...`.
- [2026-06-02 10:57] Usuário sobre cookie vs localStorage: "Qual é a melhor opção?" → decidido cookie (TTL nativo 30d).

### Tentativas que falharam (para NÃO repetir)

_nenhuma ainda_

### Arquivos ativamente sendo tocados

- `backend/src/dtos/popup.dto.ts` (editado — lint fix)
- `backend/src/services/popup.service.ts` (editado — lint fix; falta remover past-date)
- `backend/src/entities/Popup.ts` (a criar)
- `backend/src/config/database.ts`, `backend/src/{app,server}.ts`, `backend/src/routes/popup.routes.ts` (a editar)
- `backend/src/entities/Banner.ts` (referência)
- `portal/src/app/_components/Popup.tsx`, `portal/src/app/layout.tsx`, `portal/src/lib/popup/api.ts` (frontend)

### Onde parei exatamente

Acabei de criar os 3 arquivos da SPEC e os 2 lint fixes. Próximo arquivo concreto: `backend/src/entities/Popup.ts`, espelhando `Banner.ts` e conferindo os nomes de propriedade que `popup.repository.ts` já acessa (`image_url`, `html_content`, `link_url`, `show_after_seconds`, `show_only_once`, `show_on_pages`, `starts_at`, `ends_at`, `tenantId`, `isActive`).

---

## Histórico de sessões

| # | Início | Duração | Tipo | Sumário 1 linha |
|---|--------|---------|------|-----------------|
| 1 | 2026-06-02 10:57 | — | ativação | Análise do rascunho + decisões + criação da SPEC + lint fix |
