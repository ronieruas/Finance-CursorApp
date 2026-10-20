import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Modal, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { apiService } from '../services/api'
import DateInput from '../components/DateInput'
import { BackButton } from '../components/BackButton'

export const BudgetsScreen: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<'geral'|'cartao'>('geral')
  const [creditCardId, setCreditCardId] = useState<number | null>(null)
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [planned, setPlanned] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const data = await apiService.getBudgets()
      setItems(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])
  useEffect(()=>{ (async()=>{ try { const c = await apiService.getCreditCards(); setCards(c) } catch{} })() },[])

  // Percentual utilizado do orçamento (pode passar de 100%)
  const getUsage = (item: any) => {
    const plannedValue = Number(item.planned_value || 0)
    const used = Number(item.utilizado || 0)
    const pct = plannedValue > 0 ? (used / plannedValue) * 100 : 0
    return { plannedValue, used, pct }
  }

  const totalPlanned = items.reduce((s, x) => s + Number(x.planned_value || 0), 0)
  const totalUsed = items.reduce((s, x) => s + Number(x.utilizado || 0), 0)

  if (loading) return (
    <SafeAreaView style={styles.container}><View style={styles.loading}><ActivityIndicator size="large" /><Text>Carregando orçamentos...</Text></View></SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>Orçamentos</Text>
        <TouchableOpacity onPress={()=>{ setEditing(null); setName(''); setType('geral'); setCreditCardId(null); setStart(''); setEnd(''); setPlanned(''); setShowForm(true) }} style={{padding:8}}>
          <Text style={{fontSize:14, color:'#2563EB'}}>Adicionar</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item)=>String(item.id)}
        contentContainerStyle={{padding:16, paddingBottom:32}}
        ListEmptyComponent={<Text style={styles.emptyText}>Nenhum orçamento cadastrado</Text>}
        renderItem={({item})=> {
          const { plannedValue, used, pct } = getUsage(item)
          const barWidth = Math.min(100, pct)
          const overLimit = pct > 100
          return (
            <View style={styles.card}>
              <Text style={styles.label}>{item.name} {item.type==='cartao' && item.credit_card?.name ? `• ${item.credit_card.name}` : ''}</Text>
              <Text style={styles.value}>R$ {plannedValue.toLocaleString('pt-BR',{minimumFractionDigits:2})}</Text>
              <View style={{marginTop:8}}>
                <View style={styles.progressHeader}>
                  <Text style={{fontSize:12, color:'#555'}}>Utilizado</Text>
                  <Text style={[styles.progressPercent, overLimit && styles.progressPercentOver]}>{Math.round(pct)}%</Text>
                </View>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width:`${barWidth}%`, backgroundColor: overLimit ? '#DC2626' : '#2563EB' }]} />
                </View>
                <Text style={{fontSize:12, color:'#333', marginTop:4}}>R$ {used.toLocaleString('pt-BR',{minimumFractionDigits:2})} de R$ {plannedValue.toLocaleString('pt-BR',{minimumFractionDigits:2})}</Text>
              </View>
              <View style={{flexDirection:'row', gap:8, marginTop:8}}>
                <TouchableOpacity style={[styles.smallBtn,{backgroundColor:'#374151'}]} onPress={()=>{
                  setEditing(item); setName(item.name||''); setType(item.type||'geral'); setCreditCardId(item.credit_card_id||null); setStart(item.period_start ? item.period_start.split('-').reverse().join('/') : ''); setEnd(item.period_end ? item.period_end.split('-').reverse().join('/') : ''); setPlanned(String(item.planned_value||'')); setShowForm(true)
                }}><Text style={styles.smallBtnText}>Editar</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.smallBtn,{backgroundColor:'#EF4444'}]} onPress={()=>{
                  Alert.alert('Excluir orçamento','Confirma a exclusão?',[
                    { text:'Cancelar', style:'cancel' },
                    { text:'Excluir', style:'destructive', onPress: async ()=>{ await apiService.deleteBudget(item.id); await load() } }
                  ])
                }}><Text style={styles.smallBtnText}>Excluir</Text></TouchableOpacity>
              </View>
            </View>
          )
        }}
        ListFooterComponent={
          items.length === 0 ? null : (
            <View style={styles.reportSection}>
              <Text style={styles.reportTitle}>Relatórios</Text>
              <View style={styles.reportCard}>
                <Text style={styles.reportLabel}>Total planejado</Text>
                <Text style={styles.reportValue}>R$ {totalPlanned.toLocaleString('pt-BR',{minimumFractionDigits:2})}</Text>
                <Text style={[styles.reportLabel, { marginTop:8 }]}>Total utilizado</Text>
                <Text style={styles.reportValue}>R$ {totalUsed.toLocaleString('pt-BR',{minimumFractionDigits:2})}</Text>
                <View style={{marginTop:12}}>
                  {items.map((b)=>{
                    const { pct } = getUsage(b)
                    const overLimit = pct > 100
                    return (
                      <View key={b.id} style={{marginVertical:6}}>
                        <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                          <Text style={{flex:1}}>{b.name}</Text>
                          <Text style={[styles.progressPercent, overLimit && styles.progressPercentOver]}>
                            {Math.round(pct)}%
                          </Text>
                        </View>
                        <View style={styles.progressTrack}>
                          <View style={[styles.progressFill, { width:`${Math.min(100, pct)}%`, backgroundColor: overLimit ? '#DC2626' : '#10B981' }]} />
                        </View>
                      </View>
                    )
                  })}
                </View>
              </View>
            </View>
          )
        }
      />

      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalBackdrop}><View style={[styles.modalContainer,{maxHeight:'85%'}]}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>{editing ? 'Editar orçamento' : 'Novo orçamento'}</Text>
          <View style={styles.modalGroup}><Text style={styles.modalLabel}>Nome</Text><TextInput style={styles.modalInput} value={name} onChangeText={setName} placeholder="Ex: Alimentação" placeholderTextColor="#999" /></View>
          <View style={{flexDirection:'row', gap:8, marginTop:8}}>
            {(['geral','cartao'] as const).map(t=> (
              <TouchableOpacity key={t} style={[styles.typeChip, type===t && styles.typeChipActive]} onPress={()=> setType(t)}><Text style={[styles.typeChipText, type===t && styles.typeChipTextActive]}>{t.toUpperCase()}</Text></TouchableOpacity>
            ))}
          </View>
          {type==='cartao' && (
            <View style={{marginTop:8}}>
              <Text style={styles.modalLabel}>Cartão</Text>
              <View style={{flexDirection:'row', flexWrap:'wrap', gap:8}}>
                {cards.map(c=> (
                  <TouchableOpacity key={c.id} style={[styles.cardChip, creditCardId===c.id && styles.cardChipActive]} onPress={()=> setCreditCardId(c.id)}><Text style={[styles.cardChipText, creditCardId===c.id && styles.cardChipTextActive]}>{c.name}</Text></TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <View style={{flexDirection:'row', gap:8}}>
            <View style={{flex:1}}><DateInput label="Início" value={start} onChange={setStart} /></View>
            <View style={{flex:1}}><DateInput label="Fim" value={end} onChange={setEnd} /></View>
          </View>
          <View style={styles.modalGroup}><Text style={styles.modalLabel}>Valor planejado</Text><TextInput style={styles.modalInput} value={planned} onChangeText={setPlanned} keyboardType="numeric" placeholder="0,00" placeholderTextColor="#999" /></View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#6B7280'}]} onPress={()=> setShowForm(false)}><Text style={styles.modalBtnText}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#2563EB'}]} onPress={async()=>{
              try {
                const toISO = (s:string)=>{ const m=s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/); if(m) return `${m[3]}-${m[2]}-${m[1]}`; return s }
                if (!name.trim()) { Alert.alert('Orçamentos','Informe o nome'); return }
                if (!start || !end || !/^\d{2}\/\d{2}\/\d{4}$/.test(start) || !/^\d{2}\/\d{2}\/\d{4}$/.test(end)) { Alert.alert('Orçamentos','Informe datas válidas'); return }
                const payload:any = { name: name.trim(), type, credit_card_id: type==='cartao' ? creditCardId : undefined, period_start: toISO(start), period_end: toISO(end), planned_value: parseFloat(planned.replace(',','.')) || 0 }
                if (editing) await apiService.updateBudget(editing.id, payload)
                else await apiService.createBudget(payload)
                Alert.alert('Orçamentos','Orçamento salvo')
                setShowForm(false); await load()
              } catch(e:any) { Alert.alert('Erro', e?.message || 'Falha ao salvar orçamento') }
            }}><Text style={styles.modalBtnText}>Salvar</Text></TouchableOpacity>
          </View>
        </View></View></View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:'#F2F2F7'},
  header:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingVertical:14, backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:'#eee'},
  title:{fontSize:20, fontWeight:'bold'},
  loading:{flex:1, alignItems:'center', justifyContent:'center'},
  emptyText:{textAlign:'center', color:'#6B7280', marginTop:24},
  card:{backgroundColor:'#fff', borderRadius:12, padding:16, marginBottom:12},
  label:{color:'#666'},
  value:{fontWeight:'700', color:'#333'},
  progressHeader:{flexDirection:'row', justifyContent:'space-between', alignItems:'center'},
  progressPercent:{fontSize:12, fontWeight:'700', color:'#333'},
  progressPercentOver:{color:'#DC2626'},
  progressTrack:{height:10, backgroundColor:'#E5E7EB', borderRadius:999, overflow:'hidden'},
  progressFill:{height:10, borderRadius:999},
  smallBtn:{ paddingHorizontal:10, paddingVertical:8, borderRadius:8 },
  smallBtnText:{ color:'#fff', fontWeight:'700' },
  reportSection:{marginTop:8},
  reportTitle:{fontSize:16, fontWeight:'700', marginBottom:8},
  reportCard:{backgroundColor:'#fff', borderRadius:12, padding:12},
  reportLabel:{fontSize:12, color:'#555'},
  reportValue:{fontSize:14, fontWeight:'700', color:'#333'},
  modalBackdrop:{flex:1, backgroundColor:'#0006', alignItems:'center', justifyContent:'center'},
  modalContainer:{width:'100%', paddingHorizontal:16},
  modalCard:{backgroundColor:'#fff', borderRadius:12, padding:16},
  modalTitle:{fontSize:18, fontWeight:'700', marginBottom:8},
  modalGroup:{marginTop:8},
  modalLabel:{fontSize:12, color:'#555'},
  modalInput:{borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:10, fontSize:14, backgroundColor:'#f9f9f9', color:'#111'},
  modalActions:{flexDirection:'row', justifyContent:'flex-end', gap:8, marginTop:12},
  modalBtn:{paddingVertical:10, paddingHorizontal:14, borderRadius:8},
  modalBtnText:{color:'#fff', fontWeight:'700'},
  typeChip:{ paddingHorizontal:12, paddingVertical:6, borderWidth:1, borderColor:'#ddd', borderRadius:999 },
  typeChipActive:{ backgroundColor:'#E5E7EB', borderColor:'#bbb' },
  typeChipText:{ color:'#111' },
  typeChipTextActive:{ fontWeight:'700' },
  cardChip:{ borderWidth:1, borderColor:'#ddd', borderRadius:999, paddingHorizontal:12, paddingVertical:6 },
  cardChipActive:{ backgroundColor:'#E5E7EB', borderColor:'#bbb' },
  cardChipText:{ color:'#111' },
  cardChipTextActive:{ fontWeight:'700' }
})
