import React, { useEffect, useState } from 'react';

const API_URL = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api`;

function Transfers({ token }) {
  const [accounts, setAccounts] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [form, setForm] = useState({ from_account_id: '', to_account_id: '', value: '', date: '', description: '', isThirdParty: false });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

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

  const fetchTransfers = async () => {
    try {
      const res = await fetch(`${API_URL}/transfers`, { headers: { Authorization: `Bearer ${token}` } });
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

  return (
    <div style={{ maxWidth: 600, margin: '40px auto', padding: 32, border: '1px solid #eee', borderRadius: 8 }}>
      <h2>Transferências</h2>
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
          Transferência para terceiro
        </label>
        {!form.isThirdParty && (
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
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
        <thead>
          <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
            <th style={{ padding: 8 }}>Data</th>
            <th style={{ padding: 8 }}>Origem</th>
            <th style={{ padding: 8 }}>Destino</th>
            <th style={{ padding: 8 }}>Valor</th>
            <th style={{ padding: 8 }}>Descrição</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map(t => (
            <tr key={t.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{t.date}</td>
              <td style={{ padding: 8 }}>{accounts.find(a => a.id === t.from_account_id)?.name || t.from_account_id}</td>
              <td style={{ padding: 8 }}>{t.to_account_id ? (accounts.find(a => a.id === t.to_account_id)?.name || t.to_account_id) : 'Terceiro'}</td>
              <td style={{ padding: 8 }}>R$ {Number(t.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
              <td style={{ padding: 8 }}>{t.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Transfers; 