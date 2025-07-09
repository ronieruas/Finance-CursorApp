import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/login`; // ajuste conforme backend

function Login({ setToken }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem('token', data.token);
        setToken(data.token);
        navigate('/');
      } else {
        setError(data.error || 'Falha no login');
      }
    } catch (err) {
      setError('Erro de conexão');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 320, margin: '80px auto', padding: 32, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input name="email" type="email" placeholder="E-mail" value={form.email} onChange={handleChange} required style={{ width: '100%', marginBottom: 12 }} />
        <div style={{ position: 'relative', width: '100%', marginBottom: 12 }}>
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha"
            value={form.password}
            onChange={handleChange}
            required
            style={{ width: '100%', paddingRight: 36 }}
          />
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            tabIndex={-1}
          >
            {showPassword ? '🙈' : '👁️'}
          </button>
        </div>
        <button type="submit" style={{ width: '100%' }} disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
    </div>
  );
}

export default Login; 