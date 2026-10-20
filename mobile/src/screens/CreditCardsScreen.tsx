import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TextInput, Modal, TouchableOpacity, KeyboardAvoidingView, Platform, Alert, Switch, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { apiService, CreditCard } from '../services/api'
import DateInput from '../components/DateInput'
import { useNavigation } from '@react-navigation/native'
import { BackButton } from '../components/BackButton'
import { BankLogo } from '../components/BankLogo'

export const CreditCardsScreen: React.FC = () => {
  const navigation = useNavigation();
  const [cards, setCards] = useState<Array<{ card_id: number; card_name: string; gastos_mes: number; fatura_atual: number; fatura_fechada_valor: number; fatura_fechada_status: string }>>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [billMonth, setBillMonth] = useState(()=>{
    const d = new Date();
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = String(d.getFullYear());
    return `${dd}/${mm}/${yy}`
  })
  const [showNextMonth, setShowNextMonth] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [formCard, setFormCard] = useState<CreditCard | null>(null)
  const [formDesc, setFormDesc] = useState('')
  const [formAmount, setFormAmount] = useState('')
  const [formDate, setFormDate] = useState(()=>{
    const d = new Date();
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = String(d.getFullYear());
    return `${dd}/${mm}/${yy}`
  })
  const [formInstallments, setFormInstallments] = useState('1')
  const [showPay, setShowPay] = useState(false)
  const [payAccounts, setPayAccounts] = useState<any[]>([])
  const [payAccountId, setPayAccountId] = useState<number | null>(null)
  const [cardsMeta, setCardsMeta] = useState<CreditCard[]>([])
  const [showCardForm, setShowCardForm] = useState(false)
  const [editingCard, setEditingCard] = useState<any | null>(null)
  const [cardName, setCardName] = useState('')
  const [cardBank, setCardBank] = useState('')
  const [cardBrand, setCardBrand] = useState('')
  const [cardLimit, setCardLimit] = useState('')
  const [cardClosing, setCardClosing] = useState('')
  const [cardDue, setCardDue] = useState('')
  const [cardStatus, setCardStatus] = useState('ativa')
  const [showExpenses, setShowExpenses] = useState(false)
  const [expenseCard, setExpenseCard] = useState<any | null>(null)
  const [expStart, setExpStart] = useState(()=>{
    const d = new Date();
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = String(d.getFullYear());
    return `${dd}/${mm}/${yy}`
  })
  const [expEnd, setExpEnd] = useState(()=>{
    const d = new Date();
    const dd = String(d.getDate()).padStart(2,'0');
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const yy = String(d.getFullYear());
    return `${dd}/${mm}/${yy}`
  })
  const [expCategory, setExpCategory] = useState('')
  const [expMin, setExpMin] = useState('')
  const [expMax, setExpMax] = useState('')
  const [expData, setExpData] = useState<any[]>([])
  const [expenseCategories, setExpenseCategories] = useState<string[]>([])
  const [showExpensesByCategory, setShowExpensesByCategory] = useState(false)
  const [expStatus, setExpStatus] = useState<'all'|'pendente'|'paga'|'atrasada'>('all')
  const [editingExpense, setEditingExpense] = useState<any | null>(null)
  const [showExpenseEdit, setShowExpenseEdit] = useState(false)
  const [editExpenseDesc, setEditExpenseDesc] = useState('')
  const [editExpenseAmount, setEditExpenseAmount] = useState('')
  const [editExpenseDate, setEditExpenseDate] = useState('')
  const [editExpenseCategory, setEditExpenseCategory] = useState('')
  const [editExpenseStatus, setEditExpenseStatus] = useState<'pendente'|'paga'|'atrasada'>('pendente')
  const [showBills, setShowBills] = useState(false)
  const [billsCard, setBillsCard] = useState<any | null>(null)
  const [billsAtual, setBillsAtual] = useState<any[]>([])
  const [billsProxima, setBillsProxima] = useState<any[]>([])
  const [billsPeriods, setBillsPeriods] = useState<any | null>(null)
  const [highlightCardId, setHighlightCardId] = useState<number | null>(null)
  const billsAtualTotal = useMemo(()=> billsAtual.reduce((s:any,x:any)=> s + Number(x.value||0),0), [billsAtual])
  const billsProximaTotal = useMemo(()=> billsProxima.reduce((s:any,x:any)=> s + Number(x.value||0),0), [billsProxima])

  const load = async () => {
    try {
      setLoading(true)
      const toISO = (s:string)=>{ const m=s.match(/^([0-9]{2})\/(\d{2})\/(\d{4})$/); if(m) return `${m[3]}-${m[2]}-${m[1]}`; return s }
      const base = toISO(billMonth)
      const d = new Date(base)
      const monthOffset = showNextMonth ? 1 : 0
      d.setMonth(d.getMonth() + monthOffset)
      const start = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`
      const lastDay = String(new Date(d.getFullYear(), d.getMonth()+1, 0).getDate()).padStart(2,'0')
      const endIso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${lastDay}`
      const meta = await apiService.getCreditCards()
      setCardsMeta(meta)
      let list: Array<{ card_id: number; card_name: string; gastos_mes: number; fatura_atual: number; fatura_fechada_valor: number; fatura_fechada_status: string }> = []
      try {
        list = await apiService.getCardSummary({ start, end: endIso })
      } catch (e) {
        list = []
      }
      console.log('[Mobile] GastosPorCartao (from dashboard)', list)
      const byId = new Map<number, { card_id: number; card_name: string; gastos_mes: number; fatura_atual: number; fatura_fechada_valor: number; fatura_fechada_status: string }>()
      list.forEach(it => byId.set(Number(it.card_id), it))
      const merged: typeof list = meta.map(card => {
        const existing = byId.get(Number((card as any).id))
        if (existing) return existing
        return {
          card_id: Number((card as any).id),
          card_name: card.name,
          gastos_mes: 0,
          fatura_atual: 0,
          fatura_fechada_valor: 0,
          fatura_fechada_status: 'paga',
        }
      })
      console.log('[Mobile] Cartões merged (inclui vazios)', merged)
      setCards(merged)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])
  useEffect(() => {
    if (showExpenses && expenseCard) loadCardExpenses()
  }, [showExpenses, expenseCard, expStatus])

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false) }

  const fmt = (v: number) => `R$ ${Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
  const toISO = (s:string)=>{ const m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if(m) return `${m[3]}-${m[2]}-${m[1]}`; return s }
  const toBR = (s:string)=>{ const m=String(s).match(/^(\d{4})-(\d{2})-(\d{2})$/); if(m) return `${m[3]}/${m[2]}/${m[1]}`; return s }
  const parseSortableDate = (s:string) => {
    const iso = toISO(s)
    const d = new Date(`${iso}T00:00:00`)
    return isNaN(d.getTime()) ? 0 : d.getTime()
  }
  const groupExpensesByCategory = useMemo(() => {
    const grouped = expData.reduce((acc:any, e:any) => {
      const key = e.category || 'other'
      acc[key] = (acc[key] || 0) + Number(e.value || 0)
      return acc
    }, {})
    return Object.entries(grouped).sort((a:any, b:any) => Number(b[1]) - Number(a[1]))
  }, [expData])
  const resolveCardPeriod = async (card:any) => {
    try {
      const bill = await apiService.getCreditCardBill((card.id as any))
      const localToBR = (s:string)=>{ const [y,m,d] = String(s).split('-'); return `${d}/${m}/${y}` }
      const venc = bill?.periods?.atual?.vencimento_date
      if (venc) {
        const br = localToBR(venc)
        return { start: br, end: br }
      }
      if (bill?.periods?.atual?.start_date && bill?.periods?.atual?.end_date) {
        return { start: localToBR(bill.periods.atual.start_date), end: localToBR(bill.periods.atual.end_date) }
      }
    } catch {}
    return { start: expStart, end: expEnd }
  }
  const loadExpenseCategories = async () => {
    try {
      const categories = await apiService.getExpenseCategories()
      setExpenseCategories(categories)
    } catch {}
  }
  const loadCardExpenses = async (
    cardOverride?: any,
    filtersOverride?: Partial<{ start: string; end: string; category: string; min: string; max: string; status: 'all'|'pendente'|'paga'|'atrasada' }>
  ) => {
    try {
      const selectedCard = cardOverride || expenseCard
      if (!selectedCard) return
      const activeStart = filtersOverride?.start ?? expStart
      const activeEnd = filtersOverride?.end ?? expEnd
      const activeCategory = filtersOverride?.category ?? expCategory
      const activeStatus = filtersOverride?.status ?? expStatus
      const activeMin = filtersOverride?.min ?? expMin
      const activeMax = filtersOverride?.max ?? expMax
      const list = await apiService.getExpenses({ type:'cartao', credit_card_id: (selectedCard.id as any), start: activeStart ? toISO(activeStart) : undefined, end: activeEnd ? toISO(activeEnd) : undefined, category: activeCategory || undefined, status: activeStatus==='all' ? undefined : activeStatus })
      const min = parseFloat(activeMin.replace(',','.'))
      const max = parseFloat(activeMax.replace(',','.'))
      let filtered: any[] = list.filter((e:any)=> (
        (isNaN(min) || Number(e.value) >= min) && (isNaN(max) || Number(e.value) <= max)
      ))
      if (filtered.length === 0) {
        try {
          const bill = await apiService.getCreditCardBill((selectedCard.id as any))
          const atual = Array.isArray(bill?.atual) ? bill.atual : []
          filtered = atual.map((e:any)=> ({
            id: e.id,
            description: e.description,
            value: Number(e.value||0),
            due_date: e.due_date,
            category: e.category||'other',
            account_id: e.account_id,
            user_id: e.user_id,
            status: e.status || 'pendente',
          }))
        } catch {}
      }
      filtered = [...filtered].sort((a:any, b:any) => parseSortableDate(b.due_date) - parseSortableDate(a.due_date))
      setExpData(filtered)
    } catch(e:any) { Alert.alert('Erro', e?.message || 'Falha ao carregar despesas') }
  }
  const openExpenseEditor = (item:any) => {
    setEditingExpense(item)
    setEditExpenseDesc(item.description || '')
    setEditExpenseAmount(String(item.value ?? '').replace('.', ','))
    setEditExpenseDate(toBR(item.due_date || ''))
    setEditExpenseCategory(item.category || '')
    setEditExpenseStatus((item.status || 'pendente') as 'pendente'|'paga'|'atrasada')
    setShowExpenseEdit(true)
  }
  const handleDeleteExpense = () => {
    const id = editingExpense?.id
    if (!id) return
    Alert.alert('Excluir despesa','Confirma a exclusão desta despesa? Esta ação não pode ser desfeita.',[
      { text:'Cancelar', style:'cancel' },
      { text:'Excluir', style:'destructive', onPress: async ()=>{
        try {
          await apiService.deleteExpense(id)
          setShowExpenseEdit(false)
          await loadCardExpenses()
          await load()
          Alert.alert('Despesas','Despesa excluída com sucesso')
        } catch(e:any) {
          Alert.alert('Erro', e?.message || 'Falha ao excluir despesa')
        }
      }}
    ])
  }
  const filtered = useMemo(() => cards.filter(c => {
    const byName = (c.card_name || '').toLowerCase().includes(query.toLowerCase())
    return byName
  }), [cards, query])

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}> 
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando cartões...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Cartões</Text>
        <View style={{width:40}} />
      </View>
      <View style={styles.actionsBar}>
        <TouchableOpacity style={[styles.actionBtn,{backgroundColor:'#10B981'}]} onPress={()=>{
          setEditingCard(null); setCardName(''); setCardBank(''); setCardBrand(''); setCardLimit(''); setCardClosing(''); setCardDue(''); setCardStatus('ativa'); setShowCardForm(true)
        }}><Text style={styles.actionBtnText}>Adicionar cartão</Text></TouchableOpacity>
      </View>
      <View style={styles.searchRow}>
        <TextInput style={styles.search} placeholder="Buscar por nome" placeholderTextColor="#999" value={query} onChangeText={setQuery} />
      </View>
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <Text style={styles.modalLabel}>Fatura do mês</Text>
        <View style={{flexDirection:'row', alignItems:'center', gap:12}}>
          <View style={{flex:1}}>
            <DateInput value={billMonth} onChange={(v)=>{ setBillMonth(v); load() }} />
          </View>
          <View style={{flexDirection:'row', alignItems:'center', gap:8}}>
            <Switch value={showNextMonth} onValueChange={setShowNextMonth} />
            <Text style={styles.metaText}>Mostrar próximo mês</Text>
          </View>
        </View>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.card_id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContainer}
        renderItem={({ item }) => {
          const meta = cardsMeta.find(c=>c.name===item.card_name)
          const brand = meta?.brand ? ` • ${meta.brand}` : ''
          const bank = meta?.bank ? ` (${meta.bank})` : ''
          return (
          <View style={[styles.cardItem, highlightCardId===item.card_id && { backgroundColor:'#E8F5E8', borderWidth:1, borderColor:'#86EFAC' }]}>
            <View style={styles.cardRowHeader}>
              <BankLogo name={`${item.card_name} ${meta?.bank ?? ''}`} size={40} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.cardName}>{item.card_name}</Text>
                <Text style={styles.metaText}>{`Cartão${brand}${bank}`}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.field}><Text style={styles.label}>Gastos do mês:</Text> <Text style={styles.value}>{fmt(item.gastos_mes)}</Text></Text>
              <Text style={styles.field}><Text style={styles.label}>Fatura atual:</Text> <Text style={styles.value}>{fmt(item.fatura_atual)}</Text></Text>
              <Text style={styles.field}><Text style={styles.label}>Fatura fechada:</Text> <Text style={styles.value}>{fmt(item.fatura_fechada_valor)}</Text> <Text style={styles.badge}>{item.fatura_fechada_status?.toUpperCase?.()}</Text></Text>
              <TouchableOpacity style={styles.addBtn} onPress={async () => {
                // Obter detalhes do cartão pelo nome
                try {
                  const all = await apiService.getCreditCards()
                  const card = all.find(c => c.name === item.card_name)
                  if (!card) { Alert.alert('Cartões','Cartão não encontrado'); return }
                  setFormCard(card)
                  setFormDesc('')
                  setFormAmount('')
                  setFormDate('')
                  setFormInstallments('1')
                  setShowForm(true)
                } catch (e) {
                  Alert.alert('Cartões','Falha ao carregar cartões')
                }
              }}>
                <Text style={styles.addBtnText}>Adicionar despesa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.addBtn,{backgroundColor:'#9333EA'}]} onPress={async()=>{
                try {
                  const all = await apiService.getCreditCards()
                  const card = all.find(c => c.name === item.card_name)
                  if (!card) { Alert.alert('Cartões','Cartão não encontrado'); return }
                  setFormCard(card)
                  const accts = await apiService.getAccounts();
                  setPayAccounts(accts)
                  setPayAccountId(accts.length ? accts[0].id : null)
                  setShowPay(true)
                } catch(e) {
                  Alert.alert('Cartões','Falha ao carregar contas/cartões')
                }
              }}>
                <Text style={styles.addBtnText}>Pagar fatura</Text>
              </TouchableOpacity>
              <View style={{flexDirection:'row', gap:8, marginTop:8, flexWrap:'wrap'}}>
                <TouchableOpacity style={[styles.smallBtn,{backgroundColor:'#111827'}]} onPress={async()=>{
                  try {
                    const all = await apiService.getCreditCards()
                    const card = all.find(c => c.name === item.card_name)
                    if (!card) { Alert.alert('Cartões','Cartão não encontrado'); return }
                    const period = await resolveCardPeriod(card)
                    setExpenseCard(card)
                    setExpStart(period.start)
                    setExpEnd(period.end)
                    await loadExpenseCategories()
                    await loadCardExpenses(card, { start: period.start, end: period.end })
                    setShowExpenses(true)
                  } catch(e:any) { Alert.alert('Erro', e?.message || 'Falha ao abrir despesas') }
                }}><Text style={styles.smallBtnText}>Ver despesas</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.smallBtn,{backgroundColor:'#0F766E'}]} onPress={async()=>{
                  try {
                    const all = await apiService.getCreditCards()
                    const card = all.find(c => c.name === item.card_name)
                    if (!card) { Alert.alert('Cartões','Cartão não encontrado'); return }
                    const period = await resolveCardPeriod(card)
                    setExpenseCard(card)
                    setExpStart(period.start)
                    setExpEnd(period.end)
                    setExpCategory('')
                    await loadExpenseCategories()
                    await loadCardExpenses(card, { start: period.start, end: period.end, category: '' })
                    setShowExpensesByCategory(true)
                  } catch(e:any) { Alert.alert('Erro', e?.message || 'Falha ao abrir despesas por categoria') }
                }}><Text style={styles.smallBtnText}>Despesas por categoria</Text></TouchableOpacity>
              
                <TouchableOpacity style={[styles.smallBtn,{backgroundColor:'#374151'}]} onPress={async()=>{
                  const meta = cardsMeta.find(c=>c.name===item.card_name)
                  if (!meta) { Alert.alert('Cartões','Cartão não encontrado'); return }
                  setEditingCard(meta); setCardName(meta.name); setCardBank(meta.bank || ''); setCardBrand(meta.brand || ''); setCardLimit(String(meta.limit_value || '')); setCardClosing(String(meta.closing_day || '')); setCardDue(String(meta.due_day || '')); setCardStatus(meta.status === 'ativo' ? 'ativa' : (meta.status || 'ativa')); setShowCardForm(true)
                }}><Text style={styles.smallBtnText}>Editar</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.smallBtn,{backgroundColor:'#EF4444'}]} onPress={async()=>{
                  const meta = cardsMeta.find(c=>c.name===item.card_name)
                  if (!meta) { Alert.alert('Cartões','Cartão não encontrado'); return }
                  Alert.alert('Excluir cartão','Confirma a exclusão?',[
                    { text:'Cancelar', style:'cancel' },
                    { text:'Excluir', style:'destructive', onPress: async ()=>{ await apiService.deleteCreditCard(meta.id as any); await load() } }
                  ])
                }}><Text style={styles.smallBtnText}>Excluir</Text></TouchableOpacity>
              </View>
            </View>
          </View>
          )
        }}
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <TouchableOpacity accessibilityLabel="Fechar" hitSlop={{top:10,left:10,bottom:10,right:10}} onPress={()=>setShowForm(false)} style={styles.modalCloseX}><Text style={{fontSize:20, fontWeight:'700'}}>×</Text></TouchableOpacity>
              <Text style={styles.modalTitle}>Nova despesa no cartão</Text>
              <Text style={styles.modalLabel}>Cartão</Text>
              <Text style={styles.modalValue}>{formCard?.name} (venc {formCard?.due_day}/ fechamento {formCard?.closing_day})</Text>
              <View style={styles.modalGroup}><Text style={styles.modalLabel}>Descrição</Text><TextInput style={styles.modalInput} value={formDesc} onChangeText={setFormDesc} placeholder="Ex: Supermercado" placeholderTextColor="#999" /></View>
              <View style={styles.modalGroup}><Text style={styles.modalLabel}>Valor</Text><TextInput style={styles.modalInput} value={formAmount} onChangeText={setFormAmount} keyboardType="numeric" placeholder="0,00" placeholderTextColor="#999" /></View>
              <View style={styles.modalGroup}><DateInput label="Data da compra" value={formDate} onChange={setFormDate} /></View>
              <View style={styles.modalGroup}><Text style={styles.modalLabel}>Parcelas</Text><TextInput style={styles.modalInput} value={formInstallments} onChangeText={setFormInstallments} keyboardType="numeric" placeholder="1" placeholderTextColor="#999" /></View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#6B7280'}]} onPress={()=>setShowForm(false)}><Text style={styles.modalBtnText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#2563EB'}]} onPress={async ()=>{
                  try {
                    if (!formCard) { Alert.alert('Cartões','Seleção de cartão ausente'); return }
                    const amount = parseFloat(formAmount.replace(',','.'))
                    if (!isFinite(amount) || amount<=0) { Alert.alert('Cartões','Informe um valor válido'); return }
                    if (!formDate) { Alert.alert('Cartões','Informe a data da compra'); return }
                    const dateOk = /^\d{2}\/\d{2}\/\d{4}$/.test(formDate)
                    if (!dateOk) { Alert.alert('Cartões','Use o formato DD/MM/AAAA'); return }
                    const parcelas = Math.max(1, parseInt(formInstallments || '1',10))
                    await apiService.createCardExpense({
                      card: formCard,
                      description: formDesc || 'Despesa do cartão',
                      amount,
                      purchase_date: formDate,
                      category: 'shopping',
                      status: 'pendente',
                      installment_total: parcelas,
                    })
                    Alert.alert('Cartões','Despesa lançada na fatura correta')
                    setShowForm(false)
                    setHighlightCardId((formCard.id as any))
                    setTimeout(()=> setHighlightCardId(null), 2000)
                    await load()
                  } catch(e:any) {
                    Alert.alert('Erro', e?.message || 'Falha ao lançar despesa')
                  }
                }}><Text style={styles.modalBtnText}>Salvar</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={showCardForm} animationType="slide" transparent>
        <View style={styles.modalBackdrop}><View style={styles.modalContainer}><View style={styles.modalCard}>
          <TouchableOpacity accessibilityLabel="Fechar" hitSlop={{top:10,left:10,bottom:10,right:10}} onPress={()=> setShowCardForm(false)} style={styles.modalCloseX}><Text style={{fontSize:20, fontWeight:'700'}}>×</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>{editingCard ? 'Editar cartão' : 'Novo cartão'}</Text>
          <View style={styles.modalGroup}><Text style={styles.modalLabel}>Nome</Text><TextInput style={styles.modalInput} value={cardName} onChangeText={setCardName} placeholder="Ex: Nubank" placeholderTextColor="#999" /></View>
          <View style={styles.modalGroup}><Text style={styles.modalLabel}>Banco</Text><TextInput style={styles.modalInput} value={cardBank} onChangeText={setCardBank} placeholder="Ex: Nubank" placeholderTextColor="#999" /></View>
          <View style={styles.modalGroup}><Text style={styles.modalLabel}>Bandeira</Text><TextInput style={styles.modalInput} value={cardBrand} onChangeText={setCardBrand} placeholder="Visa/Master" placeholderTextColor="#999" /></View>
          <View style={styles.modalGroup}><Text style={styles.modalLabel}>Limite</Text><TextInput style={styles.modalInput} value={cardLimit} onChangeText={setCardLimit} placeholder="0,00" placeholderTextColor="#999" keyboardType="numeric" /></View>
          <View style={{flexDirection:'row', gap:8}}>
            <View style={{flex:1}}><Text style={styles.modalLabel}>Fechamento</Text><TextInput style={styles.modalInput} value={cardClosing} onChangeText={setCardClosing} placeholder="dia" placeholderTextColor="#999" keyboardType="numeric" /></View>
            <View style={{flex:1}}><Text style={styles.modalLabel}>Vencimento</Text><TextInput style={styles.modalInput} value={cardDue} onChangeText={setCardDue} placeholder="dia" placeholderTextColor="#999" keyboardType="numeric" /></View>
          </View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#6B7280'}]} onPress={()=> setShowCardForm(false)}><Text style={styles.modalBtnText}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#2563EB'}]} onPress={async()=>{
              try {
                const payload = {
                  name: cardName.trim(), bank: cardBank.trim(), brand: cardBrand.trim(),
                  limit_value: parseFloat(cardLimit.replace(',','.')) || 0,
                  closing_day: parseInt(cardClosing||'0',10), due_day: parseInt(cardDue||'0',10), status: cardStatus
                }
                if (!payload.name || !payload.closing_day || !payload.due_day) { Alert.alert('Cartões','Preencha nome/fechamento/vencimento'); return }
                if (editingCard) await apiService.updateCreditCard((editingCard.id as any), payload)
                else await apiService.createCreditCard(payload)
                Alert.alert('Cartões','Cartão salvo')
                setShowCardForm(false); await load()
              } catch(e:any) { Alert.alert('Erro', e?.message || 'Falha ao salvar cartão') }
            }}><Text style={styles.modalBtnText}>Salvar</Text></TouchableOpacity>
          </View>
        </View></View></View>
      </Modal>

      <Modal visible={showExpenses} animationType="slide" transparent>
        <View style={styles.modalBackdrop}><View style={[styles.modalContainer,{maxHeight:'85%'}]}><View style={styles.modalCard}>
          <TouchableOpacity accessibilityLabel="Fechar" hitSlop={{top:10,left:10,bottom:10,right:10}} onPress={()=> setShowExpenses(false)} style={styles.modalCloseX}><Text style={{fontSize:20, fontWeight:'700'}}>×</Text></TouchableOpacity>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Despesas do cartão</Text>
            <View style={{flexDirection:'row', gap:8}}>
              <View style={{flex:1}}><DateInput label="Início" value={expStart} onChange={setExpStart} /></View>
              <View style={{flex:1}}><DateInput label="Fim" value={expEnd} onChange={setExpEnd} /></View>
            </View>
            <View style={{flexDirection:'row', gap:8, marginTop:8}}>
              <View style={{flex:1}}><Text style={styles.modalLabel}>Min</Text><TextInput style={styles.modalInput} value={expMin} onChangeText={setExpMin} keyboardType="numeric" placeholder="0,00" placeholderTextColor="#999" /></View>
              <View style={{flex:1}}><Text style={styles.modalLabel}>Max</Text><TextInput style={styles.modalInput} value={expMax} onChangeText={setExpMax} keyboardType="numeric" placeholder="0,00" placeholderTextColor="#999" /></View>
            </View>
            <View style={{marginTop:8}}>
              <Text style={styles.modalLabel}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                <TouchableOpacity style={[styles.filterChip, !expCategory && styles.filterChipActive]} onPress={()=> setExpCategory('')}>
                  <Text style={[styles.filterChipText, !expCategory && styles.filterChipTextActive]}>TODAS</Text>
                </TouchableOpacity>
                {expenseCategories.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.filterChip, expCategory===cat && styles.filterChipActive]} onPress={()=> setExpCategory(cat)}>
                    <Text style={[styles.filterChipText, expCategory===cat && styles.filterChipTextActive]}>{cat.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View style={{flexDirection:'row', gap:8, marginTop:8}}>
              {(['all','pendente','paga','atrasada'] as const).map(st=> (
                <TouchableOpacity key={st} style={[styles.smallBtn,{backgroundColor: expStatus===st ? '#2563EB' : '#E5E7EB'}]} onPress={()=> setExpStatus(st)}>
                  <Text style={[styles.smallBtnText,{color: expStatus===st ? '#fff' : '#111'}]}>{st.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#2563EB'}]} onPress={loadCardExpenses}><Text style={styles.modalBtnText}>Aplicar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#6B7280'}]} onPress={()=> setShowExpenses(false)}><Text style={styles.modalBtnText}>Fechar</Text></TouchableOpacity>
            </View>
            <ScrollView nestedScrollEnabled style={{maxHeight:320}} contentContainerStyle={{paddingBottom:8}}>
              <View style={{flexDirection:'row', paddingVertical:6}}>
                <Text style={{flex:2, fontWeight:'700'}}>Descrição</Text>
                <Text style={{flex:1, fontWeight:'700'}}>Data</Text>
                <Text style={{width:90, fontWeight:'700', textAlign:'right'}}>Valor</Text>
              </View>
              {expData.map((item) => (
                <View key={`e-${item.id}`} style={styles.expenseRow}>
                  <View style={{flex:1}}>
                    <Text style={{fontWeight:'600'}}>{item.description}</Text>
                    <Text style={styles.metaText}>{item.category || 'other'} • {item.status || 'pendente'}</Text>
                  </View>
                  <View style={{marginLeft:8}}>
                    <Text>{toBR(item.due_date)}</Text>
                    <Text style={{textAlign:'right'}}>R$ {Number(item.value).toLocaleString('pt-BR',{minimumFractionDigits:2})}</Text>
                  </View>
                  <TouchableOpacity style={[styles.smallBtn,{backgroundColor:'#374151', marginLeft:8}]} onPress={()=> openExpenseEditor(item)}>
                    <Text style={styles.smallBtnText}>Editar</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </ScrollView>
        </View></View></View>
      </Modal>

      <Modal visible={showExpensesByCategory} animationType="slide" transparent>
        <View style={styles.modalBackdrop}><View style={[styles.modalContainer,{maxHeight:'85%'}]}><View style={styles.modalCard}>
          <TouchableOpacity accessibilityLabel="Fechar" hitSlop={{top:10,left:10,bottom:10,right:10}} onPress={()=> setShowExpensesByCategory(false)} style={styles.modalCloseX}><Text style={{fontSize:20, fontWeight:'700'}}>×</Text></TouchableOpacity>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Despesas por categoria</Text>
            <Text style={styles.modalValue}>{expenseCard?.name || ''}</Text>
            <View style={{flexDirection:'row', gap:8}}>
              <View style={{flex:1}}><DateInput label="Início" value={expStart} onChange={setExpStart} /></View>
              <View style={{flex:1}}><DateInput label="Fim" value={expEnd} onChange={setExpEnd} /></View>
            </View>
            <View style={{flexDirection:'row', gap:8, marginTop:8}}>
              <View style={{flex:1}}><Text style={styles.modalLabel}>Min</Text><TextInput style={styles.modalInput} value={expMin} onChangeText={setExpMin} keyboardType="numeric" placeholder="0,00" placeholderTextColor="#999" /></View>
              <View style={{flex:1}}><Text style={styles.modalLabel}>Max</Text><TextInput style={styles.modalInput} value={expMax} onChangeText={setExpMax} keyboardType="numeric" placeholder="0,00" placeholderTextColor="#999" /></View>
            </View>
            <View style={{flexDirection:'row', gap:8, marginTop:8, flexWrap:'wrap'}}>
              {(['all','pendente','paga','atrasada'] as const).map(st=> (
                <TouchableOpacity key={st} style={[styles.smallBtn,{backgroundColor: expStatus===st ? '#2563EB' : '#E5E7EB'}]} onPress={()=> setExpStatus(st)}>
                  <Text style={[styles.smallBtnText,{color: expStatus===st ? '#fff' : '#111'}]}>{st.toUpperCase()}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#2563EB'}]} onPress={()=> loadCardExpenses(undefined, { category: '' })}><Text style={styles.modalBtnText}>Aplicar</Text></TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#6B7280'}]} onPress={()=> setShowExpensesByCategory(false)}><Text style={styles.modalBtnText}>Fechar</Text></TouchableOpacity>
            </View>
            {groupExpensesByCategory.length === 0 ? (
              <Text style={styles.emptyStateText}>Nenhuma despesa encontrada para os filtros informados.</Text>
            ) : (
              groupExpensesByCategory.map(([cat,total]:any)=>{
                const totalAll = expData.reduce((s:any,x:any)=>s+Number(x.value||0),0)
                const widthPct = totalAll ? Math.min(100, Math.round((Number(total)/totalAll)*100)) : 0
                return (
                  <View key={cat} style={styles.categorySummaryCard}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', marginBottom:6}}>
                      <Text style={styles.categorySummaryTitle}>{cat}</Text>
                      <Text style={styles.categorySummaryValue}>R$ {Number(total).toLocaleString('pt-BR',{minimumFractionDigits:2})}</Text>
                    </View>
                    <View style={styles.categoryBarTrack}>
                      <View style={[styles.categoryBarFill,{width:`${widthPct}%`}]} />
                    </View>
                  </View>
                )
              })
            )}
          </ScrollView>
        </View></View></View>
      </Modal>

      <Modal visible={showExpenseEdit} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <TouchableOpacity accessibilityLabel="Fechar" hitSlop={{top:10,left:10,bottom:10,right:10}} onPress={()=> setShowExpenseEdit(false)} style={styles.modalCloseX}><Text style={{fontSize:20, fontWeight:'700'}}>×</Text></TouchableOpacity>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                style={{maxHeight:420}}
                contentContainerStyle={{paddingBottom:8}}
              >
              <Text style={styles.modalTitle}>Editar despesa</Text>
              <View style={styles.modalGroup}><Text style={styles.modalLabel}>Descrição</Text><TextInput style={styles.modalInput} value={editExpenseDesc} onChangeText={setEditExpenseDesc} placeholder="Descrição" placeholderTextColor="#999" /></View>
              <View style={styles.modalGroup}><Text style={styles.modalLabel}>Valor</Text><TextInput style={styles.modalInput} value={editExpenseAmount} onChangeText={setEditExpenseAmount} keyboardType="numeric" placeholder="0,00" placeholderTextColor="#999" /></View>
              <View style={styles.modalGroup}><DateInput label="Data" value={editExpenseDate} onChange={setEditExpenseDate} /></View>
              <View style={styles.modalGroup}>
                <Text style={styles.modalLabel}>Categoria</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
                  {expenseCategories.map(cat => (
                    <TouchableOpacity key={cat} style={[styles.filterChip, editExpenseCategory===cat && styles.filterChipActive]} onPress={()=> setEditExpenseCategory(cat)}>
                      <Text style={[styles.filterChipText, editExpenseCategory===cat && styles.filterChipTextActive]}>{cat.toUpperCase()}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TextInput style={[styles.modalInput,{marginTop:8}]} value={editExpenseCategory} onChangeText={setEditExpenseCategory} placeholder="Categoria" placeholderTextColor="#999" />
              </View>
              <View style={{flexDirection:'row', gap:8, marginTop:8}}>
                {(['pendente','paga','atrasada'] as const).map(st=> (
                  <TouchableOpacity key={st} style={[styles.smallBtn,{backgroundColor: editExpenseStatus===st ? '#2563EB' : '#E5E7EB'}]} onPress={()=> setEditExpenseStatus(st)}>
                    <Text style={[styles.smallBtnText,{color: editExpenseStatus===st ? '#fff' : '#111'}]}>{st.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              </ScrollView>
              <View style={styles.modalActionsSpread}>
                <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#EF4444'}]} onPress={handleDeleteExpense}><Text style={styles.modalBtnText}>Excluir</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#6B7280'}]} onPress={()=>setShowExpenseEdit(false)}><Text style={styles.modalBtnText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#2563EB'}]} onPress={async()=>{
                  try {
                    if (!editingExpense?.id) return
                    const amount = parseFloat(editExpenseAmount.replace(',','.'))
                    if (!editExpenseDesc.trim()) { Alert.alert('Despesas','Informe a descrição'); return }
                    if (!isFinite(amount) || amount <= 0) { Alert.alert('Despesas','Informe um valor válido'); return }
                    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(editExpenseDate)) { Alert.alert('Despesas','Use a data no formato DD/MM/AAAA'); return }
                    await apiService.updateExpense(editingExpense.id, {
                      description: editExpenseDesc.trim(),
                      value: amount as any,
                      due_date: toISO(editExpenseDate) as any,
                      category: editExpenseCategory.trim() || 'other',
                      status: editExpenseStatus as any,
                    })
                    setShowExpenseEdit(false)
                    await loadCardExpenses()
                    await load()
                    Alert.alert('Despesas','Despesa atualizada com sucesso')
                  } catch(e:any) {
                    Alert.alert('Erro', e?.message || 'Falha ao editar despesa')
                  }
                }}><Text style={styles.modalBtnText}>Salvar</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal visible={showBills} animationType="slide" transparent>
        <View style={styles.modalBackdrop}><View style={[styles.modalContainer,{maxHeight:'85%'}]}><View style={styles.modalCard}>
          <TouchableOpacity accessibilityLabel="Fechar" hitSlop={{top:10,left:10,bottom:10,right:10}} onPress={()=> setShowBills(false)} style={styles.modalCloseX}><Text style={{fontSize:20, fontWeight:'700'}}>×</Text></TouchableOpacity>
          <Text style={styles.modalTitle}>Faturas em aberto</Text>
          <Text style={styles.modalValue}>{billsCard?.name}</Text>
          <View style={{marginBottom:8}}>
            <Text style={styles.modalLabel}>Atual ({billsPeriods?.atual?.start_date} a {billsPeriods?.atual?.end_date})</Text>
            <View style={{flexDirection:'row', paddingVertical:6}}>
              <Text style={{flex:2, fontWeight:'700'}}>Descrição</Text>
              <Text style={{flex:1, fontWeight:'700'}}>Vencimento</Text>
              <Text style={{width:90, fontWeight:'700', textAlign:'right'}}>Valor</Text>
            </View>
            <View style={{maxHeight:240}}>
              <FlatList
                data={billsAtual}
                keyExtractor={(_,i)=>`a-${i}`}
                initialNumToRender={20}
                windowSize={5}
                renderItem={({item})=> (
                  <View style={{flexDirection:'row', paddingVertical:6, borderTopWidth:1, borderTopColor:'#eee'}}>
                    <Text style={{flex:2}}>{item.description}</Text>
                    <Text style={{flex:1}}>{item.due_date}</Text>
                    <Text style={{width:90, textAlign:'right'}}>R$ {Number(item.value).toLocaleString('pt-BR',{minimumFractionDigits:2})}</Text>
                  </View>
                )}
              />
            </View>
            <Text style={{textAlign:'right', fontWeight:'700'}}>Total: R$ {Number(billsAtualTotal).toLocaleString('pt-BR',{minimumFractionDigits:2})}</Text>
          </View>

          <View style={{marginTop:12}}>
            <Text style={styles.modalLabel}>Próxima ({billsPeriods?.proxima?.start_date} a {billsPeriods?.proxima?.end_date})</Text>
            <View style={{flexDirection:'row', paddingVertical:6}}>
              <Text style={{flex:2, fontWeight:'700'}}>Descrição</Text>
              <Text style={{flex:1, fontWeight:'700'}}>Vencimento</Text>
              <Text style={{width:90, fontWeight:'700', textAlign:'right'}}>Valor</Text>
            </View>
            <View style={{maxHeight:240}}>
              <FlatList
                data={billsProxima}
                keyExtractor={(_,i)=>`p-${i}`}
                initialNumToRender={20}
                windowSize={5}
                renderItem={({item})=> (
                  <View style={{flexDirection:'row', paddingVertical:6, borderTopWidth:1, borderTopColor:'#eee'}}>
                    <Text style={{flex:2}}>{item.description}</Text>
                    <Text style={{flex:1}}>{item.due_date}</Text>
                    <Text style={{width:90, textAlign:'right'}}>R$ {Number(item.value).toLocaleString('pt-BR',{minimumFractionDigits:2})}</Text>
                  </View>
                )}
              />
            </View>
            <Text style={{textAlign:'right', fontWeight:'700'}}>Total: R$ {Number(billsProximaTotal).toLocaleString('pt-BR',{minimumFractionDigits:2})}</Text>
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#6B7280'}]} onPress={()=> setShowBills(false)}><Text style={styles.modalBtnText}>Fechar</Text></TouchableOpacity>
          </View>
        </View></View></View>
      </Modal>

      <Modal visible={showPay} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <TouchableOpacity accessibilityLabel="Fechar" hitSlop={{top:10,left:10,bottom:10,right:10}} onPress={()=>setShowPay(false)} style={styles.modalCloseX}><Text style={{fontSize:20, fontWeight:'700'}}>×</Text></TouchableOpacity>
              <Text style={styles.modalTitle}>Pagamento de fatura</Text>
              <Text style={styles.modalLabel}>Cartão</Text>
              <Text style={styles.modalValue}>{formCard?.name}</Text>
              <Text style={styles.modalLabel}>Conta</Text>
              <View style={{flexDirection:'row', flexWrap:'wrap', gap:8}}>
                {payAccounts.map(acc => (
                  <TouchableOpacity key={acc.id} style={[styles.accountChip, payAccountId===acc.id && styles.accountChipActive]} onPress={()=>setPayAccountId(acc.id)}>
                    <Text style={[styles.accountChipText, payAccountId===acc.id && styles.accountChipTextActive]}>{acc.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#6B7280'}]} onPress={()=>setShowPay(false)}><Text style={styles.modalBtnText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#2563EB'}]} onPress={async()=>{
                  try {
                    if (!formCard || !payAccountId) { Alert.alert('Cartões','Selecione uma conta'); return }
                    await apiService.payCreditCardBill(formCard.id, { account_id: payAccountId, is_full_payment: true })
                    Alert.alert('Cartões','Fatura paga com sucesso')
                    setShowPay(false)
                    await load()
                  } catch(e:any) { Alert.alert('Erro', e?.message || 'Falha ao pagar fatura') }
                }}><Text style={styles.modalBtnText}>Pagar</Text></TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

  const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  listContainer: { padding: 16, paddingBottom: 32 },
  searchRow: { paddingHorizontal: 16, marginTop: 12 },
  search: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, fontSize: 16, backgroundColor: '#f9f9f9', color: '#111' },
  statusRow: { flexDirection: 'row', marginTop: 8, gap: 8 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#ddd', color: '#555' },
  statusChipActive: { backgroundColor: '#E5E7EB', borderColor: '#bbb', color: '#111', fontWeight: '700' },
  cardItem: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12, elevation: 2 },
  cardRowHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardName: { fontSize: 18, fontWeight: '600' },
  metaText: { fontSize: 12, color: '#666', marginTop: 2 },
  field: { fontSize: 14, marginBottom: 4 },
  label: { color: '#666' },
  value: { fontWeight: '700', color: '#333' },
  badge: { marginLeft: 6, fontWeight: '700', color: '#2563eb' },
  addBtn: { marginTop: 8, backgroundColor: '#10B981', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, alignSelf: 'flex-start' },
  addBtnText: { color: '#fff', fontWeight: '700' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 8, color: '#666' }
  ,modalBackdrop: { flex:1, backgroundColor: '#0006', alignItems:'center', justifyContent:'center' },
  modalContainer: { width:'100%', paddingHorizontal:16 },
  modalCard: { backgroundColor:'#fff', borderRadius:12, padding:16 },
  modalTitle: { fontSize:18, fontWeight:'700', marginBottom:8 },
  modalGroup: { marginTop:8 },
  modalLabel: { fontSize:12, color:'#555' },
  modalInput: { borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:10, fontSize:14, backgroundColor:'#f9f9f9', color:'#111' },
  modalValue: { fontSize:14, fontWeight:'600', color:'#333', marginBottom:6 },
  modalActions: { flexDirection:'row', justifyContent:'flex-end', gap:8, marginTop:12 },
  modalActionsSpread: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', gap:8, marginTop:12 },
  modalBtn: { paddingVertical:10, paddingHorizontal:14, borderRadius:8 },
  modalBtnText: { color:'#fff', fontWeight:'700' }
  ,accountChip: { borderWidth:1, borderColor:'#ddd', borderRadius:999, paddingHorizontal:12, paddingVertical:6 },
  accountChipActive: { backgroundColor:'#E5E7EB', borderColor:'#bbb' },
  accountChipText: { color:'#111' },
  accountChipTextActive: { fontWeight:'700' }
  ,actionsBar:{ paddingHorizontal:16, paddingBottom:8 },
  actionBtn:{ paddingVertical:10, borderRadius:8, alignItems:'center', backgroundColor:'#2563EB' },
  actionBtnText:{ color:'#fff', fontWeight:'700' },
  smallBtn:{ paddingHorizontal:10, paddingVertical:8, borderRadius:8 },
  smallBtnText:{ color:'#fff', fontWeight:'700' },
  modalCloseX: { position:'absolute', top:8, right:8, zIndex:10, elevation:10, width:32, height:32, borderRadius:16, backgroundColor:'#F9FAFB', borderWidth:1, borderColor:'#E5E7EB', alignItems:'center', justifyContent:'center' },
  categoryScroll:{ gap:8, paddingVertical:6, paddingRight:12 },
  filterChip:{ paddingHorizontal:10, paddingVertical:8, borderRadius:999, borderWidth:1, borderColor:'#D1D5DB', backgroundColor:'#F9FAFB' },
  filterChipActive:{ backgroundColor:'#DBEAFE', borderColor:'#2563EB' },
  filterChipText:{ color:'#374151', fontWeight:'600', fontSize:12 },
  filterChipTextActive:{ color:'#1D4ED8' },
  expenseRow:{ flexDirection:'row', alignItems:'center', paddingVertical:8, borderTopWidth:1, borderTopColor:'#eee' },
  emptyStateText:{ color:'#6B7280', textAlign:'center', marginTop:16, marginBottom:8 },
  categorySummaryCard:{ backgroundColor:'#F9FAFB', borderWidth:1, borderColor:'#E5E7EB', borderRadius:10, padding:12, marginTop:10 },
  categorySummaryTitle:{ fontSize:15, fontWeight:'700', color:'#111827' },
  categorySummaryValue:{ fontSize:14, fontWeight:'700', color:'#111827' },
  categoryBarTrack:{ height:10, backgroundColor:'#E5E7EB', borderRadius:999, overflow:'hidden' },
  categoryBarFill:{ height:'100%', backgroundColor:'#2563EB', borderRadius:999 }
})
