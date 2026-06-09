# State — SPEC-20260608-1000

> Main: [main.md](./main.md)
> Memory: [memory.md](./memory.md)
> Criado: 2026-06-08 10:00

---

## TL;DR (sobrescrever ao fim de cada sessão)

**Última atualização:** 2026-06-08 10:00
**Onde tô:** Fase 1 concluída (documentação SPEC + feature). Código gerado, aguardando dev colar arquivos na branch e rodar migration.
**Próximo passo:** Dev cria branch `feature/shopping-info`, cola arquivos nos caminhos indicados, roda `npm run migration:run -w backend`, testa GET e PUT manualmente.
**Última decisão:** UPSERT via SELECT + UPDATE/INSERT (TypeORM 0.3 sem suporte nativo limpo a INSERT ON CONFLICT).
**Bloqueio atual:** nenhum
**Se retomar, ler:** log de ativação abaixo + seção "Fatos confirmados".

---

## Status snapshot (sobrescrever)

### Fases / etapas

| # | Descrição | Status | Atualizado | Commit |
|---|-----------|--------|-----------|--------|
| 1 | Documentação SPEC + feature doc | concluído | 2026-06-08 10:00 | — |
| 2 | Migration + Entity | concluído | 2026-06-08 10:00 | — |
| 3 | Repository + Service + Validator | concluído | 2026-06-08 10:00 | — |
| 4 | Controller + Routes | concluído | 2026-06-08 10:00 | — |
| 5 | Testes manuais + critérios de aceite | pendente | 2026-06-08 10:00 | — |
| 6 | Atualizar feature doc + arquivar SPEC | pendente | 2026-06-08 10:00 | — |

### Próximos passos

- [ ] Dev cola arquivos na branch `feature/shopping-info`
- [ ] Dev roda `npm run migration:run -w backend`
- [ ] Dev testa GET (deve retornar `{}` se nunca preenchido)
- [ ] Dev testa PUT com payload completo
- [ ] Dev testa PUT com payload inválido (400 esperado)
- [ ] Dev testa acesso com role `editor` (403 esperado)
- [ ] Marcar critérios de aceite em main.md com timestamp + commit
- [ ] Atualizar `docs/features/shopping-info.md` (mover SPEC de "Em execução" → "Concluídas")
- [ ] Arquivar SPEC: mover `active/SPEC-20260608-1000-shopping-info/` → `archive/`

### Bloqueios ativos

nenhum

---

## Fatos confirmados

- [2026-06-08 10:00] Projeto usa TypeORM 0.3 + Express 4 + TypeScript no backend. Fonte: CLAUDE.md stack section.
- [2026-06-08 10:00] Naming convention do banco: `tb_<entity>` + colunas com prefixo `<entity>_<col>`. Aqui a tabela é `shopping_info` (dados de negócio, não entidade core de tenant). Fonte: CLAUDE.md.
- [2026-06-08 10:00] Tenant context via middleware Express + AsyncLocalStorage já existe. Controller pode consumir via helper `withTenant`. Fonte: CLAUDE.md.
- [2026-06-08 10:00] Redis disponível via `ioredis`. Chave de cache de tenant resolve já usa padrão `tenant:resolve:{host}`. Fonte: CLAUDE.md.
- [2026-06-08 10:00] Schema dedicado `scp` no PostgreSQL. Fonte: CLAUDE.md.

## Inferências prováveis

- [2026-06-08 10:00] Deve existir helper `getTenantContext()` ou similar para pegar `tenant_id` do AsyncLocalStorage no controller. Validar com: buscar em `backend/src/middleware/` ou `backend/src/utils/`.
- [2026-06-08 10:00] Arquivo de registro de rotas provavelmente é `backend/src/routes/index.ts`. Validar com: listar `backend/src/routes/`.

## Dúvidas em aberto

- [2026-06-08 10:00] Nome exato do arquivo de registro central de rotas no backend. Próxima ação: dev verifica e ajusta import em `shoppingInfo.routes.ts` conforme necessário.
- [2026-06-08 10:00] Redis client já exportado de algum `lib/redis.ts` ou similar? Próxima ação: dev verifica caminho e ajusta import no service.

---

## Log cronológico (APPEND-ONLY — NUNCA editar entradas antigas)

## 2026-06-08 10:00 — [ativação]

SPEC criada e ativada direto em `active/` (escopo claro, execução imediata). Documentação SPEC-driven completa gerada: main.md, state.md, memory.md, feature doc `shopping-info.md`. Todos os arquivos de código gerados e prontos para colar na branch. Arquivos identificados: migration, entity, repository, service, controller, dto, routes, validator. Nenhum bloqueio identificado.