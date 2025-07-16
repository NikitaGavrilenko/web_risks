import React from 'react';

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
  riskDetails: RiskDetail | null;
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

const RiskDetails: React.FC<RiskDetailsProps> = ({ riskDetails }) => {
  if (!riskDetails) {
    return <div>Нет данных для отображения.</div>;
  }

  return (
    <div className="risk-details">
      <h3>Базовая информация</h3>
      <div className="metrics-grid">
        <div className="metric-box" title="Количество высоких рисков">
          <div className="metric-value">{formatValue(riskDetails.high_risk_count)}</div>
        </div>
        <div className="metric-box" title="Общее количество рисков">
          <div className="metric-value">{formatValue(riskDetails.total_risk_count)}</div>
        </div>
        <div className="metric-box" title="Рейтинг процесса для угрозы">
          <div className="metric-value">{formatValue(riskDetails.process_threat_rating)}</div>
        </div>
      </div>
    </div>
  );
};

export default RiskDetails;
