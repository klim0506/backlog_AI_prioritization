import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ collapsed, onToggle }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/projects', label: 'Все проекты', icon: '📋' },
    { path: '/evaluations', label: 'Таблица оценки', icon: '📊' },
    { path: '/visualization', label: 'Визуализация', icon: '📈' },
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <div className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="toggle-btn" onClick={onToggle}>
          {collapsed ? '☰' : '✕'}
        </button>
        {!collapsed && <h2 className="sidebar-title">Приоритизация</h2>}
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        {!collapsed && user && (
          <div className="user-info">
            <span className="user-name">{user.username}</span>
          </div>
        )}
        <button className="logout-btn" onClick={handleLogout} title={collapsed ? 'Выход' : ''}>
          <span className="logout-icon">🚪</span>
          {!collapsed && <span>Выход</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

