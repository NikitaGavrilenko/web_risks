import React, { useState } from 'react';

interface RiskDetail {
  id: number;
  as_reserved_in_rcod: string;
  risk_label: string;
  rto_hours: string;
  mtpd: string;
  tr: string;
  high_risk_count?: number | string;
  total_risk_count?: number | string;
  process_threat_rating?: string;
}

interface RiskDetailsProps {
  riskDetails: RiskDetail;
}

// Компонент визуализации временных метрик
const TimeMetricsVisualizer: React.FC<{
  rto: number;
  mtpd: number;
  tr: number;
}> = ({ rto, mtpd, tr }) => {
  const roundMetricValue = (value: number): number => {
    if (value < 1) {
      return Math.round(value * 10) / 10;
    }
    return Math.round(value);
  };

  const mtpdCritical = roundMetricValue(mtpd * 1.3);
  const maxHours = Math.max(rto, mtpd, tr, mtpdCritical);

  const getTimelineLabels = (maxHours: number): number[] => {
    if (maxHours <= 1) return [0, 0.2, 0.4, 0.6, 0.8, 1];
    if (maxHours <= 2) return [0, 0.5, 1, 1.5, 2];
    if (maxHours <= 4) return [0, 1, 2, 3, 4];
    if (maxHours <= 8) return [0, 2, 4, 6, 8];
    if (maxHours <= 12) return [0, 3, 6, 9, 12];
    if (maxHours <= 24) return [0, 6, 12, 18, 24];
    const step = Math.ceil(maxHours / 5);
    return [0, step, step * 2, step * 3, step * 4, maxHours];
  };

  const timeLabels = getTimelineLabels(maxHours);

  return (
    <div className="time-metrics-visualizer">
      <h4 style={{ marginBottom: '16px', color: 'var(--text-primary)' }}>
        Временные метрики
      </h4>
      
      <div className="metrics-timeline" style={{
        position: 'relative',
        height: '120px',
        background: 'var(--surface-hover)',
        borderRadius: 'var(--radius-sm)',
        padding: '20px',
        marginBottom: '20px'
      }}>
        {/* Временная шкала */}
        <div className="timeline-scale" style={{
          position: 'absolute',
          bottom: '10px',
          left: '20px',
          right: '20px',
          height: '2px',
          background: 'var(--border)',
          borderRadius: '1px'
        }}>
          {timeLabels.map((hours, index) => (
            <div
              key={index}
              style={{
                position: 'absolute',
                left: `${(index / (timeLabels.length - 1)) * 100}%`,
                transform: 'translateX(-50%)',
                bottom: '-20px',
                fontSize: '11px',
                color: 'var(--text-secondary)'
              }}
            >
              {hours < 1 ? hours.toFixed(1) : Math.round(hours)}ч
            </div>
          ))}
        </div>

        {/* Метрики */}
        <div className="metrics-indicators">
          {/* RTO */}
          <div
            className="metric-indicator rto"
            style={{
              position: 'absolute',
              left: `${20 + (rto / maxHours) * (100 - 40)}%`,
              top: '20px',
              transform: 'translateX(-50%)'
            }}
          >
            <div style={{
              width: '3px',
              height: '60px',
              background: '#28a745',
              marginBottom: '4px'
            }} />
            <div style={{
              fontSize: '10px',
              fontWeight: '600',
              color: '#28a745',
              whiteSpace: 'nowrap'
            }}>
              RTO: {rto < 1 ? rto.toFixed(1) : Math.round(rto)}ч
            </div>
          </div>

          {/* MTPD */}
          <div
            className="metric-indicator mtpd"
            style={{
              position: 'absolute',
              left: `${20 + (mtpd / maxHours) * (100 - 40)}%`,
              top: '20px',
              transform: 'translateX(-50%)'
            }}
          >
            <div style={{
              width: '3px',
              height: '60px',
              background: '#ffc107',
              marginBottom: '4px'
            }} />
            <div style={{
              fontSize: '10px',
              fontWeight: '600',
              color: '#ffc107',
              whiteSpace: 'nowrap'
            }}>
              MTPD: {mtpd < 1 ? mtpd.toFixed(1) : Math.round(mtpd)}ч
            </div>
          </div>

          {/* MTPD Critical */}
          <div
            className="metric-indicator mtpd-critical"
            style={{
              position: 'absolute',
              left: `${20 + (mtpdCritical / maxHours) * (100 - 40)}%`,
              top: '20px',
              transform: 'translateX(-50%)'
            }}
          >
            <div style={{
              width: '3px',
              height: '60px',
              background: '#fd7e14',
              marginBottom: '4px'
            }} />
            <div style={{
              fontSize: '10px',
              fontWeight: '600',
              color: '#fd7e14',
              whiteSpace: 'nowrap'
            }}>
              MTPD×1.3: {mtpdCritical < 1 ? mtpdCritical.toFixed(1) : Math.round(mtpdCritical)}ч
            </div>
          </div>

          {/* TR (текущий) */}
          <div
            className="metric-indicator tr"
            style={{
              position: 'absolute',
              left: `${20 + (tr / maxHours) * (100 - 40)}%`,
              top: '20px',
              transform: 'translateX(-50%)'
            }}
          >
            <div style={{
              width: '4px',
              height: '60px',
              background: 'var(--primary-color)',
              marginBottom: '4px',
              borderRadius: '2px',
              boxShadow: '0 0 8px rgba(18, 189, 124, 0.5)'
            }} />
            <div style={{
              fontSize: '10px',
              fontWeight: '600',
              color: 'var(--primary-color)',
              whiteSpace: 'nowrap'
            }}>
              TR: {tr < 1 ? tr.toFixed(1) : Math.round(tr)}ч
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Компонент карточки статуса резервирования
const ReservationStatusCard: React.FC<{ status: string }> = ({ status }) => {
  const getStatusInfo = (status: string) => {
    const normalizedStatus = status?.toLowerCase() || '';
    
    if (normalizedStatus.includes('да') || normalizedStatus.includes('в плане')) {
      return {
        label: 'Резервируется',
        color: '#28a745',
        bgColor: 'rgba(40, 167, 69, 0.1)',
        icon: '✅'
      };
    } else if (normalizedStatus.includes('нет') || normalizedStatus.includes('не в плане')) {
      return {
        label: 'Не резервируется',
        color: '#dc3545',
        bgColor: 'rgba(220, 53, 69, 0.1)',
        icon: '❌'
      };
    } else {
      return {
        label: 'Статус неизвестен',
        color: '#6c757d',
        bgColor: 'rgba(108, 117, 125, 0.1)',
        icon: '❓'
      };
    }
  };

  const statusInfo = getStatusInfo(status);

  return (
    <div className="reservation-status-card" style={{
      background: statusInfo.bgColor,
      border: `1px solid ${statusInfo.color}40`,
      borderRadius: 'var(--radius-sm)',
      padding: '16px',
      marginBottom: '20px'
    }}>
      <h4 style={{
        margin: '0 0 8px 0',
        color: 'var(--text-primary)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        {statusInfo.icon} Резервирование в РСОД
      </h4>
      <div style={{
        color: statusInfo.color,
        fontWeight: '600',
        fontSize: '14px'
      }}>
        {statusInfo.label}
      </div>
    </div>
  );
};

// Основной компонент RiskDetails
const RiskDetails: React.FC<RiskDetailsProps> = ({ riskDetails }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'counts'>('overview');

  const parseNumericValue = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const rto = parseNumericValue(riskDetails.rto_hours);
  const mtpd = parseNumericValue(riskDetails.mtpd);
  const tr = parseNumericValue(riskDetails.tr);

  return (
    <div className="risk-details-container fade-in">
      <div className="tabs-container" style={{
        display: 'flex',
        borderBottom: '2px solid var(--border)',
        marginBottom: '24px'
      }}>
        {[
          { key: 'overview', label: '📊 Обзор', icon: '📊' },
          { key: 'metrics', label: '⏱️ Метрики', icon: '⏱️' },
          { key: 'counts', label: '📈 Статистика', icon: '📈' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              background: 'none',
              border: 'none',
              padding: '12px 20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              color: activeTab === tab.key ? 'var(--primary-color)' : 'var(--text-secondary)',
              borderBottom: activeTab === tab.key ? '2px solid var(--primary-color)' : '2px solid transparent',
              transition: 'var(--transition)'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="overview-tab slide-in">
          <ReservationStatusCard status={riskDetails.as_reserved_in_rcod} />
          
          <div className="risk-info-card" style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '20px'
          }}>
            <h4 style={{ margin: '0 0 16px 0', color: 'var(--text-primary)' }}>
              📋 Информация о риске
            </h4>
            
            <div className="info-grid" style={{
              display: 'grid',
              gap: '12px'
            }}>
              <div className="info-item">
                <strong style={{ color: 'var(--text-primary)' }}>Метка риска:</strong>
                <div style={{ 
                  marginTop: '4px',
                  padding: '8px 12px',
                  background: 'var(--surface-hover)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px'
                }}>
                  {riskDetails.risk_label || 'Не указана'}
                </div>
              </div>
              
              {riskDetails.process_threat_rating && (
                <div className="info-item">
                  <strong style={{ color: 'var(--text-primary)' }}>Рейтинг угрозы:</strong>
                  <div style={{ 
                    marginTop: '4px',
                    padding: '8px 12px',
                    background: 'var(--surface-hover)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px'
                  }}>
                    {riskDetails.process_threat_rating}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'metrics' && (
        <div className="metrics-tab slide-in">
          <TimeMetricsVisualizer rto={rto} mtpd={mtpd} tr={tr} />
          
          <div className="metrics-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
            gap: '16px'
          }}>
            <div className="metric-card">
              <span className="metric-value" style={{ color: '#28a745' }}>
                {rto < 1 ? rto.toFixed(1) : Math.round(rto)}
              </span>
              <span className="metric-label">RTO (часы)</span>
            </div>
            <div className="metric-card">
              <span className="metric-value" style={{ color: '#ffc107' }}>
                {mtpd < 1 ? mtpd.toFixed(1) : Math.round(mtpd)}
              </span>
              <span className="metric-label">MTPD</span>
            </div>
            <div className="metric-card">
              <span className="metric-value" style={{ color: 'var(--primary-color)' }}>
                {tr < 1 ? tr.toFixed(1) : Math.round(tr)}
              </span>
              <span className="metric-label">TR</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'counts' && (
        <div className="counts-tab slide-in">
          <div className="statistics-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px'
          }}>
            {riskDetails.high_risk_count && (
              <div className="stat-card" style={{
                background: 'rgba(220, 53, 69, 0.1)',
                border: '1px solid rgba(220, 53, 69, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#dc3545',
                  marginBottom: '8px'
                }}>
                  {riskDetails.high_risk_count}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#dc3545',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '600'
                }}>
                  Высокие риски
                </div>
              </div>
            )}
            
            {riskDetails.total_risk_count && (
              <div className="stat-card" style={{
                background: 'rgba(18, 189, 124, 0.1)',
                border: '1px solid rgba(18, 189, 124, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: 'var(--primary-color)',
                  marginBottom: '8px'
                }}>
                  {riskDetails.total_risk_count}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--primary-color)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '600'
                }}>
                  Всего рисков
                </div>
              </div>
            )}
            
            {riskDetails.high_risk_count && riskDetails.total_risk_count && (
              <div className="stat-card" style={{
                background: 'rgba(255, 193, 7, 0.1)',
                border: '1px solid rgba(255, 193, 7, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '32px',
                  fontWeight: '700',
                  color: '#ffc107',
                  marginBottom: '8px'
                }}>
                  {Math.round((Number(riskDetails.high_risk_count) / Number(riskDetails.total_risk_count)) * 100)}%
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#ffc107',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: '600'
                }}>
                  Доля высоких рисков
                </div>
              </div>
            )}
          </div>
          
          {(!riskDetails.high_risk_count && !riskDetails.total_risk_count) && (
            <div className="no-stats" style={{
              textAlign: 'center',
              padding: '40px',
              color: 'var(--text-secondary)'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>
                📊
              </div>
              <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
                Статистика недоступна
              </h4>
              <p style={{ margin: 0, fontSize: '14px' }}>
                Данные о количестве рисков не найдены
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RiskDetails;