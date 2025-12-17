import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ProgressContext } from '../../App';
import './Evaluations.css';

const Evaluations = () => {
  const { progress, evaluationsRefreshTrigger } = useContext(ProgressContext);
  const [evaluations, setEvaluations] = useState([]);
  const [users, setUsers] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(new Set());
  const [generating, setGenerating] = useState(new Set());
  const [sortBy, setSortBy] = useState('priority');
  const [sortOrder, setSortOrder] = useState('asc');

  const formatProjectNumber = (projectNumber) => {
    if (!projectNumber) return '№000';
    const num = projectNumber.replace('#', '').replace('№', '');
    const parsed = parseInt(num) || 0;
    return `№${parsed.toString().padStart(3, '0')}`;
  };

  useEffect(() => {
    fetchData();
    
    const handleFocus = () => {
      fetchEvaluations();
    };
    
    window.addEventListener('focus', handleFocus);
    const interval = setInterval(() => {
      fetchEvaluations();
    }, progress.isActive ? 1000 : 3000);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (evaluationsRefreshTrigger > 0) {
      fetchEvaluations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationsRefreshTrigger]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchEvaluations(),
        fetchUsers(),
        fetchStatuses()
      ]);
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEvaluations = async () => {
    try {
      const response = await axios.get('/api/evaluations/evaluation/', {
        withCredentials: true
      });
      setEvaluations(response.data.results || response.data);
    } catch (error) {
      console.error('Ошибка загрузки оценок:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users/list/', {
        withCredentials: true
      });
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Ошибка загрузки пользователей:', error);
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

  const handleCellChange = async (evaluationId, field, value) => {
    const evaluation = evaluations.find(e => e.id === evaluationId);
    if (!evaluation) return;

    const payload = {
      project_id: evaluation.project?.id || evaluation.project_id,
      status_id: evaluation.status?.id || evaluation.status_id || null,
      product_id: evaluation.product?.id || evaluation.product_id || null,
      developer_id: evaluation.developer?.id || evaluation.developer_id || null,
      economic_efficiency: evaluation.economic_efficiency || 0,
      technical_complexity: evaluation.technical_complexity || 0,
      expert_rating: evaluation.expert_rating || 0,
    };

    if (field.endsWith('_id')) {
      payload[field] = value || null;
    } else {
      payload[field] = value;
    }

    const updatedEvaluation = { ...evaluation };
    if (field.endsWith('_id')) {
      const baseField = field.replace('_id', '');
      if (value) {
        if (baseField === 'status') {
          updatedEvaluation.status = statuses.find(s => s.id === parseInt(value)) || null;
        } else if (['product', 'developer'].includes(baseField)) {
          updatedEvaluation[baseField] = users.find(u => u.id === parseInt(value)) || null;
        }
      } else {
        updatedEvaluation[baseField] = null;
      }
      updatedEvaluation[field] = value;
    } else {
      updatedEvaluation[field] = value;
    }

    setEvaluations(prev => prev.map(e => 
      e.id === evaluationId ? updatedEvaluation : e
    ));

    setSaving(prev => new Set(prev).add(evaluationId));

    try {
      await axios.put(`/api/evaluations/evaluation/${evaluationId}/`, payload, {
        withCredentials: true
      });

      await fetchEvaluations();
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert(error.response?.data?.error || 'Ошибка при сохранении изменений');
      await fetchEvaluations();
    } finally {
      setSaving(prev => {
        const newSet = new Set(prev);
        newSet.delete(evaluationId);
        return newSet;
      });
    }
  };

  const handleLLMGenerate = async (evaluationId) => {
    if (generating.has(evaluationId)) {
      return;
    }

    setGenerating(prev => new Set(prev).add(evaluationId));

    try {
      const response = await axios.post(
        `/api/evaluations/evaluation/${evaluationId}/generate_with_llm/`,
        {},
        { withCredentials: true }
      );

      const updatedEvaluation = response.data.evaluation;
      setEvaluations(prev => prev.map(e => 
        e.id === evaluationId ? updatedEvaluation : e
      ));

      await fetchEvaluations();
    } catch (error) {
      console.error('Ошибка генерации:', error);
      alert(error.response?.data?.error || 'Ошибка при генерации оценок через LLM');
      await fetchEvaluations();
    } finally {
      setGenerating(prev => {
        const newSet = new Set(prev);
        newSet.delete(evaluationId);
        return newSet;
      });
    }
  };

  const handleSort = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const getStatusColor = (statusName) => {
    const colors = {
      'бэклог': '#fef3c7',
      'разработка': '#dbeafe',
      'тестирование': '#fce7f3',
      'использование': '#d1fae5',
      'закрыт': '#e5e7eb'
    };
    return colors[statusName?.toLowerCase()] || 'white';
  };

  const getSortedEvaluations = () => {
    const sorted = [...evaluations];
    
    sorted.sort((a, b) => {
      let aValue, bValue;
      
      switch(sortBy) {
        case 'project_number':
          aValue = a.project?.project_number || '';
          bValue = b.project?.project_number || '';
          break;
        case 'priority':
          aValue = a.project?.priority_number || 0;
          bValue = b.project?.priority_number || 0;
          // Приоритет 0 должен быть в конце
          if (aValue === 0 && bValue !== 0) return 1;
          if (aValue !== 0 && bValue === 0) return -1;
          break;
        case 'name':
          aValue = (a.project?.name || '').toLowerCase();
          bValue = (b.project?.name || '').toLowerCase();
          break;
        case 'status':
          aValue = a.status?.name || '';
          bValue = b.status?.name || '';
          break;
        case 'economic_efficiency':
          aValue = a.economic_efficiency || 0;
          bValue = b.economic_efficiency || 0;
          break;
        case 'technical_complexity':
          aValue = a.technical_complexity || 0;
          bValue = b.technical_complexity || 0;
          break;
        case 'expert_rating':
          aValue = a.expert_rating || 0;
          bValue = b.expert_rating || 0;
          break;
        case 'vector_sum':
          aValue = a.sum || 0;
          bValue = b.sum || 0;
          break;
        case 'pm':
          aValue = (a.product?.username || '').toLowerCase();
          bValue = (b.product?.username || '').toLowerCase();
          break;
        case 'developer':
          aValue = (a.developer?.username || '').toLowerCase();
          bValue = (b.developer?.username || '').toLowerCase();
          break;
        default:
          return 0;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return sorted;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading">Загрузка данных...</div>
      </div>
    );
  }

  const sortedEvaluations = getSortedEvaluations();

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top">
          <div>
        <h1 className="page-title">Таблица оценки проектов</h1>
        <p className="page-description">
          Центральное место расчёта приоритета проектов по трём осям: экономическая эффективность, 
          сложность технической реализации и экспертная оценка.
        </p>
          </div>
          <div className="sort-controls">
            <span className="sort-info">Кликните по заголовку столбца для сортировки</span>
          </div>
        </div>
      </div>
      
      <div className="page-content">
        {evaluations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>Нет оценок</h3>
            <p>Оценки создаются автоматически при добавлении проектов</p>
          </div>
        ) : (
          <div className="evaluations-table-container">
            <table className="evaluations-table">
              <thead>
                <tr>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('project_number')}
                    title="Сортировать по № проекта"
                  >
                    № {sortBy === 'project_number' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('priority')}
                    title="Сортировать по приоритету"
                  >
                    Приоритет {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('name')}
                    title="Сортировать по названию"
                  >
                    Название {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('status')}
                    title="Сортировать по статусу"
                  >
                    Статус {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('economic_efficiency')}
                    title="Сортировать по E"
                  >
                    E {sortBy === 'economic_efficiency' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('technical_complexity')}
                    title="Сортировать по T"
                  >
                    T {sortBy === 'technical_complexity' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('expert_rating')}
                    title="Сортировать по X"
                  >
                    X {sortBy === 'expert_rating' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th>
                    🤖
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('vector_sum')}
                    title="Сортировать по сумме"
                  >
                    Сумма {sortBy === 'vector_sum' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('pm')}
                    title="Сортировать по PM"
                  >
                    PM {sortBy === 'pm' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('developer')}
                    title="Сортировать по разработчику"
                  >
                    Разработчик {sortBy === 'developer' && (sortOrder === 'asc' ? '↑' : '↓')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedEvaluations.map((evaluation) => (
                  <tr key={evaluation.id} id={`project-${evaluation.project?.id}`}>
                    <td className="cell-project-number">
                      {formatProjectNumber(evaluation.project?.project_number)}
                    </td>
                    <td className="cell-priority">
                      {evaluation.project?.priority_number || 0}
                    </td>
                    <td className="cell-project-name">
                      {evaluation.project?.name || '-'}
                    </td>
                    <td className="cell-status">
                      <select
                        value={evaluation.status?.id || ''}
                        onChange={(e) => handleCellChange(evaluation.id, 'status_id', e.target.value || null)}
                        disabled={saving.has(evaluation.id) || generating.has(evaluation.id)}
                        className={`cell-select status-select status-${evaluation.status?.name?.toLowerCase() || 'none'}`}
                      >
                        <option value="">Не выбран</option>
                        {statuses.map(status => (
                          <option
                            key={status.id}
                            value={status.id}
                            style={{ backgroundColor: getStatusColor(status.name) }}
                          >
                            {status.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="cell-evaluation">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={evaluation.economic_efficiency || 0}
                        onChange={(e) => handleCellChange(evaluation.id, 'economic_efficiency', parseFloat(e.target.value) || 0)}
                        disabled={saving.has(evaluation.id) || generating.has(evaluation.id)}
                        className="evaluation-input-compact"
                      />
                    </td>
                    <td className="cell-evaluation">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={evaluation.technical_complexity || 0}
                        onChange={(e) => handleCellChange(evaluation.id, 'technical_complexity', parseFloat(e.target.value) || 0)}
                        disabled={saving.has(evaluation.id) || generating.has(evaluation.id)}
                        className="evaluation-input-compact"
                      />
                    </td>
                    <td className="cell-evaluation">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={evaluation.expert_rating || 0}
                        onChange={(e) => handleCellChange(evaluation.id, 'expert_rating', parseFloat(e.target.value) || 0)}
                        disabled={saving.has(evaluation.id) || generating.has(evaluation.id)}
                        className="evaluation-input-compact"
                      />
                    </td>
                    <td className="cell-llm-generate">
                      <button
                        className="llm-btn-compact"
                        onClick={() => handleLLMGenerate(evaluation.id)}
                        disabled={generating.has(evaluation.id)}
                        title="Сгенерировать все оценки (E, T, X) через LLM"
                      >
                        🤖
                      </button>
                    </td>
                    <td className="cell-vector-sum">
                      {(evaluation.sum || 0).toFixed(2)}
                    </td>
                    <td className="cell-pm">
                      <select
                        value={evaluation.product?.id || ''}
                        onChange={(e) => handleCellChange(evaluation.id, 'product_id', e.target.value || null)}
                        disabled={saving.has(evaluation.id) || generating.has(evaluation.id)}
                        className="cell-select"
                      >
                        <option value="">Не выбран</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.username} {user.first_name || ''} {user.last_name || ''}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="cell-developer">
                      <select
                        value={evaluation.developer?.id || ''}
                        onChange={(e) => handleCellChange(evaluation.id, 'developer_id', e.target.value || null)}
                        disabled={saving.has(evaluation.id) || generating.has(evaluation.id)}
                        className="cell-select"
                      >
                        <option value="">Не выбран</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.username} {user.first_name || ''} {user.last_name || ''}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
        )}
      </div>
    </div>
  );
};

export default Evaluations;
