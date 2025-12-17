import React, { useContext } from 'react';
import { ProgressContext } from '../../App';
import './ProgressBar.css';

const ProgressBar = ({ total, current, isActive }) => {
  const { cancelImport } = useContext(ProgressContext);
  
  if (!isActive) return null;

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  const handleCancel = () => {
    cancelImport();
  };

  return (
    <div className="progress-bar-container">
      <div className="progress-bar-content">
        <div className="progress-bar-icon">
          <div className="spinner"></div>
        </div>
        <div className="progress-bar-info">
          <div className="progress-bar-text">
            Обработка: {current} / {total}
          </div>
          <div className="progress-bar-track">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
        </div>
        <button 
          className="progress-bar-cancel"
          onClick={handleCancel}
          title="Отменить импорт"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default ProgressBar;

