import React, { useEffect, useState } from 'react';
import { MetricCard } from '../components/MetricCard';
import './AdminDashboard.css';

export interface DashboardMetrics {
  stores_total: number;
  stores_active: number;
  events_upcoming: number;
  posts_published_30d: number;
  newsletter_subscribers: number;
  promotions_active: number;
  ga?: {
    configured: boolean;
    users_30d?: number;
    pageviews_30d?: number;
    error?: boolean;
  };
}

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch('/api/admin/dashboard/metrics', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.status === 401) {
        setError('Não autenticado. Faça login novamente.');
        return;
      }

      if (response.status === 403) {
        setError('Sem permissão para acessar este painel.');
        return;
      }

      if (!response.ok) {
        throw new Error('Falha ao carregar métricas');
      }

      const data: DashboardMetrics = await response.json();
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 60000); // Refresh a cada minuto
    return () => clearInterval(interval);
  }, []);

  if (error && !metrics) {
    return (
      <div className="admin-dashboard error-state">
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchMetrics} className="retry-button">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="subtitle">Visão geral da plataforma</p>
      </header>

      <div className="metrics-grid">
        <MetricCard
          icon="🏪"
          label="Lojas Ativas"
          value={metrics?.stores_active ?? '—'}
          trend={
            metrics
              ? {
                  value: `de ${metrics.stores_total}`,
                  isPositive: true,
                }
              : undefined
          }
          isLoading={isLoading}
        />

        <MetricCard
          icon="📅"
          label="Eventos Agendados"
          value={metrics?.events_upcoming ?? '—'}
          isLoading={isLoading}
        />

        <MetricCard
          icon="📰"
          label="Notícias (30 dias)"
          value={metrics?.posts_published_30d ?? '—'}
          isLoading={isLoading}
        />

        <MetricCard
          icon="📧"
          label="Newsletter"
          value={metrics?.newsletter_subscribers ?? '—'}
          isLoading={isLoading}
        />

        <MetricCard
          icon="🎁"
          label="Promoções Ativas"
          value={metrics?.promotions_active ?? '—'}
          isLoading={isLoading}
        />

        {metrics?.ga?.configured && (
          <MetricCard
            icon="📊"
            label="Usuários GA4 (30 dias)"
            value={metrics.ga.users_30d ?? '—'}
            error={metrics.ga.error ? 'Erro ao carregar dados do GA4' : undefined}
            onRetry={metrics.ga.error ? fetchMetrics : undefined}
            isLoading={isLoading}
          />
        )}

        {!metrics?.ga?.configured && (
          <MetricCard
            icon="⚙️"
            label="Google Analytics"
            value="—"
            error="Configure GA4 em Integrações"
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
};
