import { useEffect, useState } from 'react';

/**
 * Painel do Superadmin — CRUD de tenants (SPEC-20260603-1149).
 *
 * Self-contained: gerencia a própria sessão de superadmin (login global via
 * `POST /auth/superadmin/login`, sem tenant) já que o App.tsx é tenant-scoped.
 * Branding NÃO entra na criação — usa `flavor_slug` (Modelo A), nunca cores.
 */
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

type Status = 'active' | 'trial' | 'inactive' | 'suspended';

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  host: string;
  status: Status;
  stores_count: number;
  posts_count: number;
  created_at: string;
}

interface CreateForm {
  name: string;
  slug: string;
  host: string;
  status: Status;
  flavor_slug: string;
  admin_email: string;
  admin_password: string;
}

const EMPTY_FORM: CreateForm = {
  name: '',
  slug: '',
  host: '',
  status: 'trial',
  flavor_slug: 'default',
  admin_email: '',
  admin_password: '',
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function TenantsPage() {
  const [authed, setAuthed] = useState(false);
  const [login, setLogin] = useState({ email: '', password: '' });
  const [loginError, setLoginError] = useState<string | null>(null);

  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<'all' | Status>('all');
  const [listError, setListError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CreateForm>(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  async function fetchTenants() {
    const query = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    try {
      const res = await fetch(`${BACKEND_URL}/api/superadmin/tenants${query}`, {
        credentials: 'include',
      });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (res.status === 403) {
        setListError('Acesso restrito ao superadmin.');
        return;
      }
      const data = (await res.json()) as { data?: TenantItem[]; total?: number };
      setTenants(data.data ?? []);
      setTotal(data.total ?? 0);
      setListError(null);
    } catch {
      setListError('Falha ao conectar com o servidor.');
    }
  }

  // Recarrega ao autenticar e ao mudar o filtro. `fetchTenants` só faz setState
  // pós-await (data-fetch legítimo, não render cascateado); o disable é pontual.
  useEffect(() => {
    if (!authed) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchTenants();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, statusFilter]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/auth/superadmin/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(login),
      });
      if (res.ok) {
        setAuthed(true);
        return;
      }
      setLoginError(res.status === 401 ? 'Credenciais inválidas.' : 'Falha no login.');
    } catch {
      setLoginError('Falha ao conectar com o servidor.');
    }
  }

  function resetModal() {
    setIsModalOpen(false);
    setStep(1);
    setForm(EMPTY_FORM);
    setFormErrors({});
  }

  async function handleCreate() {
    setFormErrors({});
    try {
      const res = await fetch(`${BACKEND_URL}/api/superadmin/tenants`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => null)) as {
        error?: string;
        errors?: Record<string, string>;
      } | null;

      if (res.status === 400 && data?.errors) {
        setFormErrors(data.errors);
        setStep(1);
      } else if (res.status === 409) {
        setFormErrors(
          data?.error === 'host_already_taken'
            ? { host: 'Host já está em uso.' }
            : { slug: 'Slug já está em uso.' },
        );
        setStep(1);
      } else if (res.ok) {
        resetModal();
        void fetchTenants();
      }
    } catch {
      setFormErrors({ name: 'Falha ao conectar com o servidor.' });
    }
  }

  async function patchTenant(id: string, body: Record<string, unknown>) {
    const res = await fetch(`${BACKEND_URL}/api/superadmin/tenants/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (res.ok) void fetchTenants();
  }

  async function handleToggleStatus(t: TenantItem) {
    const next: Status = t.status === 'active' ? 'suspended' : 'active';
    await patchTenant(t.id, { name: t.name, host: t.host, status: next });
  }

  async function handleDelete(t: TenantItem) {
    if (!window.confirm(`Desativar o shopping "${t.name}"?`)) return;
    if (
      !window.confirm(
        'CONFIRMAÇÃO FINAL: status vira "inactive" e o host é liberado. Dados são preservados para auditoria. Prosseguir?',
      )
    )
      return;
    const res = await fetch(`${BACKEND_URL}/api/superadmin/tenants/${t.id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) void fetchTenants();
  }

  if (!authed) {
    return (
      <div style={{ maxWidth: 360, margin: '80px auto', fontFamily: 'sans-serif' }}>
        <h1 style={{ fontSize: 22 }}>Superadmin</h1>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          Acesso global à plataforma — provisionamento de shoppings.
        </p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            type="email"
            placeholder="email"
            value={login.email}
            onChange={(e) => setLogin((c) => ({ ...c, email: e.target.value }))}
            required
          />
          <input
            type="password"
            placeholder="senha"
            value={login.password}
            onChange={(e) => setLogin((c) => ({ ...c, password: e.target.value }))}
            required
          />
          <button type="submit">Entrar</button>
          {loginError ? <p style={{ color: 'red', fontSize: 13 }}>{loginError}</p> : null}
        </form>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, fontFamily: 'sans-serif' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 26, margin: 0 }}>Gerenciamento Global de Tenants</h1>
          <p style={{ fontSize: 14, color: '#6b7280' }}>Shoppings na plataforma: {total}</p>
        </div>
        <button type="button" onClick={() => setIsModalOpen(true)}>
          + Novo Shopping
        </button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 14 }}>Status:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | Status)}
        >
          <option value="all">Todos</option>
          <option value="active">Ativos</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspensos</option>
          <option value="inactive">Inativos</option>
        </select>
      </div>

      {listError ? <p style={{ color: 'red' }}>{listError}</p> : null}

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
            <th style={{ padding: 12 }}>Nome / ID</th>
            <th style={{ padding: 12 }}>Slug / Host</th>
            <th style={{ padding: 12 }}>Status</th>
            <th style={{ padding: 12 }}>Lojas</th>
            <th style={{ padding: 12 }}>Posts</th>
            <th style={{ padding: 12 }}>Criado em</th>
            <th style={{ padding: 12 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: 12 }}>
                <div style={{ fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 11, color: '#9ca3af' }}>{t.id}</div>
              </td>
              <td style={{ padding: 12 }}>
                <div>{t.slug}</div>
                <div style={{ fontSize: 12, color: '#2563eb' }}>{t.host}</div>
              </td>
              <td style={{ padding: 12 }}>{t.status}</td>
              <td style={{ padding: 12, textAlign: 'center' }}>{t.stores_count}</td>
              <td style={{ padding: 12, textAlign: 'center' }}>{t.posts_count}</td>
              <td style={{ padding: 12, fontSize: 12 }}>
                {new Date(t.created_at).toLocaleDateString('pt-BR')}
              </td>
              <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => void handleToggleStatus(t)}
                  disabled={t.status === 'inactive'}
                >
                  {t.status === 'active' ? 'Suspender' : 'Reativar'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(t)}
                  disabled={t.status === 'inactive'}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isModalOpen ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div style={{ background: '#fff', padding: 32, borderRadius: 8, width: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Novo Shopping — Passo {step} de 3</h3>
              <button type="button" onClick={resetModal}>
                ×
              </button>
            </div>

            {step === 1 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label>
                  Nome
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((c) => ({
                        ...c,
                        name: e.target.value,
                        slug: slugify(e.target.value),
                      }))
                    }
                  />
                  {formErrors.name ? (
                    <small style={{ color: 'red' }}>{formErrors.name}</small>
                  ) : null}
                </label>
                <label>
                  Slug
                  <input
                    type="text"
                    value={form.slug}
                    onChange={(e) => setForm((c) => ({ ...c, slug: e.target.value }))}
                  />
                  {formErrors.slug ? (
                    <small style={{ color: 'red' }}>{formErrors.slug}</small>
                  ) : null}
                </label>
                <label>
                  Host
                  <input
                    type="text"
                    placeholder="ex: shoppingnovo.com.br"
                    value={form.host}
                    onChange={(e) => setForm((c) => ({ ...c, host: e.target.value }))}
                  />
                  {formErrors.host ? (
                    <small style={{ color: 'red' }}>{formErrors.host}</small>
                  ) : null}
                </label>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!form.name || !form.slug || !form.host}
                >
                  Avançar
                </button>
              </div>
            ) : null}

            {step === 2 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label>
                  Flavor (identidade visual versionada em git — Modelo A)
                  <input
                    type="text"
                    value={form.flavor_slug}
                    onChange={(e) => setForm((c) => ({ ...c, flavor_slug: e.target.value }))}
                  />
                  {formErrors.flavor_slug ? (
                    <small style={{ color: 'red' }}>{formErrors.flavor_slug}</small>
                  ) : null}
                  <small style={{ display: 'block', color: '#6b7280' }}>
                    Deve existir em portal/flavors/&lt;slug&gt;/. Padrão: default.
                  </small>
                </label>
                <label>
                  Status inicial
                  <select
                    value={form.status}
                    onChange={(e) => setForm((c) => ({ ...c, status: e.target.value as Status }))}
                  >
                    <option value="trial">trial</option>
                    <option value="active">active</option>
                  </select>
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button type="button" onClick={() => setStep(1)}>
                    Voltar
                  </button>
                  <button type="button" onClick={() => setStep(3)}>
                    Avançar
                  </button>
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <label>
                  E-mail do admin inicial
                  <input
                    type="email"
                    value={form.admin_email}
                    onChange={(e) => setForm((c) => ({ ...c, admin_email: e.target.value }))}
                  />
                  {formErrors.admin_email ? (
                    <small style={{ color: 'red' }}>{formErrors.admin_email}</small>
                  ) : null}
                </label>
                <label>
                  Senha temporária (mín. 12 caracteres)
                  <input
                    type="password"
                    value={form.admin_password}
                    onChange={(e) => setForm((c) => ({ ...c, admin_password: e.target.value }))}
                  />
                  {formErrors.admin_password ? (
                    <small style={{ color: 'red' }}>{formErrors.admin_password}</small>
                  ) : null}
                </label>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <button type="button" onClick={() => setStep(2)}>
                    Voltar
                  </button>
                  <button type="button" onClick={() => void handleCreate()}>
                    Finalizar e criar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
