import React, { useState } from 'react';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/change-password`;

function ChangePassword({ token }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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
    <div style={{ maxWidth: 400, margin: '40px auto', padding: 32, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Trocar Senha</h2>
      <form onSubmit={handleSubmit}>
        <input name="currentPassword" type="password" placeholder="Senha atual" value={form.currentPassword} onChange={handleChange} required style={{ width: '100%', marginBottom: 12 }} />
        <input name="newPassword" type="password" placeholder="Nova senha" value={form.newPassword} onChange={handleChange} required style={{ width: '100%', marginBottom: 12 }} />
        <input name="confirmPassword" type="password" placeholder="Confirmar nova senha" value={form.confirmPassword} onChange={handleChange} required style={{ width: '100%', marginBottom: 12 }} />
        <button type="submit" style={{ width: '100%' }} disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
      </form>
      {message && <p style={{ color: 'green', marginTop: 12 }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
    </div>
  );
}

export default ChangePassword; 