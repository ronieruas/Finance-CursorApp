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
import { apiService, Income, Account } from '../services/api';
import DateInput from '../components/DateInput'

interface RouteParams {
  income?: Income;
}

export const IncomeFormScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { income } = (route.params as RouteParams) || {};
  
  const [description, setDescription] = useState(income?.description || '');
  const [amount, setAmount] = useState(income?.value?.toString() || '');
  const [category, setCategory] = useState((income as any)?.category || 'other');
  const [date, setDate] = useState(
    income?.date ? new Date(income.date).toISOString().split('T')[0] : 
    new Date().toISOString().split('T')[0]
  );
  const [accountId, setAccountId] = useState((income?.account_id as any) || '');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  const isEditing = !!income;

  const categories = [
    { value: 'salary', label: 'Salário', icon: 'briefcase-outline' },
    { value: 'freelance', label: 'Freelance', icon: 'laptop-outline' },
    { value: 'investment', label: 'Investimento', icon: 'trending-up-outline' },
    { value: 'bonus', label: 'Bônus', icon: 'gift-outline' },
    { value: 'rental', label: 'Aluguel', icon: 'home-outline' },
    { value: 'business', label: 'Negócio', icon: 'storefront-outline' },
    { value: 'other', label: 'Outros', icon: 'cash-outline' }
  ];

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const data = await apiService.getAccounts();
      setAccounts(data);
      
      // Se não há conta selecionada e há contas disponíveis, selecionar a primeira
      if (!accountId && data.length > 0) {
        setAccountId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as contas');
    }
  };

  const handleSave = async () => {
    if (!description.trim()) {
      Alert.alert('Erro', 'Por favor, informe a descrição da receita');
      return;
    }

    if (!amount || parseFloat(amount.replace(',', '.')) <= 0) {
      Alert.alert('Erro', 'Por favor, informe um valor válido');
      return;
    }

    if (!accountId) {
      Alert.alert('Erro', 'Por favor, selecione uma conta');
      return;
    }

    const incomeAmount = parseFloat(amount.replace(',', '.'));
    const toISO = (s: string) => {
      const m = s.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      return s;
    };

    try {
      setLoading(true);
      
      const updatePayload = {
        description: description.trim(),
        value: incomeAmount,
        date: toISO(date),
        account_id: Number(accountId),
        category,
      } as any;

      if (isEditing) {
        await apiService.updateIncome(income.id, updatePayload);
        Alert.alert('Sucesso', 'Receita atualizada com sucesso');
      } else {
        await apiService.createIncome({
          description: description.trim(),
          amount: incomeAmount,
          category,
          date: toISO(date),
          accountId: Number(accountId),
        });
        Alert.alert('Sucesso', 'Receita criada com sucesso');
      }

      navigation.goBack();
    } catch (error) {
      console.error('Erro ao salvar receita:', error);
      Alert.alert(
        'Erro',
        isEditing 
          ? 'Não foi possível atualizar a receita'
          : 'Não foi possível criar a receita'
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
            {isEditing ? 'Editar Receita' : 'Nova Receita'}
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
            <Text style={styles.sectionTitle}>Informações da Receita</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Descrição *</Text>
              <TextInput
                style={styles.input}
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Salário mensal"
                placeholderTextColor="#999999"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Valor *</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={(text) => setAmount(formatCurrency(text))}
                placeholder="0,00"
                placeholderTextColor="#999999"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <DateInput label="Data" value={date} onChange={setDate} />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Categoria</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categorySelector}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.value}
                      style={[
                        styles.categoryOption,
                        category === cat.value && styles.categoryOptionSelected
                      ]}
                      onPress={() => setCategory(cat.value)}
                    >
                      <Ionicons
                        name={cat.icon as any}
                        size={20}
                        color={category === cat.value ? '#FFFFFF' : '#34C759'}
                      />
                      <Text
                        style={[
                          styles.categoryOptionText,
                          category === cat.value && styles.categoryOptionTextSelected
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Conta *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.accountSelector}>
                  {accounts.map((account) => (
                    <TouchableOpacity
                      key={account.id}
                      style={[
                        styles.accountOption,
                        accountId === account.id && styles.accountOptionSelected
                      ]}
                      onPress={() => setAccountId(account.id)}
                    >
                      <Text
                        style={[
                          styles.accountOptionText,
                          accountId === account.id && styles.accountOptionTextSelected
                        ]}
                      >
                        {account.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
              {accounts.length === 0 && (
                <Text style={styles.noAccountsText}>
                  Nenhuma conta encontrada. Crie uma conta primeiro.
                </Text>
              )}
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
  categorySelector: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34C759',
    backgroundColor: '#FFFFFF',
  },
  categoryOptionSelected: {
    backgroundColor: '#34C759',
    borderColor: '#34C759',
  },
  categoryOptionText: {
    fontSize: 14,
    color: '#34C759',
    marginLeft: 6,
  },
  categoryOptionTextSelected: {
    color: '#FFFFFF',
  },
  accountSelector: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  accountOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
    backgroundColor: '#FFFFFF',
  },
  accountOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  accountOptionText: {
    fontSize: 14,
    color: '#007AFF',
  },
  accountOptionTextSelected: {
    color: '#FFFFFF',
  },
  noAccountsText: {
    fontSize: 14,
    color: '#FF3B30',
    fontStyle: 'italic',
    marginTop: 8,
  },
});
