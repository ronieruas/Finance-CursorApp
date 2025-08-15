import React, { useState } from 'react';
import { motion } from 'framer-motion';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/auth/change-password`;

function ChangePassword({ token }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [show, setShow] = useState({ current: false, new: false, confirm: false });

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    if (form.newPassword !== form.confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(API_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Senha alterada com sucesso!');
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setError(data.error || 'Erro ao alterar senha.');
      }
    } catch (err) {
      setError('Erro de conexão.');
    }
    setLoading(false);
  };

  return (
    <motion.div className="glass-card fade-in" style={{ padding: 32, background: 'linear-gradient(135deg, #f5f7fa 60%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px #0002', marginBottom: 32, maxWidth: 480, margin: '0 auto' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
      <h2>Trocar Senha</h2>
      <form style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'flex-start' }} onSubmit={handleSubmit}>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            name="currentPassword"
            type={show.current ? 'text' : 'password'}
            placeholder="Senha atual"
            value={form.currentPassword}
            onChange={handleChange}
            required
            autoComplete="current-password"
            style={{ width: '100%', paddingRight: 36 }}
          />
          <button type="button" onClick={() => setShow(s => ({ ...s, current: !s.current }))} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }} aria-label={show.current ? 'Ocultar senha' : 'Mostrar senha'} tabIndex={-1}>{show.current ? '🙈' : '👁️'}</button>
        </div>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            name="newPassword"
            type={show.new ? 'text' : 'password'}
            placeholder="Nova senha"
            value={form.newPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            style={{ width: '100%', paddingRight: 36 }}
          />
          <button type="button" onClick={() => setShow(s => ({ ...s, new: !s.new }))} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }} aria-label={show.new ? 'Ocultar senha' : 'Mostrar senha'} tabIndex={-1}>{show.new ? '🙈' : '👁️'}</button>
        </div>
        <div style={{ position: 'relative', width: '100%' }}>
          <input
            name="confirmPassword"
            type={show.confirm ? 'text' : 'password'}
            placeholder="Confirmar nova senha"
            value={form.confirmPassword}
            onChange={handleChange}
            required
            autoComplete="new-password"
            style={{ width: '100%', paddingRight: 36 }}
          />
          <button type="button" onClick={() => setShow(s => ({ ...s, confirm: !s.confirm }))} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }} aria-label={show.confirm ? 'Ocultar senha' : 'Mostrar senha'} tabIndex={-1}>{show.confirm ? '🙈' : '👁️'}</button>
        </div>
        <button type="submit" style={{ width: '100%' }} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
      </form>
      {message && <p style={{ color: 'green', marginTop: 12 }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
    </motion.div>
  );
}

export default ChangePassword;