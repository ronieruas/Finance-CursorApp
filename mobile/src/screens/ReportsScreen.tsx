import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity } from 'react-native'
import { apiService } from '../services/api'
import { Linking } from 'react-native'

export const ReportsScreen: React.FC = () => {
  const [summary, setSummary] = useState<{ totalIncomes: number; totalExpenses: number; totalCreditCardBills: number; balance: number } | null>(null)
  const [loading, setLoading] = useState(true)
  const [current, setCurrent] = useState<Date>(new Date())

  const load = async (d = current) => {
    try {
      setLoading(true)
      const s = await apiService.getMonthlySummary(d.getTime())
      setSummary(s)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(current) }, [current])

  const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  if (loading || !summary) {
    return (
      <SafeAreaView style={styles.container}> 
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando relatório...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Relatórios</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setCurrent(new Date(current.getFullYear(), current.getMonth()-1, 1))}><Text style={styles.headerBtnText}>◀︎</Text></TouchableOpacity>
          <Text style={styles.monthText}>{current.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</Text>
          <TouchableOpacity style={styles.headerBtn} onPress={() => setCurrent(new Date(current.getFullYear(), current.getMonth()+1, 1))}><Text style={styles.headerBtnText}>▶︎</Text></TouchableOpacity>
        </View>
      </View>
      <View style={styles.content}>
        <View style={styles.card}><Text style={styles.label}>Receitas no mês</Text><Text style={styles.value}>{fmt(summary.totalIncomes)}</Text></View>
        <View style={styles.card}><Text style={styles.label}>Despesas no mês</Text><Text style={styles.value}>{fmt(summary.totalExpenses)}</Text></View>
        <View style={styles.card}><Text style={styles.label}>Faturas de cartão</Text><Text style={styles.value}>{fmt(summary.totalCreditCardBills)}</Text></View>
        <View style={styles.card}><Text style={styles.label}>Saldo</Text><Text style={[styles.value, { color: summary.balance >= 0 ? '#4CAF50' : '#F44336' }]}>{fmt(summary.balance)}</Text></View>
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
      </View>
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
  content: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  label: { fontSize: 14, color: '#666', marginBottom: 4 },
  value: { fontSize: 20, fontWeight: '700', color: '#333' },
  exportBtn: { marginTop: 12, backgroundColor: '#2563EB', padding: 12, borderRadius: 8, alignItems:'center' },
  exportText: { color:'#fff', fontWeight:'700' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: '#666' }
})