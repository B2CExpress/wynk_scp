# SPEC-20260503-1507: Módulo Editorial

**Status:** draft
**Criada:** 2026-05-03 15:07
**Ativada:** —
**Concluída:** —
**Commit final:** —
**Keywords:** noticias, eventos, teatro, promocoes, servicos, editor, wysiwyg
**Features:** noticias, eventos, teatro, promocoes, servicos
**Branch:** feature/modulo-editorial (quando ativa)
**Depende de:** SPEC-20260503-1505 (base), SPEC-20260503-1506 (lojas — promoções podem vincular)
**Origem:** sugerida em `docs/specs/scp-spec.md` §11 Fase 3 — usuário em 2026-05-03 15:05
**Resumo:** Implementa o conteúdo editorial do shopping — notícias (WYSIWYG, categorias, agendamento), eventos (com arquivamento automático), sub-módulo Teatro, promoções (com/sem vínculo a loja) e cadastro de serviços.

## Objetivo

Dar ao tenant ferramentas editoriais para publicar e gerenciar conteúdo dinâmico do shopping com mínimo treinamento, e ao visitante uma forma agradável de consumi-lo.

## Escopo

**DENTRO:**
- **Notícias:** schema (tenant_id, título, slug, conteúdo HTML, categoria, autor, publicado_em, agendado_para, status), admin com WYSIWYG (TipTap ou similar), categorias, publicação programada (job que ativa quando `agendado_para <= now`)
- **Eventos:** schema (tenant_id, título, descrição, data_inicio, data_fim, local, imagem, destaque, status), arquivamento automático ao encerrar (job que move para `status=archived` quando `data_fim < now`)
- **Teatro:** sub-módulo de eventos (mesmo schema + flag `tipo=teatro` ou tabela separada — decidir na ativação) para sessões teatrais
- **Promoções:** schema (tenant_id, título, descrição, loja_id NULL, validade_inicio, validade_fim, imagem), CRUD admin, listagem pública com filtro por validade
- **Serviços:** cadastro simples (tenant_id, nome, descrição, ícone, ordem) — sem agendamento ou booking
- Frontend público: `/noticias`, `/noticias/[slug]`, `/eventos`, `/eventos/[slug]`, `/teatro`, `/promocoes`, `/servicos`
- Cache Redis 5 min em listagens (§9)

**FORA:**
- Booking/reserva de serviços
- Comentários ou interação social em notícias/eventos
- Push notifications de eventos
- Newsletter de promoções (Fase 4 — newsletter geral)

## Implementação

- WYSIWYG: TipTap (controle granular, extensível) ou Quill — decidir na ativação. Output sanitizado server-side antes de salvar
- Job de publicação programada e arquivamento de eventos: cron a cada 5 min (Vercel Cron / sidekiq / equivalente)
- Promoções com `loja_id NULL` aparecem em listagem geral; com `loja_id` aparecem também na página da loja
- Permissões: Editor pode tudo no editorial; Tenant Admin idem; Superadmin idem
- ISR (60s, §9) para `/noticias/[slug]`, `/eventos/[slug]` — invalida sob demanda quando publicado/atualizado

## Critério de aceite

- [ ] Editor consegue criar notícia, agendar publicação para data futura, e ela ativa sozinha
- [ ] Evento com `data_fim` passada arquiva automaticamente em até 5 min
- [ ] Promoção sem loja aparece em `/promocoes` mas não em página de loja específica
- [ ] Promoção com loja aparece nas duas
- [ ] WYSIWYG sanitiza HTML perigoso (testar paste de `<script>`)
- [ ] Sub-módulo Teatro herda comportamento de evento mas tem listagem própria em `/teatro`
- [ ] Páginas de detalhe ISR — primeira request lenta, demais rápidas
- [ ] Isolamento por tenant validado em todas as 5 entidades
- [ ] **Features tocadas (noticias, eventos, teatro, promocoes, servicos) atualizadas** com timestamp e referência a esta SPEC
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado

---

## Referência: implementação prévia em `feature/SQU-53-API-publica-editorial`

> Adicionado em 2026-05-11 17:50 durante a revisão pós-merge da SPEC-1505. PR/branch original do Leonardo (commit `83ff7d1`, "feat: implement public editorial API with caching and tenant isolation") foi fechado/descartado porque ficou inválido após a mudança de stack (Next.js+Drizzle → Express+TypeORM da SPEC-1505). **A branch permanece em `origin/feature/SQU-53-API-publica-editorial` e pode ser consultada via `git show` para detalhes.** Esta seção captura o que vale aproveitar como referência quando esta SPEC for ativada.

### O que a SQU-53 entregou

5 endpoints públicos (Next.js App Router, com stubs `// TODO: substituir pelo acesso real ao banco`):

- `GET /api/v1/events` (`app/api/v1/events/route.ts`)
- `GET /api/v1/news` (`app/api/v1/news/route.ts`)
- `GET /api/v1/promotions` (`app/api/v1/promotions/route.ts`)
- `GET /api/v1/services` (`app/api/v1/services/route.ts`)
- `GET /api/v1/theater-shows` (`app/api/v1/theater-shows/route.ts`)

Helpers compartilhados:
- `lib/public-editorial.ts` — `getTenantId`, `parsePagination`, `createListCacheKey`, `createJsonResponse` (com `Cache-Control` + `Vary` + `X-Cache`), `parseBooleanParam`, `normalizeOptionalString`
- `lib/cache.ts` — `cached<T>(key, ttl, fetchFn)` (in-memory `Map` global, **não Redis**)

### Shape capturado dos contratos (útil pra esta SPEC)

**Pagination padrão:** `page=1`, `limit=10`, `limit` máximo `20`.
**Cache TTL público:** `300s` (5 min) — alinhado com SPEC-1400.
**Cache key:** `${type}:list:${tenantId}:${sha256(JSON.stringify(filters))}` — hash dos filtros, não params ordenados.

**Promotions response:**
```ts
{ data: { id, title, discount_label, image_url, valid_until, store: { slug, name, logo_url } | null }[], total, page, limit }
```

**Events response:**
```ts
{ data: { id, title, starts_at, ends_at, location, ticket_info }[], total, page, limit }
```

(News, services, theater-shows seguem o mesmo padrão `{ data, total, page, limit }` — ver branch.)

### Decisões da SQU-53 a **reavaliar** (não copiar cegamente)

- **Tenant via `x-tenant-id` header** — obsoleto. SPEC-1505 padronizou `host` → `AsyncLocalStorage`. Substituir.
- **`Vary: x-tenant-id`** — não se aplica. Usar `Vary: x-forwarded-host` (ou equivalente do middleware tenant real).
- **Cache key por sha256 hash** — diverge do padrão da SPEC-1400 (`stores:list:{tenant}:cat=:feat=:l=:p=:q=:rest=`). Decidir um padrão único pra todo o backend público: hash compacto vs alfabético legível. Recomendado: alinhar com 1400 para consistência.
- **In-memory `Map` como cache** — só funciona em 1 instância. SPEC-1500 disponibiliza Redis (`ioredis`). Trocar.
- **Limit máximo 20** — SPEC-1400 usa 50. Decidir padrão único.
- **Pagination padrão 10** vs SPEC-1400 padrão 20. Decidir padrão único.

### Decisões da SQU-53 a **aproveitar**

- 5 endpoints e seus shapes de resposta são bons como ponto de partida (validar com produto).
- Helper `parseBooleanParam` (`"true"` e `"1"` ambos válidos) — corrige o gotcha da SPEC-1400 onde só `"true"` literal funciona.
- Helper `normalizeOptionalString` (trim + retorna `undefined` se vazio) — útil pra todos os filtros opcionais.
- Estrutura `{ data, total, page, limit }` consistente entre endpoints.

### O que a SQU-53 NÃO entregou

- Acesso real ao banco — todas as queries são `TODO`.
- Cache distribuído (Redis) — só Map em memória.
- Invalidação — nenhuma estratégia definida.
- Schema das tabelas (`news`, `events`, `promotions`, `services`, `theater_shows`).
- Endpoints admin (CRUD).
- Frontend público.

Esta SPEC ainda precisa entregar todos esses pontos do zero — a SQU-53 só serve como ponto de partida para o **shape dos endpoints públicos**.
