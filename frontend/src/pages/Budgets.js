import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';
import Toast from '../components/Toast';
import dayjs from 'dayjs';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/budgets`; // ajuste conforme backend

function Budgets({ token }) {
  const [budgets, setBudgets] = useState([]);
  const [form, setForm] = useState({ name: '', type: 'geral', credit_card_id: '', period_start: '', period_end: '', planned_value: '' });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [creditCards, setCreditCards] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => { 
    fetchBudgets(); 
    fetchCreditCards();
  }, []);

  const fetchBudgets = async () => {
    setLoading(true);
    const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setBudgets(data);
    setLoading(false);
  };

  const fetchCreditCards = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/creditCards`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setCreditCards(data || []);
      } else {
        console.error('Erro ao carregar cartões:', res.status);
        setCreditCards([]);
      }
    } catch (error) {
      console.error('Erro ao carregar cartões:', error);
      setCreditCards([]);
    }
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
        setToast({ show: true, message: 'Orçamento adicionado com sucesso!', type: 'success' });
        setForm({ name: '', type: 'geral', credit_card_id: '', period_start: '', period_end: '', planned_value: '' });
        fetchBudgets();
      } else {
        setToast({ show: true, message: 'Erro ao adicionar orçamento.', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: 'Erro ao adicionar orçamento.', type: 'error' });
    }
    setLoading(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Deseja realmente excluir este orçamento?')) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setToast({ show: true, message: 'Orçamento excluído com sucesso!', type: 'success' });
        fetchBudgets();
      } else {
        setToast({ show: true, message: 'Erro ao excluir orçamento.', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: 'Erro ao excluir orçamento.', type: 'error' });
    }
    setLoading(false);
  };

  const handleEdit = budget => { setEditingId(budget.id); setEditForm(budget); };

  const handleEditChange = e => { setEditForm({ ...editForm, [e.target.name]: e.target.value }); };

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
        setToast({ show: true, message: 'Orçamento editado com sucesso!', type: 'success' });
        setEditingId(null); setEditForm({});
        fetchBudgets();
      } else {
        setToast({ show: true, message: 'Erro ao editar orçamento.', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: 'Erro ao editar orçamento.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div className="main-content" style={{ marginLeft: 240, padding: 32 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700 }}>Orçamentos</h2>
      <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 0 }}>
          <Input name="name" label="Nome do orçamento" value={form.name} onChange={handleChange} required />
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 120 }}>
            <label style={{ marginBottom: 4, fontWeight: 500 }}>Tipo</label>
            <select name="type" value={form.type} onChange={handleChange} className="input-glass">
              <option value="geral">Geral</option>
              <option value="cartao">Cartão</option>
            </select>
          </div>
          {form.type === 'cartao' && (
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 200 }}>
              <label style={{ marginBottom: 4, fontWeight: 500 }}>Cartão de Crédito</label>
              <select name="credit_card_id" value={form.credit_card_id} onChange={handleChange} className="input-glass" required={form.type === 'cartao'}>
                <option value="">Selecione um cartão</option>
                {creditCards && creditCards.map(card => (
                  <option key={card.id} value={card.id}>
                    {card.name} - Final {card.card_number ? card.card_number.slice(-4) : '****'}
                  </option>
                ))}
              </select>
            </div>
          )}
          <Input name="period_start" label="Início" type="date" value={form.period_start} onChange={handleChange} required />
          <Input name="period_end" label="Fim" type="date" value={form.period_end} onChange={handleChange} required />
          <Input name="planned_value" label="Valor planejado" type="number" value={form.planned_value} onChange={handleChange} required />
          <Button variant="primary" loading={loading} type="submit">Adicionar Orçamento</Button>
        </form>
      </motion.div>
      {loading ? <p>Carregando...</p> : (
        <motion.div className="glass-card fade-in" style={{ padding: 24 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ padding: 8, textAlign: 'left' }}>Nome</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Tipo</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Cartão</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Início</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Fim</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Valor Planejado</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Utilizado</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map(budget => (
                <tr key={budget.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {editingId === budget.id ? (
                    <>
                      <td><Input name="name" value={editForm.name} onChange={handleEditChange} /></td>
                      <td>
                        <select name="type" value={editForm.type} onChange={handleEditChange} className="input-glass">
                          <option value="geral">Geral</option>
                          <option value="cartao">Cartão</option>
                        </select>
                      </td>
                      <td>
                        {editForm.type === 'cartao' ? (
                                                      <select name="credit_card_id" value={editForm.credit_card_id} onChange={handleEditChange} className="input-glass">
                              <option value="">Selecione um cartão</option>
                              {creditCards && creditCards.map(card => (
                                <option key={card.id} value={card.id}>
                                  {card.name} - Final {card.card_number ? card.card_number.slice(-4) : '****'}
                                </option>
                              ))}
                            </select>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td><Input name="period_start" value={editForm.period_start} onChange={handleEditChange} /></td>
                      <td><Input name="period_end" value={editForm.period_end} onChange={handleEditChange} /></td>
                      <td><Input name="planned_value" value={editForm.planned_value} onChange={handleEditChange} /></td>
                      <td style={{ color: 'var(--color-despesa)', fontWeight: 600 }}>R$ {Number(budget.utilizado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>
                        <Button variant="primary" onClick={handleEditSubmit} loading={loading}>Salvar</Button>
                        <Button variant="secondary" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ textAlign: 'left' }}>{budget.name}</td>
                      <td style={{ textAlign: 'left' }}>{budget.type}</td>
                      <td style={{ textAlign: 'left' }}>
                        {budget.type === 'cartao' && budget.credit_card ? 
                          `${budget.credit_card.name} - Final ${budget.credit_card.card_number ? budget.credit_card.card_number.slice(-4) : '****'}` : 
                          '-'
                        }
                      </td>
                      <td style={{ textAlign: 'left' }}>{budget.period_start ? dayjs(budget.period_start).format('DD/MM/YYYY') : ''}</td>
                      <td style={{ textAlign: 'left' }}>{budget.period_end ? dayjs(budget.period_end).format('DD/MM/YYYY') : ''}</td>
                      <td style={{ textAlign: 'left', color: 'var(--color-primary)', fontWeight: 600 }}>R$ {Number(budget.planned_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'left', color: 'var(--color-despesa)', fontWeight: 600 }}>R$ {Number(budget.utilizado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td style={{ textAlign: 'left' }}>
                        <Button variant="secondary" onClick={() => handleEdit(budget)}>Editar</Button>
                        <Button variant="danger" onClick={() => handleDelete(budget.id)}>Excluir</Button>
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

export default Budgets; 