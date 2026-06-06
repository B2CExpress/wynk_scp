import { useEffect, useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

interface Actor {
  id: string;
  email: string;
  role: string;
}

interface TargetTenant {
  id: string;
  name: string;
}

interface AuditLogEntry {
  id: string;
  event_type: string;
  actor: Actor;
  target_tenant: TargetTenant | null;
  metadata: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

interface AuditListResponse {
  data: AuditLogEntry[];
  total: number;
  page: number;
}

export function AuditPage() {
  const [authed, setAuthed] = useState(false);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [eventFilter, setEventFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: page.toString() });
      if (eventFilter) {
        query.append('event_type', eventFilter);
      }

      const res = await fetch(`${BACKEND_URL}/api/admin/audit?${query.toString()}`, {
        credentials: 'include',
      });

      if (res.status === 401) {
        setAuthed(false);
        return;
      }

      if (res.status === 403) {
        setError('Acesso restrito ao superadmin.');
        return;
      }

      if (!res.ok) {
        setError('Erro ao carregar logs de auditoria');
        return;
      }

      const data = (await res.json()) as AuditListResponse;
      setLogs(data.data ?? []);
      setTotal(data.total ?? 0);
      setAuthed(true);
      setError(null);
    } catch {
      setError('Falha ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authed && page === 1) {
      // Tentar autenticar e carregar
      fetchLogs();
    }
  }, []);

  useEffect(() => {
    if (authed) {
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, eventFilter]);

  if (!authed && error) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Logs de Auditoria</h1>
        <p style={{ color: '#dc2626' }}>{error}</p>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR');
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      impersonate_start: 'Início de impersonação',
      impersonate_stop: 'Fim de impersonação',
      tenant_created: 'Tenant criado',
      tenant_updated: 'Tenant atualizado',
      tenant_deleted: 'Tenant deletado',
      user_created: 'Usuário criado',
      user_updated: 'Usuário atualizado',
      password_changed: 'Senha alterada',
      login: 'Login',
      logout: 'Logout',
    };
    return labels[eventType] ?? eventType;
  };

  const maxPage = Math.ceil(total / 50);

  return (
    <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ marginBottom: '20px', fontSize: '24px', fontWeight: 600 }}>
          Logs de Auditoria
        </h1>

        {error && (
          <div
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '20px',
            }}
          >
            {error}
          </div>
        )}

        {/* Filtros */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <select
            value={eventFilter}
            onChange={(e) => {
              setEventFilter(e.target.value);
              setPage(1);
            }}
            style={{
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #d1d5db',
            }}
          >
            <option value="">Todos os eventos</option>
            <option value="impersonate_start">Início de impersonação</option>
            <option value="impersonate_stop">Fim de impersonação</option>
            <option value="tenant_created">Tenant criado</option>
            <option value="tenant_updated">Tenant atualizado</option>
            <option value="tenant_deleted">Tenant deletado</option>
            <option value="user_created">Usuário criado</option>
            <option value="user_updated">Usuário atualizado</option>
            <option value="password_changed">Senha alterada</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
          </select>
        </div>

        {/* Tabela */}
        <div
          style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
            }}
          >
            <thead>
              <tr style={{ backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' }}>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Data/Hora
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Evento
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Ator
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  Tenant
                </th>
                <th
                  style={{
                    padding: '12px',
                    textAlign: 'left',
                    fontSize: '14px',
                    fontWeight: 600,
                  }}
                >
                  IP
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>
                    Carregando...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                    Nenhum log encontrado
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: 'white' }}
                  >
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {formatDate(log.created_at)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          backgroundColor:
                            log.event_type.includes('impersonate') || log.event_type.includes('delete')
                              ? '#fecaca'
                              : '#bfdbfe',
                          color:
                            log.event_type.includes('impersonate') || log.event_type.includes('delete')
                              ? '#7f1d1d'
                              : '#1e3a8a',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: 500,
                        }}
                      >
                        {getEventLabel(log.event_type)}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      <div>{log.actor.email}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>({log.actor.role})</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {log.target_tenant ? (
                        <>
                          <div>{log.target_tenant.name}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            {log.target_tenant.id.substring(0, 8)}...
                          </div>
                        </>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {log.ip_address ? (
                        <code style={{ fontSize: '12px', color: '#6b7280' }}>{log.ip_address}</code>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div
          style={{
            marginTop: '20px',
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            alignItems: 'center',
          }}
        >
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            style={{
              padding: '8px 12px',
              backgroundColor: page === 1 ? '#f3f4f6' : '#e5e7eb',
              color: page === 1 ? '#9ca3af' : '#374151',
              border: 'none',
              borderRadius: '4px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
            }}
          >
            ← Anterior
          </button>

          <span style={{ fontSize: '14px', color: '#6b7280' }}>
            Página {page} de {maxPage}
          </span>

          <button
            onClick={() => setPage(Math.min(maxPage, page + 1))}
            disabled={page === maxPage}
            style={{
              padding: '8px 12px',
              backgroundColor: page === maxPage ? '#f3f4f6' : '#e5e7eb',
              color: page === maxPage ? '#9ca3af' : '#374151',
              border: 'none',
              borderRadius: '4px',
              cursor: page === maxPage ? 'not-allowed' : 'pointer',
            }}
          >
            Próximo →
          </button>
        </div>

        {/* Info */}
        <div
          style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#eff6ff',
            borderRadius: '4px',
            color: '#1e40af',
            fontSize: '14px',
          }}
        >
          Total: {total} eventos registrados
        </div>
      </div>
    </div>
  );
}
