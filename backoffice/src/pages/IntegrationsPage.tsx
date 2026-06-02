import * as React from 'react';

export function IntegrationsPage() {
  const [form, setForm] = React.useState({ 
    ga4_measurement_id: '', 
    meta_pixel_id: '', 
    app_store_url: '', 
    play_store_url: '', 
    popup_show_rule: 'once_per_session' 
  });
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch('/api/admin/settings/integrations')
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar integrações');
        return res.json();
      })
      .then(data => setForm(data))
      .catch(err => console.error('Erro de conexão:', err));
  }, []);

  const handleSave = async () => {
    setLoading(true); 
    setErrors({});
    
    try {
      const res = await fetch('/api/admin/settings/integrations', { 
        method: 'PUT', 
        body: JSON.stringify(form), 
        headers: { 'Content-Type': 'application/json' } 
      });
      
      if (!res.ok) {
        const data = await res.json();
        if (data.errors) setErrors(data.errors);
      } else {
        alert('Configurações salvas com sucesso!');
      }
    } catch (err) {
      alert('Falha ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  };

  const getInputStyle = (field: string) => {
    if (errors[field]) return { borderColor: '#ef4444', backgroundColor: '#fef2f2' };
    if (form[field as keyof typeof form]) return { borderColor: '#22c55e', backgroundColor: '#f0fdf4' };
    return { borderColor: '#d1d5db', backgroundColor: '#ffffff' };
  };

  // Renderização segura para contornar o erro do TypeScript
  return React.createElement('div', { style: { maxWidth: '600px', padding: '32px', fontFamily: 'sans-serif' } },
    React.createElement('h1', { style: { fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' } }, 'Integrações Externas'),
    
    React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } },
      
      // GOOGLE ANALYTICS 4
      React.createElement('div', null,
        React.createElement('label', { style: { display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' } }, 'Google Analytics 4'),
        React.createElement('input', { 
          type: 'text', 
          value: form.ga4_measurement_id, 
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, ga4_measurement_id: e.target.value}), 
          style: { width: '100%', padding: '10px', border: '1px solid', borderRadius: '6px', outline: 'none', ...getInputStyle('ga4_measurement_id') },
          placeholder: 'Ex: G-ABC123XYZ'
        }),
        errors.ga4_measurement_id && React.createElement('p', { style: { color: '#ef4444', fontSize: '12px', marginTop: '4px' } }, errors.ga4_measurement_id)
      ),

      // META PIXEL
      React.createElement('div', null,
        React.createElement('label', { style: { display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' } }, 'Meta Pixel (Facebook/Instagram)'),
        React.createElement('input', { 
          type: 'text', 
          value: form.meta_pixel_id, 
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, meta_pixel_id: e.target.value}), 
          style: { width: '100%', padding: '10px', border: '1px solid', borderRadius: '6px', outline: 'none', ...getInputStyle('meta_pixel_id') },
          placeholder: 'Ex: 1234567890123456'
        }),
        errors.meta_pixel_id && React.createElement('p', { style: { color: '#ef4444', fontSize: '12px', marginTop: '4px' } }, errors.meta_pixel_id)
      ),

      // APP STORE
      React.createElement('div', null,
        React.createElement('label', { style: { display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' } }, 'URL do Aplicativo (App Store - iOS)'),
        React.createElement('input', { 
          type: 'text', 
          value: form.app_store_url, 
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, app_store_url: e.target.value}), 
          style: { width: '100%', padding: '10px', border: '1px solid', borderRadius: '6px', outline: 'none', ...getInputStyle('app_store_url') },
          placeholder: 'https://apple.com...'
        }),
        errors.app_store_url && React.createElement('p', { style: { color: '#ef4444', fontSize: '12px', marginTop: '4px' } }, errors.app_store_url)
      ),

      // PLAY STORE
      React.createElement('div', null,
        React.createElement('label', { style: { display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' } }, 'URL do Aplicativo (Play Store - Android)'),
        React.createElement('input', { 
          type: 'text', 
          value: form.play_store_url, 
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm({...form, play_store_url: e.target.value}), 
          style: { width: '100%', padding: '10px', border: '1px solid', borderRadius: '6px', outline: 'none', ...getInputStyle('play_store_url') },
          placeholder: 'https://google.com...'
        }),
        errors.play_store_url && React.createElement('p', { style: { color: '#ef4444', fontSize: '12px', marginTop: '4px' } }, errors.play_store_url)
      ),

      // REGRA DO POPUP
      React.createElement('div', null,
        React.createElement('label', { style: { display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '14px' } }, 'Exibição do Pop-up de Captura'),
        React.createElement('select', { 
          value: form.popup_show_rule, 
          onChange: (e: React.ChangeEvent<HTMLSelectElement>) => setForm({...form, popup_show_rule: e.target.value}), 
          style: { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', outline: 'none' }
        },
          React.createElement('option', { value: 'always' }, 'Sempre mostrar'),
          React.createElement('option', { value: 'once_per_session' }, 'Uma vez por sessão (Padrão)'),
          React.createElement('option', { value: 'once_per_day' }, 'Uma vez por dia'),
          React.createElement('option', { value: 'once_ever' }, 'Apenas uma vez na vida')
        )
      ),

      // BOTÃO SALVAR
      React.createElement('button', { 
        onClick: handleSave, 
        disabled: loading, 
        style: { width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', opacity: loading ? 0.6 : 1, marginTop: '12px' }
      }, loading ? 'Salvando...' : 'Salvar Configurações')
    )
  );
}