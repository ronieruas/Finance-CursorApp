import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useBackendAuth } from '../contexts/BackendAuthContext'
import { apiService } from '../services/api'

export const ProfileScreen: React.FC = () => {
  const { user, signOut } = useBackendAuth()
  const [apiBase, setApiBase] = useState(apiService.getBaseURL())
  const [pinging, setPinging] = useState(false)
  const [pingText, setPingText] = useState('')
  const [curPwd, setCurPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)

  useEffect(() => { setApiBase(apiService.getBaseURL()) }, [])

  const save = async () => {
    await apiService.setBaseURL(apiBase)
    Alert.alert('Configuração', 'Base da API atualizada')
  }

  const testHealth = async () => {
    setPinging(true)
    setPingText('')
    try {
      const res = await apiService.health()
      setPingText(`OK: ${res?.status}`)
    } catch (e: any) {
      setPingText(`Falha: ${e?.message || 'erro'}`)
    }
    setPinging(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Configurações</Text></View>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.label}>Usuário</Text>
          <Text style={styles.value}>{user?.name} ({user?.email})</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Base da API</Text>
          <TextInput
            style={styles.input}
            placeholder="http://10.0.2.2:3001"
            placeholderTextColor="#999"
            value={apiBase}
            onChangeText={setApiBase}
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={save}><Text style={styles.buttonText}>Salvar</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.button, { backgroundColor: '#10B981' }]} onPress={testHealth} disabled={pinging}>
            {pinging ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Testar API</Text>}
          </TouchableOpacity>
          {pingText ? <Text style={{ marginTop: 8, color: pingText.startsWith('OK') ? '#065f46' : '#b91c1c' }}>{pingText}</Text> : null}
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Alterar Senha</Text>
          <TextInput style={styles.input} placeholder="Senha atual" placeholderTextColor="#999" secureTextEntry value={curPwd} onChangeText={setCurPwd} />
          <TextInput style={styles.input} placeholder="Nova senha" placeholderTextColor="#999" secureTextEntry value={newPwd} onChangeText={setNewPwd} />
          <TouchableOpacity style={[styles.button,{ backgroundColor: '#F59E0B' }]} disabled={savingPwd} onPress={async()=>{
            try {
              setSavingPwd(true)
              await apiService.changePassword(curPwd, newPwd)
              Alert.alert('Senha','Senha alterada com sucesso')
              setCurPwd(''); setNewPwd('')
            } catch(e:any) {
              Alert.alert('Senha', e?.message || 'Falha ao alterar senha')
            } finally { setSavingPwd(false) }
          }}>
            {savingPwd ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Salvar nova senha</Text>}
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={[styles.button, { backgroundColor: '#EF4444' }]} onPress={signOut}><Text style={styles.buttonText}>Sair</Text></TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: { paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E5EA' },
  title: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  content: { padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 2 },
  label: { fontSize: 14, color: '#666', marginBottom: 6 },
  value: { fontSize: 13, fontWeight: '600', color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 12, fontSize: 16, backgroundColor: '#f9f9f9', color: '#111' },
  button: { marginTop: 12, backgroundColor: '#007AFF', padding: 12, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
})
