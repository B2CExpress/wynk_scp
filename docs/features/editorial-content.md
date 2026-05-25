# Feature: editorial-content

**Keywords:** eventos, theater-shows, news, noticias, editorial, content-management, crud-admin, scheduler, publicacao-automatica, state-machine, cron-secret
**Arquivos principais:**
  - backend/src/entities/Event.ts
  - backend/src/entities/TheaterShow.ts
  - backend/src/entities/TheaterSession.ts
  - backend/src/entities/News.ts
  - backend/src/controllers/event.controller.ts
  - backend/src/controllers/theater.controller.ts
  - backend/src/controllers/news.controller.ts
  - backend/src/controllers/cron.controller.ts
  - backend/src/services/event.service.ts
  - backend/src/services/theater.service.ts
  - backend/src/services/news.service.ts
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

> Última atualização: 2026-05-25 15:30 (SPEC-20260522-1100)

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

## Estado congelado (se houver)

_(nenhum)_
