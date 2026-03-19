import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { useBackendAuth } from '../contexts/BackendAuthContext';
import { apiService } from '../services/api';

export const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [apiBase, setApiBase] = useState(apiService.getBaseURL());
  const [testing, setTesting] = useState(false);
  
  const { signIn, signUp } = useBackendAuth();

  const handleSubmit = async () => {
    console.log('handleSubmit chamado', { email, password, name, isSignUp });
    
    if (!email || !password || (isSignUp && !name)) {
      console.log('Campos obrigatórios não preenchidos');
      Alert.alert('Erro', 'Por favor, preencha todos os campos');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        console.log('Chamando signUp com:', { name, email, password });
        await signUp(name, email, password);
        Alert.alert('Sucesso', 'Conta criada com sucesso!');
      } else {
        console.log('Chamando signIn com:', { email, password });
        await signIn(email, password);
      }
    } catch (error: any) {
      console.error('Erro no handleSubmit:', error);
      Alert.alert('Erro', error.message);
    } finally {
      setLoading(false);
    }
  };

  const saveApiBase = async () => {
    try {
      await apiService.setBaseURL(apiBase);
      Alert.alert('Configuração', 'Base da API atualizada');
    } catch (e: any) {
      Alert.alert('Configuração', e?.message || 'Falha ao salvar base');
    }
  };

  const testApi = async () => {
    setTesting(true);
    try {
      const res = await apiService.health();
      Alert.alert('API', `OK: ${res?.status || 'ok'}`);
    } catch (e: any) {
      Alert.alert('API', e?.message || 'Falha ao testar API');
    }
    setTesting(false);
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.formContainer}>
          <Text style={styles.title}>
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </Text>
          <Text style={styles.subtitle}>
            Gerencie suas finanças de forma inteligente
          </Text>

          {isSignUp && (
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nome</Text>
              <TextInput
                style={styles.input}
                placeholder="Seu nome"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="seu@email.com"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <TextInput
              style={styles.input}
              placeholder="Sua senha"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Carregando...' : (isSignUp ? 'Criar Conta' : 'Entrar')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchButton}
            onPress={() => setIsSignUp(!isSignUp)}
          >
            <Text style={styles.switchText}>
              {isSignUp 
                ? 'Já tem uma conta? Faça login' 
                : 'Não tem conta? Cadastre-se'
              }
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.advancedToggle} onPress={()=> setShowAdvanced(!showAdvanced)}>
            <Text style={styles.advancedText}>{showAdvanced ? 'Ocultar configuração avançada' : 'Configurar API'}</Text>
          </TouchableOpacity>

          {showAdvanced && (
            <View style={styles.advancedContainer}>
              <Text style={styles.label}>Base da API</Text>
              <TextInput
                style={styles.input}
                placeholder={Platform.OS === 'android' ? 'http://192.168.0.142:3001' : 'http://localhost:3001'}
                placeholderTextColor="#999"
                value={apiBase}
                onChangeText={setApiBase}
                autoCapitalize="none"
              />
              <View style={{flexDirection:'row', gap:12}}>
                <TouchableOpacity style={[styles.button,{flex:1}]} onPress={saveApiBase}>
                  <Text style={styles.buttonText}>Salvar base</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button,{flex:1, backgroundColor:'#10B981'}]} onPress={testApi} disabled={testing}>
                  <Text style={styles.buttonText}>{testing ? 'Testando...' : 'Testar API'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    color: '#111',
  },
  fieldGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#555',
    marginBottom: 6,
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
  },
  switchText: {
    textAlign: 'center',
    color: '#007AFF',
    fontSize: 16,
  },
  advancedToggle: {
    marginTop: 16,
  },
  advancedText: {
    textAlign: 'center',
    color: '#007AFF',
    fontSize: 14,
  },
  advancedContainer: {
    marginTop: 16,
  }
});
