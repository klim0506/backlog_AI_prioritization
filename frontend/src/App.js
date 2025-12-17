import React, { useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import Login from './pages/Login/Login';
import Projects from './pages/Projects/Projects';
import Evaluations from './pages/Evaluations/Evaluations';
import Visualization from './pages/Visualization/Visualization';
import ProgressBar from './components/ProgressBar/ProgressBar';
import { AuthProvider, useAuth } from './context/AuthContext';

export const ProgressContext = React.createContext();

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      fontSize: '18px',
      color: '#64748b'
    }}>Загрузка...</div>;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const loadProgressFromStorage = () => {
    try {
      const saved = localStorage.getItem('import_progress');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.isActive && parsed.current < parsed.total) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Ошибка загрузки прогресса из localStorage:', e);
    }
    return { total: 0, current: 0, isActive: false };
  };

  const [progress, setProgress] = useState(loadProgressFromStorage);
  const [evaluationsRefreshTrigger, setEvaluationsRefreshTrigger] = useState(0);
  const cancelImportRef = useRef(false);

  const triggerEvaluationsRefresh = () => {
    setEvaluationsRefreshTrigger(prev => prev + 1);
  };

  const updateProgress = (newProgress) => {
    setProgress(newProgress);
    try {
      if (newProgress.isActive) {
        localStorage.setItem('import_progress', JSON.stringify(newProgress));
      } else {
        localStorage.removeItem('import_progress');
      }
    } catch (e) {
      console.error('Ошибка сохранения прогресса в localStorage:', e);
    }
  };

  const cancelImport = () => {
    cancelImportRef.current = true;
    setProgress({ total: 0, current: 0, isActive: false });
    localStorage.removeItem('import_progress');
  };

  return (
    <AuthProvider>
      <ProgressContext.Provider value={{ progress, setProgress: updateProgress, triggerEvaluationsRefresh, evaluationsRefreshTrigger, cancelImport, cancelImportRef }}>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Projects />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/evaluations" element={<Evaluations />} />
                      <Route path="/visualization" element={<Visualization />} />
                    </Routes>
                  </Layout>
                  <ProgressBar 
                    total={progress.total} 
                    current={progress.current} 
                    isActive={progress.isActive} 
                  />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </ProgressContext.Provider>
    </AuthProvider>
  );
}

export default App;

