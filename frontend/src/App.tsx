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

// Компонент мини-карты для навигации
const GraphMinimap: React.FC<{
  nodes: GraphNode[];
  transform: { x: number; y: number; scale: number };
  containerSize: { width: number; height: number };
  graphSize: { width: number; height: number };
  onTransformChange: (transform: { x: number; y: number; scale: number }) => void;
}> = ({ nodes, transform, containerSize, graphSize, onTransformChange }) => {
  if (nodes.length === 0) return null;

  const minimapWidth = 200;
  const minimapHeight = 150;
  
  // Находим границы графа
  const minX = Math.min(...nodes.map(node => node.x));
  const maxX = Math.max(...nodes.map(node => node.x + 200));
  const minY = Math.min(...nodes.map(node => node.y));
  const maxY = Math.max(...nodes.map(node => node.y + 100));
  
  const graphWidth = maxX - minX;
  const graphHeight = maxY - minY;
  
  // Масштаб мини-карты
  const scaleX = minimapWidth / graphWidth;
  const scaleY = minimapHeight / graphHeight;
  const minimapScale = Math.min(scaleX, scaleY) * 0.8;

  // Обработчик клика по мини-карте
  const handleMinimapClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top - 24; // учитываем заголовок
    
    // Преобразуем координаты клика в координаты графа
    const graphClickX = (clickX / minimapScale) + minX;
    const graphClickY = (clickY / minimapScale) + minY;
    
    // Центрируем граф на точке клика
    const newX = containerSize.width / 2 - graphClickX * transform.scale;
    const newY = containerSize.height / 2 - graphClickY * transform.scale;
    
    onTransformChange({
      ...transform,
      x: newX,
      y: newY
    });
  };

  return (
    <div 
      style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        width: `${minimapWidth}px`,
        height: `${minimapHeight}px`,
        background: 'rgba(255, 255, 255, 0.95)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-md)',
        zIndex: 50
      }}
      onClick={handleMinimapClick}
    >
      {/* Заголовок мини-карты */}
      <div style={{
        padding: '4px 8px',
        background: 'var(--primary-color)',
        color: 'white',
        fontSize: '10px',
        fontWeight: '600',
        textAlign: 'center'
      }}>
        Карта навигации
      </div>
      
      {/* Область мини-карты */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 'calc(100% - 24px)',
        background: '#f8f9fa'
      }}>
        {/* Узлы на мини-карте */}
        {nodes.map(node => {
          const threat = node.data as Threat;
          let nodeColor = 'var(--primary-color)';
          
          if (node.type === 'threat') {
            const level = threat.integral_risk_level?.toLowerCase() || '';
            if (level.includes('критический') || level.includes('высокий')) {
              nodeColor = '#dc3545';
            } else if (level.includes('средний')) {
              nodeColor = '#ffc107';
            } else if (level.includes('низкий')) {
              nodeColor = '#28a745';
            } else {
              nodeColor = '#6c757d';
            }
          }
          
          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: `${(node.x - minX) * minimapScale}px`,
                top: `${(node.y - minY) * minimapScale}px`,
                width: `${Math.max(4, 200 * minimapScale)}px`,
                height: `${Math.max(3, 100 * minimapScale)}px`,
                background: nodeColor,
                borderRadius: '1px',
                opacity: 0.8
              }}
            />
          );
        })}
        
        {/* Видимая область */}
        <div style={{
          position: 'absolute',
          left: `${Math.max(0, (-transform.x / transform.scale - minX) * minimapScale)}px`,
          top: `${Math.max(0, (-transform.y / transform.scale - minY) * minimapScale)}px`,
          width: `${Math.min(minimapWidth, (containerSize.width / transform.scale) * minimapScale)}px`,
          height: `${Math.min(minimapHeight - 24, (containerSize.height / transform.scale) * minimapScale)}px`,
          border: '2px solid var(--primary-color)',
          background: 'rgba(18, 189, 124, 0.1)',
          pointerEvents: 'none'
        }} />
      </div>
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
}> = ({ threat, riskDetails, detailedReports }) => {
  const getStatusClass = (level: string): string => {
    if (!level) return '';
    const l = level.toLowerCase();
    if (l.includes('критический')) return 'status-critical';
    if (l.includes('высокий')) return 'status-high';
    if (l.includes('средний')) return 'status-medium';
    if (l.includes('низкий')) return 'status-low';
    return '';
  };

  return (
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
  const [isAdjustingNodes, setIsAdjustingNodes] = useState(false);
  const [hasOverlappingNodes, setHasOverlappingNodes] = useState(false);

  // Состояние для графового представления
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [graphTransform, setGraphTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 1000, height: 600 });
  const graphContainerRef = useRef<HTMLDivElement>(null);

  // Создание графового представления с улучшенным алгоритмом
  const createGraphNodes = useCallback((process: Process, threats: Threat[]) => {
    const nodes: GraphNode[] = [];
    
    // Получаем размеры контейнера
    const containerWidth = 1400;
    const containerHeight = 1000;
    const nodeWidth = 220;
    const nodeHeight = 120;
    const minDistance = 300; // увеличиваем минимальное расстояние
    
    // Центральный узел процесса
    const centerX = containerWidth / 2;
    const centerY = containerHeight / 2;
    
    const processNode: GraphNode = {
      id: `process-${process.sid}`,
      type: 'process',
      x: centerX - nodeWidth / 2,
      y: centerY - nodeHeight / 2,
      data: process,
      connections: threats.map(t => `threat-${t.id}`)
    };
    nodes.push(processNode);

    // Функция для проверки пересечения с увеличенной зоной безопасности
    const checkCollision = (x1: number, y1: number, x2: number, y2: number, safetyMargin = 80) => {
      const actualDistance = Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
      return actualDistance < minDistance + safetyMargin;
    };

    // Функция для получения всех позиций узлов
    const getAllNodePositions = () => {
      return nodes.map(node => ({
        x: node.x + nodeWidth / 2,
        y: node.y + nodeHeight / 2,
        id: node.id
      }));
    };

    // Улучшенная функция поиска позиции с физической симуляцией
    const findValidPosition = (preferredX: number, preferredY: number, attempts = 0): { x: number; y: number } => {
      if (attempts > 100) {
        // Крайний случай - размещаем в спирали
        const spiralRadius = 400 + Math.floor(attempts / 20) * 100;
        const spiralAngle = (attempts * 0.5) % (2 * Math.PI);
        return {
          x: centerX + Math.cos(spiralAngle) * spiralRadius - nodeWidth / 2,
          y: centerY + Math.sin(spiralAngle) * spiralRadius - nodeHeight / 2
        };
      }

      const currentPositions = getAllNodePositions();
      let hasCollision = false;
      let repulsionX = 0;
      let repulsionY = 0;

      // Проверяем коллизии и вычисляем силы отталкивания
      for (const pos of currentPositions) {
        const distance = Math.sqrt((preferredX - pos.x) ** 2 + (preferredY - pos.y) ** 2);
        
        if (distance < minDistance) {
          hasCollision = true;
          // Вычисляем силу отталкивания
          const repulsionForce = (minDistance - distance) / minDistance;
          const angle = Math.atan2(preferredY - pos.y, preferredX - pos.x);
          repulsionX += Math.cos(angle) * repulsionForce * 100;
          repulsionY += Math.sin(angle) * repulsionForce * 100;
        }
      }

      // Проверяем границы контейнера
      const margin = 100;
      const isInBounds = 
        preferredX >= margin && 
        preferredX <= containerWidth - nodeWidth - margin &&
        preferredY >= margin && 
        preferredY <= containerHeight - nodeHeight - margin;

      if (!hasCollision && isInBounds) {
        return { x: preferredX, y: preferredY };
      }

      // Применяем силы отталкивания и случайное смещение
      const randomAngle = Math.random() * 2 * Math.PI;
      const randomDistance = 50 + Math.random() * 100;
      
      const newX = preferredX + repulsionX + Math.cos(randomAngle) * randomDistance;
      const newY = preferredY + repulsionY + Math.sin(randomAngle) * randomDistance;

      return findValidPosition(newX, newY, attempts + 1);
    };

    // Создаем начальные позиции для угроз по расширяющимся кольцам
    const threatPositions: { x: number; y: number; threat: Threat }[] = [];
    
    // Первое кольцо - ближайшие позиции
    const firstRingPositions = 8;
    const firstRingRadius = minDistance * 1.2;
    
    // Второе кольцо - для остальных угроз
    const secondRingRadius = minDistance * 1.8;
    
    threats.forEach((threat, index) => {
      let angle, radius;
      
      if (index < firstRingPositions) {
        // Размещаем в первом кольце
        angle = (index / firstRingPositions) * 2 * Math.PI;
        radius = firstRingRadius;
      } else {
        // Размещаем во втором кольце
        const secondRingIndex = index - firstRingPositions;
        const secondRingCount = Math.max(8, threats.length - firstRingPositions);
        angle = (secondRingIndex / secondRingCount) * 2 * Math.PI;
        radius = secondRingRadius;
      }
      
      const initialX = centerX + Math.cos(angle) * radius;
      const initialY = centerY + Math.sin(angle) * radius;
      
      threatPositions.push({
        x: initialX,
        y: initialY,
        threat
      });
    });

    // Применяем симуляцию для разнесения узлов
    for (let iteration = 0; iteration < 5; iteration++) {
      threatPositions.forEach((threatPos, index) => {
        const position = findValidPosition(threatPos.x, threatPos.y);
        threatPositions[index].x = position.x + nodeWidth / 2;
        threatPositions[index].y = position.y + nodeHeight / 2;
      });
    }

    // Создаем финальные узлы угроз
    threatPositions.forEach(({ x, y, threat }) => {
      const threatNode: GraphNode = {
        id: `threat-${threat.id}`,
        type: 'threat',
        x: x - nodeWidth / 2,
        y: y - nodeHeight / 2,
        data: threat,
        connections: [`process-${process.sid}`]
      };
      nodes.push(threatNode);
    });

    return nodes;
  }, []);

  // Функция для корректировки перекрывающихся узлов
  const adjustOverlappingNodes = useCallback((nodes: GraphNode[]) => {
    const adjustedNodes = [...nodes];
    const nodeWidth = 220;
    const nodeHeight = 120;
    const minDistance = 320; // увеличиваем минимальное расстояние
    const maxIterations = 15; // больше итераций
    const pushForce = 1.5; // увеличиваем силу отталкивания

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let hasOverlap = false;
      
      // Проверяем каждую пару узлов на перекрытие
      for (let i = 0; i < adjustedNodes.length; i++) {
        for (let j = i + 1; j < adjustedNodes.length; j++) {
          const node1 = adjustedNodes[i];
          const node2 = adjustedNodes[j];
          
          const centerX1 = node1.x + nodeWidth / 2;
          const centerY1 = node1.y + nodeHeight / 2;
          const centerX2 = node2.x + nodeWidth / 2;
          const centerY2 = node2.y + nodeHeight / 2;
          
          const distance = Math.sqrt((centerX1 - centerX2) ** 2 + (centerY1 - centerY2) ** 2);
          
          if (distance < minDistance) {
            hasOverlap = true;
            
            // Вычисляем направление разделения
            let angle = Math.atan2(centerY2 - centerY1, centerX2 - centerX1);
            
            // Если узлы очень близко, используем случайный угол
            if (distance < 50) {
              angle = Math.random() * 2 * Math.PI;
            }
            
            const pushDistance = ((minDistance - distance) * pushForce) + 30;
            
            // Если один из узлов - процесс, он остается на месте
            if (node1.type === 'process') {
              // Перемещаем только второй узел с большей силой
              const newX2 = centerX2 + Math.cos(angle) * pushDistance;
              const newY2 = centerY2 + Math.sin(angle) * pushDistance;
              adjustedNodes[j] = {
                ...node2,
                x: Math.max(50, Math.min(1300, newX2 - nodeWidth / 2)),
                y: Math.max(50, Math.min(850, newY2 - nodeHeight / 2))
              };
            } else if (node2.type === 'process') {
              // Перемещаем только первый узел с большей силой
              const newX1 = centerX1 - Math.cos(angle) * pushDistance;
              const newY1 = centerY1 - Math.sin(angle) * pushDistance;
              adjustedNodes[i] = {
                ...node1,
                x: Math.max(50, Math.min(1300, newX1 - nodeWidth / 2)),
                y: Math.max(50, Math.min(850, newY1 - nodeHeight / 2))
              };
            } else {
              // Перемещаем оба узла с увеличенной силой
              const halfPush = pushDistance * 0.7;
              const newX1 = centerX1 - Math.cos(angle) * halfPush;
              const newY1 = centerY1 - Math.sin(angle) * halfPush;
              const newX2 = centerX2 + Math.cos(angle) * halfPush;
              const newY2 = centerY2 + Math.sin(angle) * halfPush;
              
              adjustedNodes[i] = {
                ...node1,
                x: Math.max(50, Math.min(1300, newX1 - nodeWidth / 2)),
                y: Math.max(50, Math.min(850, newY1 - nodeHeight / 2))
              };
              
              adjustedNodes[j] = {
                ...node2,
                x: Math.max(50, Math.min(1300, newX2 - nodeWidth / 2)),
                y: Math.max(50, Math.min(850, newY2 - nodeHeight / 2))
              };
            }
          }
        }
      }
      
      // Если нет перекрытий, выходим из цикла
      if (!hasOverlap) {
        console.log(`Корректировка завершена за ${iteration + 1} итераций`);
        break;
      }
    }
    
    return adjustedNodes;
  }, []);

  // Обновленная функция создания графа с пост-обработкой
  const createAndAdjustGraphNodes = useCallback((process: Process, threats: Threat[]) => {
    const initialNodes = createGraphNodes(process, threats);
    return adjustOverlappingNodes(initialNodes);
  }, [createGraphNodes, adjustOverlappingNodes]);

  // Функция для проверки перекрытий узлов
  const checkForOverlaps = useCallback((nodes: GraphNode[]) => {
    const nodeWidth = 220;
    const nodeHeight = 120;
    const minDistance = 300; // немного меньше чем в корректировке для раннего предупреждения

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const node1 = nodes[i];
        const node2 = nodes[j];
        
        const centerX1 = node1.x + nodeWidth / 2;
        const centerY1 = node1.y + nodeHeight / 2;
        const centerX2 = node2.x + nodeWidth / 2;
        const centerY2 = node2.y + nodeHeight / 2;
        
        const distance = Math.sqrt((centerX1 - centerX2) ** 2 + (centerY1 - centerY2) ** 2);
        
        if (distance < minDistance) {
          return true;
        }
      }
    }
    return false;
  }, []);

  // Обновление размеров контейнера
  useEffect(() => {
    const updateContainerSize = () => {
      if (graphContainerRef.current) {
        const rect = graphContainerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  // Функции для управления графом
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.3, Math.min(3, graphTransform.scale * delta));
    
    // Зум относительно позиции мыши
    const rect = graphContainerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const deltaScale = newScale - graphTransform.scale;
      const newX = graphTransform.x - (mouseX * deltaScale);
      const newY = graphTransform.y - (mouseY * deltaScale);
      
      setGraphTransform({
        x: newX,
        y: newY,
        scale: newScale
      });
    }
  }, [graphTransform]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === graphContainerRef.current || (e.target as HTMLElement).closest('.graph-transform-container')) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - graphTransform.x, y: e.clientY - graphTransform.y });
      e.preventDefault();
    }
  }, [graphTransform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setGraphTransform(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Центрирование графа
  const centerGraph = useCallback(() => {
    if (graphContainerRef.current && graphNodes.length > 0) {
      const container = graphContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      
      // Находим границы всех узлов
      const minX = Math.min(...graphNodes.map(node => node.x));
      const maxX = Math.max(...graphNodes.map(node => node.x + 200));
      const minY = Math.min(...graphNodes.map(node => node.y));
      const maxY = Math.max(...graphNodes.map(node => node.y + 100));
      
      const graphWidth = maxX - minX;
      const graphHeight = maxY - minY;
      
      // Вычисляем оптимальный масштаб
      const scaleToFit = Math.min(
        (containerRect.width - 100) / graphWidth,
        (containerRect.height - 100) / graphHeight,
        1
      );
      
      // Вычисляем центрирование
      const centerX = (containerRect.width - graphWidth * scaleToFit) / 2 - minX * scaleToFit;
      const centerY = (containerRect.height - graphHeight * scaleToFit) / 2 - minY * scaleToFit;
      
      setGraphTransform({
        x: centerX,
        y: centerY,
        scale: scaleToFit
      });
    }
  }, [graphNodes]);

  // Функция для принудительной перестановки узлов
  const forceRearrangeNodes = useCallback(() => {
    if (selectedProcess && threats.length > 0) {
      setIsAdjustingNodes(true);
      setHasOverlappingNodes(false); // Скрываем уведомление
      
      setTimeout(() => {
        const newNodes = createAndAdjustGraphNodes(selectedProcess, threats);
        setGraphNodes(newNodes);
        
        setTimeout(() => {
          centerGraph();
          setIsAdjustingNodes(false);
          
          // Проверяем снова через небольшую задержку
          setTimeout(() => {
            const stillHasOverlaps = checkForOverlaps(newNodes);
            if (stillHasOverlaps) {
              console.log('Перекрытия все еще присутствуют после корректировки');
            }
          }, 100);
        }, 300);
      }, 100);
    }
  }, [selectedProcess, threats, createAndAdjustGraphNodes, centerGraph, checkForOverlaps]);

  // Функция для изменения трансформации из мини-карты
  const handleTransformChange = useCallback((newTransform: { x: number; y: number; scale: number }) => {
    setGraphTransform(newTransform);
  }, []);

  // Проверяем перекрытия при изменении узлов
  useEffect(() => {
    if (graphNodes.length > 0) {
      const hasOverlaps = checkForOverlaps(graphNodes);
      setHasOverlappingNodes(hasOverlaps);
    }
  }, [graphNodes, checkForOverlaps]);

  // Центрируем граф при изменении узлов
  useEffect(() => {
    if (graphNodes.length > 0) {
      setTimeout(centerGraph, 100); // небольшая задержка для рендера
    }
  }, [graphNodes, centerGraph]);

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
          const initialNodes = createAndAdjustGraphNodes(selectedProcess, threatsArray);
          setGraphNodes(initialNodes);
          
          // Автоматически применяем дополнительную корректировку, если есть перекрытия
          setTimeout(() => {
            const hasOverlaps = checkForOverlaps(initialNodes);
            if (hasOverlaps && threatsArray.length > 1) {
              console.log('Обнаружены перекрытия, применяем дополнительную корректировку...');
              const adjustedNodes = adjustOverlappingNodes(initialNodes);
              setGraphNodes(adjustedNodes);
            }
          }, 100);
        }
      })
      .catch(err => setError('Не удалось загрузить угрозы для процесса.'));
  }, [selectedProcess, isLoggedIn, createAndAdjustGraphNodes, checkForOverlaps, adjustOverlappingNodes]);

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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 className="graph-title">{selectedProcess.name}</h2>
                    <p className="graph-subtitle">
                      Интерактивная схема процесса и связанных угроз
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      onClick={centerGraph}
                      style={{
                        padding: '8px 16px',
                        background: 'var(--primary-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      🎯 Центрировать
                    </button>
                    <button
                      onClick={forceRearrangeNodes}
                      disabled={isAdjustingNodes}
                      style={{
                        padding: '8px 16px',
                        background: isAdjustingNodes ? 'var(--text-secondary)' : '#ffc107',
                        color: isAdjustingNodes ? 'white' : 'var(--text-primary)',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        cursor: isAdjustingNodes ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {isAdjustingNodes ? '🔄 Перестановка...' : '🔀 Переставить узлы'}
                    </button>
                    <button
                      onClick={() => setGraphTransform({ x: 0, y: 0, scale: 1 })}
                      style={{
                        padding: '8px 16px',
                        background: 'var(--surface-hover)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        fontSize: '14px'
                      }}
                    >
                      🔄 Сброс
                    </button>
                  </div>
                </div>
              </div>
              
              <div 
                ref={graphContainerRef}
                className="graph-area" 
                style={{ 
                  position: 'relative', 
                  height: 'calc(100% - 100px)', 
                  overflow: 'hidden',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  background: '#fafbfc'
                }}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Уведомление о перекрытиях */}
                {hasOverlappingNodes && !isAdjustingNodes && (
                  <div style={{
                    position: 'absolute',
                    top: '16px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #ffc107, #ffda44)',
                    color: 'var(--text-primary)',
                    padding: '12px 20px',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 60,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '14px',
                    fontWeight: '500',
                    maxWidth: '400px',
                    animation: 'slideIn 0.3s ease-out'
                  }}>
                    <span style={{ fontSize: '16px' }}>⚠️</span>
                    <span>Обнаружены перекрывающиеся узлы</span>
                    <button
                      onClick={forceRearrangeNodes}
                      style={{
                        background: 'rgba(255, 255, 255, 0.2)',
                        border: '1px solid rgba(255, 255, 255, 0.3)',
                        color: 'var(--text-primary)',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: '600',
                        transition: 'var(--transition)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                      }}
                    >
                      Исправить
                    </button>
                    <button
                      onClick={() => setHasOverlappingNodes(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        fontSize: '16px',
                        padding: '2px'
                      }}
                      title="Скрыть уведомление"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Индикатор процесса перестановки */}
                {isAdjustingNodes && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '20px 30px',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'var(--text-primary)'
                  }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '3px solid var(--primary-light)',
                      borderTop: '3px solid var(--primary-color)',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Перестановка узлов...
                  </div>
                )}

                {/* Контейнер с трансформацией */}
                <div
                  className="graph-transform-container"
                  style={{
                    transform: `translate(${graphTransform.x}px, ${graphTransform.y}px) scale(${graphTransform.scale})`,
                    transformOrigin: '0 0',
                    position: 'absolute',
                    width: '1400px',
                    height: '1000px',
                    transition: isDragging ? 'none' : 'transform 0.3s ease'
                  }}
                >
                  {/* Сетка для лучшей ориентации */}
                  <svg
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      opacity: 0.1
                    }}
                  >
                    <defs>
                      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="var(--primary-color)" strokeWidth="1"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>

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
                
                {/* Мини-карта */}
                <GraphMinimap
                  nodes={graphNodes}
                  transform={graphTransform}
                  containerSize={containerSize}
                  graphSize={{ width: 1400, height: 1000 }}
                  onTransformChange={handleTransformChange}
                />
                
                {/* Элементы управления */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <button
                    onClick={() => setGraphTransform(prev => ({ ...prev, scale: Math.min(3, prev.scale * 1.2) }))}
                    style={{
                      width: '40px',
                      height: '40px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    title="Увеличить"
                  >
                    +
                  </button>
                  <button
                    onClick={() => setGraphTransform(prev => ({ ...prev, scale: Math.max(0.3, prev.scale * 0.8) }))}
                    style={{
                      width: '40px',
                      height: '40px',
                      background: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      fontSize: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    title="Уменьшить"
                  >
                    -
                  </button>
                </div>

                {/* Подсказка по управлению */}
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px',
                  color: 'var(--text-secondary)',
                  boxShadow: 'var(--shadow-sm)',
                  maxWidth: '250px',
                  lineHeight: '1.4'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '6px', color: 'var(--primary-color)' }}>
                    💡 Управление графом:
                  </div>
                  <div>• Колесо мыши - масштабирование</div>
                  <div>• Перетаскивание - перемещение</div>
                  <div>• Клик по мини-карте - навигация</div>
                  <div>• Кнопка "Переставить" - если узлы перекрываются</div>
                </div>
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