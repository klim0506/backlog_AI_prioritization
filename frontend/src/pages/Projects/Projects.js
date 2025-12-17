import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ProgressContext } from '../../App';
import './Projects.css';

const Projects = () => {
  const { setProgress, triggerEvaluationsRefresh } = useContext(ProgressContext);
  const [projects, setProjects] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('priority');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [nextProjectNumber, setNextProjectNumber] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchProjects(currentPage);
    fetchStatuses();
  }, [currentPage, sortBy, sortOrder]);

  useEffect(() => {
    calculateNextProjectNumber();
  }, [projects]);

  const fetchProjects = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/projects/project/`, {
        withCredentials: true,
        params: {
          page: page,
          sort_by: sortBy,
          sort_order: sortOrder
        }
      });
      
      if (response.data.results) {
        setProjects(response.data.results);
        setTotalPages(Math.ceil(response.data.count / 20));
        setTotalCount(response.data.count);
      } else {
        setProjects(Array.isArray(response.data) ? response.data : []);
        setTotalPages(1);
        setTotalCount(Array.isArray(response.data) ? response.data.length : 0);
      }
      setLoading(false);
    } catch (error) {
      console.error('Ошибка загрузки проектов:', error);
      setLoading(false);
    }
  };

  const fetchStatuses = async () => {
    try {
      const response = await axios.get('/api/projects/status/', {
        withCredentials: true
      });
      setStatuses(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки статусов:', error);
    }
  };

  const calculateNextProjectNumber = () => {
    if (projects.length === 0) {
      setNextProjectNumber('№001');
      return;
    }
    
    const numbers = projects
      .map(p => {
        const num = p.project_number?.replace('#', '').replace('№', '');
        return parseInt(num) || 0;
      })
      .filter(n => n > 0);
    
    const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
    const nextNumber = maxNumber + 1;
    setNextProjectNumber(`№${nextNumber.toString().padStart(3, '0')}`);
  };

  const formatProjectNumber = (projectNumber) => {
    if (!projectNumber) return '№000';
    const num = projectNumber.replace('#', '').replace('№', '');
    const parsed = parseInt(num) || 0;
    return `№${parsed.toString().padStart(3, '0')}`;
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    
    try {
      await axios.delete(`/api/projects/project/${projectToDelete.id}/`, {
        withCredentials: true
      });
      fetchProjects(currentPage);
      if (triggerEvaluationsRefresh) {
        triggerEvaluationsRefresh();
      }
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error('Ошибка удаления проекта:', error);
      alert('Ошибка при удалении проекта');
    }
  };

  const handleEdit = (project) => {
    setEditingProject(project);
    setShowAddForm(true);
  };

  const handleClearAll = async () => {
    if (totalCount === 0) {
      alert('Нет проектов для удаления');
      return;
    }

    const confirmed = window.confirm(
      `Вы уверены, что хотите удалить все ${totalCount} проектов? Это действие нельзя отменить!`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await axios.get('/api/projects/project/', {
        withCredentials: true,
        params: { page_size: 1000 }
      });
      
      const allProjects = response.data.results || response.data;
      
      for (const project of allProjects) {
        try {
          await axios.delete(`/api/projects/project/${project.id}/`, {
            withCredentials: true
          });
        } catch (error) {
          console.error(`Ошибка удаления проекта ${project.id}:`, error);
        }
      }
      
      setCurrentPage(1);
      await fetchProjects(1);
      if (triggerEvaluationsRefresh) {
        triggerEvaluationsRefresh();
      }
      alert('Все проекты успешно удалены');
    } catch (error) {
      console.error('Ошибка при удалении проектов:', error);
      alert('Произошла ошибка при удалении проектов');
    }
  };

  const filteredProjects = () => {
    return projects.filter(project => {
      const matchesSearch = project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.project_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Загрузка проектов...</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top">
          <div>
            <h1 className="page-title">Все проекты</h1>
            <p className="page-description">
              Управление перечнем проектов и быстрый обзор
            </p>
          </div>
          <div className="header-actions">
            <button
              className="btn btn-primary"
              onClick={() => {
                setEditingProject(null);
                setShowAddForm(true);
              }}
            >
              + Добавить проект
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => setShowImportModal(true)}
            >
              📥 Импорт через LLM
            </button>
            <button
              className="btn btn-danger"
              onClick={handleClearAll}
            >
              🗑️ Очистить все
            </button>
          </div>
        </div>

        <div className="controls">
          <div className="search-box">
            <input
              type="text"
              placeholder="Поиск по названию, номеру или описанию..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filters">
            <select
              className="filter-select"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="priority"># Приоритет</option>
              <option value="number">№ Проекта</option>
            </select>
            <button
              className="sort-order-btn"
              onClick={() => {
                setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                setCurrentPage(1);
              }}
              title={sortOrder === 'asc' ? 'По возрастанию' : 'По убыванию'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`}
              onClick={() => setViewMode('cards')}
              title="Карточки"
            >
              ▦
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="Список"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {showAddForm && (
        <ProjectForm
          project={editingProject}
          formatProjectNumber={formatProjectNumber}
          nextProjectNumber={nextProjectNumber}
          onClose={() => {
            setShowAddForm(false);
            setEditingProject(null);
          }}
          onSave={() => {
            fetchProjects(currentPage);
            if (triggerEvaluationsRefresh) {
              triggerEvaluationsRefresh();
            }
          }}
        />
      )}

      {showImportModal && (
        <ImportModal
          onClose={() => setShowImportModal(false)}
          onImport={() => fetchProjects(currentPage)}
          setProgress={setProgress}
          fetchProjects={fetchProjects}
          triggerEvaluationsRefresh={triggerEvaluationsRefresh}
        />
      )}

      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Подтверждение удаления</h2>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Вы уверены, что хотите удалить проект <strong>{projectToDelete?.name}</strong>?</p>
              <p style={{ fontSize: '14px', color: '#64748b', marginTop: '8px' }}>
                Это действие нельзя отменить.
              </p>
            </div>
            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeleteModal(false)}
              >
                Отмена
              </button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirm}
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="page-content">
        {filteredProjects().length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <h3>Нет проектов</h3>
            <p>Добавьте первый проект, чтобы начать работу</p>
          </div>
        ) : viewMode === 'cards' ? (
          <div className="projects-grid">
            {filteredProjects().map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                formatProjectNumber={formatProjectNumber}
              />
            ))}
          </div>
        ) : (
          <div className="projects-list">
            <table className="projects-table">
              <thead>
                <tr>
                  <th>№ проекта</th>
                  <th>Приоритет</th>
                  <th>Название</th>
                  <th>Описание</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects().map((project) => (
                  <tr 
                    key={project.id}
                    onClick={() => handleEdit(project)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td>{formatProjectNumber(project.project_number)}</td>
                    <td>
                      {project.priority_number > 0 ? (
                        <span className="priority-badge-bright">#{project.priority_number}</span>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td>{project.name}</td>
                    <td className="description-cell">
                      {project.description?.substring(0, 50)}
                      {project.description?.length > 50 ? '...' : ''}
                    </td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn-icon"
                        onClick={() => handleDeleteClick(project)}
                        title="Удалить"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="pagination">
            <div className="pagination-info">
              Страница {currentPage} из {totalPages} (всего {totalCount} проектов)
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                ««
              </button>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                ‹
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    className={`pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                ›
              </button>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                »»
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ProjectCard = ({ project, onEdit, onDelete, formatProjectNumber }) => {
  const getPMName = () => {
    if (project.pm) {
      return project.pm.first_name && project.pm.last_name 
        ? `${project.pm.first_name} ${project.pm.last_name}`
        : project.pm.username;
    }
    return 'Не назначен';
  };

  const getDeveloperName = () => {
    if (project.developer) {
      return project.developer.first_name && project.developer.last_name 
        ? `${project.developer.first_name} ${project.developer.last_name}`
        : project.developer.username;
    }
    return 'Не назначен';
  };

  return (
    <div 
      className="project-card"
      onClick={() => onEdit(project)}
      style={{ cursor: 'pointer' }}
    >
      <div className="card-header-compact">
        <div className="card-number-compact">
          <span className="value">{formatProjectNumber(project.project_number)}</span>
          {project.priority_number > 0 ? (
            <span className="priority-badge-bright">#{project.priority_number}</span>
          ) : (
            <span className="priority-badge">-</span>
          )}
        </div>
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <button
            className="btn-icon-small"
            onClick={() => onDelete(project)}
            title="Удалить"
          >
            🗑️
          </button>
        </div>
      </div>
      <div className="card-body-compact">
        <h3 className="card-title-compact">{project.name}</h3>
        <div className="card-people-compact">
          <span className="person-item">PM: {getPMName()}</span>
          <span className="person-item">Dev: {getDeveloperName()}</span>
        </div>
        {project.description && (
          <p className="card-description-compact">{project.description}</p>
        )}
        {project.comment && (
          <p className="card-comment-compact">{project.comment}</p>
        )}
      </div>
    </div>
  );
};

const ProjectForm = ({ project, onClose, onSave, formatProjectNumber, nextProjectNumber }) => {
  const [formData, setFormData] = useState({
    name: project?.name || '',
    description: project?.description || '',
    comment: project?.comment || '',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const data = {
        name: formData.name,
        description: formData.description,
        comment: formData.comment || '',
      };

      if (project) {
        await axios.put(`/api/projects/project/${project.id}/`, data, {
          withCredentials: true
        });
      } else {
        await axios.post('/api/projects/project/', data, {
          withCredentials: true
        });
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Ошибка сохранения проекта:', error);
      
      let errorMessage = 'Ошибка при сохранении проекта';
      
      if (error.response?.data) {
        const data = error.response.data;
        if (data.detail) {
          errorMessage = data.detail;
        } else if (data.description) {
          errorMessage = Array.isArray(data.description) ? data.description[0] : data.description;
        } else if (data.name) {
          errorMessage = Array.isArray(data.name) ? data.name[0] : data.name;
        } else if (data.non_field_errors) {
          errorMessage = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else {
          const firstError = Object.values(data)[0];
          if (firstError) {
            errorMessage = Array.isArray(firstError) ? firstError[0] : firstError;
          }
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{project ? 'Редактировать проект' : 'Добавить проект'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="project-form">
          {project && (
            <div className="form-group">
              <label>№ проекта</label>
              <input
                type="text"
                value={formatProjectNumber(project.project_number)}
                disabled
                style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Номер проекта генерируется автоматически
              </p>
            </div>
          )}

          {!project && (
            <div className="form-group">
              <label>№ проекта</label>
              <input
                type="text"
                value={nextProjectNumber}
                disabled
                style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
              />
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Номер проекта будет присвоен автоматически при создании
              </p>
            </div>
          )}

          <div className="form-group">
            <label>Название *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={saving}
              placeholder="Введите название проекта"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label>Описание *</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="4"
              required
              disabled={saving}
              placeholder="Введите описание проекта"
              autoComplete="off"
            />
          </div>

          <div className="form-group">
            <label>Комментарий</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
              rows="3"
              disabled={saving}
              placeholder="Дополнительные комментарии (необязательно)"
              autoComplete="off"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
              Отмена
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Сохранение...' : (project ? 'Сохранить' : 'Добавить')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ImportModal = ({ onClose, onImport, setProgress, fetchProjects, triggerEvaluationsRefresh }) => {
  const { cancelImportRef } = useContext(ProgressContext);
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setResult(null);
  };

  const processBatch = async (batchRows, headers, startIndex, total, batchNumber) => {
    try {
      console.log(`[Батч ${batchNumber}] Отправка батча из ${batchRows.length} строк...`);
      
      const response = await axios.post('/api/projects/project/import_batch_rows/', {
        rows_data: batchRows,
        headers: headers
      }, {
        withCredentials: true
      });

      console.log(`[Батч ${batchNumber}] Получен ответ:`, {
        success_count: response.data.success_count,
        total_count: response.data.total_count,
        errors_count: response.data.errors?.length || 0
      });

      const successCount = response.data.success_count || 0;
      const newCurrent = startIndex + successCount;
      
      setProgress({ total, current: newCurrent, isActive: true, startTime: Date.now() });

      if (successCount > 0) {
        await fetchProjects(1);
        if (triggerEvaluationsRefresh) {
          triggerEvaluationsRefresh();
        }
      }
      
      return { 
        success: successCount > 0, 
        projects: response.data.projects || [],
        errors: response.data.errors || [],
        successCount: successCount
      };
    } catch (error) {
      console.error(`[Батч ${batchNumber}] Ошибка при обработке:`, error);
      return { 
        success: false, 
        errors: [error.response?.data?.error || 'Ошибка при обработке батча'],
        successCount: 0
      };
    }
  };

  const handleImport = async () => {
    if (!file) {
      alert('Выберите файл для импорта');
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const parseResponse = await axios.post('/api/projects/project/import_projects/', formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (parseResponse.data.error) {
        setResult({ error: parseResponse.data.error });
        setImporting(false);
        return;
      }

      const tableData = parseResponse.data.table_data || [];
      const totalRows = parseResponse.data.total_rows || 0;
      const headers = tableData.length > 0 ? Object.keys(tableData[0]) : [];

      if (tableData.length === 0) {
        setResult({ error: 'Файл не содержит данных' });
        setImporting(false);
        return;
      }

      setProgress({ total: totalRows, current: 0, isActive: true, startTime: Date.now() });
      cancelImportRef.current = false;

      const results = {
        success: 0,
        errors: []
      };

      const batchSize = 5;
      let processedCount = 0;
      let batchNumber = 1;
      
      for (let i = 0; i < tableData.length; i += batchSize) {
        if (cancelImportRef.current) {
          console.log('Импорт отменен пользователем');
          setProgress({ total: totalRows, current: processedCount, isActive: false });
          setResult({
            message: `Импорт отменен. Обработано: ${processedCount} из ${totalRows}`,
            success: results.success,
            errors: results.errors,
            total: totalRows,
            cancelled: true
          });
          setImporting(false);
          return;
        }

        const batch = tableData.slice(i, i + batchSize);
        const batchResult = await processBatch(batch, headers, processedCount, totalRows, batchNumber);
        
        if (cancelImportRef.current) {
          console.log('Импорт отменен пользователем после обработки батча');
          setProgress({ total: totalRows, current: processedCount, isActive: false });
          setResult({
            message: `Импорт отменен. Обработано: ${processedCount} из ${totalRows}`,
            success: results.success,
            errors: results.errors,
            total: totalRows,
            cancelled: true
          });
          setImporting(false);
          return;
        }
        
        processedCount += batchResult.successCount || 0;
        
        if (batchResult.success) {
          results.success += batchResult.successCount || batchResult.projects.length;
        }
        
        if (batchResult.errors && batchResult.errors.length > 0) {
          results.errors.push(...batchResult.errors);
        }
        
        batchNumber++;
      }

      setProgress({ total: totalRows, current: totalRows, isActive: false });
      localStorage.removeItem('import_progress');
      setResult({
        message: `Импортировано проектов: ${results.success} из ${totalRows}`,
        success: results.success,
        errors: results.errors,
        total: totalRows
      });

      if (results.success > 0) {
        onImport();
      }
    } catch (error) {
      console.error('Ошибка импорта:', error);
      setResult({
        error: error.response?.data?.error || 'Ошибка при импорте файла'
      });
      setProgress({ total: 0, current: 0, isActive: false });
      localStorage.removeItem('import_progress');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Импорт проектов через LLM</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body" style={{ padding: '24px' }}>
          <div className="form-group">
            <label>Выберите файл (CSV или Excel)</label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={importing}
            />
            <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>
              DeepSeek LLM автоматически определит структуру таблицы, сопоставит колонки с полями проекта и сгенерирует недостающие данные. Каждая строка таблицы будет обработана как отдельный проект.
            </p>
          </div>

          {result && (
            <div style={{ 
              marginTop: '20px', 
              padding: '16px', 
              borderRadius: '8px',
              background: result.error ? '#fee2e2' : '#d1fae5',
              color: result.error ? '#dc2626' : '#065f46'
            }}>
              {result.error ? (
                <div>
                  <strong>Ошибка:</strong> {result.error}
                </div>
              ) : (
                <div>
                  <strong>Результат импорта:</strong>
                  <p>Импортировано проектов: {result.success || 0} из {result.total || 0}</p>
                  {result.errors && result.errors.length > 0 && (
                    <div style={{ marginTop: '12px' }}>
                      <strong>Ошибки:</strong>
                      <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        {result.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {result.note && (
                    <p style={{ fontSize: '12px', marginTop: '8px', opacity: 0.8 }}>
                      {result.note}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose}
              disabled={importing}
            >
              Отмена
            </button>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={handleImport}
              disabled={!file || importing}
            >
              {importing ? 'Импорт...' : 'Импортировать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
