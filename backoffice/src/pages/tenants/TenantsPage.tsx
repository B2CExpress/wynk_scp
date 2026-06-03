import * as React from 'react';

interface TenantItem {
  id: string;
  name: string;
  slug: string;
  host: string;
  status: 'active' | 'trial' | 'inactive' | 'suspended';
  stores_count: number;
  posts_count: number;
  created_at: string;
}

export function TenantsPage() {
  const [tenants, setTenants] = React.useState<TenantItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [statusFilter, setStatusFilter] = React.useState('all');
  
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [step, setStep] = React.useState(1);
  const [form, setForm] = React.useState({
    name: '', slug: '', host: '', status: 'trial',
    primary_color: '#0066CC', secondary_color: '#003D7A',
    admin_email: '', admin_password: ''
  });
  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const fetchTenants = React.useCallback(() => {
    const queryParam = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
    fetch(`/api/superadmin/tenants${queryParam}`)
      .then(res => res.json())
      .then(resData => {
        setTenants(resData.data || []);
        setTotal(resData.total || 0);
      })
      .catch(err => console.error('Erro ao buscar shoppings:', err));
  }, [statusFilter]);

  React.useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleCreateTenant = async () => {
    setFormErrors({});
    try {
      const res = await fetch('/api/superadmin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      
      if (res.status === 400 && data.errors) {
        setFormErrors(data.errors);
      } else if (res.status === 409) {
        alert('Erro: O slug ou o domínio fornecido já está em uso globalmente.');
      } else if (res.ok) {
        alert('Shopping e usuário administrador criados com absoluto sucesso em transação atômica!');
        setIsModalOpen(false);
        setStep(1);
        setForm({
          name: '', slug: '', host: '', status: 'trial',
          primary_color: '#0066CC', secondary_color: '#003D7A',
          admin_email: '', admin_password: ''
        });
        fetchTenants();
      }
    } catch (err) {
      alert('Erro crítico ao conectar com o servidor.');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) {
        fetchTenants();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTenant = async (id: string, name: string) => {
    const confirm1 = window.confirm(`Atenção: Você tem certeza que deseja desativar o shopping "${name}"?`);
    if (!confirm1) return;
    const confirm2 = window.confirm(`CONFIRMAÇÃO FINAL: Isso mudará o status para 'inactive' e liberará o host corporativo. Os dados históricos serão preservados para auditoria. Deseja prosseguir?`);
    if (!confirm2) return;

    try {
      const res = await fetch(`/api/superadmin/tenants/${id}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Soft-delete realizado com sucesso. O domínio antigo foi liberado.');
        fetchTenants();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleNameChange = (val: string) => {
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setForm({ ...form, name: val, slug: generatedSlug });
  };

  return React.createElement('div', { style: { padding: '32px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' } },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' } },
      React.createElement('div', null,
        React.createElement('h1', { style: { fontSize: '26px', fontWeight: 'bold', color: '#111827', margin: 0 } }, 'Gerenciamento Global de Tenants'),
        React.createElement('p', { style: { fontSize: '14px', color: '#6b7280', marginTop: '4px' } }, `Total de shoppings integrados na plataforma: ${total}`)
      ),
      React.createElement('button', {
        onClick: () => setIsModalOpen(true),
        style: { padding: '12px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }
      }, '+ Novo Shopping')
    ),

    React.createElement('div', { style: { marginBottom: '20px', display: 'flex', gap: '12px' } },
      React.createElement('span', { style: { alignSelf: 'center', fontSize: '14px', fontWeight: '600' } }, 'Filtrar por Status:'),
      React.createElement('select', {
        value: statusFilter,
        onChange: (e: any) => setStatusFilter(e.target.value),
        style: { padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff' }
      },
        React.createElement('option', { value: 'all' }, 'Todos os shoppings'),
        React.createElement('option', { value: 'active' }, 'Ativos'),
        React.createElement('option', { value: 'trial' }, 'Período de Teste (Trial)'),
        React.createElement('option', { value: 'suspended' }, 'Suspensos'),
        React.createElement('option', { value: 'inactive' }, 'Inativos (Removidos)')
      )
    ),

    React.createElement('table', { style: { width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } },
      React.createElement('thead', { style: { backgroundColor: '#f3f4f6', borderBottom: '1px solid #e5e7eb' } },
        React.createElement('tr', null,
          React.createElement('th', { style: { padding: '14px', textAlign: 'left', fontSize: '13px', color: '#374151' } }, 'Shopping / ID'),
          React.createElement('th', { style: { padding: '14px', textAlign: 'left', fontSize: '13px', color: '#374151' } }, 'Slug / Host'),
          React.createElement('th', { style: { padding: '14px', textAlign: 'left', fontSize: '13px', color: '#374151' } }, 'Status'),
          React.createElement('th', { style: { padding: '14px', textAlign: 'center', fontSize: '13px', color: '#374151' } }, 'Lojas'),
          React.createElement('th', { style: { padding: '14px', textAlign: 'center', fontSize: '13px', color: '#374151' } }, 'Posts'),
          React.createElement('th', { style: { padding: '14px', textAlign: 'left', fontSize: '13px', color: '#374151' } }, 'Ações')
        )
      ),
      React.createElement('tbody', null,
        tenants.map((t) => 
          React.createElement('tr', { key: t.id, style: { borderBottom: '1px solid #e5e7eb' } },
            React.createElement('td', { style: { padding: '14px' } },
              React.createElement('div', { style: { fontWeight: '600', color: '#111827' } }, t.name),
              React.createElement('div', { style: { fontSize: '11px', color: '#9ca3af' } }, t.id)
            ),
            React.createElement('td', { style: { padding: '14px' } },
              React.createElement('div', { style: { color: '#4b5563', fontSize: '14px' } }, t.slug),
              React.createElement('div', { style: { color: '#2563eb', fontSize: '12px' } }, t.host)
            ),
            React.createElement('td', { style: { padding: '14px' } },
              React.createElement('span', { style: { padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500', backgroundColor: t.status === 'active' ? '#dcfce7' : t.status === 'suspended' ? '#fee2e2' : '#f3f4f6', color: t.status === 'active' ? '#166534' : t.status === 'suspended' ? '#991b1b' : '#374151' } }, t.status)
            ),
            React.createElement('td', { style: { padding: '14px', textAlign: 'center', fontWeight: '500' } }, t.stores_count),
            React.createElement('td', { style: { padding: '14px', textAlign: 'center', fontWeight: '500' } }, t.posts_count),
            React.createElement('td', { style: { padding: '14px', display: 'flex', gap: '8px' } },
              React.createElement('button', {
                onClick: () => handleToggleStatus(t.id, t.status),
                disabled: t.status === 'inactive',
                style: { padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: '1px solid #d1d5db', cursor: t.status === 'inactive' ? 'not-allowed' : 'pointer', backgroundColor: '#fff' }
              }, t.status === 'active' ? 'Suspender' : 'Reativar'),
              React.createElement('button', {
                onClick: () => handleDeleteTenant(t.id, t.name),
                disabled: t.status === 'inactive',
                style: { padding: '6px 12px', fontSize: '12px', borderRadius: '4px', border: 'none', cursor: t.status === 'inactive' ? 'not-allowed' : 'pointer', backgroundColor: '#ef4444', color: 'white' }
              }, 'Excluir')
            )
          )
        )
      )
    ),

    isModalOpen && React.createElement('div', { style: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 9999 } },
    React.createElement('div', { style: { backgroundColor: '#fff', padding: '32px', borderRadius: '8px', width: '500px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' } },
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' } },
    React.createElement('h3', { style: { fontSize: '18px', fontWeight: 'bold', margin: 0 } }, `Novo Shopping - Passo ${step} de 3`),
    React.createElement('button', { onClick: () => { setIsModalOpen(false); setStep(1); }, style: { border: 'none', background: 'none', fontSize: '18px', cursor: 'pointer' } }, '×')),step === 1 && 
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
    React.createElement('div', null,React.createElement('label', { style: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' } }, 'Nome Comercial do Shopping'),

    React.createElement('input', { type: 'text', value: form.name, onChange: (e: any) => handleNameChange(e.target.value), style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' } }),formErrors.name && 
    React.createElement('p', { style: { color: 'red', fontSize: '11px', margin: '4px 0 0' } }, formErrors.name)),
    React.createElement('div', null,React.createElement('label', { style: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' } }, 'Slug da URL (Auto-gerado)'),
    React.createElement('input', { type: 'text', value: form.slug, onChange: (e: any) => setForm({ ...form, slug: e.target.value }), style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f3f4f6' } }),formErrors.slug && 
    React.createElement('p', { style: { color: 'red', fontSize: '11px', margin: '4px 0 0' } }, formErrors.slug)),
    React.createElement('div', null,React.createElement('label', { style: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' } }, 'Domínio Corporativo (Host)'),
    React.createElement('input', { type: 'text', value: form.host, placeholder: 'ex: shoppingnovo.com.br', onChange: (e: any) => setForm({ ...form, host: e.target.value }), style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' } }),formErrors.host && React.createElement('p', { style: { color: 'red', fontSize: '11px', margin: '4px 0 0' } }, formErrors.host)),

    React.createElement('button', {onClick: () => setStep(2),disabled: !form.name || !form.slug || !form.host,style: { padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', marginTop: '12px', cursor: 'pointer' }}, 'Avançar ➡️')),step === 2 && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
                       React.createElement('div', null,React.createElement('label', { style: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' } }, 'Cor Primária (Hexadecimal)'),
                        React.createElement('input', { type: 'color', value: form.primary_color || '#0066CC', onChange: (e: any) => setForm({ ...form, primary_color: e.target.value }), style: { width: '60px', height: '36px', border: 'none', cursor: 'pointer' } }),formErrors.primary_color && React.createElement('p', { style: { color: 'red', fontSize: '11px', margin: '4px 0 0' } }, formErrors.primary_color)),
                         React.createElement('div', null,React.createElement('label', { style: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' } }, 'Cor Secundária (Hexadecimal)'),
                          React.createElement('input', { type: 'color', value: form.secondary_color || '#003D7A', onChange: (e: any) => setForm({ ...form, secondary_color: e.target.value }), style: { width: '60px', height: '36px', border: 'none', cursor: 'pointer' } }),formErrors.secondary_color && React.createElement('p', { style: { color: 'red', fontSize: '11px', margin: '4px 0 0' } }, formErrors.secondary_color)),
                           React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: '12px' } },
                            React.createElement('button', { onClick: () => setStep(1), style: { padding: '10px 16px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', cursor: 'pointer' } }, '⬅️ Voltar'),
    React.createElement('button', { onClick: () => setStep(3), style: { padding: '10px 16px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' } }, 'Avançar ➡️'))),step === 3 && React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '14px' } },
    React.createElement('div', null,React.createElement('label', { style: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' } }, 'E-mail do Administrador Inicial'),
    React.createElement('input', { type: 'email', value: form.admin_email, placeholder: 'admin@shopping.com.br', onChange: (e: any) => setForm({ ...form, admin_email: e.target.value }), style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' } }),formErrors.admin_email && React.createElement('p', { style: { color: 'red', fontSize: '11px', margin: '4px 0 0' } }, formErrors.admin_email)),
    React.createElement('div', null,React.createElement('label', { style: { display: 'block', fontSize: '13px', fontWeight: '600', marginBottom: '4px' } }, 'Senha Temporária (Mínimo 12 caracteres)'),
    React.createElement('input', { type: 'password', value: form.admin_password, placeholder: 'SenhaSegura123!', onChange: (e: any) => setForm({ ...form, admin_password: e.target.value }), style: { width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' } }),formErrors.admin_password && React.createElement('p', { style: { color: 'red', fontSize: '11px', margin: '4px 0 0' } }, formErrors.admin_password)),
    React.createElement('div', { style: { display: 'flex', justifyContent: 'space-between', marginTop: '12px' } },
    React.createElement('button', { onClick: () => setStep(2), style: { padding: '10px 16px', border: '1px solid #ccc', borderRadius: '4px', background: '#fff', cursor: 'pointer' } }, '⬅️ Voltar'),
    React.createElement('button', { onClick: handleCreateTenant, style: { padding: '10px 20px', backgroundColor: '#166534', color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' } }, '🚀 Finalizar e Criar'))))));}