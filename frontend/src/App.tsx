import React, { useState, useEffect } from 'react';
import './index.css';
import Login from './Login.tsx';
import RiskDetails from './RiskDetails.tsx';
import DetailedRisks from './DetailedRisks.tsx';

// Определяем интерфейсы для наших данных
interface Process {
  id: number;
  sid: string;
  name: string;
  risk_label: string;
  owner_block: string;
  department: string;
  rating: number;
}

interface Threat {
  id: number;
  type: string;
  scenario: string;
  integral_risk_level: string;
  highest_risk_level: string;
  process_sid: string;
  threat_rating: string;
  threat_rating_color: string;
}

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

const ProcessSearch: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Поиск по названию или коду процесса..."
        onChange={(e) => onSearch(e.target.value)}
        className="search-input"
      />
    </div>
  );
};

const roundMetricValue = (value: number): number => {
  if (value < 1) {
    return Math.round(value * 10) / 10;
  }
  return Math.round(value);
};

const TimeMetricsVisualizer: React.FC<{
  rto: number;
  mtpd: number;
  tr: number;
}> = ({ rto, mtpd, tr }) => {
  const mtpdCritical = roundMetricValue(mtpd * 1.3);
  const maxHours = Math.max(rto, mtpd, tr, mtpdCritical);

  const getTimelineLabels = (maxHours: number): number[] => {
    if (maxHours <= 1) return [0, 0.2, 0.4, 0.6, 0.8, 1];
    if (maxHours <= 2) return [0, 0.5, 1, 1.5, 2];
    if (maxHours <= 4) return [0, 1, 2, 3, 4];
    if (maxHours <= 8) return [0, 2, 4, 6, 8];
    if (maxHours <= 12) return [0, 3, 6, 9, 12];
    if (maxHours <= 24) return [0, 6, 12, 18, 24];
    const step = maxHours / 5;
    return [0, step, step * 2, step * 3, step * 4, maxHours];
  };

  const timeLabels = getTimelineLabels(maxHours);

  return (
    <div className="time-metrics-container">
      <div className="metrics-timeline">
        <div className="timeline-labels">
          {timeLabels.map((hours, index) => (
            <div key={index}>{hours < 1 ? hours.toFixed(1) : Math.round(hours)}ч</div>
          ))}
        </div>
        <div className="timeline-grid">
          {timeLabels.map((_, index) => (
            <div key={index} className="grid-line" 
              style={{ left: `${(index / (timeLabels.length - 1)) * 100}%` }}></div>
          ))}
        </div>
        <div className="timeline-metrics">
          <div className="metrics-boundaries">
            <div className="metric rto" style={{ left: `${(rto / maxHours) * 100}%` }}>
              <div className="metric-line"></div>
              <div className="metric-label">RTO {rto < 1 ? rto.toFixed(1) : Math.round(rto)}ч</div>
            </div>
            <div className="metric mtpd" style={{ left: `${(mtpd / maxHours) * 100}%` }}>
              <div className="metric-line"></div>
              <div className="metric-label">MTPD {mtpd < 1 ? mtpd.toFixed(1) : Math.round(mtpd)}ч</div>
            </div>
            <div className="metric mtpd-critical" style={{ left: `${(mtpdCritical / maxHours) * 100}%` }}>
              <div className="metric-line"></div>
              <div className="metric-label">MTPD*1.3 {mtpdCritical < 1 ? mtpdCritical.toFixed(1) : Math.round(mtpdCritical)}ч</div>
            </div>
          </div>
          <div className="metrics-current">
            <div className="metric tr" style={{ left: `${(tr / maxHours) * 100}%` }}>
              <div className="metric-line"></div>
              <div className="metric-label">TR {tr < 1 ? tr.toFixed(1) : Math.round(tr)}ч</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!localStorage.getItem('token'));
  const [processes, setProcesses] = useState<Process[]>([]);
  const [filteredProcesses, setFilteredProcesses] = useState<Process[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [threats, setThreats] = useState<Threat[]>([]);
  const [selectedThreat, setSelectedThreat] = useState<Threat | null>(null);
  const [selectedThreatDetails, setSelectedThreatDetails] = useState<RiskDetail | null>(null);
  const [fullName, setFullName] = useState<string>('');
  const [detailedRisks, setDetailedRisks] = useState<DetailedRiskReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoggedIn) return;

    fetch('http://localhost:8000/users/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Ошибка авторизации');
        return res.json();
      })
      .then(userData => setFullName(userData.full_name || ''))
      .catch(() => setFullName(''));

    fetch('http://localhost:8000/processes', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Ошибка авторизации');
        return response.json();
      })
      .then(data => {
        const processesArray = Array.isArray(data) ? data : [];
        setProcesses(processesArray);
        setFilteredProcesses(processesArray);
      })
      .catch(err => setError('Не удалось загрузить список процессов.'));
  }, [isLoggedIn]);

  const handleProcessSearch = (query: string) => {
    const lowercaseQuery = query.toLowerCase();
    const filtered = processes.filter(process =>
      process.name.toLowerCase().includes(lowercaseQuery) ||
      process.sid.toLowerCase().includes(lowercaseQuery)
    );
    const sorted = filtered.sort((a, b) => 
      a.risk_label === 'Высокий интегральный риск' ? -1 : 1
    );
    setFilteredProcesses(sorted);
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    setThreats([]);
    setSelectedThreat(null);
    setSelectedThreatDetails(null);
    setDetailedRisks([]);
    setError(null);

    selectedProcess && fetch(`http://localhost:8000/threats/${selectedProcess.sid}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => response.json())
      .then(data => setThreats(data || []))
      .catch(err => setError('Не удалось загрузить угрозы для процесса.'));
  }, [selectedProcess, isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn || !selectedThreat) return;
    
    setError(null);
    const fetchData = async () => {
      try {
        const [detailsRes, reportRes] = await Promise.all([
          fetch(`http://localhost:8000/risk-details/${selectedThreat.process_sid}?threat_type=${encodeURIComponent(selectedThreat.type)}&threat_scenario=${encodeURIComponent(selectedThreat.scenario)}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }),
          fetch(`http://localhost:8000/detailed-risk-report/${selectedThreat.process_sid}?threat_type=${encodeURIComponent(selectedThreat.type)}&threat_scenario=${encodeURIComponent(selectedThreat.scenario)}`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          })
        ]);

        if (!detailsRes.ok || !reportRes.ok) throw new Error('Ошибка загрузки данных');
        
        const details = await detailsRes.json();
        const reports = await reportRes.json();
        
        setSelectedThreatDetails(details);
        setDetailedRisks(Array.isArray(reports) ? reports : [reports]);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, [selectedThreat, isLoggedIn]);

  const getRiskColor = (level: string | undefined | null): string => {
    if (!level) return '#6c757d';
    const l = level.toLowerCase();
    if (l.includes('критический')) return '#dc3545';
    if (l.includes('высокий')) return '#ffc107';
    if (l.includes('средний')) return '#fd7e14';
    if (l.includes('низкий')) return '#28a745';
    return '#6c757d';
  };

  if (!isLoggedIn) return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;

  return (
    <div className="App">
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '10px 20px', 
        backgroundColor: '#f5f5f5', 
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '20px' }}>Риски по процессам</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#333' }}>
            {fullName}
          </div>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              setIsLoggedIn(false);
              setFullName('');
              setProcesses([]);
              setFilteredProcesses([]);
              setSelectedProcess(null);
            }}
            style={{
              padding: '6px 12px',
              fontSize: '14px',
              cursor: 'pointer',
              backgroundColor: '#007bff',
              color: '#fff',
              border: 'none',
              borderRadius: '4px'
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      <div className="main-container" style={{ marginTop: '60px', display: 'flex' }}>
        <div className="sidebar">
          <h2>Процессы</h2>
          <ProcessSearch onSearch={handleProcessSearch} />
          <div className="process-list">
            {filteredProcesses.map(p => (
              <div
                key={p.sid}
                className={`process-item ${selectedProcess?.sid === p.sid ? 'selected' : ''}`}
                onClick={() => setSelectedProcess(p)}
              >
                <div className="process-name">{p.name}</div>
                <div className="process-sid">{p.sid}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="main-content">
          {selectedProcess ? (
            <>
              <h2>Угрозы для: {selectedProcess.name}</h2>
              <div className="threats-container" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {threats.map(threat => (
                  <div
                    key={`${threat.process_sid}-${threat.type}-${threat.scenario}`}
                    className={`threat-card ${
                      selectedThreat?.process_sid === threat.process_sid &&
                      selectedThreat?.type === threat.type &&
                      selectedThreat?.scenario === threat.scenario
                        ? 'selected'
                        : ''
                    }`}
                    style={{ 
                      flex: selectedThreat && !(
                        selectedThreat?.process_sid === threat.process_sid &&
                        selectedThreat?.type === threat.type &&
                        selectedThreat?.scenario === threat.scenario
                      ) ? '1 1 30%' : '3 1 60%',
                      opacity: selectedThreat && !(
                        selectedThreat?.process_sid === threat.process_sid &&
                        selectedThreat?.type === threat.type &&
                        selectedThreat?.scenario === threat.scenario
                      ) ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                      borderLeft: `5px solid ${getRiskColor(threat.integral_risk_level)}`,
                      backgroundColor: '#fff'
                    }}
                    onClick={() => setSelectedThreat(threat)}
                  >
                    <div className="threat-header">
                      <h3>{threat.type}</h3>
                      <div
                        className="threat-rating"
                        style={{
                          backgroundColor: threat.threat_rating_color || getRiskColor(threat.threat_rating),
                        }}
                      >
                        {threat.threat_rating || 'Нет данных'}
                      </div>
                    </div>
                    <p className="threat-scenario">{threat.scenario}</p>
                    <div className="threat-risks">
                      <div className="risk-item integral-risk">
                        <strong>Интегральный риск:</strong>
                        <span
                          style={{
                            color: getRiskColor(threat.integral_risk_level),
                            fontWeight: 'bold',
                          }}
                        >
                          {threat.integral_risk_level}
                        </span>
                      </div>
                      <div className="risk-item highest-risk">
                        <strong>Уровень наиболее высокого риска:</strong>
                        <span style={{ color: getRiskColor(threat.highest_risk_level) }}>
                          {threat.highest_risk_level}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <hr />
            </>
          ) : (
            <div className="placeholder">Выберите процесс для просмотра информации.</div>
          )}
        </div>
      </div>

      {/* Модальное окно для деталей риска */}
      {selectedThreat && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001
          }}
          onClick={() => setSelectedThreat(null)}
        >
          <div 
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxWidth: '90%',
              maxHeight: '90%',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              style={{
                position: 'absolute',
                right: '10px',
                top: '10px',
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#666'
              }}
              onClick={() => setSelectedThreat(null)}
            >
              ×
            </button>
            <div className="details-container">
              {error ? (
                <div className="error-message">{error}</div>
              ) : (
                <>
                  <RiskDetails riskDetails={selectedThreatDetails} />
                  <DetailedRisks detailedRisks={detailedRisks} />
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { TimeMetricsVisualizer };
export default App;
