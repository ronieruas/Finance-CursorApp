import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { motion } from 'framer-motion';

const ResumoFinanceiro = ({ token }) => {
  const [data, setData] = useState({
    receitas: {
      total: 0,
      saldoPorConta: []
    },
    despesas: {
      total: 0,
      gerais: 0,
      faturasCartao: 0
    },
    cartoes: [],
    vencimentos: [],
    parceladas: []
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Buscar dados das contas (receitas e saldos)
        const accountsRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/accounts`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const accountsData = await accountsRes.json();
        
        // Buscar dados de receitas do mês atual
        const currentDate = new Date();
        const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Buscar dados dos últimos 6 meses para gráficos
        const receitasChartData = [];
        const despesasChartData = [];
        
        for (let i = 5; i >= 0; i--) {
          const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const monthFirstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
          const monthLastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
          
          const monthName = monthDate.toLocaleDateString('pt-BR', { month: 'short' });
          
          // Buscar receitas do mês
          const monthIncomesRes = await fetch(
            `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/incomes?start=${monthFirstDay.toISOString().split('T')[0]}&end=${monthLastDay.toISOString().split('T')[0]}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const monthIncomesData = await monthIncomesRes.json();
          const monthReceitas = monthIncomesData.reduce((sum, income) => {
            const amount = parseFloat(income.amount) || 0;
            return sum + amount;
          }, 0);
          
          // Buscar despesas do mês
          const monthExpensesRes = await fetch(
            `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/expenses?start=${monthFirstDay.toISOString().split('T')[0]}&end=${monthLastDay.toISOString().split('T')[0]}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const monthExpensesData = await monthExpensesRes.json();
          const monthDespesas = monthExpensesData.reduce((sum, expense) => {
            const amount = parseFloat(expense.amount) || 0;
            return sum + amount;
          }, 0);
          
          // Calcular saldo (receitas - despesas)
          const monthSaldo = monthReceitas - monthDespesas;
          
          receitasChartData.push({
            mes: monthName,
            receitas: monthReceitas,
            saldo: monthSaldo
          });
          
          despesasChartData.push({
            mes: monthName,
            despesas: monthDespesas
          });
        }
        
        const incomesRes = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/incomes?start=${firstDay.toISOString().split('T')[0]}&end=${lastDay.toISOString().split('T')[0]}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const incomesData = await incomesRes.json();
        
        // Buscar dados de despesas do mês atual
        const expensesRes = await fetch(
          `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/expenses?start=${firstDay.toISOString().split('T')[0]}&end=${lastDay.toISOString().split('T')[0]}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const expensesData = await expensesRes.json();
        
        // Buscar cartões de crédito
        const creditCardsRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/creditCards`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const creditCardsData = await creditCardsRes.json();
        
        // Buscar orçamentos
        const budgetsRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/budgets`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const budgetsData = await budgetsRes.json();
        
        // Buscar faturas dos cartões de crédito
        const creditCardPaymentsRes = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/creditCardPayments`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const creditCardPaymentsData = await creditCardPaymentsRes.json();
        
        // Calcular totais com tratamento de dados
        const totalReceitas = incomesData.reduce((sum, income) => {
          const amount = parseFloat(income.amount) || 0;
          return sum + amount;
        }, 0);
        
        const totalDespesas = expensesData.reduce((sum, expense) => {
          const amount = parseFloat(expense.amount) || 0;
          return sum + amount;
        }, 0);
        
        const despesasGerais = expensesData
          .filter(expense => expense.type !== 'cartao')
          .reduce((sum, expense) => {
            const amount = parseFloat(expense.amount) || 0;
            return sum + amount;
          }, 0);
        
        // Calcular faturas de cartão (despesas + faturas em aberto)
        const faturasCartao = expensesData
          .filter(expense => expense.type === 'cartao')
          .reduce((sum, expense) => {
            const amount = parseFloat(expense.amount) || 0;
            return sum + amount;
          }, 0);
        
        // Adicionar faturas em aberto
        const faturasEmAberto = creditCardPaymentsData
          .filter(payment => !payment.paid)
          .reduce((sum, payment) => {
            const amount = parseFloat(payment.amount) || 0;
            return sum + amount;
          }, 0);
        
        const totalFaturasCartao = faturasCartao + faturasEmAberto;
        
        // Preparar dados dos cartões
        const cartoesComGastos = creditCardsData.map(card => {
          // Gastos do cartão (despesas + faturas em aberto)
          const gastosCartao = expensesData
            .filter(expense => expense.credit_card_id === card.id)
            .reduce((sum, expense) => {
              const amount = parseFloat(expense.amount) || 0;
              return sum + amount;
            }, 0);
          
          // Faturas em aberto do cartão
          const faturasEmAberto = creditCardPaymentsData
            .filter(payment => payment.credit_card_id === card.id && !payment.paid)
            .reduce((sum, payment) => {
              const amount = parseFloat(payment.amount) || 0;
              return sum + amount;
            }, 0);
          
          const totalGastosCartao = gastosCartao + faturasEmAberto;
          
          const orcamentoCartao = budgetsData
            .filter(budget => budget.credit_card_id === card.id && budget.type === 'cartao')
            .reduce((sum, budget) => {
              const amount = parseFloat(budget.planned_value) || 0;
              return sum + amount;
            }, 0);
          
          return {
            nome: card.name,
            gasto: totalGastosCartao,
            orcamento: orcamentoCartao,
            vencimento: card.due_date ? new Date(card.due_date).toLocaleDateString('pt-BR') : 'N/A'
          };
        });
        
        // Preparar dados de saldo por conta
        const saldoPorConta = accountsData.map(account => ({
          conta: account.name,
          saldo: parseFloat(account.balance || 0)
        }));
        
        // Debug logs
        console.log('Dados carregados:', {
          accountsData,
          incomesData,
          expensesData,
          creditCardsData,
          budgetsData,
          creditCardPaymentsData,
          totalReceitas,
          totalDespesas,
          despesasGerais,
          faturasCartao: totalFaturasCartao,
          faturasEmAberto,
          cartoesComGastos,
          saldoPorConta,
          receitasChartData,
          despesasChartData
        });
        
        setData({
          receitas: {
            total: totalReceitas,
            saldoPorConta
          },
          despesas: {
            total: totalDespesas + faturasEmAberto,
            gerais: despesasGerais,
            faturasCartao: totalFaturasCartao
          },
          cartoes: cartoesComGastos,
          vencimentos: [], // Será implementado quando houver API de vencimentos
          parceladas: [] // Será implementado quando houver API de despesas parceladas
        });
        
        // Atualizar dados dos gráficos
        setReceitasChartData(receitasChartData);
        setDespesasChartData(despesasChartData);
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  // Dados para os gráficos (serão preenchidos com dados reais)
  const [receitasChartData, setReceitasChartData] = useState([]);
  const [despesasChartData, setDespesasChartData] = useState([]);
  const [orcamentoChartData, setOrcamentoChartData] = useState([]);

  // Atualizar dados do gráfico de orçamento quando os dados principais mudarem
  useEffect(() => {
    // Dados do gráfico de orçamento vs gasto
    const orcamentoData = data.cartoes.map(cartao => ({
      nome: cartao.nome,
      gasto: cartao.gasto,
      orcamento: cartao.orcamento
    }));
    setOrcamentoChartData(orcamentoData);
  }, [data.cartoes]);

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
            {receitasChartData.length > 0 ? (
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
            ) : (
              <div style={{ 
                height: 250, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Histórico de receitas será exibido aqui
              </div>
            )}
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
            {despesasChartData.length > 0 ? (
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
            ) : (
              <div style={{ 
                height: 250, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Histórico de despesas será exibido aqui
              </div>
            )}
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
            {orcamentoChartData.length > 0 ? (
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
            ) : (
              <div style={{ 
                height: 250, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: '#6b7280',
                fontSize: '14px'
              }}>
                Nenhum cartão com orçamento configurado
              </div>
            )}
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
              {data.vencimentos.length > 0 ? (
                data.vencimentos.map((vencimento, index) => (
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
                ))
              ) : (
                <div style={{ 
                  padding: '12px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  Nenhum vencimento próximo
                </div>
              )}
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
              {data.parceladas.length > 0 ? (
                data.parceladas.map((parcelada, index) => (
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
                ))
              ) : (
                <div style={{ 
                  padding: '12px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px'
                }}>
                  Nenhuma despesa parcelada
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ResumoFinanceiro; 