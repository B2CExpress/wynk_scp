import { useEffect, useState } from 'react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:3001';

interface ImpersonationBannerProps {
  tenantName?: string;
  refreshTrigger?: number;
}

/**
 * Banner vermelho fixo no topo indicando impersonação ativa.
 * Aparece em todas as páginas /admin quando o cookie de impersonação está presente.
 * Impossível fechar sem clicar em "Encerrar impersonação".
 */
export function ImpersonationBanner({ tenantName, refreshTrigger }: ImpersonationBannerProps) {
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkImpersonation = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: 'include',
        });

        if (res.ok) {
          const data = (await res.json()) as { user?: { impersonating?: boolean } };
          // Se o backend retornar impersonating flag, usar; senão, verificar cookie
          setIsImpersonating(data.user?.impersonating ?? false);
        }
      } catch {
        // Erro ao checar - não fazer nada
      }
    };

    checkImpersonation();
  }, [refreshTrigger]);

  const handleStop = async () => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/superadmin/impersonate/stop`, {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        const data = (await res.json()) as { redirect_url?: string };
        window.location.href = data.redirect_url ?? '/admin/tenants';
      } else {
        alert('Erro ao encerrar impersonação');
      }
    } catch {
      alert('Erro ao conectar com o servidor');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isImpersonating) {
    return null;
  }

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#dc2626',
        color: 'white',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        fontWeight: 600,
      }}
    >
      <span>
        Você está impersonando <strong>{tenantName ?? 'Tenant'}</strong> — suas ações serão
        auditadas.
      </span>
      <button
        onClick={handleStop}
        disabled={isLoading}
        style={{
          backgroundColor: 'white',
          color: '#dc2626',
          border: 'none',
          padding: '6px 12px',
          borderRadius: '4px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontWeight: 600,
          opacity: isLoading ? 0.7 : 1,
        }}
      >
        {isLoading ? 'Encerrando...' : 'Encerrar impersonação'}
      </button>
    </div>
  );
}
