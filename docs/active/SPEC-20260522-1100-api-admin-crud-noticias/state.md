# State — SPEC-20260522-1100

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-05-22 11:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-05-23 21:15
**Onde tô:** Implementação completa — todos os endpoints, rotas, services, repositories e cron job finalizados
**Próximo passo:** Testes de integração e documentação das features relacionadas
**Última decisão:** Usar padrão de Event como template (confirmado bem-sucedido)
**Bloqueio atual:** nenhum
**Se retomar, ler:** Memory.md completo + SPEC-20260518-1625 para referência de padrão

---

## Status snapshot

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Setup: entidade News, schema Zod, state machine | completo | 2026-05-23 21:15 | 76c5b19 |
| 2 | Endpoints CRUD: GET/POST/PUT/DELETE | completo | 2026-05-23 21:15 | 76c5b19 |
| 3 | Endpoints especiais: /publish, /archive | completo | 2026-05-23 21:15 | 76c5b19 |
| 4 | Cron endpoint + validação header secret | completo | 2026-05-23 21:15 | 76c5b19 |
| 5 | Cache Redis + invalidação | completo | 2026-05-23 21:15 | 76c5b19 |
| 6 | Testes manuais + ajustes | pendente | 2026-05-23 21:15 | — |

### Próximos passos

- [ ] Executar testes de integração (listagem, criação, publicação, agendamento, cron)
- [ ] Validar isolamento multitenant
- [ ] Testar cron endpoint com X-Cron-Secret
- [ ] Arquivar SPEC e atualizar features relacionadas (editorial-content, tenant-resolution, auth, infra-base)

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
