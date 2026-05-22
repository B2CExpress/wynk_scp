# State — SPEC-20260522-1100

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-22 11:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-22 11:00
**Onde tô:** Ativação — lendo docs e padrões da SPEC anterior (eventos)
**Próximo passo:** Implementar entidade News + schemas Zod
**Última decisão:** Reutilizar padrão de events/theater-shows para news (mesma structure de isolamento, cache, validação)
**Bloqueio atual:** nenhum
**Se retomar, ler:** Entradas de 2026-05-22 11:00 em diante; SPEC-20260518-1625 como referência de padrão

---

## Status snapshot

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Setup: entidade News, schema Zod, state machine | pendente | 2026-05-22 11:00 | — |
| 2 | Endpoints CRUD: GET/POST/PUT/DELETE | pendente | 2026-05-22 11:00 | — |
| 3 | Endpoints especiais: /publish, /archive | pendente | 2026-05-22 11:00 | — |
| 4 | Cron endpoint + validação header secret | pendente | 2026-05-22 11:00 | — |
| 5 | Cache Redis + invalidação | pendente | 2026-05-22 11:00 | — |
| 6 | Testes manuais + ajustes | pendente | 2026-05-22 11:00 | — |

### Próximos passos

- [ ] Ler SPEC-20260518-1625 e feature editorial-content completo
- [ ] Examinar implementação de Event + EventService como referência
- [ ] Criar migration para News
- [ ] Implementar News entity
- [ ] Implementar schemas Zod
- [ ] Implementar state machine
- [ ] Implementar repositories + services
- [ ] Implementar controllers + rotas

### Bloqueios ativos

_(nenhum)_

---

## Fatos confirmados

- [2026-05-22 11:00] Projeto usa SPEC-driven v2 com docs em `docs/active/` e `docs/features/`.
- [2026-05-22 11:00] SPEC anterior (SPEC-20260518-1625) implementou events + theater-shows com mesmo padrão de isolamento, cache, validação.
- [2026-05-22 11:00] Feature `editorial-content` agrupa events, theater-shows, e vai agrupar news.
- [2026-05-22 11:00] Backend usa Express + TypeORM + `withTenant()` helper para isolamento.
- [2026-05-22 11:00] Branch atual: `feature/SQU-50-api-admin-crud-de-noticias`.

## Inferências prováveis

- [2026-05-22 11:00] News terá estrutura muito similar a Event (ambas datadas, ambas publicáveis agora/depois), pode reutilizar validações e helpers. Validar com: examinar Event entity.
- [2026-05-22 11:00] Cron job provavelmente será extension do existente em `jobs/publish-scheduled.ts`. Validar com: procurar arquivo.

## Dúvidas em aberto

_(nenhuma)_

---

## Log cronológico (APPEND-ONLY)

## 2026-05-22 11:00 — [ativação]

SPEC criada. Plano:
1. Ler SPEC-20260518-1625 (eventos) e feature editorial-content como referência
2. Examinar implementação existente de Event, EventService, EventRepository
3. Implementar News seguindo mesmo padrão
4. Endpoints: GET (lista paginada), POST (cria draft), PUT (atualiza), DELETE (draft/archived), POST /publish (imediato/agendado), POST /archive
5. Cron: POST /api/cron/publish-scheduled com X-Cron-Secret
6. Cache: Redis invalidação em todas escritas
7. Validação: slug único/tenant, publish_at não > 1h passado, body max 50k sanitizado

Arquivos principais a ler:
- backend/src/entities/Event.ts
- backend/src/services/event.service.ts
- backend/src/repositories/event.repository.ts
- backend/src/dtos/event.dto.ts
- lib/validators/ (se existir)
- jobs/publish-scheduled.ts
