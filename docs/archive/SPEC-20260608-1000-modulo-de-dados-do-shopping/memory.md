# Memory — SPEC-20260608-1000

> Main: [main.md](./main.md)
> State: [state.md](./state.md)

---

## TL;DR vivo (sobrescrever a cada sessão)

SPEC criada em 2026-06-08 10:00. Toda a documentação e código gerados em sessão única. Aguardando dev colar arquivos na branch `feature/shopping-info` e rodar migration para iniciar fase de testes.

---

## O que esta SPEC entrega

Módulo completo de dados institucionais do shopping: tabela `shopping_info` no banco, endpoints `GET /api/admin/settings/info` e `PUT /api/admin/settings/info` no backend Express, validação robusta de payload, UPSERT seguro (UNIQUE constraint + lógica SELECT→UPDATE/INSERT), invalidação de cache Redis após PUT, controle de acesso por role (editor→403, tenant_admin→OK, superadmin→OK).

---

## Contexto do projeto relevante

- **Stack backend:** Express 4 + TypeORM 0.3 + TypeScript + PostgreSQL (schema `scp`) + Redis (ioredis)
- **Naming banco:** `tb_<entity>` para entidades core de tenant; `shopping_info` para dados de negócio (sem prefixo `tb_` por ser dado de negócio do módulo, alinhado com o documento da atividade)
- **Tenant context:** middleware Express + AsyncLocalStorage; helper `withTenant` disponível
- **Cache pattern existente:** `tenant:resolve:{host}` com TTL 10 min; este módulo usa `tenant:info:{tenant_id}` com TTL 5 min
- **Monorepo:** npm workspaces; backend em `backend/`, portal em `portal/`

---

## Decisões tomadas nesta SPEC

| Decisão | Alternativa rejeitada | Motivo |
|---|---|---|
| JSONB para `opening_hours` e `parking_rates` | Tabelas relacionais separadas | Estrutura variável por área/tipo; evita migrations futuras para novos tipos de horário |
| UPSERT via SELECT + UPDATE/INSERT | INSERT ON CONFLICT | TypeORM 0.3 não tem suporte nativo limpo; legibilidade e tipagem |
| Cache key `tenant:info:{tenant_id}` TTL 5 min | Sem cache | Dados consumidos por header/footer em toda page load |
| Validação de shape de opening_hours na camada de serviço | CHECK constraint no banco | Flexibilidade para novas áreas sem migration |

---

## Respostas-chave do usuário

- [2026-06-08 10:00] Usuário solicitou implementação do módulo §5.4 conforme documento de atividade — inclui schema do banco, endpoints, validação, estrutura de UI e critérios de aceite detalhados.

---

## Tentativas que falharam

_(nenhuma ainda)_

---

## Gotchas críticos (copy do feature doc para acesso rápido)

1. **UNIQUE(tenant_id) obrigatório** — sem ela cada PUT insere linha nova
2. **Validar shape JSONB** — banco aceita tudo; validação é responsabilidade da app
3. **URLs: exigir https://** — normalizar ou rejeitar sem schema
4. **Coordenadas: validar range** — lat [-90,90], lng [-180,180]
5. **HH:MM obrigatório** — não aceitar "10h" ou "10:00-22:00" como string única

---

## Arquivos gerados nesta SPEC

| Arquivo | Pasta no repo |
|---|---|
| `docs/features/shopping-info.md` | `docs/features/` |
| `docs/active/SPEC-20260608-1000-shopping-info/main.md` | `docs/active/SPEC-20260608-1000-shopping-info/` |
| `docs/active/SPEC-20260608-1000-shopping-info/state.md` | `docs/active/SPEC-20260608-1000-shopping-info/` |
| `docs/active/SPEC-20260608-1000-shopping-info/memory.md` | `docs/active/SPEC-20260608-1000-shopping-info/` |
| `1749380400000-CreateShoppingInfo.ts` | `backend/src/migrations/` |
| `ShoppingInfo.ts` | `backend/src/entities/` |
| `ShoppingInfoRepository.ts` | `backend/src/repositories/` |
| `ShoppingInfoDto.ts` | `backend/src/dtos/` |
| `shopping_info.ts` (validator) | `portal/src/lib/validators/` |
| `ShoppingInfoService.ts` | `backend/src/services/` |
| `ShoppingInfoController.ts` | `backend/src/controllers/` |
| `shoppingInfo.routes.ts` | `backend/src/routes/` |