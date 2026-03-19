import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, TextInput, Modal, Alert, KeyboardAvoidingView, Platform } from 'react-native'
import { apiService } from '../services/api'
import { useNavigation } from '@react-navigation/native'
import DateInput from '../components/DateInput'

export const TransfersScreen: React.FC = () => {
  const navigation = useNavigation()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [accounts, setAccounts] = useState<any[]>([])
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [fromId, setFromId] = useState<number | 'terceiros' | null>(null)
  const [toId, setToId] = useState<number | 'terceiros' | null>(null)
  const [desc, setDesc] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [newFromId, setNewFromId] = useState<number | 'terceiros' | null>(null)
  const [newToId, setNewToId] = useState<number | 'terceiros' | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newValue, setNewValue] = useState('')
  const [newDesc, setNewDesc] = useState('')

  const load = async () => {
    try {
      setLoading(true)
      const data = await apiService.getTransfers({ start: start ? iso(start) : undefined, end: end ? iso(end) : undefined, from_account_id: fromId || undefined, to_account_id: toId || undefined, description: desc || undefined })
      setItems(Array.isArray(data) ? data : [])
    } finally { setLoading(false) }
  }
  useEffect(()=>{ load() },[])
  useEffect(()=>{ (async()=>{ try { const ac = await apiService.getAccounts(); setAccounts(ac) } catch {} })() },[])

  const iso = (s: string) => {
    const m = s.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/)
    if (m) return `${m[3]}-${m[2]}-${m[1]}`
    return s
  }

  if (loading) return (
    <SafeAreaView style={styles.container}><View style={styles.loading}><ActivityIndicator size="large" /><Text>Carregando transferências...</Text></View></SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={()=>navigation.goBack()} style={{padding:8}}><Text style={{fontSize:18}}>‹</Text></TouchableOpacity>
        <Text style={styles.title}>Transferências</Text>
        <TouchableOpacity onPress={()=>{
          setNewFromId(null); setNewToId(null); setNewDate(''); setNewValue(''); setNewDesc(''); setShowAdd(true)
        }} style={{padding:8}}>
          <Text style={{fontSize:14, color:'#2563EB'}}>Adicionar</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.filters}>
        <DateInput label="Início" value={start} onChange={setStart} />
        <DateInput label="Fim" value={end} onChange={setEnd} />
        <View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:8}}>
          <Text style={styles.filterLabel}>Origem</Text>
          <TouchableOpacity style={[styles.chip, fromId==='terceiros' && styles.chipActive]} onPress={()=>setFromId('terceiros')}><Text style={[styles.chipText, fromId==='terceiros' && styles.chipTextActive]}>Terceiros</Text></TouchableOpacity>
          {accounts.map(a=> (
            <TouchableOpacity key={`f-${a.id}`} style={[styles.chip, fromId===a.id && styles.chipActive]} onPress={()=>setFromId(a.id)}><Text style={[styles.chipText, fromId===a.id && styles.chipTextActive]}>{a.name}</Text></TouchableOpacity>
          ))}
        </View>
        <View style={{flexDirection:'row', flexWrap:'wrap', gap:8, marginTop:8}}>
          <Text style={styles.filterLabel}>Destino</Text>
          <TouchableOpacity style={[styles.chip, toId==='terceiros' && styles.chipActive]} onPress={()=>setToId('terceiros')}><Text style={[styles.chipText, toId==='terceiros' && styles.chipTextActive]}>Terceiros</Text></TouchableOpacity>
          {accounts.map(a=> (
            <TouchableOpacity key={`t-${a.id}`} style={[styles.chip, toId===a.id && styles.chipActive]} onPress={()=>setToId(a.id)}><Text style={[styles.chipText, toId===a.id && styles.chipTextActive]}>{a.name}</Text></TouchableOpacity>
          ))}
        </View>
        <TextInput style={styles.input} placeholder="Descrição" placeholderTextColor="#999" value={desc} onChangeText={setDesc} />
        <TouchableOpacity style={styles.applyBtn} onPress={load}><Text style={styles.applyBtnText}>Aplicar filtros</Text></TouchableOpacity>
      </View>
      <FlatList data={items} keyExtractor={(item)=>String(item.id)} contentContainerStyle={{padding:16}}
        renderItem={({item})=> (
          <View style={styles.card}><Text style={styles.label}>{item.description}</Text><Text style={styles.value}>R$ {Number(item.value).toLocaleString('pt-BR',{minimumFractionDigits:2})}</Text></View>
        )}
      />

      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS==='ios' ? 'padding' : undefined} style={styles.modalContainer}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Nova transferência</Text>
              <Text style={styles.modalLabel}>Origem</Text>
              <View style={{flexDirection:'row', flexWrap:'wrap', gap:8}}>
                <TouchableOpacity style={[styles.chip, newFromId==='terceiros' && styles.chipActive]} onPress={()=>setNewFromId('terceiros')}><Text style={[styles.chipText, newFromId==='terceiros' && styles.chipTextActive]}>Terceiros</Text></TouchableOpacity>
                {accounts.map(a=> (
                  <TouchableOpacity key={`nf-${a.id}`} style={[styles.chip, newFromId===a.id && styles.chipActive]} onPress={()=>setNewFromId(a.id)}><Text style={[styles.chipText, newFromId===a.id && styles.chipTextActive]}>{a.name}</Text></TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.modalLabel,{marginTop:8}]}>Destino</Text>
              <View style={{flexDirection:'row', flexWrap:'wrap', gap:8}}>
                <TouchableOpacity style={[styles.chip, newToId==='terceiros' && styles.chipActive]} onPress={()=>setNewToId('terceiros')}><Text style={[styles.chipText, newToId==='terceiros' && styles.chipTextActive]}>Terceiros</Text></TouchableOpacity>
                {accounts.map(a=> (
                  <TouchableOpacity key={`nt-${a.id}`} style={[styles.chip, newToId===a.id && styles.chipActive]} onPress={()=>setNewToId(a.id)}><Text style={[styles.chipText, newToId===a.id && styles.chipTextActive]}>{a.name}</Text></TouchableOpacity>
                ))}
              </View>
              <View style={styles.modalGroup}><DateInput label="Data" value={newDate} onChange={setNewDate} /></View>
              <View style={styles.modalGroup}><Text style={styles.modalLabel}>Valor</Text><TextInput style={styles.modalInput} placeholder="0,00" placeholderTextColor="#999" keyboardType="numeric" value={newValue} onChangeText={setNewValue} /></View>
              <View style={styles.modalGroup}><Text style={styles.modalLabel}>Descrição</Text><TextInput style={styles.modalInput} placeholder="Ex: transferência" placeholderTextColor="#999" value={newDesc} onChangeText={setNewDesc} /></View>
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#6B7280'}]} onPress={()=>setShowAdd(false)}><Text style={styles.modalBtnText}>Cancelar</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn,{backgroundColor:'#2563EB'}]} onPress={async()=>{
                  try {
                    const v = parseFloat(newValue.replace(',','.'))
                    if (!isFinite(v) || v<=0) { Alert.alert('Transferências','Informe um valor válido'); return }
                    if (!newDate || !/^\d{2}\/\d{2}\/\d{4}$/.test(newDate)) { Alert.alert('Transferências','Informe a data no formato DD/MM/AAAA'); return }
                    if (!newFromId && !newToId) { Alert.alert('Transferências','Selecione origem ou destino'); return }
                    const payload:any = { value: v, description: newDesc, date: iso(newDate) }
                    if (newFromId && newFromId !== 'terceiros') payload.from_account_id = newFromId
                    if (newToId && newToId !== 'terceiros') payload.to_account_id = newToId
                    const res = await apiService.createTransfer(payload)
                    Alert.alert('Transferências','Transferência registrada')
                    setShowAdd(false)
                    await load()
                  } catch(e:any) { Alert.alert('Erro', e?.message || 'Falha ao registrar transferência') }
                }}><Text style={styles.modalBtnText}>Salvar</Text></TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container:{flex:1, backgroundColor:'#F2F2F7'},
  header:{flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, backgroundColor:'#fff', borderBottomWidth:1, borderBottomColor:'#eee'},
  title:{fontSize:20, fontWeight:'bold'},
  loading:{flex:1, alignItems:'center', justifyContent:'center'},
  card:{backgroundColor:'#fff', borderRadius:12, padding:16, marginBottom:12},
  label:{color:'#666'},
  value:{fontWeight:'700', color:'#333'},
  filters:{backgroundColor:'#fff', padding:16, borderBottomWidth:1, borderBottomColor:'#eee'},
  input:{borderWidth:1, borderColor:'#ddd', borderRadius:8, paddingHorizontal:12, paddingVertical:8, fontSize:14, backgroundColor:'#f9f9f9', color:'#111', marginTop:8},
  filterLabel:{fontSize:12, color:'#555', marginRight:8, alignSelf:'center'},
  chip:{borderWidth:1, borderColor:'#ddd', borderRadius:999, paddingHorizontal:12, paddingVertical:6},
  chipActive:{backgroundColor:'#E5E7EB', borderColor:'#bbb'},
  chipText:{color:'#111'},
  chipTextActive:{fontWeight:'700'},
  applyBtn:{marginTop:8, backgroundColor:'#2563EB', paddingVertical:10, borderRadius:8, alignItems:'center'},
  applyBtnText:{color:'#fff', fontWeight:'700'},
  modalBackdrop:{flex:1, backgroundColor:'#0006', alignItems:'center', justifyContent:'center'},
  modalContainer:{width:'100%', paddingHorizontal:16},
  modalCard:{backgroundColor:'#fff', borderRadius:12, padding:16},
  modalTitle:{fontSize:18, fontWeight:'700', marginBottom:8},
  modalLabel:{fontSize:12, color:'#555'},
  modalGroup:{marginTop:8},
  modalInput:{borderWidth:1, borderColor:'#ddd', borderRadius:8, padding:10, fontSize:14, backgroundColor:'#f9f9f9', color:'#111'},
  modalActions:{flexDirection:'row', justifyContent:'flex-end', gap:8, marginTop:12},
  modalBtn:{paddingVertical:10, paddingHorizontal:14, borderRadius:8},
  modalBtnText:{color:'#fff', fontWeight:'700'}
})
