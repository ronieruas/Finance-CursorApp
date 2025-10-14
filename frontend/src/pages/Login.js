import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import '../styles/global.css';

const API_URL = `${process.env.REACT_APP_API_URL || '/api'}/auth/login`;

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
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="login-container" style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        maxWidth: '1000px',
        width: '100%',
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        
        {/* Lado Esquerdo - Informações */}
        <motion.div 
          className="login-info"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            padding: '60px 40px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Logo */}
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              fontSize: '40px',
              backdropFilter: 'blur(10px)',
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}>
              💰
            </div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '700', 
              margin: '0 0 8px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              Financeiro
            </h1>
            <p style={{ 
              fontSize: '16px', 
              opacity: 0.9,
              margin: 0,
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              Controle Financeiro Inteligente
            </p>
          </div>

          {/* Recursos do Sistema */}
          <div style={{ marginBottom: '40px' }}>
            <h3 style={{ 
              fontSize: '20px', 
              fontWeight: '600', 
              margin: '0 0 24px',
              textAlign: 'center',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              Recursos Principais
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { icon: '📊', text: 'Dashboard com insights financeiros' },
                { icon: '💳', text: 'Controle de cartões de crédito' },
                { icon: '📈', text: 'Analytics e relatórios avançados' },
                { icon: '🎯', text: 'Orçamentos e metas financeiras' },
                { icon: '📱', text: 'Interface responsiva para mobile' },
                { icon: '🔒', text: 'Segurança e privacidade garantidas' }
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '8px 0'
                  }}
                >
                  <span style={{ fontSize: '20px' }}>{item.icon}</span>
                  <span style={{ 
                    fontSize: '14px', 
                    opacity: 0.9,
                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                  }}>
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Estatísticas */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <h4 style={{ 
              fontSize: '16px', 
              fontWeight: '600', 
              margin: '0 0 12px',
              textAlign: 'center',
              textShadow: '0 1px 2px rgba(0,0,0,0.3)'
            }}>
              Por que escolher nosso sistema?
            </h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '12px',
              fontSize: '12px',
              opacity: 0.9
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>⚡</div>
                <div>Rápido e Intuitivo</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🛡️</div>
                <div>100% Seguro</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>📱</div>
                <div>Multiplataforma</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>🎨</div>
                <div>Design Moderno</div>
              </div>
            </div>
          </div>

          {/* Decoração de fundo */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
        </motion.div>

        {/* Lado Direito - Formulário */}
        <motion.div 
          className="login-form"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          style={{
            padding: '60px 40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)'
          }}
        >
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h2 style={{ 
              fontSize: '28px', 
              fontWeight: '700', 
              margin: '0 0 8px',
              color: '#333'
            }}>
              Bem-vindo de volta!
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: '#666',
              margin: 0
            }}>
              Faça login para acessar sua conta
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#333',
                fontSize: '14px'
              }}>
                E-mail
              </label>
              <input 
                name="email" 
                type="email" 
                placeholder="seu@email.com" 
                value={form.email} 
                onChange={handleChange} 
                required 
                style={{ 
                  width: '100%', 
                  padding: '12px 16px',
                  border: '2px solid #e1e5e9',
                  borderRadius: '8px',
                  fontSize: '16px',
                  transition: 'border-color 0.3s ease',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                autoComplete="username"
              />
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px', 
                fontWeight: '500',
                color: '#333',
                fontSize: '14px'
              }}>
                Senha
              </label>
              <div style={{ position: 'relative' }}>
                <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Sua senha"
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      paddingRight: '48px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '8px',
                      fontSize: '16px',
                      transition: 'border-color 0.3s ease',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#667eea'}
                    onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                  />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  style={{ 
                    position: 'absolute', 
                    right: '12px', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '18px',
                    color: '#666',
                    padding: '4px'
                  }}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  tabIndex={-1}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <motion.button 
              type="submit" 
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{ 
                width: '100%',
                padding: '14px 24px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
            >
              {loading ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Entrando...
                </div>
              ) : (
                'Entrar no Sistema'
              )}
            </motion.button>
          </form>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: '20px',
                padding: '12px 16px',
                background: '#fee2e2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '14px',
                textAlign: 'center'
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Informações adicionais */}
          <div className="login-tip" style={{ 
            marginTop: '40px', 
            padding: '20px',
            background: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <h4 style={{ 
              fontSize: '14px', 
              fontWeight: '600', 
              margin: '0 0 8px',
              color: '#333'
            }}>
              💡 Dica de Segurança
            </h4>
            <p style={{ 
              fontSize: '12px', 
              color: '#666',
              margin: 0,
              lineHeight: '1.4'
            }}>
              Mantenha suas credenciais seguras e nunca compartilhe sua senha. 
              O sistema utiliza criptografia avançada para proteger seus dados.
            </p>
          </div>
        </motion.div>
      </div>

      {/* CSS para animação de loading */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default Login;
