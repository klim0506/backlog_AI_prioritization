import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const pinInputs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  const handlePinChange = (index, value) => {
    // Разрешаем только цифры
    if (value && !/^\d$/.test(value)) {
      return;
    }

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    // Автоматически переходим к следующему полю
    if (value && index < 3) {
      pinInputs[index + 1].current?.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    // При нажатии Backspace на пустом поле переходим к предыдущему
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      pinInputs[index - 1].current?.focus();
    }
  };

  const handlePinPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    
    if (/^\d{4}$/.test(pastedData)) {
      const newPin = pastedData.split('');
      setPin(newPin);
      pinInputs[3].current?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (pin.some(digit => !digit)) {
      setError('Введите 4-значный PIN-код');
      return;
    }

    setLoading(true);
    const pinString = pin.join('');

    const result = await login(username, pinString);
    
    if (result.success) {
      navigate('/projects');
    } else {
      setError(result.error);
      // Очищаем PIN при ошибке
      setPin(['', '', '', '']);
      pinInputs[0].current?.focus();
    }
    
    setLoading(false);
  };

  useEffect(() => {
    // Фокус на первое поле при загрузке
    pinInputs[0].current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Приоритизация проектов</h1>
        <p className="login-subtitle">Войдите в систему</p>
        
        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="username">Имя пользователя</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="pin">PIN-код</label>
            <div className="pin-input-container">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={pinInputs[index]}
                  type="text"
                  inputMode="numeric"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  onPaste={index === 0 ? handlePinPaste : undefined}
                  className="pin-input"
                  required
                  disabled={loading}
                  autoComplete="off"
                />
              ))}
            </div>
          </div>
          
          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Вход...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

