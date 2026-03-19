import React, { useEffect, useMemo, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Platform } from 'react-native'

interface Props {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
}

function parseBR(s: string): Date | null {
  const m = s.match(/^([0-9]{2})\/(\d{2})\/(\d{4})$/)
  if (!m) return null
  const d = Number(m[1]); const mo = Number(m[2]); const y = Number(m[3])
  const dt = new Date(y, mo - 1, d)
  if (isNaN(dt.getTime())) return null
  return dt
}

function parseISO(s: string): Date | null {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const y = Number(m[1]); const mo = Number(m[2]); const d = Number(m[3])
  const dt = new Date(y, mo - 1, d)
  if (isNaN(dt.getTime())) return null
  return dt
}

function fmtBR(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear())
  return `${dd}/${mm}/${yy}`
}

export const DateInput: React.FC<Props> = ({ value, onChange, placeholder = 'DD/MM/AAAA', label }) => {
  const [show, setShow] = useState(false)
  const [text, setText] = useState(() => {
    const iso = parseISO(value)
    const br = parseBR(value)
    if (br) return fmtBR(br)
    if (iso) return fmtBR(iso)
    return value || ''
  })
  const [error, setError] = useState('')
  const baseDate = useMemo(()=> parseBR(value) || parseISO(value) || new Date(), [value])
  const [month, setMonth] = useState(baseDate.getMonth())
  const [year, setYear] = useState(baseDate.getFullYear())
  const [selected, setSelected] = useState<Date | null>(parseBR(value) || parseISO(value))

  useEffect(()=>{
    const iso = parseISO(value)
    const br = parseBR(value)
    if (br) setText(fmtBR(br))
    else if (iso) setText(fmtBR(iso))
    else setText(value || '')
  }, [value])

  const daysGrid = useMemo(()=>{
    const first = new Date(year, month, 1)
    const startWeekday = first.getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const arr: Array<{ day: number | null; date?: Date }> = []
    for (let i=0;i<startWeekday;i++) arr.push({ day: null })
    for (let d=1; d<=daysInMonth; d++) {
      arr.push({ day: d, date: new Date(year, month, d) })
    }
    return arr
  }, [month, year])

  const validateText = (s: string) => {
    if (!s) { setError(''); return }
    const ok = /^\d{2}\/\d{2}\/\d{4}$/.test(s) && !!parseBR(s)
    setError(ok ? '' : 'Data inválida. Use DD/MM/AAAA')
  }

  const onPick = (d: Date) => {
    setSelected(d)
    const v = fmtBR(d)
    setText(v)
    setError('')
    onChange(v)
    setShow(false)
  }

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View style={styles.row}>
        <TextInput
          accessibilityLabel={label || 'Campo de data'}
          style={styles.input}
          value={text}
          onChangeText={(s)=>{ setText(s); validateText(s); if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) onChange(s) }}
          placeholder={placeholder}
          placeholderTextColor="#999"
          keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
        />
        <TouchableOpacity accessibilityLabel="Abrir calendário" style={styles.iconBtn} onPress={()=> setShow(true)}>
          <Text style={styles.iconText}>📅</Text>
        </TouchableOpacity>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal visible={show} animationType="fade" transparent>
        <View style={styles.backdrop}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity accessibilityLabel="Mês anterior" onPress={()=>{
                let m = month - 1; let y = year
                if (m < 0) { m = 11; y -= 1 }
                setMonth(m); setYear(y)
              }}><Text style={styles.navText}>‹</Text></TouchableOpacity>
              <Text style={styles.monthText}>{String(month+1).padStart(2,'0')}/{year}</Text>
              <TouchableOpacity accessibilityLabel="Próximo mês" onPress={()=>{
                let m = month + 1; let y = year
                if (m > 11) { m = 0; y += 1 }
                setMonth(m); setYear(y)
              }}><Text style={styles.navText}>›</Text></TouchableOpacity>
            </View>
            <View style={styles.grid}>
              {daysGrid.map((cell, idx)=> (
                <TouchableOpacity
                  key={idx}
                  accessibilityLabel={cell.day ? `Dia ${cell.day}` : 'Vazio'}
                  disabled={!cell.day}
                  style={[styles.day, selected && cell.date && selected.toDateString()===cell.date.toDateString() && styles.daySelected, !cell.day && styles.dayEmpty]}
                  onPress={()=> cell.date && onPick(cell.date)}
                >
                  <Text style={styles.dayText}>{cell.day ? String(cell.day) : ''}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity accessibilityLabel="Limpar" style={[styles.closeBtn,{backgroundColor:'#EF4444'}]} onPress={()=>{ setSelected(null); setText(''); setError(''); onChange(''); setShow(false) }}><Text style={styles.closeText}>Limpar</Text></TouchableOpacity>
              <TouchableOpacity accessibilityLabel="Hoje" style={[styles.closeBtn,{backgroundColor:'#10B981'}]} onPress={()=> onPick(new Date())}><Text style={styles.closeText}>Hoje</Text></TouchableOpacity>
              <TouchableOpacity accessibilityLabel="Fechar" style={styles.closeBtn} onPress={()=> setShow(false)}><Text style={styles.closeText}>Fechar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { marginTop: 8 },
  label: { fontSize: 12, color: '#555', marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, backgroundColor: '#f9f9f9', color: '#111' },
  iconBtn: { paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, backgroundColor: '#fff' },
  iconText: { fontSize: 16 },
  error: { color: '#B91C1C', fontSize: 12, marginTop: 4 },
  backdrop: { flex: 1, backgroundColor: '#0006', alignItems: 'center', justifyContent: 'center' },
  modal: { width: '90%', backgroundColor: '#fff', borderRadius: 12, padding: 12 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  monthText: { fontSize: 16, fontWeight: '700', color: '#111' },
  navText: { fontSize: 20, color: '#111' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8, marginVertical: 2 },
  daySelected: { backgroundColor: '#2563EB' },
  dayEmpty: { opacity: 0 },
  dayText: { color: '#111' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  closeBtn: { paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#6B7280', borderRadius: 8 },
  closeText: { color: '#fff', fontWeight: '700' },
})

export default DateInput
