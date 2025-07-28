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

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/creditCards`; // ajuste conforme backend

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
  const [cardExpenses, setCardExpenses] = useState({}); // { [cardId]: [despesas] }
  // Novo estado para formulário de despesa de cartão
  const [expenseForm, setExpenseForm] = useState({
    credit_card_id: '',
    description: '',
    value: '',
    due_date: '',
    category: '',
    installment_type: 'avista',
    installment_total: 1,
    is_recurring: false,
    auto_debit: false
  });
  const [expenseLoading, setExpenseLoading] = useState(false);
  const [expenseToast, setExpenseToast] = useState({ show: false, message: '', type: 'success' });
  const [billMonth, setBillMonth] = useState('');

  useEffect(() => { 
    fetchCards(); 
    fetchLimits(); 
    // Buscar despesas de todos os cartões ao carregar
    (async () => {
      const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      data.forEach(card => fetchCardExpenses(card.id));
    })();
  }, []);

  const fetchCards = async () => {
    setLoading(true);
    const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setCards(data);
    setLoading(false);
  };

  const fetchLimits = async () => {
    try {
      const res = await fetch(`${API_URL}/limits`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const map = {};
      data.forEach(l => { map[l.card_id] = l.utilizado; });
      setLimits(map);
    } catch {
      setLimits({});
    }
  };

  const fetchAccounts = async () => {
    const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/accounts`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setAccounts(data);
  };

  const fetchBill = async (cardId) => {
    try {
      console.log('Buscando fatura para cartão:', cardId);
      const res = await fetch(`${API_URL}/${cardId}/bill`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        console.error('Erro ao buscar fatura:', res.status, res.statusText);
        setBill(null);
        return;
      }
      const data = await res.json();
      console.log('Fatura recebida:', data);
      setBill(data);
    } catch (err) {
      console.error('Erro ao buscar fatura:', err);
      setBill(null);
    }
  };

  const fetchCardExpenses = async (cardId) => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/expenses?type=cartao&credit_card_id=${cardId}&_=${Date.now()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setCardExpenses(prev => ({ ...prev, [cardId]: data }));
      console.log('Despesas retornadas para o cartão', cardId, data);
      if (Array.isArray(data)) {
        data.forEach((exp, idx) => console.log(`Despesa[${idx}]`, exp));
      }
    } catch {
      setCardExpenses(prev => ({ ...prev, [cardId]: [] }));
      console.log('Erro ao buscar despesas para o cartão', cardId);
    }
  };

  const openPayModal = async (card) => {
    console.log('Abrindo modal de pagamento para cartão:', card);
    setPayModal({ open: true, card });
    setPayForm({ account_id: '', value: '', payment_date: '', is_full_payment: true, auto_debit: !!card.debito_automatico });
    setBill(null);
    await fetchAccounts();
    await fetchBill(card.id);
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
        setToast({ show: true, message: 'Cartão adicionado com sucesso!', type: 'success' });
        setForm({ bank: '', brand: '', limit_value: '', due_day: '', closing_day: '', name: '', status: 'ativa' });
        fetchCards();
      } else {
        setToast({ show: true, message: 'Erro ao adicionar cartão.', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: 'Erro ao adicionar cartão.', type: 'error' });
    }
    setLoading(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Deseja realmente excluir este cartão?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setToast({ show: true, message: 'Cartão excluído com sucesso!', type: 'success' });
        fetchCards();
      } else {
        setToast({ show: true, message: 'Erro ao excluir cartão.', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: 'Erro ao excluir cartão.', type: 'error' });
    }
    setLoading(false);
  };

  const handleEdit = card => {
    console.log('Editando cartão:', card);
    setEditingId(card.id); setEditForm(card);
  };

  const handleEditChange = e => { setEditForm({ ...editForm, [e.target.name]: e.target.value }); };

  const handleEditSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log('Enviando edição de cartão:', editForm);
      const res = await fetch(`${API_URL}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setToast({ show: true, message: 'Cartão editado com sucesso!', type: 'success' });
        setEditingId(null); setEditForm({});
        fetchCards();
      } else {
        const err = await res.json();
        console.error('Erro ao editar cartão:', err);
        setToast({ show: true, message: 'Erro ao editar cartão.', type: 'error' });
      }
    } catch (err) {
      console.error('Erro ao editar cartão:', err);
      setToast({ show: true, message: 'Erro ao editar cartão.', type: 'error' });
    }
    setLoading(false);
  };

  const handlePayFormChange = e => {
    const { name, value, type, checked } = e.target;
    setPayForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePay = async e => {
    e.preventDefault();
    setPayLoading(true);
    try {
      console.log('Enviando pagamento:', { ...payForm, cardId: payModal.card.id });
      const res = await fetch(`${API_URL}/${payModal.card.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...payForm, value: payForm.is_full_payment ? undefined : payForm.value, bill_month: billMonth }),
      });
      if (res.ok) {
        setToast({ show: true, message: 'Pagamento realizado com sucesso!', type: 'success' });
        setPayModal({ open: false, card: null });
        fetchCards();
        fetchLimits();
        fetchCardExpenses(payModal.card.id); // Atualiza despesas do cartão
      } else {
        const err = await res.json();
        console.error('Erro ao pagar fatura:', err);
        setToast({ show: true, message: err.error || 'Erro ao pagar fatura.', type: 'error' });
      }
    } catch (err) {
      console.error('Erro ao pagar fatura:', err);
      setToast({ show: true, message: 'Erro ao pagar fatura.', type: 'error' });
    }
    setPayLoading(false);
  };

  // Função para lidar com mudanças no formulário de despesa
  const handleExpenseFormChange = e => {
    const { name, value, type, checked } = e.target;
    setExpenseForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  // Função para cadastrar despesa de cartão
  const handleExpenseSubmit = async e => {
    e.preventDefault();
    console.log('handleExpenseSubmit chamado', expenseForm);
    setExpenseLoading(true);
    try {
      const payload = { ...expenseForm, type: 'cartao' };
      payload.credit_card_id = String(payload.credit_card_id);
      if (payload.installment_type !== 'parcelado') payload.installment_total = 1;
      Object.keys(payload).forEach(k => {
        if (payload[k] === '' || payload[k] === null || payload[k] === undefined) delete payload[k];
      });
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setExpenseToast({ show: true, message: 'Despesa de cartão adicionada com sucesso!', type: 'success' });
        setExpenseForm({ credit_card_id: '', description: '', value: '', due_date: '', category: '', installment_type: 'avista', installment_total: 1, is_recurring: false, auto_debit: false });
        if (payload.credit_card_id) {
          console.log('Chamando fetchCardExpenses após criar despesa, credit_card_id:', payload.credit_card_id);
          setExpandedCardId(Number(payload.credit_card_id)); // força expandir o cartão correto
          fetchCardExpenses(payload.credit_card_id);
        }
      } else {
        const err = await res.json();
        setExpenseToast({ show: true, message: err.error || 'Erro ao adicionar despesa.', type: 'error' });
        if (payload.credit_card_id) {
          console.log('(ERRO) Chamando fetchCardExpenses após erro, credit_card_id:', payload.credit_card_id);
          fetchCardExpenses(payload.credit_card_id);
        }
      }
    } catch (err) {
      setExpenseToast({ show: true, message: err.message || 'Erro ao processar requisição.', type: 'error' });
      if (expenseForm.credit_card_id) {
        console.log('(CATCH) Chamando fetchCardExpenses após catch, credit_card_id:', expenseForm.credit_card_id);
        fetchCardExpenses(expenseForm.credit_card_id);
      }
    }
    setExpenseLoading(false);
  };

  // Função para calcular o período da fatura igual ao backend
  function getBillPeriod(card, month) {
    if (!card) return { start: null, end: null };
    const closingDay = Number(card.closing_day);
    const dueDay = Number(card.due_day);
    const [year, m] = month.split('-').map(Number);
    
    // Fechamento da fatura para o mês especificado
    const closingDate = dayjs(year, m - 1, closingDay);
    
    // Período da fatura: do fechamento do mês anterior até o dia anterior ao fechamento atual
    const start = closingDate.subtract(1, 'month');
    const end = closingDate.subtract(1, 'day');
    
    // Data de vencimento (sempre posterior ao fechamento)
    const vencimento = closingDate.add(dueDay - closingDay, 'day');
    
    return { start: start.startOf('day'), end: end.endOf('day'), vencimento };
  }

  // Função para determinar o mês da fatura em aberto (considerando fechamento)
  function getOpenBillMonth(card) {
    if (!card) return dayjs().format('YYYY-MM');
    const today = dayjs();
    const closing = dayjs().date(card.closing_day);
    // Se hoje é igual ou após o fechamento, fatura em aberto é do próximo mês
    if (today.isSameOrAfter(closing, 'day')) {
      return today.add(1, 'month').format('YYYY-MM');
    }
    return today.format('YYYY-MM');
  }

  // Novo: Preencher automaticamente a data da compra ao selecionar cartão ou mês
  useEffect(() => {
    if (expenseForm.credit_card_id && billMonth) {
      const card = cards.find(c => String(c.id) === String(expenseForm.credit_card_id));
      if (card) {
        const { start, end } = getBillPeriod(card, billMonth);
        // Só sugere/preenche se o campo estiver vazio ou se cartão/mês mudou
        if (!expenseForm.due_date ||
            (expenseForm._lastCard !== expenseForm.credit_card_id || expenseForm._lastMonth !== billMonth)) {
          setExpenseForm(f => ({
            ...f,
            due_date: start ? start.format('YYYY-MM-DD') : '',
            _lastCard: expenseForm.credit_card_id,
            _lastMonth: billMonth
          }));
        }
      }
    }
    // eslint-disable-next-line
  }, [expenseForm.credit_card_id, billMonth, cards.length]);

  // Novo: Validar se a data da compra está dentro do período da fatura
  const getSelectedCard = () => cards.find(c => String(c.id) === String(expenseForm.credit_card_id));
  let periodoFatura = { start: null, end: null };
  if (expenseForm.credit_card_id && billMonth) {
    const card = getSelectedCard();
    if (card) periodoFatura = getBillPeriod(card, billMonth);
  }
  let dataForaDoPeriodo = false;
  if (expenseForm.due_date && periodoFatura.start && periodoFatura.end) {
    const due = dayjs(expenseForm.due_date);
    dataForaDoPeriodo = !due.isSameOrAfter(periodoFatura.start) || !due.isSameOrBefore(periodoFatura.end);
  }

  // Status da fatura: 'Em aberto', 'Em atraso', 'Paga'
  function getBillStatus(card, fatura, billMonth) {
    if (!card || !fatura) return '-';
    const { vencimento } = getBillPeriod(card, billMonth);
    const todasPagas = fatura.length > 0 && fatura.every(d => d.status === 'paga');
    if (todasPagas) return 'Paga';
    // Se hoje > vencimento e não está paga, está em atraso
    if (dayjs().isAfter(vencimento, 'day')) return 'Em atraso';
    return 'Em aberto';
  }

  // Ao carregar cartões, definir billMonth para o mês da fatura em aberto do primeiro cartão (ou manter manual)
  useEffect(() => {
    if (cards.length > 0) {
      setBillMonth(getOpenBillMonth(cards[0]));
    }
  }, [cards.length]);

  return (
    <div className="main-content" style={{ marginLeft: 240, padding: 32 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700 }}>Cartões de Crédito</h2>
      <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        {/* Formulário de cartão */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 0 }}>
          <Input name="bank" label="Banco" value={form.bank} onChange={handleChange} />
          <Input name="brand" label="Bandeira" value={form.brand} onChange={handleChange} />
          <Input name="limit_value" label="Limite" type="number" value={form.limit_value} onChange={handleChange} required />
          <Input name="due_day" label="Dia de vencimento" type="number" value={form.due_day} onChange={handleChange} required />
          <Input name="closing_day" label="Dia de fechamento" type="number" value={form.closing_day} onChange={handleChange} required />
          <Input name="name" label="Nome do cartão" value={form.name} onChange={handleChange} />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
            <label style={{ marginBottom: 4, fontWeight: 500 }}>Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="input-glass">
              <option value="ativa">Ativa</option>
              <option value="inativa">Inativa</option>
            </select>
          </div>
          <Button variant="primary" loading={loading} type="submit">Adicionar Cartão</Button>
        </form>
        {/* Formulário de despesa de cartão - agora logo abaixo do de cartão */}
        <form onSubmit={handleExpenseSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', margin: '32px 0 24px 0' }}>
          <div style={{ minWidth: 180 }}>
            <label style={{ fontWeight: 500 }}>Cartão</label>
            <select name="credit_card_id" value={expenseForm.credit_card_id} onChange={handleExpenseFormChange} className="input-glass" required>
              <option value="">Selecione</option>
              {cards.map(card => (
                <option key={card.id} value={card.id}>{card.name} ({card.bank})</option>
              ))}
            </select>
          </div>
          <Input name="description" label="Descrição" value={expenseForm.description} onChange={handleExpenseFormChange} required />
          <Input name="value" label="Valor" type="number" value={expenseForm.value} onChange={handleExpenseFormChange} required />
          <Input name="due_date" label="Data da compra" type="date" value={expenseForm.due_date} onChange={handleExpenseFormChange} required />
          {periodoFatura.start && periodoFatura.end && (
            <div style={{ color: '#d00', fontSize: 13, marginTop: -8, marginBottom: 8 }}>
              Atenção: a data deve estar entre {periodoFatura.start.format('DD/MM/YYYY')} e {periodoFatura.end.format('DD/MM/YYYY')} para entrar na fatura do mês selecionado.
            </div>
          )}
          <Input name="category" label="Categoria" value={expenseForm.category} onChange={handleExpenseFormChange} />
          <div style={{ minWidth: 120 }}>
            <label style={{ fontWeight: 500 }}>Tipo de Lançamento</label>
            <select name="installment_type" value={expenseForm.installment_type} onChange={handleExpenseFormChange} className="input-glass" required>
              <option value="avista">À vista</option>
              <option value="parcelado">Parcelado</option>
            </select>
          </div>
          {expenseForm.installment_type === 'parcelado' && (
            <div style={{ minWidth: 100 }}>
              <label style={{ fontWeight: 500 }}>Parcelas</label>
              <Input name="installment_total" type="number" min={1} max={36} value={expenseForm.installment_total} onChange={handleExpenseFormChange} required />
            </div>
          )}
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 120 }}>
            <input name="is_recurring" type="checkbox" checked={expenseForm.is_recurring} onChange={handleExpenseFormChange} /> Recorrente
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 120 }}>
            <input name="auto_debit" type="checkbox" checked={expenseForm.auto_debit} onChange={handleExpenseFormChange} /> Débito automático
          </label>
          <Button variant="primary" loading={expenseLoading} type="submit">Adicionar Despesa</Button>
        </form>
        <Toast show={expenseToast.show} message={expenseToast.message} type={expenseToast.type} onClose={() => setExpenseToast({ ...expenseToast, show: false })} />
      </motion.div>
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <label style={{ fontWeight: 500 }}>Fatura do mês:</label>
        <input type="month" value={billMonth} onChange={e => setBillMonth(e.target.value)} style={{ minWidth: 120 }} />
        <span style={{ color: '#888', fontSize: 13 }}>(Período da fatura: {cards.length && expandedCardId ? (() => {
          const card = cards.find(c => c.id === expandedCardId);
          if (!card) return '-';
          const { start, end, vencimento } = getBillPeriod(card, billMonth);
          return `${start ? start.format('DD/MM/YYYY') : '-'} a ${end ? end.format('DD/MM/YYYY') : '-'} (Vence: ${vencimento ? vencimento.format('DD/MM/YYYY') : '-'})`;
        })() : '-'})</span>
      </div>
      <motion.div className="glass-card fade-in" style={{ padding: 24 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ padding: 8, textAlign: 'left' }}>Banco</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Bandeira</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Limite</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Valor da Fatura</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Vencimento</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Fechamento</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Nome</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Status</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(card => {
                // Calcular valor da fatura do mês atual
                const expenses = cardExpenses[card.id] || [];
                const { start, end } = getBillPeriod(card, billMonth);
                // Na tabela, filtrar despesas do período usando o novo getBillPeriod
                const faturaAtual = expenses.filter(exp => {
                  const due = dayjs(exp.due_date);
                  return start && end && due.isSameOrAfter(start) && due.isSameOrBefore(end);
                });
                // Debug: mostrar despesas do período e seus status
                console.log(`DEBUG - Cartão ${card.id} (${card.name}) - Fatura do período`, billMonth, faturaAtual.map(d => ({ id: d.id, desc: d.description, status: d.status, valor: d.value, due: d.due_date })));
                const valorFatura = faturaAtual.reduce((acc, d) => acc + Number(d.value), 0);
                // Novo: checar se todas as despesas do período estão pagas
                const todasPagas = faturaAtual.length > 0 && faturaAtual.every(d => d.status === 'paga');
                return (
                  <React.Fragment key={card.id}>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {editingId === card.id ? (
                        <>
                          <td><Input name="bank" value={editForm.bank} onChange={handleEditChange} /></td>
                          <td><Input name="brand" value={editForm.brand} onChange={handleEditChange} /></td>
                          <td><Input name="limit_value" value={editForm.limit_value} onChange={handleEditChange} /></td>
                          <td><Input name="due_day" value={editForm.due_day} onChange={handleEditChange} /></td>
                          <td><Input name="closing_day" value={editForm.closing_day} onChange={handleEditChange} /></td>
                          <td><Input name="name" value={editForm.name} onChange={handleEditChange} /></td>
                          <td>
                            <select name="status" value={editForm.status} onChange={handleChange} className="input-glass">
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
                          <td style={{ textAlign: 'left' }}>{card.bank}</td>
                          <td style={{ textAlign: 'left' }}>{card.brand}</td>
                          <td style={{ textAlign: 'left', color: 'var(--color-cartao)', fontWeight: 600 }}>R$ {Number(card.limit_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            <div style={{ fontSize: 13, color: '#888', fontWeight: 400 }}>
                              Limite utilizado: R$ {Number(limits[card.id] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </div>
                          </td>
                          <td style={{ textAlign: 'left', color: valorFatura > 0 ? 'var(--color-despesa)' : '#0a0', fontWeight: 600 }}>
                            R$ {valorFatura.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            <div style={{ fontSize: 13, fontWeight: 700, color: todasPagas ? '#0a0' : '#d77' }}>
                              {todasPagas ? 'Paga' : 'Em aberto'}
                            </div>
                          </td>
                          <td style={{ textAlign: 'left' }}>{card.due_day}</td>
                          <td style={{ textAlign: 'left' }}>{card.closing_day}</td>
                          <td style={{ textAlign: 'left' }}>{card.name}</td>
                          <td style={{ textAlign: 'left' }}>
                            {getBillStatus(card, faturaAtual, billMonth)}
                          </td>
                          <td style={{ textAlign: 'left' }}>
                            <Button variant="secondary" onClick={() => handleEdit(card)}>Editar</Button>
                            <Button variant="danger" onClick={() => handleDelete(card.id)}>Excluir</Button>
                            <Button variant="primary" onClick={() => openPayModal(card)}>Pagar</Button>
                            <Button variant="secondary" onClick={() => {
                              setExpandedCardId(expandedCardId === card.id ? null : card.id);
                              if (expandedCardId !== card.id) fetchCardExpenses(card.id);
                            }}>
                              {expandedCardId === card.id ? 'Ocultar despesas' : 'Ver despesas'}
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                    {expandedCardId === card.id && (
                      <tr>
                        <td colSpan={8} style={{ background: '#fafbfc', padding: 16 }}>
                          <h4>Despesas deste cartão</h4>
                          {cardExpenses[card.id] && cardExpenses[card.id].length > 0 ? (
                            <table style={{ width: '100%', fontSize: 14, marginTop: 8 }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left' }}>Data</th>
                                  <th style={{ textAlign: 'left' }}>Descrição</th>
                                  <th style={{ textAlign: 'left' }}>Valor</th>
                                  <th style={{ textAlign: 'left' }}>Categoria</th>
                                  <th style={{ textAlign: 'left' }}>Parcelas</th>
                                  <th style={{ textAlign: 'left' }}>Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {cardExpenses[card.id]
                                  .filter(exp => {
                                    // Filtro por período da fatura
                                    const { start, end } = getBillPeriod(card, billMonth);
                                    const due = dayjs(exp.due_date);
                                    if (!start || !end) return false;
                                    if (!(due.isSameOrAfter(start) && due.isSameOrBefore(end))) return false;
                                    // Removido filtro que só mostra a parcela 1
                                    return true;
                                  })
                                  .slice()
                                  .sort((a, b) => dayjs(b.due_date).valueOf() - dayjs(a.due_date).valueOf())
                                  .map(exp => (
                                    editingId === exp.id ? (
                                      <tr key={exp.id}>
                                        <td><Input name="due_date" type="date" value={editForm.due_date ? dayjs(editForm.due_date).format('YYYY-MM-DD') : ''} onChange={handleEditChange} required /></td>
                                        <td><Input name="description" value={editForm.description} onChange={handleEditChange} required /></td>
                                        <td><Input name="value" type="number" value={editForm.value} onChange={handleEditChange} required /></td>
                                        <td><Input name="category" value={editForm.category} onChange={handleEditChange} /></td>
                                        <td>{editForm.installment_total > 1 ? `${editForm.installment_number}/${editForm.installment_total}` : '-'}</td>
                                        <td style={{ display: 'flex', gap: 8 }}>
                                          <Button variant="primary" onClick={async () => {
                                            setLoading(true);
                                            try {
                                              // Corrigir campos vazios
                                              const payload = { ...editForm };
                                              if (!payload.category) payload.category = null;
                                              if (!payload.due_date || payload.due_date === 'Invalid date') payload.due_date = null;
                                              // Remove campos não editáveis
                                              delete payload.id;
                                              delete payload.user_id;
                                              delete payload.account_id;
                                              delete payload.credit_card_id;
                                              delete payload.installment_number;
                                              delete payload.createdAt;
                                              delete payload.updatedAt;
                                              const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/expenses/${exp.id}`, {
                                                method: 'PUT',
                                                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                                                body: JSON.stringify(payload),
                                              });
                                              if (res.ok) {
                                                setEditingId(null); setEditForm({});
                                                fetchCardExpenses(card.id);
                                              } else {
                                                const errData = await res.json();
                                                alert(errData.error || 'Erro ao editar despesa.');
                                              }
                                            } catch (err) {
                                              alert(err.message || 'Erro ao processar requisição.');
                                            }
                                            setLoading(false);
                                          }} loading={loading}>Salvar</Button>
                                          <Button variant="secondary" onClick={() => setEditingId(null)}>Cancelar</Button>
                                        </td>
                                      </tr>
                                    ) : (
                                      <tr key={exp.id}>
                                        <td>{exp.due_date ? dayjs(exp.due_date).format('DD/MM/YYYY') : '-'}</td>
                                        <td>{exp.description}</td>
                                        <td style={{ color: 'var(--color-despesa)', fontWeight: 600 }}>R$ {Number(exp.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                                        <td>{exp.category}</td>
                                        <td>{exp.installment_total > 1 ? `${exp.installment_number}/${exp.installment_total}` : '-'}</td>
                                        <td style={{ display: 'flex', gap: 8 }}>
                                          <Button variant="secondary" onClick={() => { setEditingId(exp.id); setEditForm(exp); }}>Editar</Button>
                                          <Button variant="danger" onClick={async () => {
                                            if (window.confirm('Deseja realmente excluir esta despesa?')) {
                                              setLoading(true);
                                              await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/expenses/${exp.id}`, {
                                                method: 'DELETE',
                                                headers: { Authorization: `Bearer ${token}` },
                                              });
                                              fetchCardExpenses(card.id);
                                              setLoading(false);
                                            }
                                          }}>Excluir</Button>
                                        </td>
                                      </tr>
                                    )
                                  ))}
                              </tbody>
                            </table>
                          ) : (
                            <div style={{ color: '#888', fontSize: 13 }}>Nenhuma despesa encontrada para esta fatura.</div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </motion.div>
      <Modal open={payModal.open} onClose={() => setPayModal({ open: false, card: null })} title={payModal.card ? `Pagamento do cartão: ${payModal.card.name}` : ''} width={480}>
        {payModal.card && (
          <form onSubmit={handlePay}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Competência da fatura</label>
              <input type="month" name="payBillMonth" value={billMonth} onChange={e => setBillMonth(e.target.value)} style={{ minWidth: 120, marginLeft: 8 }} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Conta para débito</label>
              <select name="account_id" value={payForm.account_id} onChange={handlePayFormChange} required className="input-glass" style={{ width: '100%', marginTop: 4 }}>
                <option value="">Selecione a conta</option>
                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.name} - Saldo: R$ {Number(acc.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Valor</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="radio" name="is_full_payment" checked={payForm.is_full_payment} onChange={() => setPayForm(f => ({ ...f, is_full_payment: true }))} /> <span>Pagar valor total</span>
                <input type="radio" name="is_full_payment" checked={!payForm.is_full_payment} onChange={() => setPayForm(f => ({ ...f, is_full_payment: false }))} /> <span>Outro valor</span>
              </div>
              {!payForm.is_full_payment && (
                <Input name="value" type="number" value={payForm.value} onChange={handlePayFormChange} min={1} required label="Valor a pagar" />
              )}
              {bill && payForm.is_full_payment && (
                Array.isArray(bill.atual) && bill.atual.length > 0 ? (
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Total da fatura: <b>R$ {bill.atual.reduce((acc, d) => acc + Number(d.value), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</b></div>
                ) : (
                  <div style={{ fontSize: 13, color: '#888', marginTop: 4 }}>Nenhuma despesa encontrada para esta fatura.</div>
                )
              )}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Data do pagamento</label>
              <Input name="payment_date" type="date" value={payForm.payment_date} onChange={handlePayFormChange} required />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 500 }}>Débito automático</label>
              <input type="checkbox" name="auto_debit" checked={payForm.auto_debit} onChange={handlePayFormChange} /> <span>Ativar débito automático para este cartão</span>
            </div>
            {payModal.card.debito_automatico && (
              <div style={{ fontSize: 13, color: '#0a0', marginBottom: 8 }}>Débito automático já está ativado para este cartão.</div>
            )}
            <Button variant="primary" type="submit" loading={payLoading}>Confirmar Pagamento</Button>
          </form>
        )}
      </Modal>
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}

export default CreditCards; 