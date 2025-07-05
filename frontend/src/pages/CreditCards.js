import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';
import Toast from '../components/Toast';

const API_URL = 'http://localhost:3001/api/credit-cards'; // ajuste conforme backend

function CreditCards({ token }) {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState({ bank: '', brand: '', limit_value: '', due_day: '', closing_day: '', name: '', status: 'ativa' });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => { fetchCards(); }, []);

  const fetchCards = async () => {
    setLoading(true);
    const res = await fetch(API_URL, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setCards(data);
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

  const handleEdit = card => { setEditingId(card.id); setEditForm(card); };

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
        setToast({ show: true, message: 'Cartão editado com sucesso!', type: 'success' });
        setEditingId(null); setEditForm({});
        fetchCards();
      } else {
        setToast({ show: true, message: 'Erro ao editar cartão.', type: 'error' });
      }
    } catch {
      setToast({ show: true, message: 'Erro ao editar cartão.', type: 'error' });
    }
    setLoading(false);
  };

  return (
    <div style={{ marginLeft: 240, padding: 32 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700 }}>Cartões de Crédito</h2>
      <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
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
      </motion.div>
      {loading ? <p>Carregando...</p> : (
        <motion.div className="glass-card fade-in" style={{ padding: 24 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ padding: 8 }}>Banco</th>
                <th style={{ padding: 8 }}>Bandeira</th>
                <th style={{ padding: 8 }}>Limite</th>
                <th style={{ padding: 8 }}>Vencimento</th>
                <th style={{ padding: 8 }}>Fechamento</th>
                <th style={{ padding: 8 }}>Nome</th>
                <th style={{ padding: 8 }}>Status</th>
                <th style={{ padding: 8 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {cards.map(card => (
                <tr key={card.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {editingId === card.id ? (
                    <>
                      <td><Input name="bank" value={editForm.bank} onChange={handleEditChange} /></td>
                      <td><Input name="brand" value={editForm.brand} onChange={handleEditChange} /></td>
                      <td><Input name="limit_value" value={editForm.limit_value} onChange={handleEditChange} /></td>
                      <td><Input name="due_day" value={editForm.due_day} onChange={handleEditChange} /></td>
                      <td><Input name="closing_day" value={editForm.closing_day} onChange={handleEditChange} /></td>
                      <td><Input name="name" value={editForm.name} onChange={handleEditChange} /></td>
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
                      <td>{card.bank}</td>
                      <td>{card.brand}</td>
                      <td style={{ color: 'var(--color-cartao)', fontWeight: 600 }}>R$ {Number(card.limit_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td>{card.due_day}</td>
                      <td>{card.closing_day}</td>
                      <td>{card.name}</td>
                      <td>{card.status}</td>
                      <td>
                        <Button variant="secondary" onClick={() => handleEdit(card)}>Editar</Button>
                        <Button variant="danger" onClick={() => handleDelete(card.id)}>Excluir</Button>
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

export default CreditCards; 