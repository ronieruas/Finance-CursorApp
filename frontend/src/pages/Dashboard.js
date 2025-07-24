import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import Input from '../components/Input';
import dayjs from 'dayjs';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function Dashboard({ token }) {
  // Mock de dados para exibição inicial
  const [kpis, setKpis] = useState({
    saldoTotalReais: 0,
    despesasConta: 0,
    despesasCartao: 0,
    despesasMesTotal: 0,
    faturaCartaoMes: 0,
  });
  const [receitasPorConta, setReceitasPorConta] = useState([]);
  const [breakdown, setBreakdown] = useState({
    receitas: 0,
    despesas: 0,
    cartao: 0,
  });
  const [recentes, setRecentes] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [gastosPorCartao, setGastosPorCartao] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [period, setPeriod] = useState({ start: '', end: '' });
  const [periodInput, setPeriodInput] = useState({ start: '', end: '' });
  const [saldoEvolucao, setSaldoEvolucao] = useState([]);

  // Estrutura pronta para integração futura com backend
  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line
  }, [token]);

  const fetchDashboard = async (start, end) => {
    let url = `${API_URL}/api/dashboard`;
    if (start && end) url += `?start=${start}&end=${end}`;
    try {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setKpis({
        saldoTotalReais: data.saldoTotalReais,
        despesasConta: data.despesasConta,
        despesasCartao: data.despesasCartao,
        despesasMesTotal: data.despesasMesTotal,
        faturaCartaoMes: data.faturaCartaoMes,
      });
      setReceitasPorConta(data.receitasPorConta || []);
      setGastosPorCartao(data.gastosPorCartao || []);
      setBudgets(data.budgets || []);
      setPeriod(data.periodo || {});
      setPeriodInput({
        start: data.periodo?.start ? new Date(data.periodo.start).toISOString().slice(0,10) : '',
        end: data.periodo?.end ? new Date(data.periodo.end).toISOString().slice(0,10) : ''
      });
      setBreakdown(data.breakdown || { receitas: 0, despesas: 0, cartao: 0 });
      setRecentes(data.recentes || []);
      setAlertas(data.alertas || []);
      setSaldoEvolucao(data.saldoEvolucao || []);
    } catch (err) {
      // Exibir erro, não usar mock
      alert('Erro ao carregar dashboard. Verifique sua conexão ou tente novamente.');
    }
  };

  const handlePeriodChange = e => {
    const { name, value } = e.target;
    setPeriodInput({ ...periodInput, [name]: value });
  };
  const handlePeriodSubmit = e => {
    e.preventDefault();
    if (periodInput.start && periodInput.end) {
      fetchDashboard(periodInput.start, periodInput.end);
    }
  };

  const pieData = [
    { name: 'Receitas', value: breakdown?.receitas || 0, color: '#22c55e' },
    { name: 'Despesas', value: breakdown?.despesas || 0, color: '#ef4444' },
    { name: 'Cartão', value: breakdown?.cartao || 0, color: '#8b5cf6' },
  ];

  return (
    <div style={{ marginLeft: 180, padding: 32 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>Dashboard</h2>
      <form onSubmit={handlePeriodSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 24 }}>
        <label>Período:</label>
        <Input name="start" type="date" value={periodInput.start} onChange={handlePeriodChange} required />
        <span>a</span>
        <Input name="end" type="date" value={periodInput.end} onChange={handlePeriodChange} required />
        <button type="submit" style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: 'var(--color-primary)', color: '#fff', fontWeight: 500 }}>Filtrar</button>
        <span style={{ color: '#888', fontSize: 13, marginLeft: 8 }}>(padrão: mês atual)</span>
      </form>
      {/* Primeira linha: Resumo Mensal e Evolução do Saldo */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap' }}>
        <motion.div className="glass-card fade-in" style={{ flex: 1, minWidth: 320, maxWidth: '50%', padding: 32, background: 'linear-gradient(135deg, #f5f7fa 60%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* Resumo Mensal */}
          <h3 style={{ marginBottom: 16, alignSelf: 'flex-start' }}>Resumo Mensal</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, justifyContent: 'center', width: '100%' }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75}>
                  {pieData.map((entry, idx) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v, name, props) => `${props.payload.name}: R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
            <div>
              <div style={{ fontSize: 15, marginBottom: 4 }}><span style={{ color: '#22c55e' }}>●</span> Receitas: R$ {(breakdown?.receitas || 0).toFixed(2)}</div>
              <div style={{ fontSize: 15, marginBottom: 4 }}><span style={{ color: '#ef4444' }}>●</span> Despesas: R$ {(breakdown?.despesas || 0).toFixed(2)}</div>
              <div style={{ fontSize: 15 }}><span style={{ color: '#8b5cf6' }}>●</span> Cartão: R$ {(breakdown?.cartao || 0).toFixed(2)}</div>
            </div>
          </div>
        </motion.div>
        <motion.div className="glass-card fade-in" style={{ flex: 1, minWidth: 320, maxWidth: '50%', padding: 32, background: 'linear-gradient(135deg, #f5f7fa 60%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {/* Evolução do Saldo */}
          <h3 style={{ marginBottom: 16, alignSelf: 'flex-start' }}>Evolução do Saldo</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={saldoEvolucao} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="data" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip formatter={v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Line type="monotone" dataKey="saldo" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      {/* Segunda linha: Alertas e Gastos por Cartão */}
      <div style={{ display: 'flex', gap: 24, marginBottom: 24, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        <motion.div className="glass-card fade-in" style={{ flex: 1, minWidth: 320, maxWidth: '50%', padding: 32, background: 'linear-gradient(135deg, #f5f7fa 60%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px #0002', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'center' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          {/* Alertas */}
          <h3 style={{ marginBottom: 16 }}>Alertas</h3>
          <ul style={{ padding: 0, listStyle: 'none', maxHeight: 120, overflowY: 'auto' }}>
            {alertas?.length === 0 && <li style={{ color: '#888' }}>Nenhum alerta no momento.</li>}
            {alertas?.slice(0, 4).map?.(a => (
              <li key={a.id} style={{ color: a.cor, marginBottom: 8, fontWeight: 500 }}>{a.descricao}</li>
            ))}
          </ul>
        </motion.div>
        <motion.div className="glass-card fade-in" style={{ flex: 1, minWidth: 320, maxWidth: '50%', padding: 32, background: 'linear-gradient(135deg, #f5f7fa 60%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          {/* Gastos por Cartão */}
          <h3 style={{ marginBottom: 16 }}>Gastos por Cartão</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ padding: 8, textAlign: 'left' }}>Cartão</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Banco</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {gastosPorCartao?.length === 0 && <tr><td colSpan={3} style={{ color: '#888' }}>Nenhum gasto no período.</td></tr>}
              {gastosPorCartao?.map?.(c => (
                <tr key={c.card_id}>
                  <td>{c.card_name}</td>
                  <td>{c.card_bank}</td>
                  <td style={{ color: 'var(--color-cartao)', fontWeight: 600 }}>R$ {Number(c.total).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
      {/* Terceira linha: Quadro de Orçamento ocupando 100% */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <motion.div className="glass-card fade-in" style={{ width: '100%', minWidth: 320, maxWidth: 900, padding: 32, background: 'linear-gradient(135deg, #f5f7fa 60%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          {/* Quadro de Orçamento */}
          <h3 style={{ marginBottom: 16 }}>Quadro de Orçamento</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ padding: 8, textAlign: 'left' }}>Nome</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Tipo</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Período</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Planejado</th>
                <th style={{ padding: 8, textAlign: 'left' }}>Utilizado</th>
              </tr>
            </thead>
            <tbody>
              {budgets?.length === 0 && <tr><td colSpan={5} style={{ color: '#888' }}>Nenhum orçamento para o período.</td></tr>}
              {budgets?.map?.(b => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{b.type === 'geral' ? 'Geral' : 'Cartão'}</td>
                  <td>{b.period_start ? dayjs(b.period_start).format('DD/MM/YYYY') : ''} a {b.period_end ? dayjs(b.period_end).format('DD/MM/YYYY') : ''}</td>
                  <td style={{ color: 'var(--color-primary)', fontWeight: 600 }}>R$ {Number(b.planned_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ color: 'var(--color-despesa)', fontWeight: 600 }}>R$ {Number(b.utilizado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
      {/* Transações Recentes permanece abaixo */}
      <motion.div className="glass-card fade-in" style={{ padding: 32, background: 'linear-gradient(135deg, #f5f7fa 60%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px #0002', marginBottom: 32 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <h3 style={{ marginBottom: 16 }}>Transações Recentes</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
              <th style={{ padding: 8, textAlign: 'left' }}>Data</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Descrição</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Valor</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Conta</th>
              <th style={{ padding: 8, textAlign: 'left' }}>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {recentes?.map?.((t, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 8, textAlign: 'left' }}>{t.data}</td>
                <td style={{ padding: 8, textAlign: 'left' }}>{t.descricao}</td>
                <td style={{ padding: 8, textAlign: 'left', color: t.tipo === 'receita' ? 'var(--color-receita)' : t.tipo === 'despesa' ? 'var(--color-despesa)' : 'var(--color-cartao)', fontWeight: 600 }}>
                  {t.tipo === 'despesa' ? '-' : ''}R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: 8, textAlign: 'left' }}>{t.conta_nome}</td>
                <td style={{ padding: 8, textAlign: 'left' }}>
                  {t.tipo === 'receita' && <span style={{ color: 'var(--color-receita)', fontWeight: 500 }}>Receita</span>}
                  {t.tipo === 'despesa' && <span style={{ color: 'var(--color-despesa)', fontWeight: 500 }}>Despesa</span>}
                  {t.tipo === 'cartao' && <span style={{ color: 'var(--color-cartao)', fontWeight: 500 }}>Cartão</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

function KpiCard({ label, value, prefix, color, glass, fadeIn }) {
  return (
    <motion.div
      className={['glass-card', glass ? 'glass-card' : '', fadeIn ? 'fade-in' : ''].join(' ')}
      style={{ background: color, minWidth: 160, textAlign: 'center', boxShadow: '0 2px 8px #0001', color: '#fff', marginBottom: 8, padding: 24, border: 'none', position: 'relative', overflow: 'hidden' }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{prefix}{Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
    </motion.div>
  );
}

export default Dashboard; 