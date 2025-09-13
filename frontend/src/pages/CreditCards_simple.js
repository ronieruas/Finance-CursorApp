import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import dayjs from 'dayjs';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const API_URL = `${process.env.REACT_APP_API_URL}/creditCards`;

function CreditCards({ token }) {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState({ bank: '', brand: '', limit_value: '', due_day: '', closing_day: '', name: '', status: 'ativa' });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [limits, setLimits] = useState({});
  const [payModal, setPayModal] = useState({ open: false, card: null });
  const [accounts, setAccounts] = useState([]);
  const [bill, setBill] = useState(null);
  const [payForm, setPayForm] = useState({ account_id: '', value: '', payment_date: '', is_full_payment: true, auto_debit: false });
  const [payLoading, setPayLoading] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);
  const [cardExpenses, setCardExpenses] = useState({});

  useEffect(() => { 
    fetchCards(); 
    fetchLimits(); 
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    const res = await fetch(`${process.env.REACT_APP_API_URL}/creditCards`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setCards(data);
    setLoading(false);
  };

  const fetchLimits = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/creditCards/limits`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const map = {};
      data.forEach(l => { map[l.card_id] = l.utilizado; });
      setLimits(map);
    } catch {
      setLimits({});
    }
  };

  const fetchAccounts = async () => {
    const res = await fetch(`${process.env.REACT_APP_API_URL}/accounts`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setAccounts(data);
  };

  const fetchBill = async (cardId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/creditCards/${cardId}/bill`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        setBill(null);
        return;
      }
      const data = await res.json();
      setBill(data);
    } catch (err) {
      setBill(null);
    }
  };

  const fetchCardExpenses = async (cardId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/creditCards/${cardId}/expenses`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCardExpenses(prev => ({ ...prev, [cardId]: data }));
    } catch (err) {
      setCardExpenses(prev => ({ ...prev, [cardId]: [] }));
    }
  };

  const openPayModal = async (card) => {
    await fetchAccounts();
    await fetchBill(card.id);
    setPayModal({ open: true, card });
    setPayForm({ account_id: '', value: '', payment_date: dayjs().format('YYYY-MM-DD'), is_full_payment: true, auto_debit: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `${API_URL}/${editingId}` : API_URL;
    const body = editingId ? editForm : form;
    
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    
    if (res.ok) {
      setToast({ show: true, message: editingId ? 'Cartão atualizado!' : 'Cartão adicionado!', type: 'success' });
      setForm({ bank: '', brand: '', limit_value: '', due_day: '', closing_day: '', name: '', status: 'ativa' });
      setEditingId(null);
      setEditForm({});
      fetchCards();
      fetchLimits();
    } else {
      setToast({ show: true, message: 'Erro ao salvar cartão', type: 'error' });
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir este cartão?')) return;
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setToast({ show: true, message: 'Cartão excluído!', type: 'success' });
      fetchCards();
      fetchLimits();
    } else {
      setToast({ show: true, message: 'Erro ao excluir cartão', type: 'error' });
    }
  };

  const handleEdit = (card) => {
    setEditingId(card.id);
    setEditForm(card);
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setPayLoading(true);
    
    const res = await fetch(`${process.env.REACT_APP_API_URL}/creditCards/${payModal.card.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payForm)
    });
    
    if (res.ok) {
      setToast({ show: true, message: 'Pagamento registrado!', type: 'success' });
      setPayModal({ open: false, card: null });
      fetchCards();
      fetchLimits();
    } else {
      setToast({ show: true, message: 'Erro ao registrar pagamento', type: 'error' });
    }
    setPayLoading(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (editingId) {
      setEditForm(prev => ({ ...prev, [name]: value }));
    } else {
      setForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/creditCards/export`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cartoes_${dayjs().format('YYYY-MM-DD')}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setToast({ show: true, message: 'Exportação concluída!', type: 'success' });
    } catch (err) {
      setToast({ show: true, message: 'Erro na exportação', type: 'error' });
    }
  };

  return (
    <div className="main-content" style={{ marginLeft: 240, padding: 32 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700 }}>Cartões de Crédito</h2>
      <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 0 }}>
          <Input name="bank" label="Banco" value={editingId ? editForm.bank : form.bank} onChange={handleChange} />
          <Input name="brand" label="Bandeira" value={editingId ? editForm.brand : form.brand} onChange={handleChange} />
          <Input name="limit_value" label="Limite" type="number" value={editingId ? editForm.limit_value : form.limit_value} onChange={handleChange} required />
          <Input name="due_day" label="Dia de vencimento" type="number" value={editingId ? editForm.due_day : form.due_day} onChange={handleChange} required />
          <Input name="closing_day" label="Dia de fechamento" type="number" value={editingId ? editForm.closing_day : form.closing_day} onChange={handleChange} required />
          <Input name="name" label="Nome do cartão" value={editingId ? editForm.name : form.name} onChange={handleChange} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
            <label style={{ marginBottom: 4, fontWeight: 500 }}>Status</label>
            <select name="status" value={editingId ? editForm.status : form.status} onChange={handleChange} className="input-glass">
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
            </select>
          </div>
          <Button variant="primary" loading={loading} type="submit">
            {editingId ? 'Atualizar' : 'Adicionar'} Cartão
          </Button>
          {editingId && (
            <Button variant="secondary" onClick={() => { setEditingId(null); setEditForm({}); }}>
              Cancelar
            </Button>
          )}
        </form>
      </motion.div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600 }}>Meus Cartões</h3>
        <Button variant="secondary" onClick={handleExport}>Exportar</Button>
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {cards.map(card => {
          const utilizado = limits[card.id] || 0;
          const disponivel = card.limit_value - utilizado;
          const percentual = (utilizado / card.limit_value) * 100;
          const expenses = cardExpenses[card.id] || [];
          const isExpanded = expandedCardId === card.id;

          return (
            <motion.div key={card.id} className="glass-card" style={{ padding: 20 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 600, fontSize: 18 }}>{card.name}</h4>
                  <p style={{ margin: '4px 0', color: '#666', fontSize: 14 }}>{card.bank} - {card.brand}</p>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8 }}>
                    <span style={{ fontSize: 14 }}>Limite: R$ {card.limit_value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span style={{ fontSize: 14 }}>Utilizado: R$ {utilizado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    <span style={{ fontSize: 14 }}>Disponível: R$ {disponivel.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div style={{ width: 200, height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
                    <div style={{ width: `${Math.min(percentual, 100)}%`, height: '100%', backgroundColor: percentual > 80 ? '#f44336' : percentual > 60 ? '#ff9800' : '#4caf50', transition: 'width 0.3s' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button variant="secondary" size="small" onClick={() => { fetchCardExpenses(card.id); setExpandedCardId(isExpanded ? null : card.id); }}>Ver Despesas</Button>
                  <Button variant="secondary" size="small" onClick={() => handleEdit(card)}>Editar</Button>
                  <Button variant="danger" size="small" onClick={() => handleDelete(card.id)}>Excluir</Button>
                  <Button variant="primary" size="small" onClick={() => openPayModal(card)}>Pagar</Button>
                </div>
              </div>

              {isExpanded && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ borderTop: '1px solid #e0e0e0', paddingTop: 16 }}>
                  <h5 style={{ marginBottom: 12, fontWeight: 600 }}>Despesas do Cartão</h5>
                  {expenses.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #e0e0e0' }}>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Descrição</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Valor</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Data</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Categoria</th>
                            <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenses.map(expense => (
                            <tr key={expense.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                              <td style={{ padding: '8px 12px' }}>{expense.description}</td>
                              <td style={{ padding: '8px 12px' }}>R$ {expense.value?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                              <td style={{ padding: '8px 12px' }}>{dayjs(expense.due_date).format('DD/MM/YYYY')}</td>
                              <td style={{ padding: '8px 12px' }}>{expense.category}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <span style={{ padding: '2px 8px', borderRadius: 12, fontSize: 12, backgroundColor: expense.status === 'paga' ? '#e8f5e8' : '#fff3e0', color: expense.status === 'paga' ? '#2e7d32' : '#f57c00' }}>
                                  {expense.status === 'paga' ? 'Paga' : 'Pendente'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p style={{ color: '#666', fontStyle: 'italic' }}>Nenhuma despesa encontrada para este cartão.</p>
                  )}
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      <Modal isOpen={payModal.open} onClose={() => setPayModal({ open: false, card: null })} title={`Pagar Cartão - ${payModal.card?.name}`}>
        <form onSubmit={handlePay} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>Conta para débito</label>
            <select value={payForm.account_id} onChange={(e) => setPayForm(prev => ({ ...prev, account_id: e.target.value }))} className="input-glass" required>
              <option value="">Selecione uma conta</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.bank} - {acc.account_type}</option>
              ))}
            </select>
          </div>
          <Input label="Valor" type="number" value={payForm.value} onChange={(e) => setPayForm(prev => ({ ...prev, value: e.target.value }))} required />
          <Input label="Data do pagamento" type="date" value={payForm.payment_date} onChange={(e) => setPayForm(prev => ({ ...prev, payment_date: e.target.value }))} required />
          <div style={{ display: 'flex', gap: 16 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={payForm.is_full_payment} onChange={(e) => setPayForm(prev => ({ ...prev, is_full_payment: e.target.checked }))} />
              Pagamento integral
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={payForm.auto_debit} onChange={(e) => setPayForm(prev => ({ ...prev, auto_debit: e.target.checked }))} />
              Débito automático
            </label>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <Button variant="secondary" onClick={() => setPayModal({ open: false, card: null })}>Cancelar</Button>
            <Button variant="primary" loading={payLoading} type="submit">Confirmar Pagamento</Button>
          </div>
        </form>
      </Modal>

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ show: false, message: '', type: 'success' })} />
    </div>
  );
}

export default CreditCards;