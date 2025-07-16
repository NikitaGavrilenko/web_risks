import React, { useState } from 'react';
import { TimeMetricsVisualizer } from './App.tsx';

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
  rto_hours: string[];
  mtpd: string[];
  tr: string[];
  risk_assessment_explanation: string[];
}

interface DetailedRisksProps {
  detailedRisks: DetailedRiskReport[];
}

const formatValue = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return 'Нет данных';
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  return value;
};

const DetailedRisks: React.FC<DetailedRisksProps> = ({ detailedRisks }) => {
  const [filters, setFilters] = useState<FilterState>({
    impact_type: [],
    rto_hours: [],
    mtpd: [],
    tr: [],
    risk_assessment_explanation: []
  });

  const getUniqueValues = (field: keyof DetailedRiskReport): string[] => {
    const values = detailedRisks.map(risk => String(risk[field])).filter(Boolean);
    return [...new Set(values)];
  };

  const filteredRisks = detailedRisks.filter(risk => {
    return Object.entries(filters).every(([key, selectedValues]) => {
      if (selectedValues.length === 0) return true;
      const value = String(risk[key as keyof DetailedRiskReport]);
      return selectedValues.includes(value);
    });
  });

  const handleFilterChange = (column: keyof FilterState, values: string[]) => {
    setFilters(prev => ({
      ...prev,
      [column]: values
    }));
  };

  if (!detailedRisks || detailedRisks.length === 0) {
    return <div>Нет данных для отображения.</div>;
  }

  const getReservationColor = (asReserved: string | undefined | null): string => {
    if (!asReserved) return '#6c757d';
    const status = asReserved.toLowerCase();
    if (status === 'да' || status === 'в плане') return '#28a745';
    if (status === 'нет' || status === 'не в плане') return '#dc3545';
    return '#6c757d';
  };

  const getReservationStatus = (asReserved: string | undefined | null): string => {
    if (!asReserved) return 'Статус неизвестен';
    const status = asReserved.toLowerCase();
    if (status === 'да' || status === 'в плане') return 'В плане';
    if (status === 'нет' || status === 'не в плане') return 'Не в плане';
    return asReserved;
  };

  return (
    <div className="detailed-risks">
      <h3>Детальный отчет</h3>
      <div className="filters-container">
        <MultiSelectFilter
          column="impact_type"
          values={getUniqueValues('impact_type')}
          selectedValues={filters.impact_type}
          onChange={handleFilterChange}
        />
        <MultiSelectFilter
          column="rto_hours"
          values={getUniqueValues('rto_hours')}
          selectedValues={filters.rto_hours}
          onChange={handleFilterChange}
        />
        <MultiSelectFilter
          column="mtpd"
          values={getUniqueValues('mtpd')}
          selectedValues={filters.mtpd}
          onChange={handleFilterChange}
        />
        <MultiSelectFilter
          column="tr"
          values={getUniqueValues('tr')}
          selectedValues={filters.tr}
          onChange={handleFilterChange}
        />
      </div>
      <div className="risks-table">
        <table>
          <thead>
            <tr>
              <th>Тип влияния</th>
              <th>Временные метрики</th>
              <th>Визуализация метрик</th>
              <th>Автопояснение</th>
            </tr>
          </thead>
          <tbody>
            {filteredRisks.map((risk, index) => {
              const rtoHours = parseFloat(risk.rto_hours || '0');
              const mtpdHours = parseFloat(risk.mtpd || '0');
              const trHours = parseFloat(risk.tr || '0');
              const hasValidTimeMetrics = !isNaN(rtoHours) && !isNaN(mtpdHours) && !isNaN(trHours);
              const reservationColor = getReservationColor(risk.as_reserved_in_rcod);
              const reservationStatus = getReservationStatus(risk.as_reserved_in_rcod);

              return (
                <tr key={index}>
                  <td className="impact-type-cell">
                    <div className="impact-type-container">
                      <div 
                        className="reservation-indicator"
                        style={{ backgroundColor: reservationColor }}
                      ></div>
                      <div>{formatValue(risk.impact_type)}</div>
                    </div>
                  </td>
                  <td className="metrics-values">
                    <div className="metrics-container">
                      <div className="metrics-content">
                        <div className="reservation-status">
                          АС {reservationStatus} в РЦОД
                        </div>
                        <div className="metrics-list">
                          <p><strong>TR:</strong> {formatValue(trHours)}</p>
                          <p><strong>RTO:</strong> {formatValue(rtoHours)}</p>
                          <p><strong>MTPD:</strong> {formatValue(mtpdHours)}</p>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="metrics-cell">
                    {hasValidTimeMetrics && (
                      <TimeMetricsVisualizer
                        rto={rtoHours}
                        mtpd={mtpdHours}
                        tr={trHours}
                      />
                    )}
                  </td>
                  <td>{formatValue(risk.risk_assessment_explanation)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

interface MultiSelectFilterProps {
  column: keyof FilterState;
  values: string[];
  selectedValues: string[];
  onChange: (column: keyof FilterState, values: string[]) => void;
}

const MultiSelectFilter: React.FC<MultiSelectFilterProps> = ({ column, values, selectedValues, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getDisplayName = (column: string) => {
    const names: { [key: string]: string } = {
      impact_type: 'Тип влияния',
      rto_hours: 'RTO',
      mtpd: 'MTPD',
      tr: 'TR',
      risk_assessment_explanation: 'Автопояснение'
    };
    return names[column] || column;
  };

  const toggleValue = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onChange(column, newValues);
  };

  const selectAll = () => {
    onChange(column, values);
  };

  const clearAll = () => {
    onChange(column, []);
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.multiselect-filter')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`multiselect-filter ${isOpen ? 'active' : ''}`}>
      <div 
        className="multiselect-header" 
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{getDisplayName(column)}</span>
        <span className="selected-count">
          {selectedValues.length ? `${selectedValues.length}/${values.length}` : 'Все'}
        </span>
      </div>
      {isOpen && (
        <div className="multiselect-options">
          <div className="option-actions">
            <button onClick={selectAll}>Выбрать все</button>
            <button onClick={clearAll}>Очистить</button>
          </div>
          {values.map(value => (
            <label key={value} className="option-label">
              <input
                type="checkbox"
                checked={selectedValues.includes(value)}
                onChange={() => toggleValue(value)}
              />
              <span>{formatValue(value)}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default DetailedRisks;
