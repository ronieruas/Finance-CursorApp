import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiService, Account } from '../services/api';

interface RouteParams {
  account?: Account;
}

export const AccountFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { account } = (route.params as RouteParams) || {};
  
  const [name, setName] = useState(account?.name || '');
  const [type, setType] = useState(account?.type || 'checking');
  const [description, setDescription] = useState(account?.description || '');
  const [initialBalance, setInitialBalance] = useState(
    account?.balance?.toString() || '0'
  );
  const [loading, setLoading] = useState(false);

  const isEditing = !!account;

  const accountTypes = [
    { value: 'checking', label: 'Conta Corrente', icon: 'card-outline' },
    { value: 'savings', label: 'Poupança', icon: 'wallet-outline' },
    { value: 'investment', label: 'Investimento', icon: 'trending-up-outline' },
    { value: 'other', label: 'Outro', icon: 'cash-outline' }
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erro', 'Por favor, informe o nome da conta');
      return;
    }

    const balance = parseFloat(initialBalance.replace(',', '.')) || 0;

    try {
      setLoading(true);
      
      const backendType = type === 'checking' ? 'corrente' : type === 'savings' ? 'poupanca' : type === 'investment' ? 'investimento' : 'corrente';
      const accountData = {
        name: name.trim(),
        type: backendType,
        description: description.trim(),
        balance
      };

      if (isEditing) {
        await apiService.updateAccount(account.id, accountData);
        Alert.alert('Sucesso', 'Conta atualizada com sucesso');
      } else {
        await apiService.createAccount(accountData);
        Alert.alert('Sucesso', 'Conta criada com sucesso');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar conta:', error);
      Alert.alert(
        'Erro',
        isEditing 
          ? 'Não foi possível atualizar a conta'
          : 'Não foi possível criar a conta'
      );
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (text: string) => {
    // Remove caracteres não numéricos exceto vírgula e ponto
    const cleanText = text.replace(/[^\d,.-]/g, '');
    return cleanText;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing ? 'Editar Conta' : 'Nova Conta'}
          </Text>
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informações Básicas</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome da Conta *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Conta Corrente Banco do Brasil"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tipo de Conta</Text>
              <View style={styles.typeSelector}>
                {accountTypes.map((accountType) => (
                  <TouchableOpacity
                    key={accountType.value}
                    style={[
                      styles.typeOption,
                      type === accountType.value && styles.typeOptionSelected
                    ]}
                    onPress={() => setType(accountType.value)}
                  >
                    <Ionicons
                      name={accountType.icon as any}
                      size={20}
                      color={type === accountType.value ? '#FFFFFF' : '#007AFF'}
                    />
                    <Text
                      style={[
                        styles.typeOptionText,
                        type === accountType.value && styles.typeOptionTextSelected
                      ]}
                    >
                      {accountType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Saldo Inicial</Text>
              <TextInput
                style={styles.input}
                value={initialBalance}
                onChangeText={(text) => setInitialBalance(formatCurrency(text))}
                placeholder="0,00"
                placeholderTextColor="#999999"
                keyboardType="numeric"
              />
              <Text style={styles.inputHint}>
                Informe o saldo atual da conta
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição (Opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Adicione uma descrição para esta conta..."
                placeholderTextColor="#999999"
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#111111',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  typeOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeOptionText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
  },
  typeOptionTextSelected: {
    color: '#FFFFFF',
  },
});