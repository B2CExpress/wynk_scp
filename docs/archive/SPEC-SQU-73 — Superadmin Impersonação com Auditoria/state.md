# SQU-73 — State

> Rastreamento de progresso. Atualizar à medida que etapas são concluídas.

**Última atualização**: 2026-06-05  
**Status geral**: 🟡 Implementado — testes manuais pendentes

---

## Progresso por Camada

### Backend — Database
- [x] Migration `1747190400000-CreateAuditLogTable` criada
- [x] Tabela `tb_audit_log` com todos os campos do schema
- [x] 4 índices criados
- [x] FKs com RESTRICT (histórico preservado)

### Backend — Entities & Repositories
- [x] Entity `AuditLog` (TypeORM)
- [x] `AuditLogRepository` com métodos `log()`, `list()`, `findById()`
- [x] Filtros por `event_type`, `actorId`, `tenantId`
- [x] Paginação built-in

### Backend — Services
- [x] `ImpersonationService.start()` — seta cookie + cria audit log
- [x] `ImpersonationService.stop()` — limpa cookie + cria audit log
- [x] `ImpersonationService.isImpersonating()` — checa cookie
- [x] `ImpersonationService.getImpersonatedTenantId()` — lê cookie

### Backend — Controllers & Routes
- [x] `ImpersonationController` com `start()`, `stop()`, `getAuditLog()`
- [x] Validações de auth (401) e role (403) em todos os endpoints
- [x] Rota `POST /api/superadmin/impersonate`
- [x] Rota `POST /api/superadmin/impersonate/stop`
- [x] Rota `GET /api/admin/audit` com paginação e filtros

### Backend — Middleware
- [x] `resolve-tenant-by-host.ts` atualizado
- [x] Cookie de impersonação priorizado somente para `superadmin`
- [x] Fallback para resolução por host (comportamento padrão)
- [x] Checa `status = 'active'` no tenant impersonado

### Backend — Wiring
- [x] `app.ts` — rotas de impersonação montadas em `/api`
- [x] `server.ts` — instâncias de `ImpersonationService` e `ImpersonationController`

### Backoffice — UI
- [x] `ImpersonationBanner.tsx` — banner vermelho fixo, sem botão X
- [x] `AuditPage.tsx` — tabela com filtros e paginação (50/página)
- [x] `TenantsPage.tsx` — botão "Acessar como" + handler `handleImpersonate()`

---

## Testes Manuais

> Marcar após execução. Executar em ambiente de desenvolvimento com dois tenants ativos.

### Fluxo principal
- [ ] Login como superadmin → `/admin/tenants` → clicar "Acessar como" → redireciona para `/admin` do tenant
- [ ] Banner vermelho aparece no topo com nome do tenant
- [ ] Navegar por páginas do admin — conteúdo é do tenant impersonado, não cross-tenant
- [ ] Clicar "Encerrar impersonação" → volta para `/admin/tenants` → banner some

### Audit log
- [ ] Acessar `/admin/audit` após fluxo acima
- [ ] Duas entradas: `impersonate_start` e `impersonate_stop`
- [ ] Timestamps, IDs, IP corretos nas duas entradas
- [ ] Filtros funcionando (por tipo de evento, por tenant)

### Controle de acesso
- [ ] Tenant Admin tenta `POST /api/superadmin/impersonate` → 403
- [ ] Tenant Admin tenta `GET /api/admin/audit` → 403
- [ ] Usuário não autenticado → 401 em todos os endpoints

### Casos de borda
- [ ] Cookie expira em 4 h (testar com `maxAge: 10` em dev, avançar relógio)
- [ ] Tentar impersonar tenant com `status = 'inactive'` → 404
- [ ] Soft-delete tenant enquanto impersonando → próximo request resolve 404 ou fallback para host

---

## Bloqueadores / Observações

> Registrar impedimentos, decisões pendentes ou pontos de atenção.

_(nenhum bloqueador no momento)_

---

## Próximos Passos

1. Executar migration: `npm run typeorm migration:run`
2. Executar testes manuais acima e marcar os checkboxes
3. Abrir PR e solicitar revisão de código
4. Em produção: revogar `UPDATE`/`DELETE` em `tb_audit_log` para o usuário de app
5. Monitorar primeiros usos reais via `/admin/audit`