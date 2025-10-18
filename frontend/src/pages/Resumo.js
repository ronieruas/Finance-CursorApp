import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Cell } from 'recharts';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';
import useApiBase from '../hooks/useApiBase';

// Configurar dayjs para português brasileiro
dayjs.locale('pt-br');

function Resumo({ token }) {
  const apiBase = useApiBase();
  const API_URL = apiBase;
  const [data, setData] = useState({
    receitasMes: 0,
    saldoPorConta: [],
    receitasSaldoUltimos6Meses: [],
    despesasMes: {
      gerais: 0,
      faturasProximoMes: 0,
      faturasMesCorrente: 0,
      total: 0
    },
    totalDespesasUltimos6Meses: [],
    gastosPorCartao: [],
    orcamentoVsGasto: [],
    proximosVencimentos: [],
    despesasParceladas: []
  });
  const [loading, setLoading] = useState(true);
  // Paleta de cores para cartões (barras distintas)
  const categoryColorsCartao = [
    '#2563eb', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#22d3ee'
  ];

  useEffect(() => {
    if (!apiBase) return;
    fetchResumo();
  }, [token, apiBase]);

  const fetchResumo = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/resumo`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setData(data);
    } catch (err) {
      console.error('Erro ao carregar resumo:', err);
      alert('Erro ao carregar dados do resumo. Verifique sua conexão ou tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return Number(value).toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  const formatDate = (date) => {
    return dayjs(date).format('DD/MM');
  };

  const getDaysUntilDue = (dueDate) => {
    const today = dayjs();
    const due = dayjs(dueDate);
    const diff = due.diff(today, 'day');
    return diff;
  };

  // Formatação de data em português brasileiro
  dayjs.locale('pt-br');
  const mesAtual = dayjs().format('MMMM [de] YYYY');

  // Calcular total das despesas parceladas
  const totalDespesasParceladas = data.despesasParceladas.reduce((total, parcela) => total + parcela.valor, 0);

  // Filtrar cartões com valor em aberto > 0
  const gastosPorCartaoFiltrados = (data.gastosPorCartao || []).filter(c => Number(c.total) > 0);

  if (loading) {
    return (
      <div className="main-content" style={{ marginLeft: 180, padding: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <div>Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ marginLeft: 180, padding: 32 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700, letterSpacing: '-0.01em' }}>
        RESUMO GERAL
      </h2>
      <p style={{ marginBottom: 8, color: '#666', fontSize: 16 }}>
        Resumo de suas atividades financeiras
      </p>
      <p style={{ marginBottom: 32, color: '#888', fontSize: 14, fontStyle: 'italic' }}>
        Dados referentes a {mesAtual}
      </p>

      {/* Grid principal - 3x3 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(3, 1fr)', 
        gap: 24, 
        marginBottom: 24 
      }}>
        
        {/* 1. Receitas do Mês */}
        <motion.div 
          className="glass-card fade-in" 
          style={{ 
            padding: 24, 
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
            borderRadius: 16, 
            boxShadow: '0 4px 24px #0002',
            border: '1px solid #bbf7d0'
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Receitas do Mês</h3>
            <span style={{ color: '#22c55e', fontSize: 20 }}>↗</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
            {formatCurrency(data.receitasMes)}
          </div>
        </motion.div>

        {/* 2. Saldo por Conta */}
        <motion.div 
          className="glass-card fade-in" 
          style={{ 
            padding: 24, 
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', 
            borderRadius: 16, 
            boxShadow: '0 4px 24px #0002',
            border: '1px solid #bae6fd'
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Saldo por Conta</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.saldoPorConta.map((conta, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: '#374151' }}>{conta.nome}</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                  {formatCurrency(conta.saldo)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 3. Receitas e Saldos (Últimos 6 Meses) */}
        <motion.div 
          className="glass-card fade-in" 
          style={{ 
            padding: 24, 
            background: 'linear-gradient(135deg, #fef7ff 0%, #f3e8ff 100%)', 
            borderRadius: 16, 
            boxShadow: '0 4px 24px #0002',
            border: '1px solid #d8b4fe'
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Receitas e Saldos (Últimos 6 Meses)</h3>
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={data.receitasSaldoUltimos6Meses} margin={{ left: 8, right: 8, top: 6, bottom: 6 }} barSize={22} barGap={8} barCategoryGap={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="mes" stroke="#888" fontSize={10} />
              <YAxis stroke="#888" fontSize={10} />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Bar dataKey="receitas" fill="#2563eb" radius={[4, 4, 0, 0]} />
              <Bar dataKey="saldoFinal" fill="#60a5fa" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
            <span style={{ color: '#2563eb' }}>■</span> Receitas <span style={{ marginLeft: 12, color: '#60a5fa' }}>■</span> Saldo
          </div>
        </motion.div>

        {/* 4. Despesas do Mês */}
        <motion.div 
          className="glass-card fade-in" 
          style={{ 
            padding: 24, 
            background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', 
            borderRadius: 16, 
            boxShadow: '0 4px 24px #0002',
            border: '1px solid #fecaca'
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Despesas do Mês</h3>
            <span style={{ color: '#ef4444', fontSize: 20 }}>↘</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444', marginBottom: 12 }}>
            {formatCurrency(data.despesasMes.total)}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span>Despesas Gerais:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(data.despesasMes.gerais || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span>Faturas (próximo mês):</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(data.despesasMes.faturasProximoMes || 0)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span>Faturas (mês corrente):</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(data.despesasMes.faturasMesCorrente || 0)}</span>
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>
              Ajuda: “Faturas (próximo mês)” somam as compras do período de fatura em aberto, que vencem no mês seguinte. “Faturas (mês corrente)” somam as compras do período da fatura já fechada, que vence neste mês.
            </div>
          </div>
        </motion.div>

        {/* 5. Total de Despesas (Últimos 6 Meses) */}
        <motion.div 
          className="glass-card fade-in" 
          style={{ 
            padding: 24, 
            background: 'linear-gradient(135deg, #fff7ed 0%, #fed7aa 100%)', 
            borderRadius: 16, 
            boxShadow: '0 4px 24px #0002',
            border: '1px solid #fed7aa'
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Total de Despesas (Últimos 6 Meses)</h3>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={data.totalDespesasUltimos6Meses}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="mes" stroke="#888" fontSize={10} />
              <YAxis stroke="#888" fontSize={10} />
              <Tooltip 
                formatter={(value) => formatCurrency(value)}
                labelStyle={{ color: '#374151' }}
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Line type="monotone" dataKey="total" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* 6. Gastos por Cartão de Crédito */}
        <motion.div 
          className="glass-card fade-in" 
          style={{ 
            padding: 24, 
            background: 'linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%)', 
            borderRadius: 16, 
            boxShadow: '0 4px 24px #0002',
            border: '1px solid #99f6e4'
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Gastos por Cartão de Crédito</h3>
            <span style={{ color: '#14b8a6', fontSize: 16 }}>📅</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {gastosPorCartaoFiltrados.map((cartao, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>{cartao.nome}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>Vencimento em {formatDate(cartao.vencimento)}</div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#059669' }}>
                  {formatCurrency(cartao.total)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 7. Gastos por Cartão de Crédito (Gráfico) */}
        <motion.div 
          className="glass-card fade-in" 
          style={{ 
            padding: 24, 
            background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)', 
            borderRadius: 16, 
            boxShadow: '0 4px 24px #0002',
            border: '1px solid #fde68a'
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>Gastos por Cartão de Crédito</h3>
          {gastosPorCartaoFiltrados.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={gastosPorCartaoFiltrados} margin={{ left: 8, right: 8, top: 6, bottom: 6 }} barSize={22} barGap={8} barCategoryGap={16}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="nome" stroke="#888" fontSize={10} />
                  <YAxis stroke="#888" fontSize={10} />
                  <Tooltip 
                    formatter={(value) => formatCurrency(value)}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: '#fff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                    {gastosPorCartaoFiltrados.map((entry, index) => (
                      <Cell key={`cell-card-${index}`} fill={categoryColorsCartao[index % categoryColorsCartao.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280', textAlign: 'center' }}>
                Cores representam cada cartão
              </div>
            </>
          ) : (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              height: 120, 
              color: '#6b7280',
              fontSize: 14
            }}>
              Nenhum cartão com fatura em aberto no período
            </div>
          )}
        </motion.div>

        {/* 8. Próximos Vencimentos */}
        <motion.div 
          className="glass-card fade-in" 
          style={{ 
            padding: 24, 
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', 
            borderRadius: 16, 
            boxShadow: '0 4px 24px #0002',
            border: '1px solid #fcd34d'
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Próximos Vencimentos</h3>
            <span style={{ color: '#f59e0b', fontSize: 16 }}>⚠</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {data.proximosVencimentos.map((vencimento, index) => (
              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>{vencimento.descricao}</div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    Vence em {getDaysUntilDue(vencimento.vencimento)} dias
                  </div>
                </div>
                <span style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>
                  {formatCurrency(vencimento.valor)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* 9. Despesas Parceladas */}
        <motion.div 
          className="glass-card fade-in" 
          style={{ 
            padding: 24, 
            background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%)', 
            borderRadius: 16, 
            boxShadow: '0 4px 24px #0002',
            border: '1px solid #f9a8d4'
          }}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Despesas Parceladas</h3>
            <span style={{ color: '#ec4899', fontSize: 16 }}>📅</span>
          </div>
          <div style={{ marginBottom: 12, padding: '8px 12px', backgroundColor: 'rgba(236, 72, 153, 0.1)', borderRadius: 8 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#ec4899', textAlign: 'center' }}>
              Total: {formatCurrency(totalDespesasParceladas)}
            </div>
          </div>
          {data.despesasParceladas && data.despesasParceladas.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {data.despesasParceladas.map((parcela, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#1f2937' }}>
                      {parcela.item} (Parcela {parcela.parcelaAtual}/{parcela.totalParcelas})
                    </div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      Cartão {parcela.cartao}
                    </div>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#7c3aed' }}>
                    {formatCurrency(parcela.valor)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: 80,
              color: '#6b7280',
              fontSize: 14
            }}>
              Nenhuma parcela vence este mês
            </div>
          )}
        </motion.div>

      </div>
    </div>
  );
}

export default Resumo;