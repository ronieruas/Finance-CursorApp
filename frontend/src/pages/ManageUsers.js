import React, { useEffect, useState } from 'react';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/users`;

function ManageUsers({ token }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'user' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  useEffect(() => { fetchUsers(); }, []);

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
        <input name="password" type="password" placeholder="Senha" value={form.password} onChange={handleChange} required style={{ width: '100%', marginBottom: 12 }} />
        <select name="role" value={form.role} onChange={handleChange} style={{ width: '100%', marginBottom: 12 }}>
          <option value="user">Usuário</option>
          <option value="admin">Administrador</option>
        </select>
        <button type="submit" style={{ width: '100%' }} disabled={loading}>{loading ? 'Salvando...' : 'Criar Usuário'}</button>
      </form>
      {message && <p style={{ color: 'green', marginTop: 12 }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
      <h3>Usuários Existentes</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
        <thead>
          <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
            <th style={{ padding: 8 }}>Nome</th>
            <th style={{ padding: 8 }}>E-mail</th>
            <th style={{ padding: 8 }}>Tipo</th>
            <th style={{ padding: 8 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{u.name}</td>
              <td style={{ padding: 8 }}>{u.email}</td>
              <td style={{ padding: 8 }}>{u.role}</td>
              <td style={{ padding: 8 }}><button onClick={() => handleDelete(u.id)} style={{ color: 'red' }}>Excluir</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ManageUsers; 