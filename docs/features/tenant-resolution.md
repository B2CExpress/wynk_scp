# Feature: tenant-resolution

**Keywords:** multitenant, tenant_id, host, middleware, cache, redis, isolamento
**Arquivos principais:**
  - _(a definir na execução da SPEC-20260503-1505)_
**Resumo:** Resolve o tenant ativo a partir do `host` HTTP, garante isolamento de dados via `tenant_id` em todas as queries (helper `withTenant`), e cacheia config do tenant em Redis com invalidação ao salvar.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| _(nenhuma ainda)_ | | | |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| _(nenhuma ainda)_ | | |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| SPEC-20260503-1505 | Base da plataforma multitenant | feature/multitenant-platform |

## Estado atual

Stub criado em 2026-05-08 14:22 durante ativação da SPEC-20260503-1505. Estado real será preenchido conforme a SPEC executa as fases 2-3 (schema + `withTenant` + resolução por host + cache Redis) e 7 (arquivamento).

> Última atualização: 2026-05-08 14:22 (SPEC-20260503-1505)

## Decisões arquiteturais ativas

_(nenhuma ainda)_

## Alternativas consideradas e rejeitadas

_(nenhuma ainda)_

## Gotchas

_(nenhuma ainda)_

## Estado congelado (se houver)

_(nenhum)_
