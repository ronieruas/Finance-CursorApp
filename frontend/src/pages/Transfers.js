import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api`;

function formatDateBR(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}-${m}-${y}`;
}

function Transfers({ token }) {
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [form, setForm] = useState({ from_account_id: '', to_account_id: '', value: '', date: '', description: '', isThirdParty: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [filters, setFilters] = useState(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0,10);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0,10);
    return {
      start: firstDay,
      end: lastDay,
      from_account_id: '',
      to_account_id: '',
      description: ''
    };
  });

  useEffect(() => {
    fetchAccounts();
    fetchTransfers();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch(`${API_URL}/accounts`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setAccounts(data);
    } catch (err) {
      setAccounts([]);
    }
  };

  const fetchTransfers = async (customFilters) => {
    try {
      const f = customFilters || filters;
      const params = new URLSearchParams();
      if (f.start && f.end) { params.append('start', f.start); params.append('end', f.end); }
      if (f.from_account_id) params.append('from_account_id', f.from_account_id);
      if (f.to_account_id) params.append('to_account_id', f.to_account_id);
      if (f.description) params.append('description', f.description);
      const res = await fetch(`${API_URL}/transfers?${params.toString()}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setTransfers(data);
    } catch (err) {
      setTransfers([]);
    }
  };

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'isThirdParty' && !checked) {
      setForm(f => ({ ...f, to_account_id: '' }));
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const body = {
        from_account_id: form.from_account_id,
        to_account_id: form.isThirdParty ? null : form.to_account_id,
        value: form.value,
        date: form.date,
        description: form.description,
      };
      const res = await fetch(`${API_URL}/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Transferência realizada com sucesso!');
        setForm({ from_account_id: '', to_account_id: '', value: '', date: '', description: '', isThirdParty: false });
        fetchTransfers();
        fetchAccounts();
      } else {
        setError(data.error || 'Erro ao realizar transferência.');
      }
    } catch (err) {
      setError('Erro ao realizar transferência.');
    }
    setLoading(false);
  };

  const handleEdit = t => { setEditingId(t.id); setEditForm({ ...t, isThirdParty: !t.to_account_id }); };

  const handleEditChange = e => {
    const { name, value, type, checked } = e.target;
    setEditForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'isThirdParty' && !checked) {
      setEditForm(f => ({ ...f, to_account_id: '' }));
    }
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const body = {
        from_account_id: editForm.from_account_id,
        to_account_id: editForm.isThirdParty ? null : editForm.to_account_id,
        value: editForm.value,
        date: editForm.date,
        description: editForm.description,
      };
      const res = await fetch(`${API_URL}/transfers/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Transferência editada com sucesso!');
        setEditingId(null); setEditForm({});
        fetchTransfers(); fetchAccounts();
      } else {
        setError(data.error || 'Erro ao editar transferência.');
      }
    } catch (err) {
      setError('Erro ao editar transferência.');
    }
    setLoading(false);
  };

  const handleDelete = async id => {
    if (!window.confirm('Deseja realmente excluir esta transferência?')) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch(`${API_URL}/transfers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage('Transferência excluída com sucesso!');
        fetchTransfers(); fetchAccounts();
      } else {
        setError('Erro ao excluir transferência.');
      }
    } catch {
      setError('Erro ao excluir transferência.');
    }
    setLoading(false);
  };

  const handleFilterChange = e => {
    const { name, value } = e.target;
    setFilters(f => ({ ...f, [name]: value }));
  };

  const handleFilterSubmit = e => {
    e.preventDefault();
    fetchTransfers();
  };

  return (
    <div className="main-content" style={{ maxWidth: 600, margin: '40px auto', padding: 32, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Transferências</h2>
      {/* Filtros de visualização */}
      <form onSubmit={handleFilterSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <label>Período:</label>
        <input name="start" type="date" value={filters.start} onChange={handleFilterChange} required />
        <span>a</span>
        <input name="end" type="date" value={filters.end} onChange={handleFilterChange} required />
        <label>Origem:</label>
        <select name="from_account_id" value={filters.from_account_id} onChange={handleFilterChange} style={{ minWidth: 120 }}>
          <option value="">Todas</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
          ))}
        </select>
        <label>Destino:</label>
        <select name="to_account_id" value={filters.to_account_id} onChange={handleFilterChange} style={{ minWidth: 120 }}>
          <option value="">Todos</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
          ))}
        </select>
        <label>Descrição:</label>
        <input name="description" value={filters.description} onChange={handleFilterChange} style={{ minWidth: 120 }} placeholder="Descrição" />
        <button type="submit" style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 500 }}>Filtrar</button>
      </form>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <label>Conta de origem:</label>
        <select name="from_account_id" value={form.from_account_id} onChange={handleChange} required style={{ width: '100%', marginBottom: 12 }}>
          <option value="">Selecione</option>
          {accounts.map(acc => (
            <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
          ))}
        </select>
        <label>
          <input type="checkbox" name="isThirdParty" checked={form.isThirdParty} onChange={handleChange} />
          Transferência para terceiro.
        </label>
        {form.isThirdParty ? (
          <>
            <label>Conta de origem (opcional):</label>
            <select name="to_account_id" value={form.to_account_id} onChange={handleChange} style={{ width: '100%', marginBottom: 12 }}>
              <option value="">Selecione (opcional)</option>
              {accounts.filter(acc => acc.id !== Number(form.from_account_id)).map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
              ))}
            </select>
          </>
        ) : (
          <>
            <label>Conta de destino:</label>
            <select name="to_account_id" value={form.to_account_id} onChange={handleChange} required style={{ width: '100%', marginBottom: 12 }}>
              <option value="">Selecione</option>
              {accounts.filter(acc => acc.id !== Number(form.from_account_id)).map(acc => (
                <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
              ))}
            </select>
          </>
        )}
        <input name="value" type="number" step="0.01" placeholder="Valor" value={form.value} onChange={handleChange} required style={{ width: '100%', marginBottom: 12 }} />
        <input name="date" type="date" value={form.date} onChange={handleChange} required style={{ width: '100%', marginBottom: 12 }} />
        <input name="description" type="text" placeholder="Descrição (opcional)" value={form.description} onChange={handleChange} style={{ width: '100%', marginBottom: 12 }} />
        <button type="submit" style={{ width: '100%' }} disabled={loading}>{loading ? 'Salvando...' : 'Transferir'}</button>
      </form>
      {message && <p style={{ color: 'green', marginTop: 12 }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
      <h3>Transferências Realizadas</h3>
      <motion.div className="glass-card fade-in" style={{ padding: 32, background: 'linear-gradient(135deg, #f5f7fa 60%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px #0002', marginBottom: 32, width: 'fit-content', minWidth: '100%', maxWidth: 'none', boxSizing: 'border-box', overflowX: 'auto' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent', tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
              <th style={{ padding: 8, textAlign: 'left', width: 100 }}>Data</th>
              <th style={{ padding: 8, textAlign: 'left', width: 180 }}>Origem</th>
              <th style={{ padding: 8, textAlign: 'left', width: 180 }}>Destino</th>
              <th style={{ padding: 8, textAlign: 'left', width: 100 }}>Valor</th>
              <th style={{ padding: 8, textAlign: 'left', width: 220 }}>Descrição</th>
              <th style={{ padding: 8, textAlign: 'left', width: 120 }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                {editingId === t.id ? (
                  <>
                    <td><input name="date" type="date" value={editForm.date} onChange={handleEditChange} style={{ width: '100%' }} /></td>
                    <td>
                      <select name="from_account_id" value={editForm.from_account_id} onChange={handleEditChange} style={{ width: '100%' }}>
                        <option value="">Selecione</option>
                        {accounts.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <label style={{ fontSize: 12 }}>
                        <input type="checkbox" name="isThirdParty" checked={editForm.isThirdParty} onChange={handleEditChange} /> Terceiro
                      </label>
                      {editForm.isThirdParty ? (
                        <div>
                          <label style={{ fontSize: 12, display: 'block', marginTop: 4 }}>Conta de origem (opcional):</label>
                          <select name="to_account_id" value={editForm.to_account_id} onChange={handleEditChange} style={{ width: '100%' }}>
                            <option value="">Selecione (opcional)</option>
                            {accounts.filter(acc => acc.id !== Number(editForm.from_account_id)).map(acc => (
                              <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <div>
                          <label style={{ fontSize: 12, display: 'block', marginTop: 4 }}>Conta de destino:</label>
                          <select name="to_account_id" value={editForm.to_account_id} onChange={handleEditChange} style={{ width: '100%' }}>
                            <option value="">Selecione</option>
                            {accounts.filter(acc => acc.id !== Number(editForm.from_account_id)).map(acc => (
                              <option key={acc.id} value={acc.id}>{acc.name} ({acc.bank})</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </td>
                    <td><input name="value" type="number" step="0.01" value={editForm.value} onChange={handleEditChange} style={{ width: '100%' }} /></td>
                    <td><input name="description" type="text" value={editForm.description} onChange={handleEditChange} style={{ width: '100%' }} /></td>
                    <td>
                      <button onClick={handleEditSubmit} style={{ marginRight: 8 }}>Salvar</button>
                      <button onClick={() => { setEditingId(null); setEditForm({}); }}>Cancelar</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ textAlign: 'left' }}>{formatDateBR(t.date)}</td>
                    <td style={{ textAlign: 'left' }}>{accounts.find(a => a.id === t.from_account_id)?.name || t.from_account_id}</td>
                    <td style={{ textAlign: 'left' }}>{t.to_account_id ? (accounts.find(a => a.id === t.to_account_id)?.name || t.to_account_id) : 'Transferência para terceiro'}</td>
                    <td style={{ textAlign: 'left' }}>R$ {Number(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                    <td style={{ textAlign: 'left' }}>{t.description}</td>
                    <td>
                      <button onClick={() => handleEdit(t)} style={{ marginRight: 8 }}>Editar</button>
                      <button onClick={() => handleDelete(t.id)}>Excluir</button>
                    </td>
                  </>
                )}
            </tr>
          ))}
        </tbody>
      </table>
      </motion.div>
    </div>
  );
}

export default Transfers; 