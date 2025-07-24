import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';
import Toast from '../components/Toast';
import dayjs from 'dayjs';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/expenses`; // ajuste conforme backend
const ACCOUNTS_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/accounts`;
const CARDS_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/creditCards`;

function Expenses({ token }) {
  const [expenses, setExpenses] = useState([]);
  const [accounts, setAccounts] = useState([]);
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
  const [filters, setFilters] = useState({ start: '', end: '', type: '', account_id: '', credit_card_id: '', category: '', status: '' });

  useEffect(() => { fetchExpenses(); fetchAccounts(); }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    // Adiciona type=conta para filtrar apenas despesas de conta
    const res = await fetch(`${API_URL}?type=conta`, { headers: { Authorization: `Bearer ${token}` } });
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
    // Corrige formato do paid_at para o input
    if (name === 'paid_at' && value) {
      // Garante formato yyyy-MM-ddThh:mm
      const dt = new Date(value);
      if (!isNaN(dt.getTime())) {
        const local = dt.toISOString().slice(0,16);
        newForm.paid_at = local;
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
      // Remove paid_at se vazio ou inválido
      if (!payload.paid_at || payload.paid_at === '' || payload.paid_at === 'Invalid date') {
        delete payload.paid_at;
      }
      // Remove campos vazios
      Object.keys(payload).forEach(k => {
        if (payload[k] === '' || payload[k] === null || payload[k] === undefined) delete payload[k];
      });
      console.log('Payload enviado:', payload);
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setToast({ show: true, message: 'Despesa adicionada com sucesso!', type: 'success' });
        setForm({ type: '', account_id: '', credit_card_id: '', description: '', value: '', due_date: '', category: '', status: 'pendente', is_recurring: false, auto_debit: false, paid_at: '', installment_type: 'avista', installment_total: 1 });
        fetchExpenses(); // Atualiza lista após criação
      } else {
        const errData = await res.json();
        setToast({ show: true, message: errData.error || 'Erro ao adicionar despesa.', type: 'error' });
      }
    } catch (err) {
      // Exibir mensagem amigável
      alert(err.message || 'Erro ao processar requisição.');
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
    } catch (err) {
      // Exibir mensagem amigável
      alert(err.message || 'Erro ao processar requisição.');
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
      // Corrigir campos vazios
      const payload = { ...editForm };
      if (!payload.category) payload.category = null;
      if (!payload.due_date || payload.due_date === 'Invalid date') payload.due_date = null;
      if (!payload.paid_at || payload.paid_at === 'Invalid date') payload.paid_at = null;
      const res = await fetch(`${API_URL}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setToast({ show: true, message: 'Despesa editada com sucesso!', type: 'success' });
        setEditingId(null); setEditForm({});
        fetchExpenses(); // Atualiza lista após edição
      } else {
        const errData = await res.json();
        setToast({ show: true, message: errData.error || 'Erro ao editar despesa.', type: 'error' });
      }
    } catch (err) {
      setToast({ show: true, message: err.message || 'Erro ao processar requisição.', type: 'error' });
    }
    setLoading(false);
  };

  const fetchExpensesWithFilters = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.start) params.append('start', filters.start);
    if (filters.end) params.append('end', filters.end);
    // Força o filtro type=conta
    params.append('type', 'conta');
    if (filters.account_id) params.append('account_id', filters.account_id);
    if (filters.category) params.append('category', filters.category);
    if (filters.status) params.append('status', filters.status);
    const res = await fetch(`${API_URL}?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setExpenses(data);
    setLoading(false);
  };

  return (
    <div style={{ marginLeft: 240, padding: 32 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700 }}>Despesas</h2>
      <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        {/* Filtros de visualização */}
        <form onSubmit={e => { e.preventDefault(); fetchExpensesWithFilters(); }} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 24 }}>
          <label>Período:</label>
          <Input name="filterStart" type="date" value={filters?.start || ''} onChange={e => setFilters(f => ({ ...f, start: e.target.value }))} />
          <span>a</span>
          <Input name="filterEnd" type="date" value={filters?.end || ''} onChange={e => setFilters(f => ({ ...f, end: e.target.value }))} />
          <label>Conta:</label>
          <select name="filterAccount" value={filters?.account_id || ''} onChange={e => setFilters(f => ({ ...f, account_id: e.target.value }))} style={{ minWidth: 120 }}>
            <option value="">Todas</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
            ))}
          </select>
          <label>Categoria:</label>
          <Input name="filterCategory" value={filters?.category || ''} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))} style={{ minWidth: 120 }} />
          <label>Status:</label>
          <select name="filterStatus" value={filters?.status || ''} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={{ minWidth: 100 }}>
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="paga">Paga</option>
            <option value="atrasada">Atrasada</option>
          </select>
          <Button variant="primary" type="submit">Filtrar</Button>
        </form>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 0 }}>
          {/* Tipo fixo como conta, não permite mais cadastrar despesas de cartão aqui */}
          <input type="hidden" name="type" value="conta" />
          <div style={{ minWidth: 180 }}>
            <label style={{ fontWeight: 500 }}>Conta</label>
            <select name="account_id" value={form.account_id} onChange={handleChange} className="input-glass" required>
              <option value="">Selecione</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
              ))}
            </select>
          </div>
          <Input name="description" label="Descrição" value={form.description} onChange={handleChange} required />
          <Input name="value" label="Valor" type="number" value={form.value} onChange={handleChange} required />
          <Input name="due_date" label="Vencimento" type="date" value={form.due_date} onChange={handleChange} required />
          <label style={{ marginBottom: 4, fontWeight: 500 }}>Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="input-glass">
            <option value="pendente">Pendente</option>
            <option value="paga">Paga</option>
            <option value="atrasada">Atrasada</option>
          </select>
          <Input name="paid_at" label="Pago em" type="datetime-local" value={form.paid_at ? form.paid_at.slice(0,16) : ''} onChange={handleChange} 
            required={form.status === 'paga'}
          />
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
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent', tableLayout: 'fixed', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ padding: 8, textAlign: 'left', width: 80 }}>Data</th>
                <th style={{ padding: 8, textAlign: 'left', width: 98 }}>Conta/Cartão</th>
                <th style={{ padding: 8, textAlign: 'left', width: 128 }}>Descrição</th>
                <th style={{ padding: 8, textAlign: 'left', width: 80 }}>Valor</th>
                <th style={{ padding: 8, textAlign: 'left', width: 80 }}>Vencimento</th>
                <th style={{ padding: 8, textAlign: 'left', width: 100 }}>Categoria</th>
                <th style={{ padding: 8, textAlign: 'left', width: 80 }}>Status</th>
                <th style={{ padding: 8, textAlign: 'left', width: 80 }}>Recorrente</th>
                <th style={{ padding: 8, textAlign: 'left', width: 80 }}>Débito automático</th>
                <th style={{ padding: 8, textAlign: 'left', width: 70 }}>Parcelas</th>
                <th style={{ padding: 8, textAlign: 'left', width: 100 }}>Pago em</th>
                <th style={{ padding: 8, textAlign: 'left', width: 105 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {expenses
                .slice()
                .sort((a, b) => new Date(b.due_date) - new Date(a.due_date))
                .map(exp => (
                <tr key={exp.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {editingId === exp.id ? (
                    <>
                      <td>
                        <select name="type" value={editForm.type} onChange={handleEditChange} className="input-glass" required style={{ width: '100%' }}>
                          <option value="conta">Conta</option>
                          <option value="cartao">Cartão de Crédito</option>
                        </select>
                      </td>
                      <td>
                        <select name="account_id" value={editForm.account_id} onChange={handleEditChange} className="input-glass" required style={{ width: '100%' }}>
                          <option value="">Selecione</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
                          ))}
                        </select>
                      </td>
                      <td><Input name="description" value={editForm.description} onChange={handleEditChange} required style={{ width: '100%' }} /></td>
                      <td><Input name="value" type="number" value={editForm.value} onChange={handleEditChange} required style={{ width: '100%' }} /></td>
                      <td><Input name="due_date" type="date" value={editForm.due_date} onChange={handleEditChange} required style={{ width: '100%' }} /></td>
                      <td><Input name="category" value={editForm.category} onChange={handleEditChange} style={{ width: '100%' }} /></td>
                      <td>
                        <select name="status" value={editForm.status} onChange={handleEditChange} className="input-glass" style={{ width: '100%' }}>
                          <option value="pendente">Pendente</option>
                          <option value="paga">Paga</option>
                          <option value="atrasada">Atrasada</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input name="is_recurring" type="checkbox" checked={!!editForm.is_recurring} onChange={handleEditChange} />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input name="auto_debit" type="checkbox" checked={!!editForm.auto_debit} onChange={handleEditChange} />
                      </td>
                      <td>
                        {editForm.type === 'cartao' ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <select name="installment_type" value={editForm.installment_type} onChange={handleEditChange} className="input-glass" style={{ width: '60%' }}>
                              <option value="avista">À vista</option>
                              <option value="parcelado">Parcelado</option>
                            </select>
                            {editForm.installment_type === 'parcelado' && (
                              <Input name="installment_total" type="number" min={1} max={36} value={editForm.installment_total} onChange={handleEditChange} style={{ width: '40%' }} />
                            )}
                          </div>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td><Input name="paid_at" type="datetime-local" value={editForm.paid_at || ''} onChange={handleEditChange} style={{ width: '100%' }} /></td>
                      <td style={{ display: 'flex', gap: 8 }}>
                        <Button variant="primary" onClick={handleEditSubmit} loading={loading}>Salvar</Button>
                        <Button variant="secondary" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ textAlign: 'left' }}>{exp.createdAt ? new Date(exp.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                      <td style={{ textAlign: 'left' }}>{accounts.find(a => a.id === exp.account_id)?.name || exp.account_id}</td>
                      <td style={{ textAlign: 'left' }}>{exp.description}</td>
                      <td style={{ textAlign: 'left', color: 'var(--color-despesa)', fontWeight: 600 }}>R$ {Number(exp.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'left' }}>{exp.due_date ? dayjs(exp.due_date).format('DD/MM/YYYY') : '-'}</td>
                      <td style={{ textAlign: 'left' }}>{exp.category}</td>
                      <td style={{ textAlign: 'left' }}>{exp.status}</td>
                      <td style={{ textAlign: 'left' }}>{exp.is_recurring ? 'Sim' : 'Não'}</td>
                      <td style={{ textAlign: 'left' }}>{exp.auto_debit ? 'Sim' : 'Não'}</td>
                      <td style={{ textAlign: 'left' }}>{exp.installment_total > 1 ? `${exp.installment_number}/${exp.installment_total}` : '-'}</td>
                      <td style={{ textAlign: 'left' }}>{exp.paid_at ? dayjs(exp.paid_at).format('DD/MM/YYYY HH:mm') : '-'}</td>
                      <td style={{ textAlign: 'left' }}>
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