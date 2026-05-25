# Feature: editorial-content

**Keywords:** eventos, theater-shows, editorial, content-management, crud-admin, scheduler, publicacao-automatica
**Arquivos principais:**
  - backend/src/entities/Event.ts
  - backend/src/entities/TheaterShow.ts
  - backend/src/entities/TheaterSession.ts
  - backend/src/controllers/event.controller.ts
  - backend/src/controllers/theater.controller.ts
  - backend/src/services/event.service.ts
  - backend/src/services/theater.service.ts
  - backend/src/repositories/event.repository.ts
  - backend/src/repositories/theater-show.repository.ts
  - backend/src/repositories/theater-session.repository.ts
  - backend/src/dtos/event.dto.ts
  - backend/src/dtos/theater.dto.ts
  - backend/src/jobs/publish-scheduled.ts
  - backend/src/lib/sanitize.ts (`sanitizeRichTextHtml`)
**Resumo:** CRUD admin de conteúdo editorial com data — eventos (similares a notícias mas com starts_at/ends_at) e peças teatrais (com múltiplas sessões, cada uma com data/ingresso). Isolamento multitenant via `withTenant()`, validação de conflito de sessão < 90min, cache Redis, publicação automática via cron.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| SPEC-20260518-1625 | 2026-05-25 | `42197eb` | API Admin CRUD de Eventos e Apresentações Teatrais |

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

Entrega completa (SPEC-20260518-1625): endpoints admin de CRUD + validação + isolamento multitenant + cron de publicação + sanitização HTML.

Endpoints entregues:
- Eventos: POST/GET/PUT/DELETE `/api/admin/events` e `/api/admin/events/:id`; POST `/api/admin/events/:id/publish`
- Theater shows: POST/GET/PUT/DELETE `/api/admin/theater-shows` e `/api/admin/theater-shows/:id`; POST `/api/admin/theater-shows/:id/publish`
- Theater sessions: POST `/api/admin/theater-shows/:id/sessions`; PUT/DELETE `/api/admin/theater-sessions/:id`

Validação:
- Eventos: ISO 8601 com timezone, ends_at >= starts_at, starts_at até 5 anos futuro
- Theater shows: duration_minutes 10-600 int, age_rating enum (L,10,12,14,16,18)
- Sessions: starts_at > NOW() + 1h, conflito < 90min = 409, ticket_url URL válida

Isolamento multitenant:
- `tenant_id` ignorado em payload (usa contexto da sessão)
- Cross-tenant = 404 (entidades atuais não têm coluna de categoria — critério 422 para categoria inválida não aplica nesta versão)
- Cache Redis separado por tenant (prefixos `events:`/`shows:` + `tenant_id`)

Sanitização:
- `body` (eventos) e `synopsis` (shows) passam por `sanitizeRichTextHtml` (vide [[infra-base]]) antes de gravar — tags HTML permitidas restritas, atributos perigosos descartados. Defesa contra XSS no render do portal.

Cron de publicação:
- `jobs/publish-scheduled.ts` (`startPublishScheduledLoop`) roda `setInterval` cross-tenant a cada 60s (configurável). `UPDATE ... RETURNING tenant_id` em `tb_event` e `tb_theater_show` para registros `status='scheduled' AND published_at <= NOW()`, depois `invalidateByPattern` em `events:*` / `shows:*` por tenant afetado. Loop tem `unref()` (não bloqueia shutdown) e desabilitado em `NODE_ENV=test`. Falhas no UPDATE/SCAN são logadas mas não derrubam o processo.

> Última atualização: 2026-05-25 08:50 (SPEC-20260518-1625)

## Decisões arquiteturais ativas

- **Sem Zod — validação manual em DTOs** (origem: SPEC-20260518-1625, 2026-05-18 16:26) — Zod não estava instalado; parser manual alinhado com padrão de store-list.dto.ts. Trade-off: menos declarativo vs evita nova dep.
- **Isolamento por `withTenant()` em TODA query** (origem: SPEC-20260518-1625, 2026-05-18 16:30) — Prevenir vazamento entre tenants. Trade-off: redundância aparente, mas defesa em profundidade.
- **Conflito de sessão < 90min bloqueia 409** (origem: SPEC-20260518-1625, 2026-05-18 16:31) — Horários muito próximos atrapalham operação de sala/ingresso. Trade-off: rigidez vs redução de erro operacional.
- **Cache Redis por tenant (pattern `shows:detail:tenant:id` e `shows:list:tenant:*`)** (origem: SPEC-20260518-1625, 2026-05-18 16:32) — Invalidação segura via SCAN. Trade-off: prefixo mais verboso vs legibilidade.
- **Status `draft | published | scheduled` simples (varchar, não enum DB)** (origem: SPEC-20260518-1625, 2026-05-18 16:26) — Validação no service. Trade-off: menos rigor DB vs velocidade de mudança.
- **Slug gerado automaticamente de title (lowercase, remove symbols)** (origem: SPEC-20260518-1625, 2026-05-18 16:31) — Evita conflito de entrada. Trade-off: slug pode não ser ideal; admin pode sobrescrever se necessário em CRUD futuro.
- **Cron via `setInterval` simples (zero-dep), 60s, `unref()`** (origem: SPEC-20260518-1625, 2026-05-25 08:50) — Sem `node-cron` ou agendador externo. Trade-off: granularidade fixa de 60s e sem coordenação multi-process (se rodar 2 réplicas, ambas tentam publicar — `UPDATE` é idempotente, mas há "thundering herd" no cache invalidation). Reavaliar quando deploy multi-réplica entrar.
- **Sanitização HTML real via `sanitize-html` em `body`/`synopsis`** (origem: SPEC-20260518-1625, 2026-05-25 08:50) — `sanitizeRichTextHtml` em [[infra-base]] (alias do `sanitizeStoreDescription` existente). Allowlist de tags (`p,br,strong,em,u,h2-h4,ul,ol,li,a,img,blockquote`) e atributos (`href,src,alt,target,rel,...`). Antes era só `trim()` — vulnerável a XSS no render do portal.

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

## Estado congelado (se houver)

_(nenhum)_
