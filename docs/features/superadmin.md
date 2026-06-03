# Feature: superadmin

**Keywords:** superadmin, tenants, crud, provisionamento, governanca-plataforma
**Arquivos principais:**
  - backend/src/controllers/superadminTenantController.ts
  - backend/src/routes/superadmin.routes.ts
  - backend/src/middleware/require-superadmin.ts
  - backend/src/services/superadmin-tenant.service.ts
  - backoffice/src/pages/tenants/TenantsPage.tsx
**Resumo:** Capacidades exclusivas do papel `superadmin` (global, fora de qualquer tenant) para operar a plataforma — começando pelo CRUD de tenants (provisionar shopping novo + admin inicial, listar com métricas, ativar/desativar, soft-delete).

## Specs desta feature

### Concluídas
| ID | Data | Commit | Título |
|---|---|---|---|
| _(nenhuma)_ | | | |

### Planejadas (future/)
| ID | Título | Motivo |
|---|---|---|
| _(nenhuma)_ | | |

### Em execução (só em branches — não aparece em main)
| ID | Título | Branch |
|---|---|---|
| SPEC-20260603-1149 | Superadmin — CRUD de tenants | feature/SQU-72-SuperadminCRUD-de-tenants |

## Estado atual

_(stub — feature introduzida por SPEC-20260603-1149, ainda em execução. Estado arquitetural será preenchido ao arquivar a SPEC, conforme R.7.)_

Existe hoje apenas um esboço mock do controller (`superadminTenantController.ts` com `mockTenantsDb` em memória) — não é implementação real e será substituído pela SPEC-20260603-1149.

> Última atualização: 2026-06-03 12:16 (SPEC-20260603-1149)

## Decisões arquiteturais ativas

- **Superadmin é papel em `tb_user` com `tenant_id` nullable** (origem: SPEC-20260603-1149, 2026-06-03 11:49) — reaproveita a stack de auth/refresh-token existente em vez de uma tabela `tb_superadmin` separada. Trade-off: índice único `(tenant_id, email)` precisa de atenção com tenant_id nulo.
- **Branding nunca passa pelo banco** (origem: SPEC-20260503-1505, herdada) — provisionamento de tenant referencia `flavor_slug` (Modelo A, build-time), não cores. Confirmada em SPEC-20260603-1149 (2026-06-03 11:49).

## Alternativas consideradas e rejeitadas

- **Tabela `tb_superadmin` dedicada** — rejeitada em SPEC-20260603-1149 (2026-06-03 11:49). Isola melhor a identidade global, mas duplicaria auth/refresh-token; custo alto para a 1ª entrega.
- **Cores (`primary_color`/`secondary_color`) no payload de criação de tenant** — rejeitada em SPEC-20260603-1149 (2026-06-03 11:49). Conflita com o Modelo A (white-label build-time); branding vive em `portal/flavors/<slug>/`.

## Gotchas

- **`tenant_id` nullable fura o unique `(tenant_id, email)`** (2026-06-03 12:16, SPEC-20260603-1149) — em Postgres, NULL não colide em índice único, então 2 superadmins com mesmo email passariam. Avaliar índice parcial `WHERE user_role = 'superadmin'`.

## Estado congelado (se houver)

_(nenhum)_
