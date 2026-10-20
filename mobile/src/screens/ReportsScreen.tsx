import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { apiService } from '../services/api'
import { Linking } from 'react-native'
import { BackButton } from '../components/BackButton'

type ProximoVencimento = { descricao: string; valor: number; vencimento: string }
type DespesaParcelada = { item: string; cartao: string; parcelaAtual: number; totalParcelas: number; valor: number; vencimento: string }

export const ReportsScreen: React.FC = () => {
  const [summary, setSummary] = useState<{ totalIncomes: number; totalExpenses: number; totalCreditCardBills: number; balance: number } | null>(null)
  const [proximosVencimentos, setProximosVencimentos] = useState<ProximoVencimento[]>([])
  const [despesasParceladas, setDespesasParceladas] = useState<DespesaParcelada[]>([])
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<Date>(new Date())

  const load = async (d = current) => {
    try {
      setLoading(true)
      const [s, resumo] = await Promise.all([
        apiService.getMonthlySummary(d.getTime()),
        apiService.getResumo().catch(() => ({ proximosVencimentos: [], despesasParceladas: [] })),
      ])
      setSummary(s)
      setProximosVencimentos(resumo.proximosVencimentos)
      setDespesasParceladas(resumo.despesasParceladas)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(current) }, [current])

  const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  const formatDateBR = (value: string) => {
    const iso = String(value).slice(0, 10)
    const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (m) return `${m[3]}/${m[2]}/${m[1]}`
    return iso
  }

  // Mesma lógica de contagem da versão web
  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const due = new Date(`${String(dueDate).slice(0, 10)}T00:00:00`)
    if (isNaN(due.getTime())) return ''
    const diff = Math.round((due.getTime() - today.getTime()) / 86400000)
    if (diff === 0) return 'hoje'
    if (diff === 1) return 'amanhã'
    if (diff < 0) return `há ${Math.abs(diff)} dias`
    return `em ${diff} dias`
  }

  const totalDespesasParceladas = despesasParceladas.reduce((total, parcela) => total + Number(parcela.valor || 0), 0)

  if (loading || !summary) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.title}>Relatórios</Text>
          <View style={{width:40}} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando relatório...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setCurrent(new Date(current.getFullYear(), current.getMonth()-1, 1))}><Text style={styles.headerBtnText}>◀︎</Text></TouchableOpacity>
          <Text style={styles.monthText}>{current.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setCurrent(new Date(current.getFullYear(), current.getMonth()+1, 1))}><Text style={styles.headerBtnText}>▶︎</Text></TouchableOpacity>
        </View>
        <View style={{width:40}} />
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}><Text style={styles.label}>Receitas no mês</Text><Text style={styles.value}>{fmt(summary.totalIncomes)}</Text></View>
        <View style={styles.card}><Text style={styles.label}>Despesas no mês</Text><Text style={styles.value}>{fmt(summary.totalExpenses)}</Text></View>
        <View style={styles.card}><Text style={styles.label}>Faturas de cartão</Text><Text style={styles.value}>{fmt(summary.totalCreditCardBills)}</Text></View>
        <View style={styles.card}><Text style={styles.label}>Saldo</Text><Text style={[styles.value, { color: summary.balance >= 0 ? '#4CAF50' : '#F44336' }]}>{fmt(summary.balance)}</Text></View>

        <View style={[styles.card, styles.warningCard]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Próximos Vencimentos</Text>
            <Text style={styles.warningIcon}>⚠</Text>
          </View>
          {proximosVencimentos.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum vencimento nos próximos 15 dias</Text>
          ) : (
            proximosVencimentos.map((v, index) => (
              <View key={`venc-${index}`} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>{v.descricao}</Text>
                  <Text style={styles.rowSubtitle}>
                    {formatDateBR(v.vencimento)} • vence {getDaysUntilDue(v.vencimento)}
                  </Text>
                </View>
                <Text style={styles.rowValueRed}>{fmt(v.valor)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={[styles.card, styles.installmentCard]}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>Despesas Parceladas</Text>
            <Text style={styles.installmentIcon}>📅</Text>
          </View>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>Total: {fmt(totalDespesasParceladas)}</Text>
          </View>
          {despesasParceladas.length === 0 ? (
            <Text style={styles.emptyText}>Nenhuma parcela vence este mês</Text>
          ) : (
            despesasParceladas.map((p, index) => (
              <View key={`parc-${index}`} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowTitle}>
                    {p.item} (Parcela {p.parcelaAtual}/{p.totalParcelas})
                  </Text>
                  <Text style={styles.rowSubtitle}>Cartão {p.cartao}</Text>
                </View>
                <Text style={styles.rowValuePurple}>{fmt(p.valor)}</Text>
              </View>
            ))
          )}
        </View>

        <TouchableOpacity style={styles.exportBtn} onPress={()=>{
          try {
            const base = apiService.getBaseURL();
            const monthStart = new Date(current.getFullYear(), current.getMonth(), 1);
            const monthEnd = new Date(current.getFullYear(), current.getMonth()+1, 0);
            const fmtIso = (d:Date)=> `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            const url = `${base}/export/expenses?start=${fmtIso(monthStart)}&end=${fmtIso(monthEnd)}`;
            Linking.openURL(url);
          } catch {}
        }}><Text style={styles.exportText}>Exportar despesas (CSV)</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  headerBtn: { backgroundColor: '#E5E7EB', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  headerBtnText: { fontSize: 16, fontWeight: '700', color: '#111' },
  monthText: { marginHorizontal: 12, fontSize: 16, fontWeight: '600', color: '#333' },
  content: { flex: 1, padding: 20 },
  contentContainer: { paddingBottom: 48 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  label: { fontSize: 14, color: '#666', marginBottom: 4 },
  value: { fontSize: 20, fontWeight: '700', color: '#333' },
  warningCard: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D' },
  installmentCard: { backgroundColor: '#FDF2F8', borderWidth: 1, borderColor: '#F9A8D4' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  warningIcon: { color: '#F59E0B', fontSize: 16 },
  installmentIcon: { color: '#EC4899', fontSize: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: '#1F2937' },
  rowSubtitle: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  rowValueRed: { fontSize: 14, fontWeight: '600', color: '#DC2626' },
  rowValuePurple: { fontSize: 14, fontWeight: '600', color: '#7C3AED' },
  totalBadge: { backgroundColor: 'rgba(236, 72, 153, 0.1)', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 12 },
  totalBadgeText: { fontSize: 14, fontWeight: '600', color: '#EC4899', textAlign: 'center' },
  emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', paddingVertical: 16 },
  exportBtn: { marginTop: 12, backgroundColor: '#2563EB', padding: 12, borderRadius: 8, alignItems:'center' },
  exportText: { color:'#fff', fontWeight:'700' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: '#666' }
})
