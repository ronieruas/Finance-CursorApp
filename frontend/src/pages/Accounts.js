import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';
import Toast from '../components/Toast';

const API_URL = 'http://localhost:3001/api/accounts'; // ajuste conforme backend

const currencyOptions = [
  { value: 'BRL', label: 'Real (R$)' },
  { value: 'USD', label: 'Dólar (US$)' },
  { value: 'EUR', label: 'Euro (€)' },
];

function Accounts({ token }) {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ name: '', bank: '', type: 'corrente', balance: '', currency: 'BRL' });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setAccounts(data);
    setLoading(false);
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
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
        setToast({ show: true, message: 'Conta adicionada com sucesso!', type: 'success' });
        setForm({ name: '', bank: '', type: 'corrente', balance: '', currency: 'BRL' });
        fetchAccounts();
      } else {
        setToast({ show: true, message: 'Erro ao adicionar conta.', type: 'error' });
      }
    } catch (err) {
      setToast({ show: true, message: 'Erro ao adicionar conta.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Deseja realmente excluir esta conta?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setToast({ show: true, message: 'Conta excluída com sucesso!', type: 'success' });
        fetchAccounts();
      } else {
        setToast({ show: true, message: 'Erro ao excluir conta.', type: 'error' });
      }
    } catch (err) {
      setToast({ show: true, message: 'Erro ao excluir conta.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = acc => {
    setEditingId(acc.id);
    setEditForm(acc);
  };

  const handleEditChange = e => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
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
        setToast({ show: true, message: 'Conta atualizada com sucesso!', type: 'success' });
        setEditingId(null);
        setEditForm({});
        fetchAccounts();
      } else {
        setToast({ show: true, message: 'Erro ao atualizar conta.', type: 'error' });
      }
    } catch (err) {
      setToast({ show: true, message: 'Erro ao atualizar conta.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginLeft: 240, padding: 32 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700 }}>Contas</h2>
      <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 0 }}>
          <Input name="name" label="Nome da conta" value={form.name} onChange={handleChange} required />
          <Input name="bank" label="Banco" value={form.bank} onChange={handleChange} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
            <label style={{ marginBottom: 4, fontWeight: 500 }}>Tipo</label>
            <select name="type" value={form.type} onChange={handleChange} required className="input-glass">
              <option value="corrente">Corrente</option>
              <option value="poupanca">Poupança</option>
              <option value="investimento">Investimento</option>
            </select>
          </div>
          <Input name="balance" label="Saldo inicial" type="number" value={form.balance} onChange={handleChange} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
            <label style={{ marginBottom: 4, fontWeight: 500 }}>Moeda</label>
            <select name="currency" value={form.currency} onChange={handleChange} required className="input-glass">
              {currencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>
          <Button variant="primary" loading={loading} type="submit">Adicionar Conta</Button>
        </form>
      </motion.div>
      {loading ? <p>Carregando...</p> : (
        <motion.div className="glass-card fade-in" style={{ padding: 24 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ padding: 8 }}>Nome</th>
                <th style={{ padding: 8 }}>Banco</th>
                <th style={{ padding: 8 }}>Tipo</th>
                <th style={{ padding: 8 }}>Saldo</th>
                <th style={{ padding: 8 }}>Moeda</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {editingId === acc.id ? (
                    <>
                      <td><Input name="name" value={editForm.name} onChange={handleEditChange} /></td>
                      <td><Input name="bank" value={editForm.bank} onChange={handleEditChange} /></td>
                      <td>
                        <select name="type" value={editForm.type} onChange={handleEditChange} className="input-glass">
                          <option value="corrente">Corrente</option>
                          <option value="poupanca">Poupança</option>
                          <option value="investimento">Investimento</option>
                        </select>
                      </td>
                      <td><Input name="balance" value={editForm.balance} onChange={handleEditChange} /></td>
                      <td>
                        <select name="currency" value={editForm.currency} onChange={handleEditChange} className="input-glass">
                          {currencyOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </td>
                      <td>
                        <select name="status" value={editForm.status} onChange={handleEditChange} className="input-glass">
                          <option value="ativa">Ativa</option>
                          <option value="inativa">Inativa</option>
                        </select>
                      </td>
                      <td>
                        <Button variant="primary" onClick={handleEditSubmit} loading={loading}>Salvar</Button>
                        <Button variant="secondary" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{acc.name}</td>
                      <td>{acc.bank}</td>
                      <td>{acc.type}</td>
                      <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>R$ {Number(acc.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>{acc.currency}</td>
                      <td>{acc.status}</td>
                      <td>
                        <Button variant="secondary" onClick={() => handleEdit(acc)}>Editar</Button>
                        <Button variant="danger" onClick={() => handleDelete(acc.id)}>Excluir</Button>
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

export default Accounts; 