import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

function Dashboard({ token }) {
  // Mock de dados para exibição inicial
  const [kpis, setKpis] = useState({
    saldoTotal: 12500.50,
    receitasMes: 4200.00,
    despesasMes: 3100.00,
    cartaoMes: 800.00,
    saldoMensal: 300.00,
  });
  const [breakdown, setBreakdown] = useState({
    receitas: 4200.00,
    despesas: 3100.00,
    cartao: 800.00,
  });
  const [recentes, setRecentes] = useState([
    { id: 1, tipo: 'receita', descricao: 'Salário', valor: 3000, data: '2024-06-01', conta: 'Corrente' },
    { id: 2, tipo: 'despesa', descricao: 'Aluguel', valor: 1200, data: '2024-06-02', conta: 'Corrente' },
    { id: 3, tipo: 'cartao', descricao: 'Supermercado', valor: 400, data: '2024-06-03', conta: 'Cartão Visa' },
    { id: 4, tipo: 'receita', descricao: 'Freelance', valor: 1200, data: '2024-06-04', conta: 'Poupança' },
    { id: 5, tipo: 'despesa', descricao: 'Internet', valor: 100, data: '2024-06-05', conta: 'Corrente' },
  ]);
  const [alertas, setAlertas] = useState([
    { id: 1, tipo: 'vencimento', descricao: 'Conta de luz vence em 2 dias', cor: 'orange' },
    { id: 2, tipo: 'atraso', descricao: 'Cartão Visa em atraso!', cor: 'red' },
  ]);

  // Estrutura pronta para integração futura com backend
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/dashboard', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setKpis({
          saldoTotal: data.saldoTotal,
          receitasMes: data.receitasMes,
          despesasMes: data.despesasMes,
          cartaoMes: data.cartaoMes,
          saldoMensal: data.saldoMensal,
        });
        setBreakdown(data.breakdown);
        setRecentes(data.recentes);
        setAlertas(data.alertas);
      } catch (err) {
        // fallback para mock se erro
      }
    };
    fetchDashboard();
  }, [token]);

  const pieData = [
    { name: 'Receitas', value: breakdown.receitas, color: '#22c55e' },
    { name: 'Despesas', value: breakdown.despesas, color: '#ef4444' },
    { name: 'Cartão', value: breakdown.cartao, color: '#8b5cf6' },
  ];
  // Mock para evolução do saldo mensal (substituir por dados reais se disponível)
  const saldoEvolucao = [
    { mes: 'Jan', saldo: 2000 },
    { mes: 'Fev', saldo: 2500 },
    { mes: 'Mar', saldo: 3000 },
    { mes: 'Abr', saldo: 3500 },
    { mes: 'Mai', saldo: 4000 },
    { mes: 'Jun', saldo: kpis.saldoTotal },
  ];

  return (
    <div style={{ marginLeft: 240, padding: 32 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>Dashboard</h2>
      <div className="dashboard-flex" style={{ display: 'flex', gap: 24, marginBottom: 32, flexWrap: 'wrap' }}>
        <KpiCard label="Saldo Total" value={kpis.saldoTotal} prefix="R$" color="var(--color-primary)" glass fadeIn />
        <KpiCard label="Receitas do Mês" value={kpis.receitasMes} prefix="R$" color="var(--color-receita)" glass fadeIn />
        <KpiCard label="Despesas do Mês" value={kpis.despesasMes} prefix="R$" color="var(--color-despesa)" glass fadeIn />
        <KpiCard label="Cartão de Crédito" value={kpis.cartaoMes} prefix="R$" color="var(--color-cartao)" glass fadeIn />
        <KpiCard label="Saldo Mensal" value={kpis.saldoMensal} prefix="R$" color={kpis.saldoMensal >= 0 ? 'var(--color-success)' : 'var(--color-danger)'} glass fadeIn />
      </div>
      <div className="dashboard-flex" style={{ display: 'flex', gap: 32, marginBottom: 32 }}>
        <motion.div className="glass-card fade-in" style={{ flex: 1, padding: 24 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 style={{ marginBottom: 16 }}>Resumo Mensal</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ResponsiveContainer width={120} height={120}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={50} label>
                  {pieData.map((entry, idx) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div>
              <div style={{ fontSize: 14, marginBottom: 4 }}><span style={{ color: '#22c55e' }}>●</span> Receitas: R$ {breakdown.receitas.toFixed(2)}</div>
              <div style={{ fontSize: 14, marginBottom: 4 }}><span style={{ color: '#ef4444' }}>●</span> Despesas: R$ {breakdown.despesas.toFixed(2)}</div>
              <div style={{ fontSize: 14 }}><span style={{ color: '#8b5cf6' }}>●</span> Cartão: R$ {breakdown.cartao.toFixed(2)}</div>
            </div>
          </div>
        </motion.div>
        <motion.div className="glass-card fade-in" style={{ flex: 1, padding: 24 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 style={{ marginBottom: 16 }}>Evolução do Saldo</h3>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={saldoEvolucao} margin={{ left: -20, right: 10, top: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip formatter={v => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Line type="monotone" dataKey="saldo" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
        <motion.div className="glass-card fade-in" style={{ flex: 1, padding: 24 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h3 style={{ marginBottom: 16 }}>Alertas</h3>
          <ul style={{ padding: 0, listStyle: 'none' }}>
            {alertas.length === 0 && <li style={{ color: '#888' }}>Nenhum alerta no momento.</li>}
            {alertas.map(a => (
              <li key={a.id} style={{ color: a.cor, marginBottom: 8, fontWeight: 500 }}>{a.descricao}</li>
            ))}
          </ul>
        </motion.div>
      </div>
      <motion.div className="glass-card fade-in" style={{ padding: 24 }} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <h3 style={{ marginBottom: 16 }}>Transações Recentes</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'transparent' }}>
          <thead>
            <tr style={{ background: 'rgba(0,0,0,0.03)' }}>
              <th style={{ padding: 8, borderRadius: 6 }}>Data</th>
              <th style={{ padding: 8, borderRadius: 6 }}>Descrição</th>
              <th style={{ padding: 8, borderRadius: 6 }}>Valor</th>
              <th style={{ padding: 8, borderRadius: 6 }}>Conta</th>
              <th style={{ padding: 8, borderRadius: 6 }}>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {recentes.map((t, i) => (
              <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                <td style={{ padding: 8 }}>{t.data}</td>
                <td style={{ padding: 8 }}>{t.descricao}</td>
                <td style={{ padding: 8, color: t.tipo === 'receita' ? 'var(--color-receita)' : t.tipo === 'despesa' ? 'var(--color-despesa)' : 'var(--color-cartao)', fontWeight: 600 }}>
                  {t.tipo === 'despesa' ? '-' : ''}R$ {Number(t.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ padding: 8 }}>{t.conta}</td>
                <td style={{ padding: 8 }}>
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