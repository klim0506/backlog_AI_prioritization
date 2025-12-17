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

// Компонент 2D плоскости для проекции
const ProjectionPlane = ({ evaluations, plane, onPointHover, onPointLeave, onPointClick, selectedProject }) => {
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

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[0, 0, 5]} intensity={0.5} />
      
      <Grid args={[10, 10]} position={[2.5, 2.5, 0]} cellColor="#cbd5e1" sectionColor="#94a3b8" />
      
      <mesh position={[2.5, 0, 0.01]}>
        <boxGeometry args={[5, 0.1, 0.1]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      <mesh position={[0, 2.5, 0.01]} rotation={[0, 0, Math.PI / 2]}>
        <boxGeometry args={[5, 0.1, 0.1]} />
        <meshStandardMaterial color="#22c55e" />
      </mesh>
      
      <Text position={[7, -0.5, 0.1]} fontSize={1.2} color="#ef4444">
        {axes.labelX}
      </Text>
      <Text position={[-0.5, 7, 0.1]} fontSize={1.2} color="#22c55e">
        {axes.labelY}
      </Text>
      
      {evaluations
        .filter(evaluation => evaluation.project && (evaluation.sum || 0) > 0)
        .map((evaluation) => {
          const scale = 5; // Масштаб для значений 0-10
          const x = (evaluation[axes.x] || 0) * scale / 10;
          const y = (evaluation[axes.y] || 0) * scale / 10;
          const z = 0.1;
          
          const isSelected = selectedProject?.id === evaluation.id;
          const statusColor = getStatusColor(evaluation.status?.name);
          const color = isSelected ? '#ef4444' : statusColor;
          
          return (
            <mesh
              key={evaluation.id}
              position={[x, y, z]}
              onPointerOver={(e) => {
                e.stopPropagation();
                onPointHover(evaluation);
              }}
              onPointerOut={() => onPointLeave()}
              onClick={(e) => {
                e.stopPropagation();
                onPointClick(evaluation);
              }}
              scale={isSelected ? 1.5 : 1}
            >
              <circleGeometry args={[0.08, 16]} />
              <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={0.3}
              />
            </mesh>
          );
        })}
      
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        enableRotate={false}
        minDistance={15}
        maxDistance={30}
      />
    </>
  );
};

// Основной компонент 3D сцены
const Scene3D = ({ evaluations, onHover, onLeave, onClick, selectedProject }) => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <pointLight position={[-10, -10, -5]} intensity={0.5} />
      
      {/* Сетка - от точки (0,0,0) до точки (10,10,0) */}
      <Grid args={[10, 10]} position={[5, 5, 0]} cellColor="#cbd5e1" sectionColor="#94a3b8" />
      
      {/* Оси координат - E (X) - только положительное направление */}
      <primitive 
        object={new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 5, 0xff0000)} 
      />
      {/* Оси координат - T (Y) - только положительное направление */}
      <primitive 
        object={new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 5, 0x00ff00)} 
      />
      {/* Оси координат - X (Z) - только положительное направление */}
      <primitive 
        object={new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 5, 0x0000ff)} 
      />
      
      {/* Подписи осей */}
      <Text position={[5, 0, 0]} fontSize={1} color="#ef4444">
        E
      </Text>
      <Text position={[0, 5, 0]} fontSize={1} color="#22c55e">
        T
      </Text>
      <Text position={[0, 0, 5]} fontSize={1} color="#3b82f6">
        X
      </Text>
      
      {/* Точки проектов */}
      {evaluations
        .filter(evaluation => evaluation.project && (evaluation.sum || 0) > 0)
        .map((evaluation) => {
          const scale = 5; // Масштаб для значений 0-10
          const x = (evaluation.economic_efficiency || 0) * scale / 10;
          const y = (evaluation.technical_complexity || 0) * scale / 10;
          const z = (evaluation.expert_rating || 0) * scale / 10;
          
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
            <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
              <Scene3D
                evaluations={evaluations}
                onHover={handleHover}
                onLeave={handleLeave}
                onClick={handleClick}
                selectedProject={selectedProject}
              />
            </Canvas>
          ) : (
            <Canvas 
              orthographic
              camera={{ 
                position: [2.5, 2.5, 15], 
                zoom: 1,
                left: -2.5,
                right: 7.5,
                top: 7.5,
                bottom: -2.5,
                near: 0.1,
                far: 50
              }}
            >
              <ProjectionPlane
                evaluations={evaluations}
                plane={viewMode}
                onPointHover={handleHover}
                onPointLeave={handleLeave}
                onPointClick={handleClick}
                selectedProject={selectedProject}
              />
            </Canvas>
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
