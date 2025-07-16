import React, { useState, useEffect, useRef, useCallback } from 'react';
import './index.css';
import Login from './Login.tsx';

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

interface GraphNode {
  id: string;
  type: 'process' | 'threat';
  x: number;
  y: number;
  data: Process | Threat;
  connections: string[];
}

// Компонент поиска процессов
const ProcessSearch: React.FC<{ onSearch: (query: string) => void }> = ({ onSearch }) => {
  return (
    <div className="search-container">
      <input
        type="text"
        placeholder="Поиск процессов..."
        onChange={(e) => onSearch(e.target.value)}
        className="search-input"
      />
    </div>
  );
};

// Компонент графового узла
const GraphNode: React.FC<{
  node: GraphNode;
  isSelected: boolean;
  onClick: () => void;
}> = ({ node, isSelected, onClick }) => {
  const getRiskClass = (threat: Threat) => {
    const level = threat.integral_risk_level?.toLowerCase() || '';
    if (level.includes('критический') || level.includes('высокий')) return 'high-risk';
    if (level.includes('средний')) return 'medium-risk';
    if (level.includes('низкий')) return 'low-risk';
    return '';
  };

  return (
    <div
      className={`graph-node ${node.type}-node ${
        node.type === 'threat' ? getRiskClass(node.data as Threat) : ''
      } ${isSelected ? 'selected' : ''} fade-in`}
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
      }}
      onClick={onClick}
    >
      {node.type === 'process' ? (
        <div>
          <div className="process-name">{(node.data as Process).name}</div>
          <div className="process-sid">{(node.data as Process).sid}</div>
        </div>
      ) : (
        <div>
          <div className="threat-type">{(node.data as Threat).type}</div>
          <div className="threat-scenario">
            {(node.data as Threat).scenario.substring(0, 50)}...
          </div>
        </div>
      )}
    </div>
  );
};

// Компонент соединительной линии
const ConnectionLine: React.FC<{
  from: GraphNode;
  to: GraphNode;
  isActive: boolean;
}> = ({ from, to, isActive }) => {
  const length = Math.sqrt(
    Math.pow(to.x - from.x, 2) + Math.pow(to.y - from.y, 2)
  );
  const angle = Math.atan2(to.y - from.y, to.x - from.x) * (180 / Math.PI);

  return (
    <div
      className={`connection-line ${isActive ? 'active' : ''}`}
      style={{
        left: `${from.x + 100}px`, // смещение к центру узла
        top: `${from.y + 50}px`,
        width: `${length}px`,
        transform: `rotate(${angle}deg)`,
      }}
    />
  );
};

// Компонент детальной панели
const DetailPanel: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  selectedItem: Process | Threat | null;
  riskDetails: RiskDetail | null;
  detailedReports: DetailedRiskReport[];
}> = ({ isOpen, onClose, selectedItem, riskDetails, detailedReports }) => {
  if (!selectedItem) return null;

  const isProcess = 'sid' in selectedItem;

  return (
    <div className={`detail-panel ${isOpen ? 'open' : ''}`}>
      <div className="detail-panel-header">
        <h3 className="detail-panel-title">
          {isProcess ? 'Детали процесса' : 'Детали угрозы'}
        </h3>
        <button className="detail-panel-close" onClick={onClose}>
          ×
        </button>
      </div>
      
      <div className="detail-content">
        {isProcess ? (
          <ProcessDetails process={selectedItem as Process} />
        ) : (
          <ThreatDetails 
            threat={selectedItem as Threat} 
            riskDetails={riskDetails}
            detailedReports={detailedReports}
          />
        )}
      </div>
    </div>
  );
};

// Компонент деталей процесса
const ProcessDetails: React.FC<{ process: Process }> = ({ process }) => (
  <div className="slide-in">
    <div className="metrics-grid">
      <div className="metric-card">
        <span className="metric-value">{process.rating}</span>
        <span className="metric-label">Рейтинг</span>
      </div>
    </div>
    
    <div className="detail-section">
      <h4>Информация о процессе</h4>
      <p><strong>Код:</strong> {process.sid}</p>
      <p><strong>Название:</strong> {process.name}</p>
      <p><strong>Владелец:</strong> {process.owner_block}</p>
      <p><strong>Отдел:</strong> {process.department}</p>
      <p>
        <strong>Уровень риска:</strong> 
        <span className={`status-badge ${
          process.risk_label.includes('Высокий') ? 'status-high' : 'status-low'
        }`}>
          {process.risk_label}
        </span>
      </p>
    </div>
  </div>
);

// Компонент деталей угрозы
const ThreatDetails: React.FC<{
  threat: Threat;
  riskDetails: RiskDetail | null;
  detailedReports: DetailedRiskReport[];
}> = ({ threat, riskDetails, detailedReports }) => (
  <div className="slide-in">
    {riskDetails && (
      <div className="metrics-grid">
        <div className="metric-card">
          <span className="metric-value">{riskDetails.rto_hours}</span>
          <span className="metric-label">RTO (часы)</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{riskDetails.mtpd}</span>
          <span className="metric-label">MTPD</span>
        </div>
        <div className="metric-card">
          <span className="metric-value">{riskDetails.tr}</span>
          <span className="metric-label">TR</span>
        </div>
      </div>
    )}
    
    <div className="detail-section">
      <h4>Информация об угрозе</h4>
      <p><strong>Тип:</strong> {threat.type}</p>
      <p><strong>Сценарий:</strong> {threat.scenario}</p>
      <p>
        <strong>Интегральный риск:</strong>
        <span className={`status-badge ${getStatusClass(threat.integral_risk_level)}`}>
          {threat.integral_risk_level}
        </span>
      </p>
      <p>
        <strong>Высший уровень риска:</strong>
        <span className={`status-badge ${getStatusClass(threat.highest_risk_level)}`}>
          {threat.highest_risk_level}
        </span>
      </p>
      {threat.threat_rating && (
        <p>
          <strong>Рейтинг угрозы:</strong>
          <span className={`status-badge ${getStatusClass(threat.threat_rating)}`}>
            {threat.threat_rating}
          </span>
        </p>
      )}
    </div>

    {riskDetails && (
      <div className="detail-section">
        <h4>Детали риска</h4>
        <p><strong>Резервирование в РСОД:</strong> {riskDetails.as_reserved_in_rcod}</p>
        <p><strong>Метка риска:</strong> {riskDetails.risk_label}</p>
        {riskDetails.high_risk_count && (
          <p><strong>Количество высоких рисков:</strong> {riskDetails.high_risk_count}</p>
        )}
        {riskDetails.total_risk_count && (
          <p><strong>Общее количество рисков:</strong> {riskDetails.total_risk_count}</p>
        )}
      </div>
    )}

    {detailedReports.length > 0 && (
      <div className="detail-section">
        <h4>Детальные отчеты ({detailedReports.length})</h4>
        <div className="reports-list">
          {detailedReports.slice(0, 3).map((report, index) => (
            <div key={report.id} className="report-card">
              <p><strong>Тип воздействия:</strong> {report.impact_type}</p>
              <p><strong>Подкатегория риска:</strong> {report.risk_subcategory}</p>
              <p>
                <strong>Уровень риска:</strong>
                <span className={`status-badge ${getStatusClass(report.risk_level)}`}>
                  {report.risk_level}
                </span>
              </p>
            </div>
          ))}
          {detailedReports.length > 3 && (
            <p className="more-reports">
              +{detailedReports.length - 3} дополнительных отчетов
            </p>
          )}
        </div>
      </div>
    )}
  </div>
);

// Утилитарная функция для определения класса статуса
const getStatusClass = (level: string): string => {
  if (!level) return '';
  const l = level.toLowerCase();
  if (l.includes('критический')) return 'status-critical';
  if (l.includes('высокий')) return 'status-high';
  if (l.includes('средний')) return 'status-medium';
  if (l.includes('низкий')) return 'status-low';
  return '';
};

// Главный компонент App
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Process | Threat | null>(null);

  // Состояние для графового представления
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Загрузка данных пользователя и процессов
  useEffect(() => {
    if (!isLoggedIn) return;

    // Загрузка информации о пользователе
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

    // Загрузка процессов
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

  // Создание графового представления
  const createGraphNodes = useCallback((process: Process, threats: Threat[]) => {
    const nodes: GraphNode[] = [];
    
    // Центральный узел процесса
    const processNode: GraphNode = {
      id: `process-${process.sid}`,
      type: 'process',
      x: 400, // центр экрана
      y: 200,
      data: process,
      connections: threats.map(t => `threat-${t.id}`)
    };
    nodes.push(processNode);

    // Узлы угроз вокруг процесса
    threats.forEach((threat, index) => {
      const angle = (index / threats.length) * 2 * Math.PI;
      const radius = 300;
      const x = 400 + Math.cos(angle) * radius;
      const y = 200 + Math.sin(angle) * radius;

      const threatNode: GraphNode = {
        id: `threat-${threat.id}`,
        type: 'threat',
        x: Math.max(50, Math.min(x, 800)), // ограничиваем позиции
        y: Math.max(50, Math.min(y, 400)),
        data: threat,
        connections: [`process-${process.sid}`]
      };
      nodes.push(threatNode);
    });

    return nodes;
  }, []);

  // Поиск процессов
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

  // Загрузка угроз для выбранного процесса
  useEffect(() => {
    if (!isLoggedIn || !selectedProcess) {
      setThreats([]);
      setGraphNodes([]);
      return;
    }

    setThreats([]);
    setSelectedThreat(null);
    setSelectedThreatDetails(null);
    setDetailedRisks([]);
    setError(null);

    fetch(`http://localhost:8000/threats/${selectedProcess.sid}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    })
      .then(response => response.json())
      .then(data => {
        const threatsArray = data || [];
        setThreats(threatsArray);
        
        // Создаем граф только если есть угрозы
        if (threatsArray.length > 0) {
          const nodes = createGraphNodes(selectedProcess, threatsArray);
          setGraphNodes(nodes);
        }
      })
      .catch(err => setError('Не удалось загрузить угрозы для процесса.'));
  }, [selectedProcess, isLoggedIn, createGraphNodes]);

  // Загрузка деталей угрозы
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
      } catch (err: any) {
        setError(err.message);
      }
    };

    fetchData();
  }, [selectedThreat, isLoggedIn]);

  // Обработка клика по узлу графа
  const handleNodeClick = (node: GraphNode) => {
    setSelectedNodeId(node.id);
    
    if (node.type === 'process') {
      setSelectedItem(node.data as Process);
    } else {
      setSelectedThreat(node.data as Threat);
      setSelectedItem(node.data as Threat);
    }
    
    setIsDetailPanelOpen(true);
  };

  // Выход из системы
  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setFullName('');
    setProcesses([]);
    setFilteredProcesses([]);
    setSelectedProcess(null);
    setGraphNodes([]);
    setSelectedNodeId(null);
    setSelectedItem(null);
    setIsDetailPanelOpen(false);
  };

  if (!isLoggedIn) {
    return <Login onLoginSuccess={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className="App">
      {/* Заголовок */}
      <header className="app-header">
        <div className="app-title">
          Система управления рисками
        </div>
        <div className="user-section">
          <div className="user-name">{fullName}</div>
          <button className="logout-btn" onClick={handleLogout}>
            Выйти
          </button>
        </div>
      </header>

      <div className="main-container">
        {/* Боковая панель */}
        <div className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-header">
            <h2 className="sidebar-title">Процессы</h2>
            <ProcessSearch onSearch={handleProcessSearch} />
          </div>
          
          <div className="process-list">
            {filteredProcesses.map(process => (
              <div
                key={process.sid}
                className={`process-item ${selectedProcess?.sid === process.sid ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedProcess(process);
                  setIsMobileMenuOpen(false);
                }}
              >
                <div className="process-name">{process.name}</div>
                <div className="process-sid">{process.sid}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Основной контент */}
        <div className="main-content">
          {selectedProcess && graphNodes.length > 0 ? (
            <div className="process-graph-container">
              <div className="graph-header">
                <h2 className="graph-title">{selectedProcess.name}</h2>
                <p className="graph-subtitle">
                  Интерактивная схема процесса и связанных угроз
                </p>
              </div>
              
              <div className="graph-area" style={{ position: 'relative', height: 'calc(100% - 100px)', padding: '20px' }}>
                {/* Соединительные линии */}
                {graphNodes
                  .filter(node => node.type === 'process')
                  .map(processNode =>
                    graphNodes
                      .filter(node => node.type === 'threat')
                      .map(threatNode => (
                        <ConnectionLine
                          key={`${processNode.id}-${threatNode.id}`}
                          from={processNode}
                          to={threatNode}
                          isActive={selectedNodeId === processNode.id || selectedNodeId === threatNode.id}
                        />
                      ))
                  )}

                {/* Узлы графа */}
                {graphNodes.map(node => (
                  <GraphNode
                    key={node.id}
                    node={node}
                    isSelected={selectedNodeId === node.id}
                    onClick={() => handleNodeClick(node)}
                  />
                ))}
              </div>
            </div>
          ) : selectedProcess ? (
            <div className="placeholder">
              <div className="placeholder-icon">📊</div>
              <h3 className="placeholder-title">Загрузка данных...</h3>
              <p className="placeholder-text">
                Загружаем информацию об угрозах для выбранного процесса
              </p>
            </div>
          ) : (
            <div className="placeholder">
              <div className="placeholder-icon">🔍</div>
              <h3 className="placeholder-title">Выберите процесс</h3>
              <p className="placeholder-text">
                Выберите процесс из списка слева для просмотра связанных с ним угроз и рисков
              </p>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Детальная панель */}
      <DetailPanel
        isOpen={isDetailPanelOpen}
        onClose={() => {
          setIsDetailPanelOpen(false);
          setSelectedItem(null);
          setSelectedNodeId(null);
        }}
        selectedItem={selectedItem}
        riskDetails={selectedThreatDetails}
        detailedReports={detailedRisks}
      />
    </div>
  );
}

export default App;