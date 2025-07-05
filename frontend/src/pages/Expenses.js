import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';
import Toast from '../components/Toast';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/expenses`; // ajuste conforme backend
const ACCOUNTS_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/accounts`;
const CARDS_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/creditCards`;

function Expenses({ token }) {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState({
    type: '', // 'conta' ou 'cartao'
    account_id: '',
    credit_card_id: '',
    description: '',
    value: '',
    due_date: '',
    category: '',
    status: 'pendente',
    is_recurring: false,
    auto_debit: false,
    paid_at: '',
    installment_type: 'avista', // 'avista' ou 'parcelado'
    installment_total: 1
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => { fetchExpenses(); fetchAccounts(); fetchCards(); }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setExpenses(data);
    setLoading(false);
  };

  const fetchAccounts = async () => {
    try {
      const res = await fetch(ACCOUNTS_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAccounts(data);
    } catch {
      setAccounts([]);
    }
  };

  const fetchCards = async () => {
    try {
      const res = await fetch(CARDS_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCards(data);
    } catch {
      setCards([]);
    }
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
        setToast({ show: true, message: 'Despesa adicionada com sucesso!', type: 'success' });
        setForm({ type: '', account_id: '', credit_card_id: '', description: '', value: '', due_date: '', category: '', status: 'pendente', is_recurring: false, auto_debit: false, paid_at: '', installment_type: 'avista', installment_total: 1 });
        fetchExpenses();
      } else {
        setToast({ show: true, message: 'Erro ao adicionar despesa.', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: 'Erro ao adicionar despesa.', type: 'error' });
    }
    setLoading(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Deseja realmente excluir esta despesa?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setToast({ show: true, message: 'Despesa excluída com sucesso!', type: 'success' });
        fetchExpenses();
      } else {
        setToast({ show: true, message: 'Erro ao excluir despesa.', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: 'Erro ao excluir despesa.', type: 'error' });
    }
    setLoading(false);
  };

  const handleEdit = exp => { setEditingId(exp.id); setEditForm(exp); };

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
        setToast({ show: true, message: 'Despesa editada com sucesso!', type: 'success' });
        setEditingId(null); setEditForm({});
        fetchExpenses();
      } else {
        setToast({ show: true, message: 'Erro ao editar despesa.', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: 'Erro ao editar despesa.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div style={{ marginLeft: 240, padding: 32 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700 }}>Despesas</h2>
      <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 0 }}>
          <div style={{ minWidth: 120 }}>
            <label style={{ fontWeight: 500 }}>Tipo</label>
            <select name="type" value={form.type} onChange={handleChange} className="input-glass" required>
              <option value="">Selecione</option>
              <option value="conta">Conta</option>
              <option value="cartao">Cartão de Crédito</option>
            </select>
          </div>
          {form.type === 'conta' && (
            <div style={{ minWidth: 180 }}>
              <label style={{ fontWeight: 500 }}>Conta</label>
              <select name="account_id" value={form.account_id} onChange={handleChange} className="input-glass" required>
                <option value="">Selecione</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
                ))}
              </select>
            </div>
          )}
          {form.type === 'cartao' && (
            <>
              <div style={{ minWidth: 180 }}>
                <label style={{ fontWeight: 500 }}>Cartão</label>
                <select name="credit_card_id" value={form.credit_card_id} onChange={handleChange} className="input-glass" required>
                  <option value="">Selecione</option>
                  {cards.map(card => (
                    <option key={card.id} value={card.id}>{card.name} ({card.bank})</option>
                  ))}
                </select>
              </div>
              <div style={{ minWidth: 120 }}>
                <label style={{ fontWeight: 500 }}>Tipo de Lançamento</label>
                <select name="installment_type" value={form.installment_type} onChange={handleChange} className="input-glass" required>
                  <option value="avista">À vista</option>
                  <option value="parcelado">Parcelado</option>
                </select>
              </div>
              {form.installment_type === 'parcelado' && (
                <div style={{ minWidth: 100 }}>
                  <label style={{ fontWeight: 500 }}>Parcelas</label>
                  <Input name="installment_total" type="number" min={1} max={36} value={form.installment_total} onChange={handleChange} required />
                </div>
              )}
            </>
          )}
          <Input name="description" label="Descrição" value={form.description} onChange={handleChange} required />
          <Input name="value" label="Valor" type="number" value={form.value} onChange={handleChange} required />
          <Input name="due_date" label="Vencimento" type="date" value={form.due_date} onChange={handleChange} required />
          <Input name="category" label="Categoria" value={form.category} onChange={handleChange} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
            <label style={{ marginBottom: 4, fontWeight: 500 }}>Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-glass">
              <option value="pendente">Pendente</option>
              <option value="paga">Paga</option>
              <option value="atrasada">Atrasada</option>
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 120 }}>
            <input name="is_recurring" type="checkbox" checked={form.is_recurring} onChange={handleChange} /> Recorrente
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 120 }}>
            <input name="auto_debit" type="checkbox" checked={form.auto_debit} onChange={handleChange} /> Débito automático
          </label>
          <Input name="paid_at" label="Pago em" type="datetime-local" value={form.paid_at} onChange={handleChange} />
          <Button variant="primary" loading={loading} type="submit">Adicionar Despesa</Button>
        </form>
      </motion.div>
      {loading ? <p>Carregando...</p> : (
        <motion.div className="glass-card fade-in" style={{ padding: 24 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ padding: 8 }}>Conta/Cartão</th>
                <th style={{ padding: 8 }}>Descrição</th>
                <th style={{ padding: 8 }}>Valor</th>
                <th style={{ padding: 8 }}>Vencimento</th>
                <th style={{ padding: 8 }}>Categoria</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Recorrente</th>
                <th style={{ padding: 8 }}>Débito automático</th>
                <th style={{ padding: 8 }}>Parcela</th>
                <th style={{ padding: 8 }}>Pago em</th>
                <th style={{ padding: 8 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {editingId === exp.id ? (
                    <>
                      <td><Input name="account_id" value={editForm.account_id} onChange={handleEditChange} /></td>
                      <td><Input name="description" value={editForm.description} onChange={handleEditChange} /></td>
                      <td><Input name="value" value={editForm.value} onChange={handleEditChange} /></td>
                      <td><Input name="due_date" value={editForm.due_date} onChange={handleEditChange} /></td>
                      <td><Input name="category" value={editForm.category} onChange={handleEditChange} /></td>
                      <td>
                        <select name="status" value={editForm.status} onChange={handleEditChange} className="input-glass">
                          <option value="pendente">Pendente</option>
                          <option value="paga">Paga</option>
                          <option value="atrasada">Atrasada</option>
                        </select>
                      </td>
                      <td><input name="is_recurring" type="checkbox" checked={!!editForm.is_recurring} onChange={e => setEditForm({ ...editForm, is_recurring: e.target.checked })} /></td>
                      <td><input name="auto_debit" type="checkbox" checked={!!editForm.auto_debit} onChange={e => setEditForm({ ...editForm, auto_debit: e.target.checked })} /></td>
                      <td>{editForm.installment_total > 1 ? `${editForm.installment_number}/${editForm.installment_total}` : '-'}</td>
                      <td><Input name="paid_at" value={editForm.paid_at || ''} onChange={handleEditChange} /></td>
                      <td>
                        <Button variant="primary" onClick={handleEditSubmit} loading={loading}>Salvar</Button>
                        <Button variant="secondary" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>
                        {exp.account_id ? (accounts.find(a => a.id === exp.account_id)?.name || exp.account_id) : ''}
                        {exp.credit_card_id ? (cards.find(c => c.id === exp.credit_card_id)?.name ? `Cartão: ${cards.find(c => c.id === exp.credit_card_id)?.name}` : `Cartão ID: ${exp.credit_card_id}`) : ''}
                      </td>
                      <td>{exp.description}</td>
                      <td style={{ color: 'var(--color-despesa)', fontWeight: 600 }}>R$ {Number(exp.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>{exp.due_date}</td>
                      <td>{exp.category}</td>
                      <td>{exp.status}</td>
                      <td>{exp.is_recurring ? 'Sim' : 'Não'}</td>
                      <td>{exp.auto_debit ? 'Sim' : 'Não'}</td>
                      <td>{exp.installment_total > 1 ? `${exp.installment_number}/${exp.installment_total}` : '-'}</td>
                      <td>{exp.paid_at || '-'}</td>
                      <td>
                        <Button variant="secondary" onClick={() => handleEdit(exp)}>Editar</Button>
                        <Button variant="danger" onClick={() => handleDelete(exp.id)}>Excluir</Button>
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

export default Expenses; 