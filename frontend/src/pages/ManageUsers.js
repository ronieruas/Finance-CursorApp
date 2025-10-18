import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import useApiBase from '../hooks/useApiBase';

function ManageUsers({ token }) {
  const apiBase = useApiBase();
  const API_URL = `${apiBase}/users`;
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError('Erro ao buscar usuários.');
    }
    setLoading(false);
  };

  useEffect(() => { 
    if (!apiBase) return;
    fetchUsers(); 
  }, [apiBase, token]);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Usuário criado com sucesso!');
        setForm({ name: '', email: '', password: '', role: 'user' });
        fetchUsers();
      } else {
        setError(data.error || 'Erro ao criar usuário.');
      }
    } catch (err) {
      setError('Erro ao criar usuário.');
    }
    setLoading(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Deseja realmente excluir este usuário?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage('Usuário removido com sucesso!');
        fetchUsers();
      } else {
        setError('Erro ao remover usuário.');
      }
    } catch (err) {
      setError('Erro ao remover usuário.');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 32, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Gerenciar Usuários</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input name="name" type="text" placeholder="Nome" value={form.name} onChange={handleChange} required style={{ width: '100%', marginBottom: 12 }} />
        <input name="email" type="email" placeholder="E-mail" value={form.email} onChange={handleChange} required style={{ width: '100%', marginBottom: 12 }} />
        <div style={{ position: 'relative', width: '100%', marginBottom: 12 }}>
          <input
            name="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Senha"
            required
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
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
        <select name="role" value={form.role} onChange={handleChange} style={{ width: '100%', marginBottom: 12 }}>
          <option value="user">Usuário</option>
          <option value="admin">Administrador</option>
        </select>
        <button type="submit" style={{ width: '100%' }} disabled={loading}>{loading ? 'Salvando...' : 'Criar Usuário'}</button>
      </form>
      {message && <p style={{ color: 'green', marginTop: 12 }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
      <h3>Usuários Existentes</h3>
      <motion.div className="glass-card fade-in" style={{ padding: 32, background: 'linear-gradient(135deg, #f5f7fa 60%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px #0002', marginBottom: 32 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
        <thead>
          <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
              <th style={{ padding: 8, textAlign: 'left' }}>Nome</th>
              <th style={{ padding: 8, textAlign: 'left' }}>E-mail</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Perfil</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ textAlign: 'left' }}>{user.name}</td>
                <td style={{ textAlign: 'left' }}>{user.email}</td>
                <td style={{ textAlign: 'left' }}>{user.role}</td>
                <td style={{ textAlign: 'left' }}>
                  <button onClick={() => handleDelete(user.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>Excluir</button>
                </td>
            </tr>
          ))}
        </tbody>
      </table>
      </motion.div>
    </div>
  );
}

export default ManageUsers;