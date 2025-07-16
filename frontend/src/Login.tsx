import React, { useState } from 'react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          password,
        }),
      });

      if (!response.ok) {
        setError('Неверное имя пользователя или пароль');
        setLoading(false);
        return;
      }

      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      onLoginSuccess();
    } catch (err) {
      setError('Ошибка при попытке входа. Проверьте подключение к серверу.');
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form fade-in">
        <div className="login-title">
          🔐 Вход в систему
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Имя пользователя
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Введите имя пользователя"
              required
              autoComplete="username"
            />
          </div>
          
          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Введите пароль"
              required
              autoComplete="current-password"
            />
          </div>
          
          {error && (
            <div className="error-message slide-in">
              ⚠️ {error}
            </div>
          )}
          
          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? '⏳ Вход...' : '🚀 Войти'}
          </button>
        </form>
        
        <div style={{ 
          marginTop: '24px', 
          padding: '16px', 
          background: 'rgba(18, 189, 124, 0.1)', 
          borderRadius: '8px',
          fontSize: '14px',
          color: 'var(--text-secondary)',
          textAlign: 'center'
        }}>
          💡 Система управления рисками процессов
        </div>
      </div>
    </div>
  );
};

export default Login;