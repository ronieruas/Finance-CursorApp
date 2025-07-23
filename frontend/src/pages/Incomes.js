import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';
import Toast from '../components/Toast';
import dayjs from 'dayjs';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/incomes`; // ajuste conforme backend
const ACCOUNTS_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/accounts`;

function Incomes({ token }) {
  const [incomes, setIncomes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ account_id: '', description: '', value: '', date: '', category: '', is_recurring: false });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => { fetchIncomes(); fetchAccounts(); }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(ACCOUNTS_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAccounts(data);
    } catch {
      setAccounts([]);
    }
  };

  const fetchIncomes = async () => {
    setLoading(true);
    const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setIncomes(data);
    setLoading(false);
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setToast({ show: true, message: 'Receita adicionada com sucesso!', type: 'success' });
        setForm({ account_id: '', description: '', value: '', date: '', category: '', is_recurring: false });
        fetchIncomes();
      } else {
        setToast({ show: true, message: 'Erro ao adicionar receita.', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: 'Erro ao adicionar receita.', type: 'error' });
    }
    setLoading(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Deseja realmente excluir esta receita?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setToast({ show: true, message: 'Receita excluída com sucesso!', type: 'success' });
        fetchIncomes();
      } else {
        setToast({ show: true, message: 'Erro ao excluir receita.', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: 'Erro ao excluir receita.', type: 'error' });
    }
    setLoading(false);
  };

  const handleEdit = inc => { setEditingId(inc.id); setEditForm(inc); };

  const handleEditChange = e => {
    const { name, value, type, checked } = e.target;
    setEditForm({ ...editForm, [name]: type === 'checkbox' ? checked : value });
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setToast({ show: true, message: 'Receita editada com sucesso!', type: 'success' });
        setEditingId(null); setEditForm({});
        fetchIncomes();
      } else {
        setToast({ show: true, message: 'Erro ao editar receita.', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: 'Erro ao editar receita.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div style={{ marginLeft: 240, padding: 32 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700 }}>Receitas</h2>
      <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 0 }}>
          <label style={{ minWidth: 120 }}>
            Conta:
            <select name="account_id" value={form.account_id} onChange={handleChange} required style={{ width: '100%' }}>
              <option value="">Selecione</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
              ))}
            </select>
          </label>
          <Input name="description" label="Descrição" value={form.description} onChange={handleChange} required />
          <Input name="value" label="Valor" type="number" value={form.value} onChange={handleChange} required />
          <Input name="date" label="Data" type="date" value={form.date} onChange={handleChange} required />
          <Input name="category" label="Categoria" value={form.category} onChange={handleChange} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 120 }}>
            <input name="is_recurring" type="checkbox" checked={form.is_recurring} onChange={handleChange} /> Recorrente
          </label>
          <Button variant="primary" loading={loading} type="submit">Adicionar Receita</Button>
        </form>
      </motion.div>
      {loading ? <p>Carregando...</p> : (
        <motion.div className="glass-card fade-in" style={{ padding: 24 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ padding: 8, textAlign: 'left' }}>Conta</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Descrição</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Valor</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Data</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Categoria</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Recorrente</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {incomes.map(inc => (
                <tr key={inc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {editingId === inc.id ? (
                    <>
                      <td style={{ textAlign: 'left' }}>
                        <select name="account_id" value={editForm.account_id} onChange={handleEditChange} required>
                          <option value="">Selecione</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ textAlign: 'left' }}><Input name="description" value={editForm.description} onChange={handleEditChange} /></td>
                      <td style={{ textAlign: 'left' }}><Input name="value" value={editForm.value} onChange={handleEditChange} /></td>
                      <td style={{ textAlign: 'left' }}><Input name="date" value={editForm.date ? dayjs(editForm.date).format('DD/MM/YYYY') : ''} onChange={handleEditChange} /></td>
                      <td style={{ textAlign: 'left' }}><Input name="category" value={editForm.category} onChange={handleEditChange} /></td>
                      <td style={{ textAlign: 'left' }}><input name="is_recurring" type="checkbox" checked={!!editForm.is_recurring} onChange={e => setEditForm({ ...editForm, is_recurring: e.target.checked })} /></td>
                      <td style={{ textAlign: 'left' }}>
                        <Button variant="primary" onClick={handleEditSubmit} loading={loading}>Salvar</Button>
                        <Button variant="secondary" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ textAlign: 'left' }}>{accounts.find(a => a.id === inc.account_id)?.name || inc.account_id}</td>
                      <td style={{ textAlign: 'left' }}>{inc.description}</td>
                      <td style={{ textAlign: 'left', color: 'var(--color-receita)', fontWeight: 600 }}>R$ {Number(inc.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'left' }}>{inc.date ? dayjs(inc.date).format('DD/MM/YYYY') : ''}</td>
                      <td style={{ textAlign: 'left' }}>{inc.category}</td>
                      <td style={{ textAlign: 'left' }}>{inc.is_recurring ? 'Sim' : 'Não'}</td>
                      <td style={{ textAlign: 'left' }}>
                        <Button variant="secondary" onClick={() => handleEdit(inc)}>Editar</Button>
                        <Button variant="danger" onClick={() => handleDelete(inc.id)}>Excluir</Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}

export default Incomes; 