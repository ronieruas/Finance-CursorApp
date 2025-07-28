import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { motion } from 'framer-motion';

const ResumoFinanceiro = ({ token }) => {
  const [data, setData] = useState({
    receitas: {
      total: 7500,
      saldoPorConta: [
        { conta: 'Conta Corrente (Banco A)', saldo: 4250.50 },
        { conta: 'Poupança (Banco B)', saldo: 10100.00 },
        { conta: 'Carteira Digital', saldo: 850.75 }
      ]
    },
    despesas: {
      total: 4850,
      gerais: 2150,
      faturasCartao: 2700
    },
    cartoes: [
      { nome: 'Cartão Final 1234', gasto: 1550.20, orcamento: 2000, vencimento: '25/07' },
      { nome: 'Cartão Final 5678', gasto: 1149.80, orcamento: 1500, vencimento: '10/08' }
    ],
    vencimentos: [
      { descricao: 'Conta de Luz', valor: 180.45, dias: 3, urgente: true },
      { descricao: 'Plano de Internet', valor: 99.90, dias: 5, urgente: false },
      { descricao: 'Aluguel', valor: 1800.00, dias: 7, urgente: false },
      { descricao: 'Fatura Cartão Final 1234', valor: 1550.20, dias: 12, urgente: false }
    ],
    parceladas: [
      { descricao: 'Notebook', parcela: '5/12', cartao: 'Cartão Final 5678', valor: 450.00 },
      { descricao: 'Celular', parcela: '8/10', cartao: 'Cartão Final 1234', valor: 320.00 },
      { descricao: 'Curso Online', parcela: '2/6', cartao: 'Cartão Final 1234', valor: 150.00 }
    ]
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Aqui você pode fazer as chamadas para a API para buscar dados reais
        // Por enquanto, usando dados mockados
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Dados para os gráficos
  const receitasChartData = [
    { mes: 'Fev', receitas: 6500, saldo: 8000 },
    { mes: 'Mar', receitas: 5900, saldo: 8500 },
    { mes: 'Abr', receitas: 8000, saldo: 9200 },
    { mes: 'Mai', receitas: 8100, saldo: 9800 },
    { mes: 'Jun', receitas: 5600, saldo: 9000 },
    { mes: 'Jul', receitas: 7500, saldo: 10100 }
  ];

  const despesasChartData = [
    { mes: 'Fev', despesas: 4200 },
    { mes: 'Mar', despesas: 4500 },
    { mes: 'Abr', despesas: 3800 },
    { mes: 'Mai', despesas: 5200 },
    { mes: 'Jun', despesas: 4700 },
    { mes: 'Jul', despesas: 4850 }
  ];

  const orcamentoChartData = data.cartoes.map(cartao => ({
    nome: cartao.nome,
    gasto: cartao.gasto,
    orcamento: cartao.orcamento
  }));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Carregando dados...
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '20px',
      background: '#f0f2f5',
      minHeight: '100vh',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: '32px' }}
        >
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: '700', 
            color: '#1f2937',
            margin: '0 0 8px'
          }}>
            Resumo Financeiro
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#6b7280',
            margin: 0
          }}>
            Resumo de suas atividades financeiras
          </p>
        </motion.header>

        {/* Grid Principal */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          
          {/* Card: Receitas do Mês */}
          <motion.div 
            className="card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: 0 }}>
                Receitas do Mês
              </h2>
              <span style={{ fontSize: '24px' }}>📈</span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 24px' }}>
              {formatCurrency(data.receitas.total)}
            </p>
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#4b5563', margin: '0 0 12px' }}>
                Saldo por Conta
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {data.receitas.saldoPorConta.map((conta, index) => (
                  <div key={index} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    fontSize: '14px'
                  }}>
                    <span style={{ color: '#6b7280' }}>{conta.conta}</span>
                    <span style={{ fontWeight: '500', color: '#111827' }}>
                      {formatCurrency(conta.saldo)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Card: Gráfico de Receitas e Saldos */}
          <motion.div 
            className="card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 16px' }}>
              Receitas e Saldos (Últimos 6 Meses)
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={receitasChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="receitas" fill="#10b981" name="Receitas" />
                <Bar dataKey="saldo" fill="#3b82f6" name="Saldo Final" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Card: Despesas do Mês */}
          <motion.div 
            className="card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: 0 }}>
                Despesas do Mês
              </h2>
              <span style={{ fontSize: '24px' }}>📉</span>
            </div>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: '0 0 24px' }}>
              {formatCurrency(data.despesas.total)}
            </p>
            <div style={{ fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color: '#6b7280' }}>Despesas Gerais</span>
                <span style={{ fontWeight: '500', color: '#111827' }}>
                  {formatCurrency(data.despesas.gerais)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280' }}>Faturas de Cartão</span>
                <span style={{ fontWeight: '500', color: '#111827' }}>
                  {formatCurrency(data.despesas.faturasCartao)}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Card: Gráfico de Despesas */}
          <motion.div 
            className="card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease'
            }}
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 16px' }}>
              Total de Despesas (Últimos 6 Meses)
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={despesasChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Line 
                  type="monotone" 
                  dataKey="despesas" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  fill="#fef2f2"
                  fillOpacity={0.3}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Card: Gastos por Cartão */}
          <motion.div 
            className="card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              gridColumn: 'span 2'
            }}
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: 0 }}>
                Gastos por Cartão de Crédito
              </h2>
              <span style={{ fontSize: '24px' }}>💳</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.cartoes.map((cartao, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}>
                  <div>
                    <p style={{ fontWeight: '500', color: '#111827', margin: '0 0 4px' }}>
                      {cartao.nome}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                      Fecha em {cartao.vencimento}
                    </p>
                  </div>
                  <span style={{ fontWeight: '700', color: '#111827' }}>
                    {formatCurrency(cartao.gasto)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card: Gráfico de Orçamento vs Gasto */}
          <motion.div 
            className="card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              gridColumn: 'span 2'
            }}
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
          >
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: '0 0 16px' }}>
              Orçamento vs. Gasto por Cartão
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={orcamentoChartData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="nome" type="category" width={120} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="gasto" fill="#ef4444" name="Gasto Atual" />
                <Bar dataKey="orcamento" fill="#3b82f6" name="Orçamento" />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Card: Próximos Vencimentos */}
          <motion.div 
            className="card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              gridColumn: 'span 2'
            }}
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: 0 }}>
                Próximos Vencimentos
              </h2>
              <span style={{ fontSize: '24px' }}>⚠️</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.vencimentos.map((vencimento, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  background: vencimento.urgente ? '#fef2f2' : '#f9fafb',
                  border: vencimento.urgente ? '1px solid #fecaca' : 'none'
                }}>
                  <div>
                    <p style={{ fontWeight: '500', color: '#111827', margin: '0 0 4px' }}>
                      {vencimento.descricao}
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                      Vence em {vencimento.dias} dias
                    </p>
                  </div>
                  <span style={{ 
                    fontWeight: '600', 
                    color: vencimento.urgente ? '#dc2626' : '#374151'
                  }}>
                    {formatCurrency(vencimento.valor)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Card: Despesas Parceladas */}
          <motion.div 
            className="card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.3s ease',
              gridColumn: 'span 2'
            }}
            whileHover={{ y: -5, boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#374151', margin: 0 }}>
                Despesas Parceladas
              </h2>
              <span style={{ fontSize: '24px' }}>📅</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.parceladas.map((parcelada, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  borderRadius: '8px',
                  background: index === 1 ? '#f9fafb' : 'transparent'
                }}>
                  <div>
                    <p style={{ fontWeight: '500', color: '#111827', margin: '0 0 4px' }}>
                      {parcelada.descricao} ({parcelada.parcela})
                    </p>
                    <p style={{ fontSize: '12px', color: '#6b7280', margin: 0 }}>
                      {parcelada.cartao}
                    </p>
                  </div>
                  <span style={{ fontWeight: '600', color: '#374151' }}>
                    {formatCurrency(parcelada.valor)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResumoFinanceiro; 