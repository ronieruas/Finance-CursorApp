import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  RefreshControl,
  ActivityIndicator,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { apiService, Income } from '../services/api';
import DateInput from '../components/DateInput'

export const IncomesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadIncomes();
    }, [])
  );

  // Recarregar dados quando a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadIncomes();
    }, [])
  );

  React.useEffect(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
    setStart(fmt(first));
    setEnd(fmt(last));
  }, []);

  const loadIncomes = async () => {
    try {
      setLoading(true);
      const toISO = (s: string) => {
        if (!s) return undefined;
        const m = s.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/);
        if (m) {
          const d = Number(m[1]);
          const mo = Number(m[2]);
          const y = Number(m[3]);
          const dt = new Date(y, mo - 1, d);
          if (!isNaN(dt.getTime())) return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        }
        return s;
      };
      const data = await apiService.getIncomes({
        start: toISO(start) || undefined,
        end: toISO(end) || undefined,
      });
      setIncomes(data);
    } catch (error) {
      console.error('Erro ao carregar receitas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as receitas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadIncomes();
    setRefreshing(false);
  };

  const handleCreateIncome = () => {
    navigation.navigate('IncomeForm' as never, {} as never);
  };

  const handleEditIncome = (income: Income) => {
    navigation.navigate('IncomeForm' as never, { incomeId: String(income.id) } as never);
  };

  const handleDeleteIncome = async (income: Income) => {
    try {
      await apiService.deleteIncome(income.id);
      loadIncomes(); // Recarregar a lista
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível excluir a receita');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      salary: 'briefcase-outline',
      freelance: 'hammer-outline',
      investment: 'trending-up-outline',
      bonus: 'gift-outline',
      rental: 'home-outline',
      business: 'briefcase-outline',
      other: 'cash-outline'
    };
    return icons[category] || 'cash-outline';
  };

  const renderIncomeItem = ({ item }: { item: Income }) => (
    <View style={styles.incomeItem}>
      <View style={styles.incomeIcon}>
        <Ionicons
          name={getCategoryIcon(item.category || 'other') as any}
          size={24}
          color="#34C759"
        />
      </View>
      
      <View style={styles.incomeInfo}>
        <Text style={styles.incomeDescription}>{item.description}</Text>
        <Text style={styles.incomeCategory}>{item.category}</Text>
        <Text style={styles.incomeDate}>{formatDate(item.date)}</Text>
      </View>
      
      <View style={styles.incomeActions}>
        <Text style={styles.incomeAmount}>
          {formatCurrency(Number(item.value))}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditIncome(item)}
          >
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteIncome(item)}
          >
            <Ionicons name="trash" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trending-up-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>Nenhuma receita encontrada</Text>
      <Text style={styles.emptyStateSubtitle}>
        Comece adicionando sua primeira receita
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={handleCreateIncome}
      >
        <Text style={styles.emptyStateButtonText}>Adicionar Receita</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Receitas</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando receitas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={{padding:8}} onPress={()=> (navigation as any).goBack?.()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Receitas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateIncome}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <DateInput label="Início" value={start} onChange={setStart} />
        <DateInput label="Fim" value={end} onChange={setEnd} />
        <TouchableOpacity style={styles.applyButton} onPress={loadIncomes}><Text style={styles.applyText}>Filtrar</Text></TouchableOpacity>
      </View>

      <FlatList
        data={incomes}
        renderItem={renderIncomeItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={incomes.length === 0 ? styles.emptyContainer : styles.listContainer}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  addButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  listContainer: {
    padding: 20,
  },
  filterRow: { paddingHorizontal: 20, marginTop: 8 },
  filterInput: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 10, fontSize: 14, backgroundColor: '#f9f9f9', color: '#111', marginBottom: 8 },
  applyButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, alignSelf: 'flex-start' },
  applyText: { color: '#fff', fontWeight: '700' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  incomeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  incomeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  incomeInfo: {
    flex: 1,
  },
  incomeDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  incomeCategory: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  incomeDate: {
    fontSize: 12,
    color: '#999999',
  },
  incomeActions: {
    alignItems: 'flex-end',
  },
  incomeAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#34C759',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#E3F2FD',
  },
  deleteButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FFEBEE',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyStateButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
