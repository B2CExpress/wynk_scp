# SPEC-20260602-1057: Popup overlay admin com regras de exibição

**Status:** active
**Criada:** 2026-06-02 10:57
**Ativada:** 2026-06-02 10:57
**Concluída:** —
**Commit final:** —
**Keywords:** popup, overlay, modal, campanha, ativacao-exclusiva, agendamento, cookie, multitenant, editorial
**Features:** editorial-content
**Branch:** feature/SQU-60/44-api-admin-popup-com-regras-de-exibicao
**Depende de:** —
**Origem:** ticket SQU-60/#44 ("API admin popup com regras de exibição"), escrito na fase Next.js e adaptado para Express+TypeORM. Código rascunho já presente na branch (commits `ac7b9ef`/`63fa6f9`/`0398a0e`) mas incompleto e não-funcional. Análise + decisão de criar SPEC: usuário em 2026-06-02.
**Resumo:** Popup overlay (modal) configurável por tenant — mostra sobre o conteúdo após X segundos, 1 ativo por tenant por vez, com agendamento e regra de páginas. Entregar o CRUD admin + ativação mutuamente exclusiva (em transação) + endpoint público + componente client funcionando de ponta a ponta.

## Objetivo

Permitir que cada tenant configure um popup de campanha (Natal, Black Friday, inauguração) exibido sobre o site público, com no máximo 1 ativo por vez, agendável e com regra de em quais páginas aparece. O backend (rascunho) já tem DTO/repository/service/controller/routes, mas **não compila nem está plugado** — esta SPEC completa e integra tudo.

## Escopo

**DENTRO:**
- **Entity `Popup`** (`backend/src/entities/Popup.ts`) — campos `tenant_id`, `title`, `image_url`, `html_content`, `link_url`, `show_after_seconds`, `show_only_once`, `show_on_pages` (`home|all`), `starts_at`, `ends_at`, `is_active` (mapeado `isActive`). Seguir naming `tb_popup` / colunas `popup_*` (padrão do repo) e checar consistência com o que `popup.repository.ts` já acessa.
- **Migration** criando a tabela no schema `scp`.
- **Registro da entity** em `backend/src/config/database.ts` (lista `entities`).
- **Wiring**: instanciar `PopupRepository`/`PopupService`/`PopupController` em `server.ts` (modelo banner), declarar em `app.ts` (`AppDeps` + `app.use(createPopupRoutes(...))`).
- **Rota pública** padronizada para `GET /api/v1/popups/active` (alinhada com `stores`/`events`/`promotions`; hoje está `/api/popups/active` fora do padrão).
- **Remover** a validação `PopupStartDateInPastError` (rejeita `starts_at` no passado) — quebra agendamento retroativo e não está no ticket.
- **Sanitização** de `html_content` em POST/PUT (já via `sanitizeRichTextHtml` no DTO — confirmar).
- **Testes** backend (Jest): validação campo-a-campo, ativação exclusiva em transação, 404s, endpoint público com janela `starts_at`/`ends_at`.
- **Frontend portal**: criar `popup.module.css` (faltando → portal não builda); montar `<Popup>` no `app/layout.tsx`; implementar regra `show_on_pages` lendo `pathname`; trocar localStorage por **cookie 30d** (`popup-seen-{id}`, `Max-Age=2592000`, set no fechar e no clique do link).

**FORA:**
- UI de admin no backoffice (formulário CRUD visual do popup) — fica para SPEC futura.
- Swap do mock `portal/src/lib/popup/api.ts` pela chamada real ao backend — segue mock por ora (mesmo critério da SPEC-20260601-1909); deixar a lib no formato para swap trivial.
- Múltiplos popups simultâneos / segmentação avançada por audiência.

## Implementação

Modelo de referência: **banners** (mesma família, mesma feature) — `entities/Banner.ts`, `repositories/banner.repository.ts`, wiring em `server.ts`/`app.ts`, e `config/database.ts`. Popup reaproveita `withTenant()`, cache Redis por tenant (`cached`/`invalidateByPattern`, já no service), `requireAuth` nas rotas admin e `sanitizeRichTextHtml`.

**Backend já existente (rascunho, completar):**
- `dtos/popup.dto.ts` — `parsePopupInput`/`validatePopupInput` OK (validação campo-a-campo fiel ao ticket). `any` já corrigido (`Record<string, unknown>`).
- `repositories/popup.repository.ts` — tenant scope + `runInTransaction` para o activate (desativa todos + ativa este). Importa `../entities/Popup` (a criar).
- `services/popup.service.ts` — cache, activate/deactivate, `getActivePopupForClient`. `serializePopup` já tipado com `Popup`. **Remover** `PopupStartDateInPastError` do create/update.
- `controllers/popup.controller.ts` — todos os handlers + `getPublicPopup` (Cache-Control 300s).
- `routes/popup.routes.ts` — ajustar rota pública para `/api/v1/popups/active`.

**Pontos de atenção (gotchas):**
- A entity precisa expor exatamente os nomes que repository/service acessam: `image_url`, `html_content`, `link_url`, `show_after_seconds`, `show_only_once`, `show_on_pages`, `starts_at`, `ends_at`, `tenantId`, `isActive`. Conferir snake_case nas colunas vs. camel nas propriedades.
- `findActiveForCurrentTenant` filtra `starts_at <= now AND ends_at >= now` — colunas NOT NULL? O ticket diz "starts_at IS NULL OR ...". Decidir: tornar `starts_at`/`ends_at` NOT NULL (validação já exige ambos) e manter o filtro simples. Registrar em state.
- Cookie no client: TTL 30 dias via `Max-Age`; setar ao fechar (X) e ao clicar no link.

## Critério de aceite

- [ ] Entity `Popup` criada e registrada em `config/database.ts`; backend compila (`typecheck -w backend` verde)
- [ ] Migration criando `tb_popup` no schema `scp` (`migration:run` aplica limpo)
- [ ] Rotas plugadas em `server.ts`/`app.ts`; endpoints admin sobem com `requireAuth`
- [ ] Ativação mutuamente exclusiva funcionando em transação (criar 2, ativar A, ativar B → só B ativo)
- [ ] Rota pública `GET /api/v1/popups/active` retorna popup ativo respeitando janela `starts_at`/`ends_at` (ou null)
- [ ] Validação `starts_at` no passado removida; agendamento retroativo aceito
- [ ] `html_content` sanitizado em POST/PUT
- [ ] Testes backend cobrindo validação, ativação exclusiva, 404s e endpoint público (verdes)
- [ ] Portal builda: `popup.module.css` criado e `<Popup>` montado no `layout.tsx`
- [ ] Client respeita `show_on_pages` (pathname) e usa cookie 30d para `show_only_once` (fechar + clique no link)
- [ ] **Features tocadas (editorial-content) atualizadas** com timestamp e referência a esta SPEC
- [ ] Decisões da feature revisadas: obsoletas marcadas, ativas confirmadas
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
