import React, { useEffect, useState } from 'react';
import '../styles/global.css';
import { motion } from 'framer-motion';
import { 
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import Input from '../components/Input';
import dayjs from 'dayjs';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function Analytics({ token }) {
  const [data, setData] = useState({
    tendenciasMensais: { meses: [], receitas: [], despesas: [], saldos: [] },
    analiseCategorias: { topDespesas: [], topReceitas: [] },
    comparativoMensal: [],
    projecoes: {},
    analiseCartoes: [],
    metas: []
  });
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('last3months');
  const [periodInput, setPeriodInput] = useState({ start: '', end: '' });

  useEffect(() => {
    fetchAnalytics();
  }, [token, period]);

  const fetchAnalytics = async (start, end) => {
    setLoading(true);
    try {
      let url = `${API_URL}/analytics/dashboard`;
      const params = new URLSearchParams();
      
      if (start && end) {
        params.append('start', start);
        params.append('end', end);
      } else {
        params.append('period', period);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const analyticsData = await res.json();
        setData(analyticsData);
      } else {
        console.error('Erro ao carregar analytics');
      }
    } catch (err) {
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = e => {
    const { name, value } = e.target;
    setPeriodInput({ ...periodInput, [name]: value });
  };

  const handlePeriodSubmit = e => {
    e.preventDefault();
    if (periodInput.start && periodInput.end) {
      fetchAnalytics(periodInput.start, periodInput.end);
    }
  };

  const handlePeriodSelect = e => {
    setPeriod(e.target.value);
  };

  // Cores para gráficos
  const colors = {
    receitas: '#22c55e',
    despesas: '#ef4444',
    saldo: '#3b82f6',
    cartao: '#8b5cf6'
  };

  // Paleta de cores para categorias de despesas (fatias distintas)
  const categoryColorsDespesas = [
    '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#22d3ee',
    '#eab308', '#9ca3af'
  ];
  // Paleta de cores para categorias de receitas (fatias distintas)
  const categoryColorsReceitas = [
    '#22c55e', '#2563eb', '#f59e0b', '#10b981', '#8b5cf6',
    '#ec4899', '#14b8a6', '#f97316', '#84cc16', '#22d3ee', '#eab308', '#9ca3af'
  ];
  // Dados para gráfico de tendências
  const tendenciasData = data.tendenciasMensais.meses.map((mes, index) => ({
    mes,
    receitas: data.tendenciasMensais.receitas[index] || 0,
    despesas: data.tendenciasMensais.despesas[index] || 0,
    saldo: data.tendenciasMensais.saldos[index] || 0
  }));

  // Dados para gráfico de categorias
  const categoriasDespesasData = data.analiseCategorias.topDespesas.map(item => ({
    name: item.categoria,
    value: item.total
  }));

  const categoriasReceitasData = data.analiseCategorias.topReceitas.map(item => ({
    name: item.categoria,
    value: item.total
  }));

  if (loading) {
    return (
      <div style={{ marginLeft: 240, padding: 32, textAlign: 'center' }}>
        <div className="loader"></div>
        <p>Carregando analytics...</p>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ marginLeft: 240, padding: 32 }}>
      <h2 style={{ marginBottom: 24, fontWeight: 700 }}>Dashboard Analítico</h2>
      
      {/* Filtros */}
      <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32 }}>
        <form onSubmit={handlePeriodSubmit} style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <label style={{ fontWeight: 500, marginRight: 8 }}>Período:</label>
            <select value={period} onChange={handlePeriodSelect} className="input-glass">
              <option value="last3months">Últimos 3 meses</option>
              <option value="last6months">Últimos 6 meses</option>
              <option value="last12months">Últimos 12 meses</option>
              <option value="custom">Personalizado</option>
            </select>
          </div>
          
          {period === 'custom' && (
            <>
              <Input name="start" type="date" value={periodInput.start} onChange={handlePeriodChange} required />
              <span>a</span>
              <Input name="end" type="date" value={periodInput.end} onChange={handlePeriodChange} required />
              <button type="submit" className="btn-primary">Filtrar</button>
            </>
          )}
        </form>
      </motion.div>

      {/* 1. Tendências Mensais */}
      <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Tendências Mensais</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={tendenciasData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="mes" />
            <YAxis />
            <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
            <Line type="monotone" dataKey="receitas" stroke={colors.receitas} strokeWidth={2} name="Receitas" />
            <Line type="monotone" dataKey="despesas" stroke={colors.despesas} strokeWidth={2} name="Despesas" />
            <Line type="monotone" dataKey="saldo" stroke={colors.saldo} strokeWidth={2} name="Saldo" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* 2. Comparativo Mensal */}
      <motion.div className="glass-card fade-in" style={{ padding: 16, marginBottom: 32 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Comparativo Mensal</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={data.comparativoMensal}
            margin={{ left: 12, right: 12, top: 8, bottom: 8 }}
            barSize={18}
            barGap={6}
            barCategoryGap={'25%'}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="mes" stroke="#888" fontSize={11} />
            <YAxis stroke="#888" fontSize={11} />
            <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
            <Bar dataKey="receitas" fill="#2563eb" name="Receitas" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesas" fill="#ef4444" name="Despesas" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* 3. Análise de Categorias */}
      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
        <motion.div className="glass-card fade-in" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Top Categorias - Despesas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoriasDespesasData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: R$ ${value.toLocaleString('pt-BR')}`}
              >
                {categoriasDespesasData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={categoryColorsDespesas[index % categoryColorsDespesas.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="glass-card fade-in" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Top Categorias - Receitas</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={categoriasReceitasData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: R$ ${value.toLocaleString('pt-BR')}`}
              >
                {categoriasReceitasData.map((entry, index) => (
                  <Cell key={`cell-rec-${index}`} fill={categoryColorsReceitas[index % categoryColorsReceitas.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `R$ ${value.toLocaleString('pt-BR')}`} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* 4. Projeções */}
      <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32 }}>
        <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Projeções</h3>
        <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          <div style={{ textAlign: 'center', padding: 16, background: 'rgba(34, 197, 94, 0.1)', borderRadius: 8 }}>
            <h4 style={{ margin: 0, color: colors.receitas }}>Média de Receitas</h4>
            <p style={{ fontSize: 24, fontWeight: 700, margin: 8, color: colors.receitas }}>
              R$ {data.projecoes.mediaReceitas?.toLocaleString('pt-BR') || '0'}
            </p>
            <small>Últimos 3 meses</small>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}>
            <h4 style={{ margin: 0, color: colors.despesas }}>Média de Despesas</h4>
            <p style={{ fontSize: 24, fontWeight: 700, margin: 8, color: colors.despesas }}>
              R$ {data.projecoes.mediaDespesas?.toLocaleString('pt-BR') || '0'}
            </p>
            <small>Últimos 3 meses</small>
          </div>
          <div style={{ textAlign: 'center', padding: 16, background: 'rgba(59, 130, 246, 0.1)', borderRadius: 8 }}>
            <h4 style={{ margin: 0, color: colors.saldo }}>Projeção Saldo</h4>
            <p style={{ fontSize: 24, fontWeight: 700, margin: 8, color: colors.saldo }}>
              R$ {data.projecoes.projecaoSaldo?.toLocaleString('pt-BR') || '0'}
            </p>
            <small>{data.projecoes.proximoMes}</small>
          </div>
        </div>
      </motion.div>

      {/* 5. Análise de Cartões */}
      {data.analiseCartoes.length > 0 && (
        <motion.div className="glass-card fade-in" style={{ padding: 24, marginBottom: 32 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Análise de Cartões de Crédito</h3>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {data.analiseCartoes.map((cartao, index) => (
              <div key={cartao.id} style={{ padding: 16, background: 'rgba(139, 92, 246, 0.1)', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 8 0', color: colors.cartao }}>{cartao.nome}</h4>
                <p style={{ margin: '4 0', fontSize: 14 }}>{cartao.banco}</p>
                <div style={{ margin: '8 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Utilizado:</span>
                    <span>R$ {cartao.utilizado.toLocaleString('pt-BR')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Disponível:</span>
                    <span>R$ {cartao.disponivel.toLocaleString('pt-BR')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Limite:</span>
                    <span>R$ {cartao.limite.toLocaleString('pt-BR')}</span>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ 
                    width: '100%', 
                    height: 8, 
                    background: '#e5e7eb', 
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(cartao.limiteUtilizado, 100)}%`,
                      height: '100%',
                      background: cartao.limiteUtilizado > 80 ? colors.despesas : colors.cartao,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <small style={{ color: '#666' }}>{cartao.limiteUtilizado}% utilizado</small>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* 6. Metas */}
      {data.metas.length > 0 && (
        <motion.div className="glass-card fade-in" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 16, fontWeight: 600 }}>Metas e Objetivos</h3>
          <div className="grid-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            {data.metas.map((meta) => (
              <div key={meta.id} style={{ padding: 16, background: 'rgba(0,0,0,0.05)', borderRadius: 8 }}>
                <h4 style={{ margin: '0 0 8 0' }}>{meta.nome}</h4>
                <p style={{ margin: '4 0', fontSize: 14, color: '#666' }}>Tipo: {meta.tipo}</p>
                <div style={{ margin: '8 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Planejado:</span>
                    <span>R$ {meta.planejado.toLocaleString('pt-BR')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span>Utilizado:</span>
                    <span>R$ {meta.utilizado.toLocaleString('pt-BR')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Percentual:</span>
                    <span style={{ 
                      color: meta.status === 'excedido' ? colors.despesas : 
                             meta.status === 'atencao' ? '#f59e0b' : colors.receitas 
                    }}>
                      {meta.percentual}%
                    </span>
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div style={{ 
                    width: '100%', 
                    height: 8, 
                    background: '#e5e7eb', 
                    borderRadius: 4,
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${Math.min(meta.percentual, 100)}%`,
                      height: '100%',
                      background: meta.status === 'excedido' ? colors.despesas : 
                                 meta.status === 'atencao' ? '#f59e0b' : colors.receitas,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default Analytics;