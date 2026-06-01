import React from 'react';
import './MetricCard.css';

export interface MetricCardProps {
  icon?: string;
  label: string;
  value: number | string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  label,
  value,
  trend,
  isLoading,
  error,
  onRetry,
}) => {
  return (
    <div className="metric-card">
      {icon && <div className="metric-icon">{icon}</div>}
      <div className="metric-content">
        <div className="metric-label">{label}</div>
        {isLoading ? (
          <div className="metric-value loading">—</div>
        ) : error ? (
          <div className="metric-error">
            <p>{error}</p>
            {onRetry && (
              <button onClick={onRetry} className="retry-button">
                Tentar novamente
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="metric-value">{value}</div>
            {trend && (
              <div className={`metric-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
                {trend.isPositive ? '+' : '−'}{trend.value}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
