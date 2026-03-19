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
import { apiService, Expense } from '../services/api';
import DateInput from '../components/DateInput'

export const ExpensesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState<'all'|'pendente'|'paga'|'atrasada'>('all');

  useFocusEffect(
    React.useCallback(() => {
      loadExpenses();
    }, [])
  );

  React.useEffect(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth()+1, 0);
    const fmt = (d: Date) => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
    setStart(fmt(first));
    setEnd(fmt(last));
  }, []);

  // Recarregar dados quando a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadExpenses();
    }, [])
  );

  const loadExpenses = async () => {
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
      const data = await apiService.getExpenses({
        start: toISO(start) || undefined,
        end: toISO(end) || undefined,
        category: category || undefined,
        status: status === 'all' ? undefined : status,
        type: 'conta',
      });
      setExpenses(data);
    } catch (error) {
      console.error('Erro ao carregar despesas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as despesas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadExpenses();
    setRefreshing(false);
  };

  const handleCreateExpense = () => {
    navigation.navigate('ExpenseForm' as never, {} as never);
  };

  const handleEditExpense = (expense: Expense) => {
    (navigation as any).navigate('ExpenseForm', { expense });
  };

  const handleDeleteExpense = async (expense: Expense) => {
    Alert.alert('Excluir despesa','Confirma a exclusão?',[
      { text:'Cancelar', style:'cancel' },
      { text:'Excluir', style:'destructive', onPress: async ()=>{
        try {
          await apiService.deleteExpense(expense.id);
          Alert.alert('Sucesso','Despesa excluída');
          loadExpenses();
        } catch (error) {
          Alert.alert('Erro', 'Não foi possível excluir a despesa');
        }
      }}
    ])
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const m = dateString.match(/^\d{2}\/\d{2}\/\d{4}$/);
    if (m) return dateString;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-BR');
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      food: 'restaurant-outline',
      transport: 'car-outline',
      health: 'medkit-outline',
      entertainment: 'game-controller-outline',
      shopping: 'cart-outline',
      bills: 'receipt-outline',
      education: 'school-outline',
      other: 'ellipsis-horizontal-outline'
    };
    return icons[category] || 'cash-outline';
  };

  const renderExpenseItem = ({ item }: { item: Expense }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseIcon}>
        <Ionicons
          name={getCategoryIcon(item.category) as any}
          size={24}
          color="#FF3B30"
        />
      </View>
      
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseDescription}>{item.description}</Text>
        <Text style={styles.expenseCategory}>{item.category}</Text>
        <Text style={styles.expenseDate}>{formatDate(item.due_date)}</Text>
      </View>
      
      <View style={styles.expenseActions}>
        <Text style={styles.expenseAmount}>
          {formatCurrency(item.value)}
        </Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => handleEditExpense(item)}
          >
            <Ionicons name="pencil" size={16} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteExpense(item)}
          >
            <Ionicons name="trash" size={16} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="receipt-outline" size={64} color="#CCCCCC" />
      <Text style={styles.emptyStateTitle}>Nenhuma despesa encontrada</Text>
      <Text style={styles.emptyStateSubtitle}>
        Comece adicionando sua primeira despesa
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={handleCreateExpense}
      >
        <Text style={styles.emptyStateButtonText}>Adicionar Despesa</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Despesas</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando despesas...</Text>
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
        <Text style={styles.title}>Despesas</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleCreateExpense}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        <DateInput label="Início" value={start} onChange={setStart} />
        <DateInput label="Fim" value={end} onChange={setEnd} />
        <TextInput
          style={styles.filterInput}
          placeholder="Categoria"
          placeholderTextColor="#999"
          value={category}
          onChangeText={setCategory}
        />
        <View style={styles.statusRow}>
          {(['all','pendente','paga','atrasada'] as const).map((opt) => (
            <Text key={opt} style={[styles.statusChip, status===opt && styles.statusChipActive]} onPress={() => setStatus(opt)}>
              {opt.toUpperCase()}
            </Text>
          ))}
        </View>
        <TouchableOpacity style={styles.applyButton} onPress={loadExpenses}><Text style={styles.applyText}>Filtrar</Text></TouchableOpacity>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total filtrado</Text>
          <Text style={styles.summaryTotal}>{formatCurrency(expenses.reduce((s:any,e:any)=> s + Number(e.amount ?? e.value ?? 0),0))}</Text>
          <Text style={styles.summarySub}>{expenses.length} itens</Text>
        </View>
      </View>

      <FlatList
        data={expenses}
        renderItem={renderExpenseItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={expenses.length === 0 ? styles.emptyContainer : styles.listContainer}
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
  summaryCard: { marginTop: 8, backgroundColor:'#fff', borderRadius:12, padding:12, borderWidth:1, borderColor:'#eee' },
  summaryLabel: { fontSize:12, color:'#555' },
  summaryTotal: { fontSize:18, fontWeight:'700', color:'#111' },
  summarySub: { fontSize:12, color:'#777' },
  statusRow: { flexDirection: 'row', marginBottom: 8, gap: 8 },
  statusChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#ddd', color: '#555' },
  statusChipActive: { backgroundColor: '#E5E7EB', borderColor: '#bbb', color: '#111', fontWeight: '700' },
  applyButton: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, alignSelf: 'flex-start' },
  applyText: { color: '#fff', fontWeight: '700' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  expenseItem: {
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
  expenseIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  expenseDate: {
    fontSize: 12,
    color: '#999999',
  },
  expenseActions: {
    alignItems: 'flex-end',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF3B30',
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
