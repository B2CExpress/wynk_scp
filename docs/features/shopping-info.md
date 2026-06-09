# Feature: shopping-info

**Keywords:** shopping_info, dados-institucionais, endereco, horarios, redes-sociais, estacionamento, tenant-admin
**Arquivos principais:**
  - backend/src/entities/ShoppingInfo.ts
  - backend/src/repositories/ShoppingInfoRepository.ts
  - backend/src/services/ShoppingInfoService.ts
  - backend/src/controllers/ShoppingInfoController.ts
  - backend/src/dtos/ShoppingInfoDto.ts
  - backend/src/routes/shoppingInfo.routes.ts
  - backend/src/migrations/1749380400000-CreateShoppingInfo.ts
  - portal/src/lib/validators/shopping_info.ts
**Resumo:** Módulo de dados institucionais do shopping (endereço, telefone, horários, redes sociais, tarifas de estacionamento) — 1 registro por tenant, exposto via GET/PUT `/api/admin/settings/info`, consumido por header, footer e menu lateral do portal.

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| SPEC-20260608-1000 | Módulo de Dados do Shopping (endereço, horários, redes) | feature/shopping-info |

## Estado atual

> Última atualização: 2026-06-08 10:00 (SPEC-20260608-1000)

Feature em execução. Ainda sem código mergeado em main.

Tabela `shopping_info` no schema `scp`, com UNIQUE em `tenant_id` (1 registro por tenant). Dados em colunas diretas para campos simples e JSONB para `opening_hours` e `parking_rates`. Endpoints REST `GET /api/admin/settings/info` e `PUT /api/admin/settings/info` protegidos por JWT; roles `tenant_admin` e `superadmin` têm acesso completo, `editor` recebe 403. Cache em Redis com chave `tenant:info:{tenant_id}` TTL 5 min, invalidado no PUT.

## Decisões arquiteturais ativas

- **JSONB para opening_hours e parking_rates** (origem: SPEC-20260608-1000, 2026-06-08 10:00) — Estrutura de horários varia por área (lojas, praça, teatro) e por tipo de dia; array de tarifas é variável. JSONB permite flexibilidade sem migrations futuras. Trade-off: validação de shape feita na camada de serviço/validator, não pelo banco.
- **UPSERT via SELECT → UPDATE/INSERT** (origem: SPEC-20260608-1000, 2026-06-08 10:00) — Constraint UNIQUE(tenant_id) garante no máximo 1 registro por tenant. Aplicação faz SELECT primeiro e decide UPDATE ou INSERT. Trade-off: 2 queries no caminho feliz; alternativa seria INSERT ON CONFLICT mas TypeORM 0.3 não tem suporte nativo limpo para UPSERT genérico.
- **Cache invalidation no PUT** (origem: SPEC-20260608-1000, 2026-06-08 10:00) — `redis.del('tenant:info:${tenant_id}')` chamado após UPDATE/INSERT bem-sucedido. Header, footer e menu lateral leem do cache com TTL 5 min.

## Alternativas consideradas e rejeitadas

- **Coluna JSONB única para todo o registro** — rejeitado em SPEC-20260608-1000 (2026-06-08 10:00). Misturaria campos simples (phone, email) com complexos (horários); buscas e validações individuais por campo seriam mais custosas.
- **INSERT ON CONFLICT DO UPDATE (UPSERT nativo SQL)** — rejeitado em SPEC-20260608-1000 (2026-06-08 10:00). TypeORM 0.3 requer query builder raw para isso, perdendo tipagem. SELECT + UPDATE/INSERT é mais legível e igualmente seguro dado o UNIQUE constraint.

## Gotchas

- **Múltiplos registros por tenant sem UNIQUE** (2026-06-08 10:00, SPEC-20260608-1000) — Sem `UNIQUE(tenant_id)` cada PUT insere nova linha. A constraint é obrigatória na migration. Não confiar só na lógica da aplicação.
- **JSONB sem validação de shape** (2026-06-08 10:00, SPEC-20260608-1000) — Banco aceita qualquer JSON em `opening_hours`. Validar shape completo (areas → dias → {open, close} em HH:MM) no validator antes de salvar.
- **URLs sem schema https://** (2026-06-08 10:00, SPEC-20260608-1000) — Usuário pode colar `instagram.com/x`. Validador deve exigir prefixo `https://` ou normalizar antes de salvar.
- **Coordenadas lat/lng trocadas** (2026-06-08 10:00, SPEC-20260608-1000) — Validar range: lat ∈ [-90,90], lng ∈ [-180,180].

## Estado congelado (se houver)

_(nenhum)_