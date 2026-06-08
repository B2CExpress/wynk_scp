# SPEC-SQU-73 — Superadmin Impersonação com Auditoria

**Status**: ✅ Concluído  
**Autor**: Leonardo Campos  
**Data**: 2026-06-05  
**Branch**: `feature/SQU-73-superadmin-impersonacao-e-auditoria`  
**PR**: aguardando revisão

---

## Visão Geral

Superadmins precisam investigar problemas reportados por tenants sem solicitar credenciais. Esta feature permite entrar no painel de um tenant como se fosse aquele tenant (impersonação), com toda ação registrada em audit log append-only para rastreabilidade completa.

---

## Banco de Dados

### Migration: `1747190400000-CreateAuditLogTable`

Cria a tabela `tb_audit_log` e seus índices.

```sql
CREATE TABLE tb_audit_log (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type       VARCHAR(50)  NOT NULL,
  actor_user_id    UUID         NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
  actor_role       VARCHAR(15)  NOT NULL,
  target_tenant_id UUID         REFERENCES tenants(id) ON DELETE RESTRICT,
  target_user_id   UUID         REFERENCES admin_users(id) ON DELETE RESTRICT,
  metadata         JSONB,
  ip_address       VARCHAR(45),
  user_agent       TEXT,
  created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_actor   ON tb_audit_log (actor_user_id,    created_at DESC);
CREATE INDEX idx_audit_tenant  ON tb_audit_log (target_tenant_id, created_at DESC);
CREATE INDEX idx_audit_event   ON tb_audit_log (event_type,       created_at DESC);
CREATE INDEX idx_audit_created ON tb_audit_log (created_at DESC);
```

> **Append-only**: nenhum UPDATE nem DELETE é exposto pela aplicação. Em produção, revogar permissão `UPDATE`/`DELETE` no usuário de app.

---

## Endpoints

### `POST /api/superadmin/impersonate`

Inicia impersonação. Seta cookie e registra audit log.

**Auth**: requer `role === 'superadmin'`.

**Request body**:
```json
{ "tenant_id": "<uuid>" }
```

**Response 200**:
```json
{ "ok": true, "redirect_url": "https://<tenant.host>/admin" }
```

**Códigos de erro**: `401` não autenticado · `403` não é superadmin · `404` tenant inexistente ou inativo.

**Fluxo interno**:
1. Autenticar — 401 se não logado.
2. Verificar `user.role === 'superadmin'` — 403 se não.
3. `SELECT * FROM tenants WHERE id = $1 AND status = 'active'` — 404 se não encontrar.
4. Setar cookie `impersonate_tenant_id` (httpOnly, secure, sameSite lax, maxAge 4 h).
5. INSERT em `tb_audit_log` com `event_type = 'impersonate_start'`, metadata com `referer` sanitizado.
6. Retornar `{ ok: true, redirect_url }`.

---

### `POST /api/superadmin/impersonate/stop`

Encerra impersonação. Limpa cookie e registra audit log.

**Auth**: requer usuário autenticado.

**Response 200**:
```json
{ "ok": true, "redirect_url": "/admin/tenants" }
```

**Códigos de erro**: `401` não autenticado.

**Fluxo interno**:
1. Autenticar — 401 se não logado.
2. Ler `impersonate_tenant_id` do cookie (para registrar no log).
3. INSERT em `tb_audit_log` com `event_type = 'impersonate_stop'`.
4. Limpar cookie (maxAge 0).
5. Retornar `{ ok: true, redirect_url: '/admin/tenants' }`.

---

### `GET /api/admin/audit`

Lista o audit log paginado com filtros.

**Auth**: requer `role === 'superadmin'`.

**Query params**: `event_type` · `actor_id` · `tenant_id` · `page` (default 1) · `limit` (default 50).

**Response 200**:
```json
{
  "data": [
    {
      "id": "<uuid>",
      "event_type": "impersonate_start",
      "actor": { "id": "<uuid>", "email": "super@plataforma.com", "role": "superadmin" },
      "target_tenant": { "id": "<uuid>", "name": "Brasilia Shopping" },
      "metadata": {},
      "ip_address": "200.0.0.1",
      "created_at": "2026-05-03T17:30:00Z"
    }
  ],
  "total": 142,
  "page": 1
}
```

**Códigos de erro**: `401` não autenticado · `403` não é superadmin.

---

## Middleware — Resolução de Tenant

Atualizar `resolve-tenant-by-host.ts` para respeitar o cookie de impersonação:

```
1. Buscar user = getCurrentUser(request)
2. SE user existe E user.role === 'superadmin':
     impersonateId = request.cookies.get('impersonate_tenant_id')
     SE impersonateId existe:
       tenant = getTenantById(impersonateId)
       SE tenant existe E status='active': retornar { tenant, isImpersonating: true }
3. CASO PADRÃO (não-superadmin OU sem cookie):
     tenant = getTenantByHost(host) — 404 se não existe
     retornar { tenant, isImpersonating: false }
```

---

## Cookie

```
Nome:     impersonate_tenant_id
httpOnly: true
secure:   true (prod) / false (dev)
sameSite: lax
maxAge:   14400 s  (4 h)
path:     /
```

---

## UI — Backoffice

### `ImpersonationBanner` (`components/admin/ImpersonationBanner.tsx`)

- Banner vermelho fixo no topo (`position: fixed`, z-index alto).
- Texto: "Você está impersonando **[Tenant Nome]** — Encerrar impersonação".
- **Sem botão X**. Única ação é "Encerrar impersonação" (chama `POST /api/superadmin/impersonate/stop`).
- Visível em todas as páginas `/admin` enquanto o cookie estiver presente.
- Incluso no layout raiz de `/admin`.

### `/admin/tenants` — TenantsPage

- Cada linha da tabela de tenants tem botão **"Acessar como"**.
- Botão chama `POST /api/superadmin/impersonate` com o `tenant_id` da linha.
- Em caso de sucesso, redireciona para `redirect_url` retornado pela API.
- Botão visível apenas para `role === 'superadmin'`.
- Tenants com `status !== 'active'` têm o botão desabilitado.

### `/admin/audit` — AuditPage

- Acesso restrito a superadmin (403 para outros).
- Tabela: data/hora · tipo de evento · ator (email) · tenant alvo · IP.
- Filtros no topo: tipo de evento · ator · tenant · range de datas.
- Paginação de 50 registros por página.

---

## Permissões

| Endpoint / Recurso | superadmin | tenant_admin | anon |
|---|---|---|---|
| `POST /api/superadmin/impersonate` | ✅ | 403 | 401 |
| `POST /api/superadmin/impersonate/stop` | ✅ | ✅ | 401 |
| `GET /api/admin/audit` | ✅ | 403 | 401 |
| Banner de impersonação | visível | visível | — |
| Botão "Acessar como" | visível | oculto | — |

---

## Critérios de Aceite

- [ ] Migration cria `tb_audit_log` com todos os índices.
- [ ] `POST /impersonate` seta cookie e insere entrada `impersonate_start` no audit log.
- [ ] Cookie tem `httpOnly + secure + sameSite + maxAge 4h`.
- [ ] Resolução de tenant usa cookie de impersonação somente para `superadmin`.
- [ ] Banner aparece em todas as páginas `/admin` quando o cookie está presente.
- [ ] `POST /impersonate/stop` limpa cookie e insere `impersonate_stop` no audit log.
- [ ] `GET /admin/audit` retorna log paginado com filtros, apenas para superadmin.
- [ ] Tenant Admin recebe 403 em todos os endpoints `superadmin`.
- [ ] Audit log não expõe UPDATE nem DELETE (append-only).
- [ ] Impersonar tenant com `status !== 'active'` retorna 404.

---

## Armadilhas Documentadas

| Armadilha | Mitigação |
|---|---|
| Cookie sem TTL curto — sessão esquecida em PC público | maxAge fixo de 4 h |
| Banner com X — usuário fecha sem encerrar e continua impersonando | Sem botão X; única saída é "Encerrar" |
| Audit log mutável — alguém deleta registros comprometedores | Sem endpoint de UPDATE/DELETE; permissão revogada no DB em prod |
| Cookie aceito sem checar role — qualquer um que sete o cookie impersona | Middleware valida `user.role === 'superadmin'` antes de ler o cookie |
| Metadata com senhas no log | Sanitização de campos sensíveis antes do INSERT |
| Tenant deletado após início de impersonação | Middleware checa `status = 'active'` a cada request |