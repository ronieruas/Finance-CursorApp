import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import { motion } from 'framer-motion';
import { ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar, LineChart, Line } from 'recharts';
import Input from '../components/Input';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);

const API_URL = process.env.REACT_APP_API_URL || '/api';

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
  const [monthlySummary, setMonthlySummary] = useState({
    totalIncomes: 0,
    totalExpenses: 0,
    totalCreditCardBills: 0,
    balance: 0,
  });

  const [receitasMesVigente, setReceitasMesVigente] = useState(0);
  const [despesasMesVigente, setDespesasMesVigente] = useState(0);
  const [faturasCartaoMesVigente, setFaturasCartaoMesVigente] = useState(0);
  const [poupancaInvestimentos, setPoupancaInvestimentos] = useState({ total: 0, contas: [], totais_por_moeda: {} });

  // Cálculos derivados para o Resumo Mensal
  const despesasTotais = Number(despesasMesVigente) + Number(faturasCartaoMesVigente);
  const saldoMensal = Number(receitasMesVigente) - despesasTotais;
  const maxComparativo = Math.max(Number(receitasMesVigente) || 0, Number(despesasTotais) || 0);
  const domainMax = maxComparativo > 0 ? Math.ceil(maxComparativo * 1.1) : 100;

  // Estrutura pronta para integração futura com backend
  useEffect(() => {
    fetchDashboard();
    fetchMonthlySummary();
    // eslint-disable-next-line
  }, [token]);

  const fetchMonthlySummary = async () => {
    try {
      const res = await fetch(`${API_URL}/dashboard/monthly-summary?timestamp=${new Date().getTime()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setMonthlySummary(data);
    } catch (err) {
      console.error('Erro ao carregar resumo mensal:', err);
      alert('Erro ao carregar resumo mensal. Verifique sua conexão ou tente novamente.');
    }
  };

  const fetchDashboard = async (start, end) => {
    let url = `${API_URL}/dashboard`;
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
      // Processar transações recentes: filtrar futuras, formatar datas e ordenar desc
      const parseDate = (s) => {
        if (!s) return null;
        // DD/MM/YYYY (estrito)
        const br = dayjs(s, 'DD/MM/YYYY', true);
        if (br.isValid()) return br;
        // YYYY-MM-DD ou ISO -> sempre considerar apenas a parte de data (primeiros 10 chars)
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
          const only = s.slice(0, 10);
          const d = dayjs(only, 'YYYY-MM-DD', true);
          return d.isValid() ? d : null;
        }
        const d = dayjs(s);
        return d.isValid() ? d : null;
      };
      const hoje = dayjs().startOf('day');
      const recentesProcessadas = (data.recentes || [])
        .map(t => ({ ...t, _date: parseDate(t.data) }))
        .filter(t => t._date)
        .filter(t => t._date.startOf('day').valueOf() <= hoje.valueOf())
        .sort((a, b) => b._date.valueOf() - a._date.valueOf())
        .map(t => ({ ...t, data: t._date.format('DD/MM/YYYY') }));
      setRecentes(recentesProcessadas);
      setAlertas(data.alertas || []);
      setSaldoEvolucao(data.saldoEvolucao || []);
      setReceitasMesVigente(data.receitasMesVigente || 0);
      setDespesasMesVigente(data.despesasMesVigente || 0);
      setFaturasCartaoMesVigente(data.faturasCartaoMesVigente || 0);
      setPoupancaInvestimentos(data.poupancaInvestimentos || { total: 0, contas: [], totais_por_moeda: {} });
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
    <div className="main-content" style={{ marginLeft: 180, padding: 20 }}>
      <h2 style={{ marginBottom: 16, fontWeight: 700, letterSpacing: '-0.01em', fontSize: '1.5rem' }}>Dashboard</h2>
      <form onSubmit={handlePeriodSubmit} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="form-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '0.9rem' }}>Período:</label>
          <Input name="start" type="date" value={periodInput.start} onChange={handlePeriodChange} required style={{ padding: '6px 10px', fontSize: '0.9rem' }} />
          <span style={{ fontSize: '0.9rem' }}>a</span>
          <Input name="end" type="date" value={periodInput.end} onChange={handlePeriodChange} required style={{ padding: '6px 10px', fontSize: '0.9rem' }} />
          <button type="submit" className="btn-primary" style={{ padding: '6px 16px', fontSize: '0.9rem' }}>Filtrar</button>
        </div>
        <span style={{ color: '#888', fontSize: 12, marginLeft: 6 }}>(padrão: mês atual)</span>
      </form>
      {/* Primeira linha: Resumo Mensal e Evolução do Saldo */}
      <div className="dashboard-flex" style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <motion.div className="glass-card fade-in" style={{ flex: 1, minWidth: 320, padding: 32, background: 'linear-gradient(135deg, #f5f7fa 60%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          {/* Resumo Mensal */}
          <h3 style={{ marginBottom: 8, alignSelf: 'flex-start', fontSize: '1.05rem' }}>Resumo Mensal</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
              <span>Receitas:</span>
              <span style={{ color: '#22c55e' }}>R$ {Number(receitasMesVigente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
              <span>Despesas gerais:</span>
              <span style={{ color: '#ef4444' }}>R$ {Number(despesasMesVigente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 600 }}>
              <span>Faturas dos Cartões:</span>
              <span style={{ color: '#8b5cf6' }}>R$ {Number(faturasCartaoMesVigente).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700 }}>
              <span>Despesas totais:</span>
              <span style={{ color: '#ef4444' }}>R$ {Number(despesasTotais).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <div style={{ borderTop: '1px solid #eee', paddingTop: 2, marginTop: 2, display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700 }}>
              <span>Saldo:</span>
              <span style={{ color: saldoMensal >= 0 ? '#22c55e' : '#ef4444' }}>R$ {Number(saldoMensal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            </div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart
                layout="vertical"
                data={[
                  { name: 'Mês', Receitas: Number(receitasMesVigente), DespesasTotais: Number(despesasTotais) },
                ]}
                margin={{ left: 8, right: 8, top: 6, bottom: 6 }}
                barSize={22}
                barGap={8}
                barCategoryGap={16}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal vertical={false} />
                <XAxis type="number" stroke="#888" fontSize={11} domain={[0, domainMax]} />
                <YAxis type="category" dataKey="name" stroke="#888" fontSize={11} width={60} />
                <Tooltip formatter={v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                <Bar dataKey="Receitas" fill="#2563eb" radius={[4, 4, 4, 4]} />
                <Bar dataKey="DespesasTotais" fill="#ef4444" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        <motion.div className="glass-card fade-in" style={{ flex: 2, minWidth: 280, padding: '16px 12px', background: 'linear-gradient(135deg, #f5f7fa 60%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {/* Evolução do Saldo */}
          <h3 style={{ marginBottom: 8, alignSelf: 'flex-start', fontSize: '1.05rem' }}>Evolução do Saldo</h3>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={saldoEvolucao} margin={{ left: -18, right: 8, top: 4, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="data" stroke="#888" fontSize={11} />
              <YAxis stroke="#888" fontSize={11} />
              <Tooltip formatter={v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Line type="monotone" dataKey="saldo" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      {/* Segunda linha: Alertas e Gastos por Cartão + Poupança/Investimentos */}
      <div className="dashboard-flex" style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
        <motion.div className="glass-card fade-in" style={{ flex: 1, minWidth: 280, padding: '16px 12px', background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
          <h3 style={{ marginBottom: 8, fontSize: '1.05rem' }}>Gastos por Cartão</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Cartão</th>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Gastos do mês</th>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Fatura atual</th>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Faturas fechadas</th>
              </tr>
            </thead>
            <tbody>
              {gastosPorCartao?.length === 0 && <tr><td colSpan={4} style={{ color: '#888', padding: '5px 3px', fontSize: '0.85rem' }}>Nenhum gasto no período.</td></tr>}
              {gastosPorCartao?.map?.(c => (
                <tr key={c.card_id}>
                  <td style={{ padding: '5px 3px', fontSize: '0.85rem' }}>{c.card_name}</td>
                  <td style={{ color: 'var(--color-cartao)', fontWeight: 600, padding: '5px 3px', fontSize: '0.85rem' }}>R$ {Number(c.gastos_mes || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ color: '#8b5cf6', fontWeight: 600, padding: '5px 3px', fontSize: '0.85rem' }}>R$ {Number(c.fatura_atual || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ padding: '5px 3px', fontSize: '0.85rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>R$ {Number(c.fatura_fechada_valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                      <span style={{ fontSize: 12, color: c.fatura_fechada_status === 'paga' ? '#22c55e' : c.fatura_fechada_status === 'atrasada' ? '#ef4444' : '#2563eb', fontWeight: 700 }}>
                        {c.fatura_fechada_status?.toUpperCase?.()}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
        <motion.div className="glass-card fade-in" style={{ flex: 1, minWidth: 280, padding: '16px 12px', background: 'linear-gradient(135deg, #f5f7fa 0%, #d1fae5 100%)' }}>
          <h3 style={{ marginBottom: 8, fontSize: '1.05rem' }}>Poupança e Investimentos</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, marginBottom: 8 }}>
            <span>Total:</span>
            <span style={{ color: '#10b981' }}>R$ {Number(poupancaInvestimentos.total || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
          {(() => {
            const totais = poupancaInvestimentos?.totais_por_moeda || {};
            const foreign = Object.entries(totais).filter(([moeda]) => (moeda || 'BRL').toUpperCase() !== 'BRL');
            if (foreign.length === 0) return null;
            return (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Totais por moedas estrangeiras:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {foreign.map(([moeda, valor]) => (
                    <div key={moeda} style={{ fontSize: 13 }}>
                      <span style={{ fontWeight: 600 }}>{moeda.toUpperCase()}:</span> <span>{Number(valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Conta</th>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Tipo</th>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Moeda</th>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Saldo</th>
              </tr>
            </thead>
            <tbody>
              {(!poupancaInvestimentos?.contas || poupancaInvestimentos.contas.length === 0) && (
                <tr><td colSpan={4} style={{ color: '#888', padding: '5px 3px', fontSize: '0.85rem' }}>Nenhuma conta de poupança/investimento.</td></tr>
              )}
              {poupancaInvestimentos?.contas?.map?.(c => (
                <tr key={c.id}>
                  <td style={{ padding: '5px 3px', fontSize: '0.85rem' }}>{c.name}</td>
                  <td style={{ padding: '5px 3px', fontSize: '0.85rem' }}>{c.type === 'poupanca' ? 'Poupança' : 'Investimento'}</td>
                  <td style={{ padding: '5px 3px', fontSize: '0.85rem' }}>{(c.currency || 'BRL').toUpperCase()}</td>
                  <td style={{ color: '#10b981', fontWeight: 600, padding: '5px 3px', fontSize: '0.85rem' }}>
                    {(c.currency || 'BRL').toUpperCase() === 'BRL' ? (
                      <>R$ {Number(c.balance || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</>
                    ) : (
                      <>{(c.currency || 'BRL').toUpperCase()} {Number(c.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
      {/* Terceira linha: Quadro de Orçamento ocupando 100% */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <motion.div className="glass-card fade-in" style={{ width: '100%', minWidth: 280, maxWidth: 900, padding: '16px 12px', background: 'linear-gradient(135deg, #f5f7fa 60%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px #0002', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          {/* Quadro de Orçamento */}
          <h3 style={{ marginBottom: 8, fontSize: '1.05rem' }}>Quadro de Orçamento</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Nome</th>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Tipo</th>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Período</th>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Planejado</th>
                <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Utilizado</th>
              </tr>
            </thead>
            <tbody>
              {budgets?.length === 0 && <tr><td colSpan={5} style={{ color: '#888', padding: '5px 3px', fontSize: '0.85rem' }}>Nenhum orçamento para o período.</td></tr>}
              {budgets?.map?.(b => (
                <tr key={b.id}>
                  <td style={{ padding: '5px 3px', fontSize: '0.85rem' }}>{b.name}</td>
                  <td style={{ padding: '5px 3px', fontSize: '0.85rem' }}>{b.type === 'geral' ? 'Geral' : 'Cartão'}</td>
                  <td style={{ padding: '5px 3px', fontSize: '0.85rem' }}>{b.period_start ? dayjs(b.period_start).format('DD/MM/YYYY') : ''} a {b.period_end ? dayjs(b.period_end).format('DD/MM/YYYY') : ''}</td>
                  <td style={{ color: 'var(--color-primary)', fontWeight: 600, padding: '5px 3px', fontSize: '0.85rem' }}>R$ {Number(b.planned_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ color: 'var(--color-despesa)', fontWeight: 600, padding: '5px 3px', fontSize: '0.85rem' }}>R$ {Number(b.utilizado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
      {/* Transações Recentes permanece abaixo */}
      <motion.div className="glass-card fade-in" style={{ padding: '16px 12px', background: 'linear-gradient(135deg, #f5f7fa 60%, #e0e7ff 100%)', borderRadius: 18, boxShadow: '0 4px 24px #0002', marginBottom: 16 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <h3 style={{ marginBottom: 8, fontSize: '1.05rem' }}>Transações Recentes</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
              <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Data</th>
              <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Descrição</th>
              <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Valor</th>
              <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Conta</th>
              <th style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {recentes?.map?.((t, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>{t.data}</td>
                <td style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>{t.descricao}</td>
                <td style={{ padding: '5px 3px', textAlign: 'left', color: (
                  t.tipo === 'receita'
                    ? 'var(--color-receita)'
                    : (t.tipo === 'despesa' || t.tipo === 'pagamento' || t.tipo === 'pagamento_cartao')
                      ? 'var(--color-despesa)'
                      : (t.tipo === 'transferencia')
                        ? '#2563eb'
                        : 'var(--color-cartao)'
                ), fontWeight: 600, fontSize: '0.85rem' }}>
                  {(t.tipo === 'despesa' || t.tipo === 'pagamento' || t.tipo === 'pagamento_cartao') ? '-' : ''}R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: '5px 3px', textAlign: 'left', fontSize: '0.85rem' }}>{t.conta_nome}</td>
                <td style={{ padding: '5px 3px', textAlign: 'left' }}>
                  {t.tipo === 'receita' && <span style={{ color: 'var(--color-receita)', fontWeight: 500, fontSize: '0.8rem' }}>Receita</span>}
                  {t.tipo === 'despesa' && <span style={{ color: 'var(--color-despesa)', fontWeight: 500, fontSize: '0.8rem' }}>Despesa</span>}
                  {t.tipo === 'cartao' && <span style={{ color: 'var(--color-cartao)', fontWeight: 500, fontSize: '0.8rem' }}>Cartão</span>}
                  {t.tipo === 'transferencia' && <span style={{ color: '#2563eb', fontWeight: 500, fontSize: '0.8rem' }}>Transferência</span>}
                  {t.tipo === 'pagamento' && <span style={{ color: 'var(--color-despesa)', fontWeight: 500, fontSize: '0.8rem' }}>Pagamento</span>}
                  {t.tipo === 'pagamento_cartao' && <span style={{ color: 'var(--color-despesa)', fontWeight: 500, fontSize: '0.8rem' }}>Pagamento cartão</span>}
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
      style={{ background: color, minWidth: 160, textAlign: 'center', boxShadow: '0 2px 8px #0001', color: '#fff', marginBottom: 6, padding: 20, border: 'none', position: 'relative', overflow: 'hidden' }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="kpi-label" style={{ fontSize: '0.9rem', marginBottom: 4 }}>{label}</div>
      <div className="kpi-value" style={{ fontSize: '1.8rem' }}>{prefix}{Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
    </motion.div>
  );
}

export default Dashboard;