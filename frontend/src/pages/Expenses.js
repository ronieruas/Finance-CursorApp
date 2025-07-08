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
  const [filters, setFilters] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0,10);
    return {
      start: firstDay,
      end: lastDay,
      type: '',
      account_id: '',
      credit_card_id: '',
      category: '',
      status: ''
    };
  });
  const [categories, setCategories] = useState([]);

  useEffect(() => { fetchExpenses(); fetchAccounts(); fetchCards(); fetchCategories(); }, []);

  const fetchExpenses = async (customFilters) => {
    setLoading(true);
    const f = customFilters || filters;
    const params = new URLSearchParams();
    if (f.start && f.end) { params.append('start', f.start); params.append('end', f.end); }
    if (f.type) params.append('type', f.type);
    if (f.account_id) params.append('account_id', f.account_id);
    if (f.credit_card_id) params.append('credit_card_id', f.credit_card_id);
    if (f.category) params.append('category', f.category);
    if (f.status) params.append('status', f.status);
    const res = await fetch(`${API_URL}?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
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

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${API_URL}/categories`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCategories(data);
    } catch {
      setCategories([]);
    }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    let newForm = { ...form, [name]: type === 'checkbox' ? checked : value };
    // Limpar campos desnecessários ao trocar o tipo
    if (name === 'type') {
      if (value === 'cartao') {
        newForm = { ...newForm, account_id: '', due_date: '', status: 'pendente', paid_at: '' };
      } else if (value === 'conta') {
        newForm = { ...newForm, credit_card_id: '', installment_type: 'avista', installment_total: 1 };
      }
    }
    setForm(newForm);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      let payload = { ...form };
      if (form.type === 'cartao') {
        delete payload.status;
        delete payload.paid_at;
        delete payload.account_id;
      } else {
        delete payload.credit_card_id;
        delete payload.installment_type;
        delete payload.installment_total;
      }
      console.log('Payload enviado:', payload);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setToast({ show: true, message: 'Despesa adicionada com sucesso!', type: 'success' });
        setForm({ type: '', account_id: '', credit_card_id: '', description: '', value: '', due_date: '', category: '', status: 'pendente', is_recurring: false, auto_debit: false, paid_at: '', installment_type: 'avista', installment_total: 1 });
        fetchExpenses();
      } else {
        const errData = await res.json();
        setToast({ show: true, message: errData.error || 'Erro ao adicionar despesa.', type: 'error' });
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

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };
  const handleFilterSubmit = e => {
    e.preventDefault();
    fetchExpenses();
  };

  return (
    <div style={{ marginLeft: 240, padding: 32 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700 }}>Despesas</h2>
      {/* Filtros de despesas */}
      <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <label>Período:</label>
        <Input name="start" type="date" value={filters.start} onChange={handleFilterChange} required />
        <span>a</span>
        <Input name="end" type="date" value={filters.end} onChange={handleFilterChange} required />
        <label>Tipo:</label>
        <select name="type" value={filters.type} onChange={handleFilterChange} className="input-glass" style={{ minWidth: 100 }}>
          <option value="">Todos</option>
          <option value="conta">Conta</option>
          <option value="cartao">Cartão</option>
        </select>
        <label>Conta:</label>
        <select name="account_id" value={filters.account_id} onChange={handleFilterChange} className="input-glass" style={{ minWidth: 120 }}>
          <option value="">Todas</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
          ))}
        </select>
        <label>Cartão:</label>
        <select name="credit_card_id" value={filters.credit_card_id} onChange={handleFilterChange} className="input-glass" style={{ minWidth: 120 }}>
          <option value="">Todos</option>
          {cards.map(card => (
            <option key={card.id} value={card.id}>{card.name} ({card.bank})</option>
          ))}
        </select>
        <label>Categoria:</label>
        <select name="category" value={filters.category} onChange={handleFilterChange} className="input-glass" style={{ minWidth: 120 }}>
          <option value="">Todas</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <label>Status:</label>
        <select name="status" value={filters.status} onChange={handleFilterChange} className="input-glass" style={{ minWidth: 120 }}>
          <option value="">Todos</option>
          <option value="pendente">Pendente</option>
          <option value="paga">Paga</option>
          <option value="atrasada">Atrasada</option>
        </select>
        <button type="submit" style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 500 }}>Filtrar</button>
      </form>
      {/* Formulário de edição de despesa */}
      {editingId && (
        <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32, border: '2px solid var(--color-primary)' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleEditSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 0 }}>
            <div style={{ minWidth: 120 }}>
              <label style={{ fontWeight: 500 }}>Tipo</label>
              <select name="type" value={editForm.type || ''} onChange={handleEditChange} className="input-glass" required disabled>
                <option value="">Selecione o tipo</option>
                <option value="conta">Conta</option>
                <option value="cartao">Cartão de Crédito</option>
              </select>
            </div>
            {editForm.type === 'conta' && (
              <div style={{ minWidth: 180 }}>
                <label style={{ fontWeight: 500 }}>Conta</label>
                <select name="account_id" value={editForm.account_id || ''} onChange={handleEditChange} className="input-glass" required>
                  <option value="">Selecione</option>
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
                  ))}
                </select>
              </div>
            )}
            {editForm.type === 'cartao' && (
              <>
                <div style={{ minWidth: 180 }}>
                  <label style={{ fontWeight: 500 }}>Cartão</label>
                  <select name="credit_card_id" value={editForm.credit_card_id || ''} onChange={handleEditChange} className="input-glass" required>
                    <option value="">Selecione</option>
                    {cards.map(card => (
                      <option key={card.id} value={card.id}>{card.name} ({card.bank})</option>
                    ))}
                  </select>
                </div>
                <div style={{ minWidth: 120 }}>
                  <label style={{ fontWeight: 500 }}>Tipo de Lançamento</label>
                  <select name="installment_type" value={editForm.installment_type || 'avista'} onChange={handleEditChange} className="input-glass" required>
                    <option value="avista">À vista</option>
                    <option value="parcelado">Parcelado</option>
                  </select>
                </div>
                {editForm.installment_type === 'parcelado' && (
                  <div style={{ minWidth: 100 }}>
                    <label style={{ fontWeight: 500 }}>Parcelas</label>
                    <Input name="installment_total" type="number" min={1} max={36} value={editForm.installment_total || 1} onChange={handleEditChange} required />
                  </div>
                )}
              </>
            )}
            <Input name="description" label="Descrição" value={editForm.description || ''} onChange={handleEditChange} required />
            <Input name="value" label="Valor" type="number" value={editForm.value || ''} onChange={handleEditChange} required />
            {editForm.type === 'cartao' && (
              <Input name="due_date" label="Data da compra" type="date" value={editForm.due_date ? editForm.due_date.slice(0,10) : ''} onChange={handleEditChange} required />
            )}
            {editForm.type === 'conta' && (
              <>
                <Input name="due_date" label="Vencimento" type="date" value={editForm.due_date ? editForm.due_date.slice(0,10) : ''} onChange={handleEditChange} required />
                <label style={{ marginBottom: 4, fontWeight: 500 }}>Status</label>
                <select name="status" value={editForm.status || 'pendente'} onChange={handleEditChange} className="input-glass">
                  <option value="pendente">Pendente</option>
                  <option value="paga">Paga</option>
                  <option value="atrasada">Atrasada</option>
                </select>
                <Input name="paid_at" label="Pago em" type="datetime-local" value={editForm.paid_at || ''} onChange={handleEditChange} />
              </>
            )}
            <Input name="category" label="Categoria" value={editForm.category || ''} onChange={handleEditChange} />
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 120 }}>
              <input name="is_recurring" type="checkbox" checked={!!editForm.is_recurring} onChange={handleEditChange} /> Recorrente
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 120 }}>
              <input name="auto_debit" type="checkbox" checked={!!editForm.auto_debit} onChange={handleEditChange} /> Débito automático
            </label>
            <Button variant="primary" loading={loading} type="submit">Salvar Edição</Button>
            <Button variant="secondary" type="button" onClick={() => { setEditingId(null); setEditForm({}); }}>Cancelar</Button>
          </form>
        </motion.div>
      )}
      <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 0 }}>
          <div style={{ minWidth: 120 }}>
            <label style={{ fontWeight: 500 }}>Tipo</label>
            <select name="type" value={form.type} onChange={handleChange} className="input-glass" required>
              <option value="">Selecione o tipo</option>
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
          {form.type === 'cartao' && (
            <Input name="due_date" label="Data da compra" type="date" value={form.due_date} onChange={handleChange} required />
          )}
          {form.type === 'conta' && (
            <>
              <Input name="due_date" label="Vencimento" type="date" value={form.due_date} onChange={handleChange} required />
              <label style={{ marginBottom: 4, fontWeight: 500 }}>Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="input-glass">
                <option value="pendente">Pendente</option>
                <option value="paga">Paga</option>
                <option value="atrasada">Atrasada</option>
              </select>
              <Input name="paid_at" label="Pago em" type="datetime-local" value={form.paid_at} onChange={handleChange} />
            </>
          )}
          <Input name="category" label="Categoria" value={form.category} onChange={handleChange} />
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 120 }}>
            <input name="is_recurring" type="checkbox" checked={form.is_recurring} onChange={handleChange} /> Recorrente
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 120 }}>
            <input name="auto_debit" type="checkbox" checked={form.auto_debit} onChange={handleChange} /> Débito automático
          </label>
          <Button variant="primary" loading={loading} type="submit">Adicionar Despesa</Button>
        </form>
      </motion.div>
      {loading ? <p>Carregando...</p> : (
        <motion.div className="glass-card fade-in" style={{ padding: 24 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
            <thead>
              <tr>
                <th style={{ padding: 8 }}>Data</th>
                <th style={{ padding: 8 }}>Conta/Cartão</th>
                <th style={{ padding: 8 }}>Descrição</th>
                <th style={{ padding: 8 }}>Valor</th>
                <th style={{ padding: 8 }}>Vencimento</th>
                <th style={{ padding: 8 }}>Categoria</th>
                <th style={{ padding: 8 }}>Recorrente</th>
                <th style={{ padding: 8 }}>Débito automático</th>
                <th style={{ padding: 8 }}>Parcelas</th>
                <th style={{ padding: 8 }}>Pago em</th>
                <th style={{ padding: 8 }}></th>
              </tr>
            </thead>
            <tbody>
              {expenses.map(exp => (
                <tr key={exp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td>{exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>
                    {exp.account_id ? (accounts.find(a => a.id === exp.account_id)?.name || exp.account_id) : ''}
                    {exp.credit_card_id ? (cards.find(c => c.id === exp.credit_card_id)?.name ? `Cartão: ${cards.find(c => c.id === exp.credit_card_id)?.name}` : `Cartão ID: ${exp.credit_card_id}`) : ''}
                  </td>
                  <td>{exp.description}</td>
                  <td style={{ color: 'var(--color-despesa)', fontWeight: 600 }}>R$ {Number(exp.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>{exp.due_date ? new Date(exp.due_date).toLocaleDateString('pt-BR') : '-'}</td>
                  <td>{exp.category}</td>
                  <td>{exp.is_recurring ? 'Sim' : 'Não'}</td>
                  <td>{exp.auto_debit ? 'Sim' : 'Não'}</td>
                  <td>{exp.installment_total > 1 ? `${exp.installment_number}/${exp.installment_total}` : '-'}</td>
                  <td>{exp.paid_at ? new Date(exp.paid_at).toLocaleString('pt-BR') : '-'}</td>
                  <td>
                    <Button variant="secondary" onClick={() => handleEdit(exp)}>Editar</Button>
                    <Button variant="danger" onClick={() => handleDelete(exp.id)}>Excluir</Button>
                  </td>
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