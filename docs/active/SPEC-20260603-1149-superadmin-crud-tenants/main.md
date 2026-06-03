# SPEC-20260603-1149: Superadmin — CRUD de tenants

**Status:** active
**Criada:** 2026-06-03 11:49
**Ativada:** 2026-06-03 12:16
**Concluída:** —
**Commit final:** —
**Keywords:** superadmin, tenants, crud, provisionamento, admin-inicial, soft-delete
**Features:** superadmin, auth, tenant-resolution
**Branch:** feature/SQU-72-SuperadminCRUD-de-tenants (quando ativa)
**Depende de:** SPEC-20260503-1505 (base multitenant — `tb_tenant`, resolução por host, cache Redis), SPEC-20260531-1400 (dashboard/métricas — fonte das contagens agregadas)
**Origem:** ticket SQU-72; material de escopo colado pelo usuário em 2026-06-03 11:40 (re-escopo de Next.js → Express+TypeORM). Escopo originalmente embutido em SPEC-20260503-1509 §7.1 (Superadmin), agora fatiado em SPEC própria.
**Resumo:** Painel + API para o Superadmin provisionar shoppings na plataforma (criar tenant + admin inicial, listar com métricas, ativar/desativar, soft-delete) — único ponto de entrada para vender para um shopping novo sem intervenção de dev.

## Objetivo

Substituir a criação manual de tenants (SQL/seed + redeploy) por uma operação de minutos via painel do Superadmin. Entregar CRUD completo de tenants em Express+TypeORM (`/api/superadmin/tenants/*`) e a tela `/admin/tenants` no backoffice (Vite+React), acessíveis **apenas** ao papel `superadmin`.

## Escopo

**DENTRO:**
- **Migration** em `tb_tenant`: adicionar `tenant_status` (enum: `active|trial|inactive|suspended`, default `trial`) e `tenant_deleted_at` (timestamptz, null) para soft-delete.
- **Identidade global de Superadmin** (nova): hoje não existe (User tem `tenant_id` obrigatório e docstring diz "sem superadmin global"). Introduzir papel `superadmin` desvinculado de tenant + middleware `requireSuperadmin`.
- **Endpoints** (substituindo o controller mock atual `superadminTenantController.ts`):
  - `GET  /api/superadmin/tenants` — lista paginada com filtro `?status=&page=&limit=` + contagens agregadas (`stores_count`, `posts_count`).
  - `POST /api/superadmin/tenants` — cria tenant + user admin inicial **em uma transação TypeORM** (rollback se qualquer passo falhar → sem tenant órfão).
  - `PUT  /api/superadmin/tenants/:id` — atualiza `name`, `host`, `status` (NÃO branding).
  - `DELETE /api/superadmin/tenants/:id` — soft-delete: `status='inactive'`, renomeia host para liberar o original, seta `deleted_at`.
- **Validação campo-a-campo** (DTO/validator): name (2–200), slug (`^[a-z0-9-]+$`, 2–100, único global), host (hostname válido, único global, rejeita `localhost`/IPs), status (enum), admin_email (email válido), admin_password (mín. 12 chars), flavor_slug (ver decisão de branding abaixo). Erros → 400 com lista por campo; duplicata slug/host → 409.
- **Invalidação de cache Redis** ao atualizar/deletar: `del('tenant:resolve:{host}')` (chave real da plataforma).
- **Auditoria**: log estruturado dos eventos `tenant_created` / `tenant_updated` / `tenant_soft_deleted` (actor, tenant_id, timestamp) via logger do backend.
- **UI** `/admin/tenants` no backoffice: tabela (Nome, Slug, Host, Status, Lojas, Posts, Criado em, Ações) + criação multi-step (dados básicos → flavor → admin inicial) + editar/suspender/reativar/excluir (confirmação dupla no destrutivo).
- **Permissões**: Editor e Tenant Admin → 403 em todos os endpoints; Superadmin → acesso total.

**FORA:**
- **Branding em banco** (cores, logo, fontes). Conflita com Modelo A (white-label build-time). Ver decisão abaixo — o que entra é `flavor_slug`.
- Edição de identidade visual (é da SPEC-20260503-1509 §5.3 / `theme-system`).
- Self-service de provisionamento pelo cliente (só o Superadmin cria; segue manual nesse sentido).
- Billing/faturamento, i18n, e-mail de boas-vindas obrigatório (envio é best-effort, não bloqueia a transação; se a infra de e-mail não existir, vira nota e fica fora).
- Hard-delete / expurgo de dados (soft-delete preserva tudo para auditoria).

## Implementação

Stack: **Express 4 + TypeORM 0.3** (backend) e **Vite + React** (backoffice) — NÃO Next.js. O material de origem vinha em formato Next (`app/api/.../route.ts`, `page.tsx`); todos os arquivos abaixo são a tradução para a stack real.

**Arquivos (backend):**
- `backend/src/migrations/<ts>-AddTenantStatusAndSoftDelete.ts` — colunas novas em `tb_tenant`.
- `backend/src/entities/Tenant.ts` — adicionar `status` e `deletedAt`.
- `backend/src/entities/User.ts` — suportar `role='superadmin'` e tornar `tenant_id` **nullable** (superadmin global não pertence a tenant); migration ajusta a coluna + revisa o índice único `(tenant_id, email)`.
- `backend/src/middleware/require-superadmin.ts` — espelha `require-tenant-admin.ts`, mas só aceita `superadmin`.
- `backend/src/controllers/superadminTenantController.ts` — **reescrever** (hoje é mock em memória) para usar service/repos.
- `backend/src/services/superadmin-tenant.service.ts` — regra de negócio + transação (create tenant + admin).
- `backend/src/repositories/tenant.repository.ts` — checagens de unicidade, agregações de contagem (evitar N+1 — subquery/LEFT JOIN).
- `backend/src/dtos/` + `backend/src/utils/tenantValidator.ts` — validação (já existe stub do validator).
- `backend/src/routes/superadmin.routes.ts` — montar sob `requireAuth` + `requireSuperadmin`.

**Arquivos (backoffice):**
- `backoffice/src/pages/tenants/TenantsPage.tsx` (já existe stub) — tabela.
- `backoffice/src/pages/tenants/TenantForm.tsx` (ou modal multi-step) — criação/edição.
- Guarda de rota por papel `superadmin`.

**Decisões de arquitetura embutidas (RECONCILIAÇÃO com a base):**

1. **[branding] `flavor_slug` em vez de `primary_color`/`secondary_color`** (decidido 2026-06-03 11:49 pelo usuário). O CLAUDE.md e a docstring de `Tenant.ts` proíbem branding no banco (Modelo A — build-time em `portal/flavors/<slug>/`). O POST recebe `flavor_slug` opcional (referência a um flavor já versionado em git), default `'default'`, **não** cores. *Trade-off aceito:* um visual 100% novo exige PR+deploy do flavor antes; reusar um flavor existente (ou `default`) deixa a criação instantânea.
2. **[superadmin] identidade global = papel `superadmin` com `tenant_id` nullable na própria `tb_user`** (decidido 2026-06-03 11:49 pelo usuário). Reaproveita a stack de auth/refresh-token existente, + middleware `requireSuperadmin`. Alternativa rejeitada: tabela separada `tb_superadmin` (mais isolada, porém duplica auth/refresh-token — custo alto para 1ª entrega).
3. **[status] migration obrigatória.** `tb_tenant` não tem `status` nem `deleted_at` hoje; sem a migration, os endpoints não têm onde gravar. Default de novos tenants: `trial`.
4. **[cache] chave real é `tenant:resolve:{host}`** (não `tenant:config:{host}` do material original). Invalidar essa.
5. **[auditoria] sem tabela `audit_log` no schema.** 1ª entrega loga via logger estruturado; criar `tb_audit_log` fica FORA (abrir SPEC própria se virar requisito).
6. **[prefixo de rota]** material pede `/api/superadmin/...`; o `superadmin.routes.ts` atual monta `/superadmin/...`. Alinhar ao prefixo usado pelas demais APIs admin no mesmo PR.

Pseudocódigo do POST (transação) e do DELETE (soft + libera host) seguem o material de origem, adaptados a `queryRunner` do TypeORM e à coluna `tenant_status`.

## Critério de aceite

- [ ] Migration adiciona `tenant_status` + `tenant_deleted_at`; `migration:run` e `migration:revert` funcionam
- [ ] `requireSuperadmin` retorna 403 para `tenant_admin`/`editor` e 200/2xx para `superadmin` em todos os endpoints
- [ ] `GET /api/superadmin/tenants` retorna lista paginada com `stores_count`/`posts_count` corretos e sem N+1
- [ ] `POST` cria tenant + admin inicial em transação; falha em qualquer passo faz ROLLBACK (sem tenant órfão) — coberto por teste
- [ ] `POST` retorna 409 `slug_already_taken` / `host_already_taken` em duplicata global; 400 com erros por campo em payload inválido
- [ ] `POST` rejeita host `localhost`/`127.0.0.1`/IPs
- [ ] `PUT` atualiza name/host/status, 404 em id inexistente, 409 em host duplicado; NÃO toca branding
- [ ] `DELETE` faz soft-delete (status `inactive` + host liberado + `deleted_at`), 404 em id inexistente, dados preservados no banco
- [ ] Cache `tenant:resolve:{host}` invalidado em PUT (mudança de host/status) e DELETE
- [ ] Eventos `tenant_created`/`tenant_updated`/`tenant_soft_deleted` logados com actor + tenant_id
- [ ] Página `/admin/tenants` lista tenants e só renderiza para `superadmin`; criação multi-step funciona ponta a ponta
- [ ] Controller mock atual (`superadminTenantController.ts`) substituído por implementação real (sem `mockTenantsDb`)
- [ ] **Features tocadas (superadmin, auth, tenant-resolution) atualizadas** com timestamp e referência a esta SPEC
- [ ] Decisões das features revisadas: obsoletas marcadas, ativas confirmadas
- [ ] `state.md` com entrada `[conclusão]`
- [ ] `memory.md` com TL;DR final atualizado
