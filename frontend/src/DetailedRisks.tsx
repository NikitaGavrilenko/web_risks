import React, { useState, useMemo } from 'react';

interface DetailedRiskReport {
  id: number;
  process: string;
  process_sid: string;
  threat_type: string;
  threat_scenario: string;
  impact_type: string;
  risk_subcategory: string;
  risk_group: string;
  risk_subgroup: string;
  integral_risk: string;
  operational_risk: string;
  reputational_risk: string;
  regulatory_risk: string;
  financial_risk: string;
  impact_assessment: string;
  probability_assessment: string;
  control_assessment: string;
  risk_level: string;
  rto_hours: string;
  mtpd: string;
  tr: string;
  risk_assessment_explanation: string;
  as_reserved_in_rcod: string;
}

interface FilterState {
  impact_type: string[];
  risk_level: string[];
  as_reserved_in_rcod: string[];
  search: string;
}

interface DetailedRisksProps {
  detailedRisks: DetailedRiskReport[];
}

// Компонент фильтра
const FilterDropdown: React.FC<{
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  icon?: string;
}> = ({ label, options, selected, onChange, icon = '🔍' }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOption = (option: string) => {
    if (selected.includes(option)) {
      onChange(selected.filter(item => item !== option));
    } else {
      onChange([...selected, option]);
    }
  };

  const selectAll = () => onChange(options);
  const clearAll = () => onChange([]);

  return (
    <div className="filter-dropdown" style={{ position: 'relative', marginBottom: '16px' }}>
      <div
        className="filter-header"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px 16px',
          background: 'var(--surface)',
          border: '2px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'var(--transition)'
        }}
      >
        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>
          {icon} {label}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {selected.length > 0 && (
            <span style={{
              background: 'var(--primary-color)',
              color: 'white',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {selected.length}
            </span>
          )}
          <span style={{ color: 'var(--text-secondary)' }}>
            {isOpen ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {isOpen && (
        <div className="filter-options" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-sm)',
          boxShadow: 'var(--shadow-md)',
          zIndex: 100,
          maxHeight: '250px',
          overflowY: 'auto'
        }}>
          <div style={{
            padding: '8px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            gap: '8px'
          }}>
            <button
              onClick={selectAll}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                background: 'var(--primary-color)',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Все
            </button>
            <button
              onClick={clearAll}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                background: 'var(--border)',
                color: 'var(--text-primary)',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Очистить
            </button>
          </div>
          
          {options.map(option => (
            <div
              key={option}
              onClick={() => toggleOption(option)}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: selected.includes(option) ? 'rgba(18, 189, 124, 0.1)' : 'transparent',
                color: selected.includes(option) ? 'var(--primary-color)' : 'var(--text-primary)',
                fontSize: '14px',
                transition: 'var(--transition)'
              }}
            >
              <span style={{
                width: '16px',
                height: '16px',
                border: '2px solid',
                borderColor: selected.includes(option) ? 'var(--primary-color)' : 'var(--border)',
                borderRadius: '3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px'
              }}>
                {selected.includes(option) ? '✓' : ''}
              </span>
              {option || 'Не указано'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент карточки риска
const RiskCard: React.FC<{
  risk: DetailedRiskReport;
  onClick: () => void;
}> = ({ risk, onClick }) => {
  const getRiskColor = (level: string) => {
    const l = level?.toLowerCase() || '';
    if (l.includes('критический')) return '#dc3545';
    if (l.includes('высокий')) return '#ffc107';
    if (l.includes('средний')) return '#fd7e14';
    if (l.includes('низкий')) return '#28a745';
    return '#6c757d';
  };

  const getReservationStatus = (status: string) => {
    const s = status?.toLowerCase() || '';
    if (s.includes('да') || s.includes('в плане')) return { label: 'Резерв', color: '#28a745' };
    if (s.includes('нет') || s.includes('не в плане')) return { label: 'Нет резерва', color: '#dc3545' };
    return { label: 'Неизвестно', color: '#6c757d' };
  };

  const reservationStatus = getReservationStatus(risk.as_reserved_in_rcod);
  const riskColor = getRiskColor(risk.risk_level);

  return (
    <div
      className="risk-card"
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '2px solid var(--border)',
        borderLeft: `6px solid ${riskColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        cursor: 'pointer',
        transition: 'var(--transition)',
        marginBottom: '16px'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--primary-color)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-md)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div className="risk-header" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '12px'
      }}>
        <h4 style={{
          margin: 0,
          color: 'var(--text-primary)',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          {risk.impact_type}
        </h4>
        <div style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span style={{
            background: `${riskColor}20`,
            color: riskColor,
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {risk.risk_level}
          </span>
          <span style={{
            background: `${reservationStatus.color}20`,
            color: reservationStatus.color,
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600'
          }}>
            {reservationStatus.label}
          </span>
        </div>
      </div>

      <div className="risk-content">
        <p style={{
          margin: '0 0 8px 0',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          lineHeight: 1.4
        }}>
          <strong>Подкатегория:</strong> {risk.risk_subcategory}
        </p>
        
        <div className="metrics-row" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginTop: '16px'
        }}>
          <div className="metric" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#28a745'
            }}>
              {risk.rto_hours}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase'
            }}>
              RTO
            </div>
          </div>
          <div className="metric" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: '#ffc107'
            }}>
              {risk.mtpd}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase'
            }}>
              MTPD
            </div>
          </div>
          <div className="metric" style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: '18px',
              fontWeight: '700',
              color: 'var(--primary-color)'
            }}>
              {risk.tr}
            </div>
            <div style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase'
            }}>
              TR
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Компонент детального модала
const RiskModal: React.FC<{
  risk: DetailedRiskReport | null;
  onClose: () => void;
}> = ({ risk, onClose }) => {
  if (!risk) return null;

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="modal-content" style={{
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <div className="modal-header" style={{
          padding: '24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{
            margin: 0,
            color: 'var(--text-primary)',
            fontSize: '20px'
          }}>
            Детальная информация о риске
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              padding: '4px'
            }}
          >
            ×
          </button>
        </div>
        
        <div className="modal-body" style={{
          padding: '24px',
          overflowY: 'auto',
          maxHeight: 'calc(80vh - 100px)'
        }}>
          <div style={{ display: 'grid', gap: '20px' }}>
            <div className="section">
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary-color)' }}>
                🎯 Основная информация
              </h4>
              <div style={{ display: 'grid', gap: '8px' }}>
                <p><strong>Тип воздействия:</strong> {risk.impact_type}</p>
                <p><strong>Подкатегория риска:</strong> {risk.risk_subcategory}</p>
                <p><strong>Группа риска:</strong> {risk.risk_group}</p>
                <p><strong>Подгруппа риска:</strong> {risk.risk_subgroup}</p>
              </div>
            </div>

            <div className="section">
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary-color)' }}>
                📊 Оценки рисков
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Интегральный:</strong><br/>{risk.integral_risk}
                </div>
                <div style={{ padding: '12px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Операционный:</strong><br/>{risk.operational_risk}
                </div>
                <div style={{ padding: '12px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Репутационный:</strong><br/>{risk.reputational_risk}
                </div>
                <div style={{ padding: '12px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Регуляторный:</strong><br/>{risk.regulatory_risk}
                </div>
                <div style={{ padding: '12px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                  <strong>Финансовый:</strong><br/>{risk.financial_risk}
                </div>
              </div>
            </div>

            <div className="section">
              <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary-color)' }}>
                ⏱️ Временные показатели
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <div style={{ textAlign: 'center', padding: '16px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#28a745' }}>{risk.rto_hours}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>RTO (часы)</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: '#ffc107' }}>{risk.mtpd}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>MTPD</div>
                </div>
                <div style={{ textAlign: 'center', padding: '16px', background: 'var(--surface-hover)', borderRadius: 'var(--radius-sm)' }}>
                  <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-color)' }}>{risk.tr}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>TR</div>
                </div>
              </div>
            </div>

            {risk.risk_assessment_explanation && (
              <div className="section">
                <h4 style={{ margin: '0 0 12px 0', color: 'var(--primary-color)' }}>
                  📝 Пояснение к оценке риска
                </h4>
                <div style={{
                  padding: '16px',
                  background: 'var(--surface-hover)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  lineHeight: 1.6
                }}>
                  {risk.risk_assessment_explanation}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Основной компонент
const DetailedRisks: React.FC<DetailedRisksProps> = ({ detailedRisks }) => {
  const [filters, setFilters] = useState<FilterState>({
    impact_type: [],
    risk_level: [],
    as_reserved_in_rcod: [],
    search: ''
  });
  
  const [selectedRisk, setSelectedRisk] = useState<DetailedRiskReport | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');

  // Получение уникальных значений для фильтров
  const getUniqueValues = (field: keyof DetailedRiskReport): string[] => {
    const values = detailedRisks.map(risk => String(risk[field])).filter(Boolean);
    return [...new Set(values)].sort();
  };

  // Фильтрация рисков
  const filteredRisks = useMemo(() => {
    return detailedRisks.filter(risk => {
      // Поиск по тексту
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const searchableFields = [
          risk.impact_type,
          risk.risk_subcategory,
          risk.risk_group,
          risk.risk_assessment_explanation
        ].join(' ').toLowerCase();
        
        if (!searchableFields.includes(searchLower)) {
          return false;
        }
      }

      // Фильтры по полям
      const fieldFilters = [
        { filter: filters.impact_type, field: risk.impact_type },
        { filter: filters.risk_level, field: risk.risk_level },
        { filter: filters.as_reserved_in_rcod, field: risk.as_reserved_in_rcod }
      ];

      return fieldFilters.every(({ filter, field }) => 
        filter.length === 0 || filter.includes(field)
      );
    });
  }, [detailedRisks, filters]);

  if (detailedRisks.length === 0) {
    return (
      <div className="no-risks" style={{
        textAlign: 'center',
        padding: '80px 20px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.5 }}>📊</div>
        <h3 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
          Нет детальных данных
        </h3>
        <p style={{ margin: 0, fontSize: '14px' }}>
          Детальные отчеты по рискам отсутствуют
        </p>
      </div>
    );
  }

  return (
    <div className="detailed-risks-container fade-in">
      <div className="risks-header" style={{
        marginBottom: '24px',
        padding: '24px',
        background: 'var(--surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
            📋 Детальные отчеты по рискам ({filteredRisks.length})
          </h3>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                padding: '8px 16px',
                background: viewMode === 'cards' ? 'var(--primary-color)' : 'var(--surface-hover)',
                color: viewMode === 'cards' ? 'white' : 'var(--text-primary)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              🎴 Карточки
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: '8px 16px',
                background: viewMode === 'list' ? 'var(--primary-color)' : 'var(--surface-hover)',
                color: viewMode === 'list' ? 'white' : 'var(--text-primary)',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              📋 Список
            </button>
          </div>
        </div>

        {/* Поиск */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="🔍 Поиск по описанию, категории или группе риска..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '14px',
              background: 'var(--surface)',
              color: 'var(--text-primary)',
              transition: 'var(--transition)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--primary-color)';
              e.target.style.boxShadow = '0 0 0 3px rgba(18, 189, 124, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Фильтры */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <FilterDropdown
            label="Тип воздействия"
            options={getUniqueValues('impact_type')}
            selected={filters.impact_type}
            onChange={(selected) => setFilters(prev => ({ ...prev, impact_type: selected }))}
            icon="🎯"
          />
          <FilterDropdown
            label="Уровень риска"
            options={getUniqueValues('risk_level')}
            selected={filters.risk_level}
            onChange={(selected) => setFilters(prev => ({ ...prev, risk_level: selected }))}
            icon="⚠️"
          />
          <FilterDropdown
            label="Резервирование"
            options={getUniqueValues('as_reserved_in_rcod')}
            selected={filters.as_reserved_in_rcod}
            onChange={(selected) => setFilters(prev => ({ ...prev, as_reserved_in_rcod: selected }))}
            icon="🔄"
          />
        </div>
      </div>

      {/* Результаты */}
      <div className="risks-content">
        {viewMode === 'cards' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '20px'
          }}>
            {filteredRisks.map(risk => (
              <RiskCard
                key={risk.id}
                risk={risk}
                onClick={() => setSelectedRisk(risk)}
              />
            ))}
          </div>
        ) : (
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {filteredRisks.map((risk, index) => (
              <div
                key={risk.id}
                onClick={() => setSelectedRisk(risk)}
                style={{
                  padding: '16px 20px',
                  borderBottom: index < filteredRisks.length - 1 ? '1px solid var(--border)' : 'none',
                  cursor: 'pointer',
                  transition: 'var(--transition)',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto auto auto',
                  gap: '16px',
                  alignItems: 'center'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface-hover)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{risk.impact_type}</div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{risk.risk_subcategory}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{risk.rto_hours}ч</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>RTO</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{risk.mtpd}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>MTPD</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600' }}>{risk.tr}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>TR</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredRisks.length === 0 && (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.5 }}>🔍</div>
            <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
              Ничего не найдено
            </h4>
            <p style={{ margin: 0, fontSize: '14px' }}>
              Попробуйте изменить параметры фильтрации
            </p>
          </div>
        )}
      </div>

      {/* Модальное окно */}
      <RiskModal
        risk={selectedRisk}
        onClose={() => setSelectedRisk(null)}
      />
    </div>
  );
};

export default DetailedRisks;