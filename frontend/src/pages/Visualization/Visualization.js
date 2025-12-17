import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text, Grid } from '@react-three/drei';
import * as THREE from 'three';
import axios from 'axios';
import './Visualization.css';

const getStatusColor = (statusName) => {
  const colors = {
    'бэклог': '#fbbf24',
    'разработка': '#3b82f6',
    'тестирование': '#ec4899',
    'использование': '#10b981',
    'закрыт': '#6b7280'
  };
  return colors[statusName?.toLowerCase()] || '#64748b';
};

// Компонент точки проекта в 3D
const ProjectPoint = ({ evaluation, position, onHover, onLeave, onClick, isSelected }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);

  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHovered(true);
    onHover(evaluation);
  };

  const handlePointerOut = () => {
    setHovered(false);
    onLeave();
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick(evaluation);
  };

  const scale = hovered || isSelected ? 1.5 : 1;
  const statusColor = getStatusColor(evaluation.status?.name);
  const color = isSelected ? '#ef4444' : hovered ? '#3b82f6' : statusColor;

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onClick={handleClick}
      scale={scale}
    >
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} />
    </mesh>
  );
};

// Компонент 2D графика для проекций
const Projection2D = ({ evaluations, plane, onPointHover, onPointLeave, onPointClick, selectedProject }) => {
  const canvasRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const getAxes = () => {
    switch(plane) {
      case 'ET':
        return { x: 'economic_efficiency', y: 'technical_complexity', labelX: 'E', labelY: 'T' };
      case 'EX':
        return { x: 'economic_efficiency', y: 'expert_rating', labelX: 'E', labelY: 'X' };
      case 'TX':
        return { x: 'technical_complexity', y: 'expert_rating', labelX: 'T', labelY: 'X' };
      default:
        return { x: 'economic_efficiency', y: 'technical_complexity', labelX: 'E', labelY: 'T' };
    }
  };

  const axes = getAxes();
  const filteredEvaluations = evaluations.filter(evaluation => evaluation.project && (evaluation.sum || 0) > 0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 60;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    const maxValue = 10;

    // Очистка
    ctx.clearRect(0, 0, width, height);

    // Фон
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Сетка
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 10; i++) {
      const x = padding + (i / maxValue) * graphWidth;
      const y = padding + (i / maxValue) * graphHeight;
      
      // Вертикальные линии
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
      
      // Горизонтальные линии
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Оси
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    
    // Ось X
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();
    
    // Ось Y
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // Подписи осей
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(axes.labelX, width - padding, height - padding + 30);
    
    ctx.fillStyle = '#22c55e';
    ctx.textAlign = 'left';
    ctx.save();
    ctx.translate(padding - 30, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(axes.labelY, 0, 0);
    ctx.restore();

    // Подписи значений на осях
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i += 2) {
      const x = padding + (i / maxValue) * graphWidth;
      ctx.fillText(i.toString(), x, height - padding + 20);
    }
    
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i += 2) {
      const y = height - padding - (i / maxValue) * graphHeight;
      ctx.fillText(i.toString(), padding - 10, y + 4);
    }

    // Точки
    filteredEvaluations.forEach((evaluation) => {
      const xValue = evaluation[axes.x] || 0;
      const yValue = evaluation[axes.y] || 0;
      
      const x = padding + (xValue / maxValue) * graphWidth;
      const y = height - padding - (yValue / maxValue) * graphHeight;
      
      const isSelected = selectedProject?.id === evaluation.id;
      const isHovered = hoveredPoint?.id === evaluation.id;
      const statusColor = getStatusColor(evaluation.status?.name);
      const color = isSelected ? '#ef4444' : isHovered ? '#3b82f6' : statusColor;
      const radius = isSelected || isHovered ? 6 : 4;

      // Круг
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [filteredEvaluations, axes, selectedProject, hoveredPoint]);

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const padding = 60;
    const graphWidth = canvas.width - padding * 2;
    const graphHeight = canvas.height - padding * 2;
    const maxValue = 10;

    let closestPoint = null;
    let minDistance = Infinity;

    filteredEvaluations.forEach((evaluation) => {
      const xValue = evaluation[axes.x] || 0;
      const yValue = evaluation[axes.y] || 0;
      
      const pointX = padding + (xValue / maxValue) * graphWidth;
      const pointY = canvas.height - padding - (yValue / maxValue) * graphHeight;
      
      const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
      
      if (distance < 20 && distance < minDistance) {
        minDistance = distance;
        closestPoint = evaluation;
      }
    });

    if (closestPoint) {
      setHoveredPoint(closestPoint);
      onPointHover(closestPoint);
    } else {
      setHoveredPoint(null);
      onPointLeave();
    }
  };

  const handleClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const padding = 60;
    const graphWidth = canvas.width - padding * 2;
    const graphHeight = canvas.height - padding * 2;
    const maxValue = 10;

    let closestPoint = null;
    let minDistance = Infinity;

    filteredEvaluations.forEach((evaluation) => {
      const xValue = evaluation[axes.x] || 0;
      const yValue = evaluation[axes.y] || 0;
      
      const pointX = padding + (xValue / maxValue) * graphWidth;
      const pointY = canvas.height - padding - (yValue / maxValue) * graphHeight;
      
      const distance = Math.sqrt((x - pointX) ** 2 + (y - pointY) ** 2);
      
      if (distance < 20 && distance < minDistance) {
        minDistance = distance;
        closestPoint = evaluation;
      }
    });

    if (closestPoint) {
      onPointClick(closestPoint);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onMouseLeave={() => {
        setHoveredPoint(null);
        onPointLeave();
      }}
      style={{ width: '100%', height: '100%', cursor: hoveredPoint ? 'pointer' : 'default' }}
    />
  );
};

// Основной компонент 3D сцены
const Scene3D = ({ evaluations, onHover, onLeave, onClick, selectedProject }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      {/* Основная плоскость - квадрат от (0,0,0) до (10,0,10) в плоскости EX (XZ) */}
      <mesh position={[5, 0, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#f1f5f9" opacity={0.3} transparent />
      </mesh>
      
      {/* Зеленый прозрачный куб для области E > 5, T > 5, X > 5 */}
      <mesh position={[7.5, 7.5, 7.5]}>
        <boxGeometry args={[5, 5, 5]} />
        <meshStandardMaterial color="#10b981" opacity={0.3} transparent />
      </mesh>
      
      {/* Красный полупрозрачный куб для области E < 5, T < 5, X < 5 */}
      <mesh position={[2.5, 2.5, 2.5]}>
        <boxGeometry args={[5, 5, 5]} />
        <meshStandardMaterial color="#ef4444" opacity={0.3} transparent />
      </mesh>
      
      {/* Оси координат - E (X) - от 0 до 10 */}
      <primitive 
        object={new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 10, 0xff0000)} 
      />
      {/* Оси координат - T (Y) - от 0 до 10 */}
      <primitive 
        object={new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 10, 0x00ff00)} 
      />
      {/* Оси координат - X (Z) - только положительное направление */}
      <primitive 
        object={new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 10, 0x0000ff)} 
      />
      
      {/* Подписи осей */}
      <Text position={[10, 0, 0]} fontSize={1} color="#ef4444">
        E
      </Text>
      <Text position={[0, 10, 0]} fontSize={1} color="#22c55e">
        T
      </Text>
      <Text position={[0, 0, 10]} fontSize={1} color="#3b82f6">
        X
      </Text>
      
      {/* Точки проектов */}
      {evaluations
        .filter(evaluation => evaluation.project && (evaluation.sum || 0) > 0)
        .map((evaluation) => {
          // Масштаб для значений 0-10: прямое соответствие координатам
          const x = evaluation.economic_efficiency || 0;
          const y = evaluation.technical_complexity || 0;
          const z = evaluation.expert_rating || 0;
          
          const isSelected = selectedProject?.id === evaluation.id;
          const statusColor = getStatusColor(evaluation.status?.name);
          const color = isSelected ? '#ef4444' : statusColor;
          
          return (
            <ProjectPoint
              key={evaluation.id}
              evaluation={evaluation}
              position={[x, y, z]}
              onHover={onHover}
              onLeave={onLeave}
              onClick={onClick}
              isSelected={isSelected}
            />
          );
        })}
      
      <OrbitControls enableDamping dampingFactor={0.05} />
    </>
  );
};

const Visualization = () => {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewMode, setViewMode] = useState('3d'); // '3d', 'ET', 'EX', 'TX'

  const formatProjectNumber = (projectNumber) => {
    if (!projectNumber) return '№000';
    const num = projectNumber.replace('#', '').replace('№', '');
    const parsed = parseInt(num) || 0;
    return `№${parsed.toString().padStart(3, '0')}`;
  };

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    try {
      const response = await axios.get('/api/evaluations/evaluation/', {
        withCredentials: true
      });
      setEvaluations(response.data.results || response.data);
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки оценок:', error);
      setLoading(false);
    }
  };

  const handleHover = (evaluation) => {
    setHoveredProject(evaluation);
  };

  const handleLeave = () => {
    setHoveredProject(null);
  };

  const handleClick = (evaluation) => {
    setSelectedProject(selectedProject?.id === evaluation.id ? null : evaluation);
  };

  const getProjectInfo = () => {
    const project = hoveredProject || selectedProject;
    if (!project) return null;

    return {
      name: project.project?.name || 'Без названия',
      description: project.project?.description || 'Нет описания',
      number: formatProjectNumber(project.project?.project_number),
      priority: project.project?.priority_number || 0,
      e: project.economic_efficiency || 0,
      t: project.technical_complexity || 0,
      x: project.expert_rating || 0,
      vectorSum: project.sum || 0,
      status: project.status?.name || 'Не указан'
    };
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Загрузка данных...</div>
      </div>
    );
  }

  const projectInfo = getProjectInfo();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Визуализация результатов</h1>
      </div>

      <div className="visualization-controls">
        <div className="view-mode-selector">
          <button
            className={`view-mode-btn ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
          >
            3D Пространство
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'ET' ? 'active' : ''}`}
            onClick={() => setViewMode('ET')}
          >
            E × T
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'EX' ? 'active' : ''}`}
            onClick={() => setViewMode('EX')}
          >
            E × X
          </button>
          <button
            className={`view-mode-btn ${viewMode === 'TX' ? 'active' : ''}`}
            onClick={() => setViewMode('TX')}
          >
            T × X
          </button>
        </div>
        {selectedProject && (
          <button
            className="clear-selection-btn"
            onClick={() => setSelectedProject(null)}
          >
            Снять выделение
          </button>
        )}
      </div>

      <div className="visualization-wrapper">
        <div className="canvas-container">
          {viewMode === '3d' ? (
            <Canvas camera={{ position: [15, 15, 15], fov: 50 }}>
              <Scene3D
                evaluations={evaluations}
                onHover={handleHover}
                onLeave={handleLeave}
                onClick={handleClick}
                selectedProject={selectedProject}
              />
            </Canvas>
          ) : (
            <Projection2D
              evaluations={evaluations}
              plane={viewMode}
              onPointHover={handleHover}
              onPointLeave={handleLeave}
              onPointClick={handleClick}
              selectedProject={selectedProject}
            />
          )}
        </div>

        <div className="project-info-panel">
          <div className="project-info-header">
            <h3>Информация о проекте</h3>
            {selectedProject && (
              <button className="close-btn" onClick={() => setSelectedProject(null)}>×</button>
            )}
          </div>
          <div className="project-info-content">
            {projectInfo ? (
              <>
                <div className="info-row">
                  <span className="info-label">№ проекта:</span>
                  <span className="info-value">{projectInfo.number}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Приоритет:</span>
                  <span className="info-value">#{projectInfo.priority}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Название:</span>
                  <span className="info-value">{projectInfo.name}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Статус:</span>
                  <span className="info-value">{projectInfo.status}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Описание:</span>
                  <span className="info-value description-text">{projectInfo.description}</span>
                </div>
                <div className="metrics-row">
                  <div className="metric-card-small">
                    <div className="metric-label-small">E</div>
                    <div className="metric-value-small">{projectInfo.e.toFixed(1)}</div>
                  </div>
                  <div className="metric-card-small">
                    <div className="metric-label-small">T</div>
                    <div className="metric-value-small">{projectInfo.t.toFixed(1)}</div>
                  </div>
                  <div className="metric-card-small">
                    <div className="metric-label-small">X</div>
                    <div className="metric-value-small">{projectInfo.x.toFixed(1)}</div>
                  </div>
                </div>
                <div className="metric-card-vector">
                  <div className="metric-label-small">Σ</div>
                  <div className="metric-value-vector">{projectInfo.vectorSum.toFixed(1)}</div>
                  <div className="metric-name-small">Векторная сумма</div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <p>Наведите курсор на точку проекта для просмотра информации</p>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Visualization;
