import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';
import Toast from '../components/Toast';
import Modal from '../components/Modal';
import useApiBase from '../hooks/useApiBase';

// Bases possíveis para a API (prioridade: env -> localhost:3003 -> relativo /api)
// API base is standardized via useApiBase(); legacy API_BASES removed.

const currencyOptions = [
  { value: 'BRL', label: 'Real (R$)' },
  { value: 'USD', label: 'Dólar (US$)' },
  { value: 'EUR', label: 'Euro (€)' },
];

function Accounts({ token }) {
  // Token de autenticação: usa prop se disponível; caso contrário, fallback para localStorage
  const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const apiBase = useApiBase();
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ name: '', bank: '', type: 'corrente', balance: '', currency: 'BRL' });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [extratoConta, setExtratoConta] = useState(null); // conta selecionada para extrato
  const [extrato, setExtrato] = useState([]);
  const [extratoLoading, setExtratoLoading] = useState(false);
  const [extratoPeriodo, setExtratoPeriodo] = useState({ start: '', end: '' });
  const [extratoError, setExtratoError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);

  // Base da API padronizada via hook; nenhuma detecção adicional necessária.
  useEffect(() => {}, []);

  useEffect(() => {
    if (apiBase) fetchAccounts();
    // eslint-disable-next-line
  }, [apiBase]);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const url = `${apiBase}/accounts?t=${Date.now()}`;
      console.log('[Accounts] Fetching accounts from', url);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}`, 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        cache: 'no-store',
      });
      console.log('[Accounts] Response status:', res.status);
      if (!res.ok) {
        // Em caso de erro, garante que a UI não fique travada
        setAccounts([]);
      } else {
        const data = await res.json();
        console.log('[Accounts] Loaded accounts count:', Array.isArray(data) ? data.length : 0);
        // Garante que seja um array
        setAccounts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('[Accounts] Fetch error:', err);
      // Falha de rede ou CORS: não travar UI
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/accounts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({
          ...form,
          // garante número para backend
          balance: form.balance ? Number(form.balance) : 0,
        }),
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
      const res = await fetch(`${apiBase}/accounts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
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
      const res = await fetch(`${apiBase}/accounts/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
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

  const handleExtratoClick = acc => {
    setExtratoConta(acc);
    setExtrato([]);
    setExtratoPeriodo({ start: '', end: '' });
    setExtratoError('');
  };

  const fetchExtrato = async () => {
    if (!extratoConta) return;
    setExtratoLoading(true);
    setExtratoError('');
    try {
      const params = [];
      if (extratoPeriodo.start) params.push(`start=${extratoPeriodo.start}`);
      if (extratoPeriodo.end) params.push(`end=${extratoPeriodo.end}`);
      const url = `${apiBase}/accounts/${extratoConta.id}/extrato${params.length ? '?' + params.join('&') : ''}`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${authToken}` } });
      if (!res.ok) throw new Error('Erro ao buscar extrato');
      const data = await res.json();
      setExtrato(data.extrato || []);
    } catch (err) {
      setExtratoError('Erro ao buscar extrato.');
    } finally {
      setExtratoLoading(false);
    }
  };

  useEffect(() => {
    if (extratoConta) fetchExtrato();
    // eslint-disable-next-line
  }, [extratoConta]);

  const handlePeriodoChange = e => {
    setExtratoPeriodo({ ...extratoPeriodo, [e.target.name]: e.target.value });
  };

  const handleFiltrarExtrato = e => {
    e.preventDefault();
    fetchExtrato();
  };

  const handleExportExtrato = async () => {
    if (!extratoConta) return;
    setExportLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('accountId', extratoConta.id);
      if (extratoPeriodo.start) {
        params.append('startDate', extratoPeriodo.start);
      }
      if (extratoPeriodo.end) {
        params.append('endDate', extratoPeriodo.end);
      }

      const url = `${apiBase}/export/statement?${params.toString()}`;
      console.log('Final Export URL:', url);

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${authToken}` },
      });

      if (!res.ok) {
        throw new Error('Erro ao exportar extrato');
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `extrato_${extratoConta.name}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      setToast({ show: true, message: 'Extrato exportado com sucesso!', type: 'success' });
    } catch (err) {
      setToast({ show: true, message: err.message || 'Erro ao exportar extrato.', type: 'error' });
    } finally {
      setExportLoading(false);
    }
  };

  return (
    <div className="main-content" style={{ marginLeft: 240, padding: 32 }}>
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
                <th style={{ padding: 8, textAlign: 'left' }}>Nome</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Banco</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Tipo</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Saldo</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Moeda</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map(acc => (
                <tr key={acc.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {editingId === acc.id ? (
                    <>
                      <td style={{ textAlign: 'left' }}><Input name="name" value={editForm.name} onChange={handleEditChange} /></td>
                      <td style={{ textAlign: 'left' }}><Input name="bank" value={editForm.bank} onChange={handleEditChange} /></td>
                      <td style={{ textAlign: 'left' }}>
                        <select name="type" value={editForm.type} onChange={handleEditChange} className="input-glass">
                          <option value="corrente">Corrente</option>
                          <option value="poupanca">Poupança</option>
                          <option value="investimento">Investimento</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'left' }}><Input name="balance" value={editForm.balance} onChange={handleEditChange} /></td>
                      <td style={{ textAlign: 'left' }}>
                        <select name="currency" value={editForm.currency} onChange={handleEditChange} className="input-glass">
                          <option value="BRL">BRL</option>
                          <option value="USD">USD</option>
                          <option value="EUR">EUR</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'left' }}>
                        <Button variant="primary" onClick={handleEditSubmit} loading={loading}>Salvar</Button>
                        <Button variant="secondary" onClick={() => setEditingId(null)}>Cancelar</Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ textAlign: 'left' }}>{acc.name}</td>
                      <td style={{ textAlign: 'left' }}>{acc.bank}</td>
                      <td style={{ textAlign: 'left' }}>{acc.type}</td>
                      <td style={{ textAlign: 'left', color: 'var(--color-primary)', fontWeight: 600 }}>
                        {acc.currency === 'BRL' ? 'R$' : acc.currency === 'USD' ? 'US$' : acc.currency === 'EUR' ? '€' : acc.currency + ' '}
                        {Number((acc.saldo_calculado !== undefined ? acc.saldo_calculado : acc.balance)).toLocaleString(acc.currency === 'BRL' ? 'pt-BR' : acc.currency === 'USD' ? 'en-US' : acc.currency === 'EUR' ? 'de-DE' : undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'left' }}>{acc.currency}</td>
                      <td style={{ textAlign: 'left' }}>
                        <Button variant="secondary" onClick={() => handleEdit(acc)}>Editar</Button>
                        <Button variant="danger" onClick={() => handleDelete(acc.id)}>Excluir</Button>
                        <Button variant="primary" onClick={() => handleExtratoClick(acc)} style={{ marginLeft: 8 }}>Extrato</Button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      )}
      {/* Extrato da conta selecionada */}
      {extratoConta && (
        <motion.div className="glass-card fade-in" style={{ padding: 24, marginTop: 32 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Extrato: {extratoConta.name} ({extratoConta.bank})</h3>
            <Button variant="secondary" onClick={() => setExtratoConta(null)}>Fechar</Button>
          </div>
          <form onSubmit={handleFiltrarExtrato} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <label>Período:</label>
            <input type="date" name="start" value={extratoPeriodo.start} onChange={handlePeriodoChange} className="input-glass" />
            <span>a</span>
            <input type="date" name="end" value={extratoPeriodo.end} onChange={handlePeriodoChange} className="input-glass" />
            <Button variant="primary" type="submit" loading={extratoLoading}>Filtrar</Button>
            <Button variant="secondary" onClick={handleExportExtrato} loading={exportLoading} disabled={exportLoading} aria-label="Exportar extrato em CSV" style={{ marginLeft: 8 }}>Exportar Extrato</Button>
          </form>
          {extratoLoading ? <p>Carregando extrato...</p> : extratoError ? <p style={{ color: 'red' }}>{extratoError}</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                  <th style={{ padding: 8, textAlign: 'left' }}>Data</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Descrição</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Categoria</th>
                  <th style={{ padding: 8, textAlign: 'left' }}>Tipo</th>
                  <th style={{ padding: 8, textAlign: 'right' }}>Valor</th>
                </tr>
              </thead>
              <tbody>
                {extrato.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 16 }}>Nenhuma movimentação encontrada.</td></tr>
                ) : extrato.map((item, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: 8 }}>{item.data}</td>
                    <td style={{ padding: 8 }}>{item.descricao}</td>
                    <td style={{ padding: 8 }}>{item.categoria}</td>
                    <td style={{ padding: 8, textTransform: 'capitalize' }}>
                      {item.tipo === 'pagamento_cartao' ? 'Fatura Cartão' : item.tipo.replace('_', ' ')}
                    </td>
                    <td style={{ padding: 8, textAlign: 'right', color: item.valor < 0 ? 'crimson' : 'seagreen', fontWeight: 600 }}>
                      {item.valor < 0 ? '-' : ''}R$ {Math.abs(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      )}
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast({ ...toast, show: false })} />
    </div>
  );
}

export default Accounts;