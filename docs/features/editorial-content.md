# Feature: editorial-content

**Keywords:** eventos, theater-shows, news, noticias, banners, carrossel, popup, overlay, modal, hero, home, editorial, content-management, crud-admin, scheduler, publicacao-automatica, state-machine, cron-secret, reorder, ativacao-exclusiva, upsert, singleton-por-tenant
**Arquivos principais:**
  - backend/src/entities/Event.ts
  - backend/src/entities/TheaterShow.ts
  - backend/src/entities/TheaterSession.ts
  - backend/src/entities/News.ts
  - backend/src/entities/Banner.ts
  - backend/src/controllers/event.controller.ts
  - backend/src/controllers/theater.controller.ts
  - backend/src/controllers/news.controller.ts
  - backend/src/controllers/cron.controller.ts
  - backend/src/services/event.service.ts
  - backend/src/services/theater.service.ts
  - backend/src/services/news.service.ts
  - backend/src/services/banner.service.ts
  - backend/src/controllers/banner.controller.ts
  - backend/src/repositories/banner.repository.ts
  - backend/src/dtos/banner.dto.ts
  - backend/src/routes/banner.routes.ts
  - backend/src/entities/Popup.ts
  - backend/src/controllers/popup.controller.ts
  - backend/src/services/popup.service.ts
  - backend/src/repositories/popup.repository.ts
  - backend/src/dtos/popup.dto.ts
  - backend/src/routes/popup.routes.ts
  - portal/src/app/_components/Popup.tsx
  - portal/src/lib/popup/api.ts
  - backend/src/entities/Hero.ts
  - backend/src/controllers/hero.controller.ts
  - backend/src/services/hero.service.ts
  - backend/src/repositories/hero.repository.ts
  - backend/src/dtos/hero.dto.ts
  - backend/src/routes/hero.routes.ts
  - backend/src/repositories/event.repository.ts
  - backend/src/repositories/theater-show.repository.ts
  - backend/src/repositories/theater-session.repository.ts
  - backend/src/repositories/news.repository.ts
  - backend/src/dtos/event.dto.ts
  - backend/src/dtos/theater.dto.ts
  - backend/src/dtos/news.dto.ts
  - backend/src/lib/news/state.ts (`canTransition`, `canDelete`)
  - backend/src/jobs/publish-scheduled.ts (cobre events + shows + news)
  - backend/src/routes/cron.routes.ts (endpoint POST `/api/cron/publish-scheduled`)
  - backend/src/lib/sanitize.ts (`sanitizeRichTextHtml`)
**Resumo:** CRUD admin de conteúdo editorial: eventos (com `starts_at`/`ends_at`), peças teatrais (1 peça → N sessões com data/ingresso) e notícias (com state machine `draft → scheduled → published → archived`). Isolamento multitenant via `withTenant()`, cache Redis por tenant, sanitização HTML real (`sanitizeRichTextHtml`) em `body`/`synopsis`/`body de news`, publicação automática via cron — **dois mecanismos coexistem**: setInterval interno (`jobs/publish-scheduled.ts`, 60s) cobre events/shows/news cross-tenant, e endpoint POST `/api/cron/publish-scheduled` com header `X-Cron-Secret` permite cron externo (Vercel/cron-job.org) chamar só news.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| SPEC-20260518-1625 | 2026-05-25 | `42197eb` | API Admin CRUD de Eventos e Apresentações Teatrais |
| SPEC-20260522-1100 | 2026-05-25 | _(commit pendente)_ | API Admin CRUD de Notícias com fluxo de publicação (introduz entity `News`, state machine `lib/news/state.ts`, endpoint cron externo `POST /api/cron/publish-scheduled` com `X-Cron-Secret`, e estende `jobs/publish-scheduled.ts` setInterval para cobrir `tb_news`) |
| SPEC-20260526-1900 | 2026-05-29 | `8e0df51` | API Admin Gerenciar Banners com reordenação e agendamento (introduz entity `Banner` para o carrossel da home: CRUD + `POST /reorder` transacional + `POST /:id/toggle`, versões desktop/mobile, janela `starts_at`/`ends_at`, `alt_text` obrigatório, bloqueio `javascript:` em `link_url`) |
| SPEC-20260602-1057 | 2026-06-02 | `3317420` | Popup overlay admin com regras de exibição (introduz entity `Popup`: CRUD + ativação mutuamente exclusiva em transação `POST /:id/activate`+`/deactivate`, endpoint público `GET /api/v1/popups/active`, agendamento `starts_at`/`ends_at`, `show_on_pages` home/all, e `<Popup>` client no portal com cookie 30d) |
| SPEC-20260602-1400 | 2026-06-02 | `57190fe` | API admin — hero principal da home (re-escopada Next/Drizzle → Express+TypeORM; introduz entity `Hero` singleton por tenant: `GET + PUT /api/admin/hero` com upsert, GET retorna `HERO_DEFAULTS` se não existe, validação manual, `overlay_opacity` numeric(4,2), cache `hero:{tenant}`) |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| SPEC-20260525-1000 | Endpoints públicos de listagem de eventos/shows | Leitura sem auth; filtros por data, paginação, cache |
| SPEC-20260601-1400 | Integração com Sympla (gerador de ingresso) | Automação de ticket_url, sincronização de is_sold_out |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| _(nenhuma)_ | | |

## Estado atual

Três tipos de conteúdo editorial cobertos: **eventos**, **theater shows** e **notícias** — todos com fluxo admin de CRUD + isolamento multitenant + cache Redis por tenant + sanitização HTML real + publicação automática.

Endpoints admin entregues:
- Eventos (SPEC-20260518-1625): POST/GET/PUT/DELETE `/api/admin/events`, POST `/api/admin/events/:id/publish`
- Theater shows (SPEC-20260518-1625): POST/GET/PUT/DELETE `/api/admin/theater-shows`, POST `/api/admin/theater-shows/:id/publish`
- Theater sessions (SPEC-20260518-1625): POST `/api/admin/theater-shows/:id/sessions`, PUT/DELETE `/api/admin/theater-sessions/:id`
- Notícias (SPEC-20260522-1100): GET/POST/PUT/DELETE `/api/admin/news`, POST `/api/admin/news/:id/publish`, POST `/api/admin/news/:id/archive`
- Banners (SPEC-20260526-1900): GET/POST `/api/admin/banners`, GET/PUT/DELETE `/api/admin/banners/:id`, POST `/api/admin/banners/reorder`, POST `/api/admin/banners/:id/toggle`. Carrossel da home com versões desktop/mobile, agendamento (`starts_at`/`ends_at`), ordenação por `sort_order` e ativação sem deletar. Sem state machine (diferente de news) — `is_active` é booleano simples.
- Popups (SPEC-20260602-1057): GET/POST `/api/admin/popups`, GET/PUT/DELETE `/api/admin/popups/:id`, POST `/api/admin/popups/:id/activate`, POST `/api/admin/popups/:id/deactivate`, e público `GET /api/v1/popups/active`. Overlay modal de campanha, **1 ativo por tenant** — `activate` desativa todos os outros e ativa este numa transação (`PopupRepository.runInTransaction`). Agendamento por janela `starts_at`/`ends_at` (ambos NOT NULL); `show_on_pages` (`home`|`all`); `show_after_seconds` (0-60); `image_url` OU `html_content` (pelo menos um). Frontend: client component `<Popup>` no `portal/src/app/layout.tsx` lê o endpoint público (hoje via mock `lib/popup/api.ts`), aplica `show_on_pages` por `pathname` e grava cookie `popup-seen-{id}` (30d) para `show_only_once`.
- Hero (SPEC-20260602-1400): `GET + PUT /api/admin/hero` (admin, `requireAuth`). Config **única por tenant** (entity `Hero`/`tb_hero`, unique `tenant_id`) — não tem `:id` na rota. `GET` retorna `HERO_DEFAULTS` (do DTO) se o tenant não configurou (200, nunca 404). `PUT` faz **upsert** (lookup+save no repo) e invalida cache `hero:{tenant}`. Campos: `title` (≤300), `subtitle` (≤500), `background_image_url` (URL), `cta_text` (≤50), `cta_link` (URL ou path interno), `overlay_color` (`#RRGGBB`), `overlay_opacity` (numeric(4,2), 0–1). `tenant_id` do payload é ignorado. Endpoint público e UI de backoffice ficaram fora do escopo.

Validação:
- Eventos: ISO 8601 com timezone, ends_at >= starts_at, starts_at até 5 anos futuro
- Theater shows: duration_minutes 10-600 int, age_rating enum (L,10,12,14,16,18)
- Sessions: starts_at > NOW() + 1h, conflito < 90min = 409, ticket_url URL válida
- Notícias: title ≤255, summary ≤500, body ≤50000 (após `sanitizeRichTextHtml`), slug único por tenant (409), `publish_at` rejeita data > 1h no passado, state machine `lib/news/state.ts:canTransition` aplica draft→{scheduled,published}, scheduled→published, qualquer→archived

Isolamento multitenant:
- `tenant_id` ignorado em payload (usa contexto da sessão)
- Cross-tenant = 404 (entidades atuais não têm coluna de categoria — critério 422 para categoria inválida não aplica nesta versão)
- Cache Redis separado por tenant (prefixos `events:`/`shows:`/`news:` + `tenant_id`)

Sanitização:
- `body` (eventos), `synopsis` (shows) e `body` (notícias) passam por `sanitizeRichTextHtml` (vide [[infra-base]]) antes de gravar — tags HTML permitidas restritas, atributos perigosos descartados. Defesa contra XSS no render do portal.

Cron de publicação (dois mecanismos coexistem como defesa em profundidade):
- **Interno (setInterval 60s)** em `jobs/publish-scheduled.ts` / `startPublishScheduledLoop`: faz `UPDATE ... RETURNING tenant_id` em `tb_event`, `tb_theater_show` e `tb_news` para `status='scheduled' AND published_at <= NOW()`, depois `invalidateByPattern` em `events:*` / `shows:*` / `news:*` por tenant afetado. Tem `unref()` (não bloqueia shutdown) e é desabilitado em `NODE_ENV=test`. Falhas em uma das 3 tabelas são logadas separadamente — uma falha não impede as outras.
- **Externo (endpoint HTTP)**: `POST /api/cron/publish-scheduled` com header `X-Cron-Secret` (validado contra `process.env.CRON_SECRET`). Cobre só news (chama `NewsService.publishScheduledNews()`). Útil quando cron interno está desligado por configuração ou em deploy serverless onde setInterval não persiste. 401 se header ausente/inválido; 500 se `CRON_SECRET` não configurado no env.

State machine (apenas notícias):
- Transições válidas via `canTransition(current, next)`: `draft → {scheduled, published}`, `scheduled → published`, `qualquer → archived`. Resto rejeitado com `NewsInvalidTransitionError` → 409.
- Delete via `canDelete(status)`: aceita só `draft` e `archived`. Senão 409 `cannot_delete_<status>`.

> Última atualização: 2026-06-02 13:55 (SPEC-20260602-1400)

## Decisões arquiteturais ativas

- **Sem Zod — validação manual em DTOs** (origem: SPEC-20260518-1625, 2026-05-18 16:26) — Zod não estava instalado; parser manual alinhado com padrão de store-list.dto.ts. Trade-off: menos declarativo vs evita nova dep.
- **Isolamento por `withTenant()` em TODA query** (origem: SPEC-20260518-1625, 2026-05-18 16:30) — Prevenir vazamento entre tenants. Trade-off: redundância aparente, mas defesa em profundidade.
- **Conflito de sessão < 90min bloqueia 409** (origem: SPEC-20260518-1625, 2026-05-18 16:31) — Horários muito próximos atrapalham operação de sala/ingresso. Trade-off: rigidez vs redução de erro operacional.
- **Cache Redis por tenant (pattern `shows:detail:tenant:id` e `shows:list:tenant:*`)** (origem: SPEC-20260518-1625, 2026-05-18 16:32) — Invalidação segura via SCAN. Trade-off: prefixo mais verboso vs legibilidade.
- **Status `draft | published | scheduled` simples (varchar, não enum DB)** (origem: SPEC-20260518-1625, 2026-05-18 16:26) — Validação no service. Trade-off: menos rigor DB vs velocidade de mudança.
- **Slug gerado automaticamente de title (lowercase, remove symbols)** (origem: SPEC-20260518-1625, 2026-05-18 16:31) — Evita conflito de entrada. Trade-off: slug pode não ser ideal; admin pode sobrescrever se necessário em CRUD futuro.
- **Cron via `setInterval` simples (zero-dep), 60s, `unref()`** (origem: SPEC-20260518-1625, 2026-05-25 08:50) — Sem `node-cron` ou agendador externo. Trade-off: granularidade fixa de 60s e sem coordenação multi-process (se rodar 2 réplicas, ambas tentam publicar — `UPDATE` é idempotente, mas há "thundering herd" no cache invalidation). Reavaliar quando deploy multi-réplica entrar.
- **Sanitização HTML real via `sanitize-html` em `body`/`synopsis`/`body de news`** (origem: SPEC-20260518-1625, estendida em SPEC-20260522-1100, 2026-05-25 15:00) — `sanitizeRichTextHtml` em [[infra-base]] (alias do `sanitizeStoreDescription` existente). Allowlist de tags (`p,br,strong,em,u,h2-h4,ul,ol,li,a,img,blockquote`) e atributos (`href,src,alt,target,rel,...`). Antes era só `trim()` — vulnerável a XSS no render do portal.
- **State machine explícita em `lib/news/state.ts` (`canTransition`, `canDelete`)** (origem: SPEC-20260522-1100, 2026-05-22 11:00) — Notícias têm fluxo `draft → {scheduled, published}`, `scheduled → published`, `qualquer → archived`. Service consulta o helper antes de aplicar mudança — rejeita transição inválida com 409. Outras entities (event/theater) não têm transições rigorosas (status é livre), então este helper é específico de news.
- **Cron coexiste em dois mecanismos: setInterval interno + endpoint POST com `X-Cron-Secret`** (origem: SPEC-20260522-1100, 2026-05-22 11:00) — Interno (`jobs/publish-scheduled.ts`) cobre eventos/shows/news cross-tenant a cada 60s. Externo (`POST /api/cron/publish-scheduled` com header `X-Cron-Secret`) só promove news, validando header contra `process.env.CRON_SECRET`. Trade-off: redundância proposital — em deploy serverless o setInterval não persiste; em deploy persistente o externo é redundante mas inofensivo (UPDATE é idempotente).
- **`publish_at` > 1h no passado é rejeitado com `NewsPublishDateInPastError`** (origem: SPEC-20260522-1100, 2026-05-22 11:00) — Evita agendar publicação retroativa por engano (ex.: timezone errado). Trade-off: admin que realmente quer publicar com data antiga > 1h precisa publicar agora e ajustar `published_at` via SQL — caso raro.
- **Delete só em status `draft` ou `archived` (via `canDelete`)** (origem: SPEC-20260522-1100, 2026-05-22 11:00) — Força fluxo: archive primeiro, depois delete. Evita exclusão acidental de notícia publicada. Espelha decisão de [[promotions-admin]] (mesma regra pra promoções).
- **Reorder de banners em transação atômica (`dataSource.transaction()`)** (origem: SPEC-20260526-1900, 2026-05-29 13:53) — `POST /api/admin/banners/reorder` recebe lista `{id, sort_order}` e atualiza todos os `sort_order` numa transação única. Evita race condition quando dois admins reordenam o carrossel simultaneamente (estado intermediário inconsistente). Trade-off: lock mais longo vs consistência da ordem.
- **`alt_text` obrigatório em banners (5-300 chars)** (origem: SPEC-20260526-1900, 2026-05-29 13:53) — Banner sem `alt_text` quebra acessibilidade (WCAG) e SEO da home. Validação 400 se ausente. Mesma filosofia de acessibilidade-por-default do resto do conteúdo editorial.
- **`is_active` booleano simples em banners (sem state machine)** (origem: SPEC-20260526-1900, 2026-05-29 13:53) — Diferente de news (que tem `draft→scheduled→published→archived` via `lib/news/state.ts`), banner liga/desliga via `POST /:id/toggle` num booleano. A "agenda" de exibição é resolvida por janela `starts_at`/`ends_at` na API pública (Fase 4.7), não por status. Trade-off: menos granularidade de fluxo, mas o caso de uso de banner (campanha on/off) não pede.
- **Popup: ativação mutuamente exclusiva em transação (1 ativo por tenant)** (origem: SPEC-20260602-1057, 2026-06-02 12:46) — `POST /api/admin/popups/:id/activate` roda `deactivateAllForCurrentTenant()` + `updateStatusForCurrentTenant(id, true)` dentro de `PopupRepository.runInTransaction` (`dataSource.transaction`). Garante invariante "no máximo 1 popup ativo por tenant" sem race entre o desativar-todos e o ativar-este. Diferente do `toggle` de banner (que permite N ativos). Trade-off: lock curto vs consistência do invariante.
- **Popup: `starts_at`/`ends_at` NOT NULL (agendamento sempre obrigatório)** (origem: SPEC-20260602-1057, 2026-06-02 12:46) — A validação já exige ambos; tornar as colunas NOT NULL simplifica o filtro do endpoint público (`starts_at <= now AND ends_at >= now`, sem o `IS NULL OR` do ticket original). Divergência consciente do texto do ticket. Trade-off: não dá pra criar popup "sem janela" (sempre visível) — caso de uso não pedido.
- **Popup: sem validação de `starts_at` no passado (agendamento retroativo permitido)** (origem: SPEC-20260602-1057, 2026-06-02 12:46) — Removida a `PopupStartDateInPastError` do rascunho. **Diverge de [[promotions-admin]]/news** (que rejeitam `publish_at` retroativo): popup é overlay de campanha que pode começar "agora/ontem"; só `ends_at > starts_at` é exigido. Trade-off: admin pode criar janela já encerrada sem aviso (vem como inativo no público, sem erro).
- **Popup: rota pública padronizada `GET /api/v1/popups/active`** (origem: SPEC-20260602-1057, 2026-06-02 12:46) — Alinhada com os demais públicos (`/api/v1/stores|events|promotions|store-categories`). O rascunho expunha `/api/popups/active` (sem `/v1`) — corrigido para consistência. Plural + sub-path `active` (retorna o único ativo ou `null`).
- **Hero: singleton por tenant via upsert (sem `:id` na rota)** (origem: SPEC-20260602-1400, 2026-06-02 13:55) — Hero é config única por tenant (`tb_hero` com unique `tenant_id`), diferente de banners (lista). `PUT /api/admin/hero` faz upsert (`HeroRepository.upsertForCurrentTenant` = lookup da linha do tenant + save). `GET` retorna `HERO_DEFAULTS` se não existe (200, nunca 404) — UI não trata dois estados. Trade-off: não há histórico/versões de hero; sempre 1 linha viva por tenant.
- **Hero: re-escopo Next.js+Drizzle → Express+TypeORM** (origem: SPEC-20260602-1400, 2026-06-02 13:55) — A SPEC nasceu (em 14:00) como rotas Next `/api/admin/hero/route.ts` + Drizzle no portal + stub de auth, mas nada foi implementado e o desenho era da arquitetura descartada. Re-escopada in place pro backend Express (igual banners/popup), com `requireAuth` real (não stub) e DTO manual (não Zod). As features-fantasma `admin-content-api`/`portal-home` (que descreviam o desenho Next/Drizzle) foram removidas.
- **Hero: `overlay_opacity` como `numeric(4,2)` com transformer** (origem: SPEC-20260602-1400, 2026-06-02 13:55) — Evita jitter de float (0.4 não é exato em float64). TypeORM devolve `numeric` como string; o `transformer` na entity converte pra `number` nas duas pontas, então o resto do código trata como número.

## Alternativas consideradas e rejeitadas

- **Integração com Sympla direto na SPEC de criação** — rejeitado em SPEC-20260518-1625 (2026-05-18 16:26). Motivo: Sympla é external, precisa de auth/keys. Deixar pra SPEC futura de integração. MVP entrega só estrutura local.
- **Criar event + sessions em um POST unitário** — rejeitado em SPEC-20260518-1625 (2026-05-18 16:30). Motivo: theater shows precisam ser criados vazios, sessions adicionadas depois. Separar em 2 calls alinha melhor com operação.
- **Usar triggers DB pra validar conflito de sessão** — rejeitado em SPEC-20260518-1625 (2026-05-18 16:31). Motivo: lógica complexa de 90min fica melhor no service, mais fácil testar/debugar.

## Gotchas

- **Age rating é 'L' (letra), não número** (2026-05-18 16:26, SPEC-20260518-1625) — valores: `['L', '10', '12', '14', '16', '18']` como strings. Type hints errados causam rejeição silenciosa.
- **Sessão com starts_at < NOW() + 1h falha validação** (2026-05-18 16:31, SPEC-20260518-1625) — Não deixa agendar apresentação pra dentro de 1 hora. Lição: validação rigorosa no create; update pode relaxar se necessário.
- **Conflito de sessão validado só na criação da sessão** (2026-05-18 16:31, SPEC-20260518-1625) — PUT na sessão não revalida conflito. Se descritivo, pode quebrar invariante. Próxima melhoria: validar também no update.
- **DELETE de show cascata nas sessões** (2026-05-18 16:32, SPEC-20260518-1625) — FK com ON DELETE CASCADE. Aviso ao admin: deletar show deleta todas as sessões; sem recuperação.
- **Slug duplicado entre tenants é permitido** (2026-05-18 16:26, SPEC-20260518-1625) — Índice único é `(tenant_id, slug)`. Dois tenants podem ter slug='hamlet'. Correto, isolamento garantido.
- **Published_at populado automático ao publicar** (2026-05-18 16:31, SPEC-20260518-1625) — Endpoint `/publish` seta `published_at = NOW()` e `status = 'published'`. Se chamar 2x, segunda chama preserva primeira data.
- **`X-Cron-Secret` ausente do env trava o endpoint cron com 500** (2026-05-22 11:00, SPEC-20260522-1100) — Se `process.env.CRON_SECRET` não está configurado, `POST /api/cron/publish-scheduled` retorna 500 antes de checar o header. Faz sentido (não tem como autenticar sem secret) mas pode ser confuso em dev — set `CRON_SECRET=dev-cron-secret` no `.env`.
- **News `body` com HTML mal-formado pode passar do limite após sanitização** (2026-05-25 15:00, SPEC-20260522-1100) — `sanitizeRichTextHtml` pode adicionar fechamento de tags ausentes, levemente inflando o tamanho. Cap de 50000 chars é aplicado **após** sanitização. Raro causar problema na prática.
- **Cron interno e externo podem rodar simultâneo** (2026-05-22 11:00, SPEC-20260522-1100) — Em deploy persistente, setInterval roda E cron externo (se configurado) também chama o endpoint. `UPDATE ... WHERE status='scheduled'` é idempotente, mas o segundo encontra menos rows. Logs vão mostrar duplo trabalho — aceitar como custo da defesa em profundidade.
- **Banner agendado não é filtrado por cron — só pela API pública** (2026-05-29 13:53, SPEC-20260526-1900) — Diferente de events/shows/news (que têm `status` promovido por `jobs/publish-scheduled.ts`), banner não tem job de publicação. A janela `starts_at`/`ends_at` é aplicada em tempo de leitura pela API pública `GET /api/v1/banners` (Fase 4.7, ainda não implementada). Logo, no admin um banner agendado aparece sempre na listagem; o filtro de visibilidade é responsabilidade do endpoint público. Esquecer esse filtro na Fase 4.7 = banner fora de janela vaza pro portal.
- **`link_url` aceita path interno além de http/https — mas bloqueia `javascript:`** (2026-05-29 13:53, SPEC-20260526-1900) — `containsJavaScriptProtocol()` rejeita `javascript:` (vetor XSS no clique do banner). URLs válidas: `http://`, `https://` ou paths internos `/...`. Diferente da sanitização HTML de body/synopsis (que usa `sanitizeRichTextHtml` de [[infra-base]]) — banner não tem corpo HTML, só a URL do link, então a defesa é checagem de protocolo, não allowlist de tags.
- **Popup: SQL cru do repository usa nome de coluna completo (`popup.popup_*`), não a property** (2026-06-02 12:46, SPEC-20260602-1057) — Em `.andWhere`/`.orderBy` o TypeORM passa a string literal pro SQL; com alias `popup`, `popup.popup_is_active` referencia a coluna real. O rascunho original usava `popup.isActive`/`popup.starts_at` (property names) — não bateria com as colunas `popup_*` e quebraria em runtime. Já `.create()/.update({where},{set})` usam **property names** (camelCase). Mesma convenção do `banner.repository.ts`. Errar isso = erro de coluna inexistente só em runtime (não no typecheck).
- **Popup: cache `popup:active:{tenant}` precisa cair em TODA mutação** (2026-06-02 12:46, SPEC-20260602-1057) — `getActivePopupForClient` cacheia o popup ativo por 300s. `invalidateCaches(tenantId, id?)` (chamado em create/update/delete/activate/deactivate) faz `del('popup:active:{tenant}')` + `invalidateByPattern('popup:list:{tenant}:*')` + del detail. O rascunho **não** invalidava a chave `active` no activate/deactivate → o público serviria popup obsoleto por até 5 min após uma troca de ativo. Coberto por teste.
- **Popup no portal lê mock, não o backend real ainda** (2026-06-02 12:46, SPEC-20260602-1057) — `<Popup>` no `layout.tsx` consome `portal/src/lib/popup/api.ts` (mock fixo), igual às páginas de conteúdo da SPEC-20260601-1909. O swap pro `GET /api/v1/popups/active` real ficou FORA do escopo. A lib mock já está no shape camelCase do backend pra swap trivial. Esquecer isso = achar que o popup do portal reflete o que está no admin (não reflete — é mock).
- **Popup: cookie de "já vi" é setado no fechar E no clique do link** (2026-06-02 12:46, SPEC-20260602-1057) — `popup-seen-{id}` (`max-age` 30d, `SameSite=Lax`) só é gravado se `show_only_once=true`. Setado tanto no X quanto ao clicar a imagem/link. `setIsVisible(true)` só roda dentro do `setTimeout` (deferido) pra não violar `react-hooks/set-state-in-effect` (mesmo cuidado do `Countdown` da SPEC-20260601-1909).
- **Hero: `overlay_opacity` vem do banco como string sem o transformer** (2026-06-02 13:55, SPEC-20260602-1400) — Colunas `numeric` do TypeORM retornam string por padrão. A entity `Hero` usa um `transformer` (`from: parseFloat`) pra entregar `number`. Se criar outra coluna numeric e esquecer o transformer, a resposta JSON sai com a opacidade como string (`"0.40"`) e quebra clientes que esperam número.
- **Hero: pasta da SPEC esteve em `archive/` indevidamente (arquivamento-fantasma)** (2026-06-02 13:55, SPEC-20260602-1400) — A SPEC-20260602-1400 chegou a ser movida pra `archive/` com `Status: active`, 0 critérios marcados e **zero código commitado** (o commit só tinha docs). Foi desarquivada e re-escopada. Lição: `archive/` exige o fluxo de conclusão completo (§5.3) — `audit-docs.sh` deveria pegar SPEC em archive com critérios desmarcados.

## Estado congelado (se houver)

_(nenhum)_
