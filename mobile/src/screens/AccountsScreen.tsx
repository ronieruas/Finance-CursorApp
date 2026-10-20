import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { apiService, Account } from '../services/api';
import { useBackendAuth } from '../contexts/BackendAuthContext';
import { BackButton } from '../components/BackButton';
import { BankLogo } from '../components/BankLogo';
import DateInput from '../components/DateInput';

type ExtratoItem = { tipo: string; id: number; descricao: string; valor: number; data: string; categoria: string };

export const AccountsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useBackendAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Extrato
  const [extratoConta, setExtratoConta] = useState<Account | null>(null);
  const [extrato, setExtrato] = useState<ExtratoItem[]>([]);
  const [extratoLoading, setExtratoLoading] = useState(false);
  const [extratoError, setExtratoError] = useState('');
  const [extratoStart, setExtratoStart] = useState('');
  const [extratoEnd, setExtratoEnd] = useState('');

  useEffect(() => {
    loadAccounts();
  }, []);

  // Recarregar dados quando a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadAccounts();
    }, [])
  );

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accountsData = await apiService.getAccounts();
      setAccounts(accountsData);
    } catch (error) {
      console.error('Erro ao carregar contas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as contas');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAccounts();
    setRefreshing(false);
  };

  const handleCreateAccount = () => {
    navigation.navigate('AccountForm' as never);
  };

  const handleEditAccount = (account: Account) => {
    (navigation as any).navigate('AccountForm', { account });
  };

  const handleDeleteAccount = (account: Account) => {
    Alert.alert(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir a conta "${account.name}"?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteAccount(account.id);
              loadAccounts(); // Recarregar a lista
            } catch (error) {
              console.error('Erro ao excluir conta:', error);
              Alert.alert('Erro', 'Não foi possível excluir a conta');
            }
          },
        },
      ]
    );
  };

  // Símbolos por moeda cadastrada no banco de dados
  const CURRENCY_SYMBOLS: { [key: string]: string } = {
    BRL: 'R$',
    USD: '$',
    EUR: '€',
    GBP: '£',
    ARS: '$',
  };

  const formatCurrency = (value: number, currency?: string) => {
    const code = (currency || 'BRL').toUpperCase();
    const symbol = CURRENCY_SYMBOLS[code] || code;
    const amount = Number(value || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${symbol} ${amount}`;
  };

  const formatValue = (value: number) =>
    `R$ ${Math.abs(Number(value || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  // Extrato usa o mesmo formato do web: DD/MM/AAAA -> AAAA-MM-DD
  const toISO = (s: string) => {
    const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    return s;
  };

  const getTipoLabel = (tipo: string) => {
    if (tipo === 'pagamento_cartao') return 'Fatura Cartão';
    return tipo.replace('_', ' ');
  };

  const fetchExtrato = async (account: Account, start = extratoStart, end = extratoEnd) => {
    try {
      setExtratoLoading(true);
      setExtratoError('');
      const data = await apiService.getAccountStatement(account.id, {
        start: start ? toISO(start) : undefined,
        end: end ? toISO(end) : undefined,
      });
      setExtrato(data);
    } catch (err: any) {
      setExtrato([]);
      setExtratoError(err?.message || 'Erro ao buscar extrato.');
    } finally {
      setExtratoLoading(false);
    }
  };

  const openExtrato = (account: Account) => {
    setExtratoConta(account);
    setExtrato([]);
    setExtratoStart('');
    setExtratoEnd('');
    setExtratoError('');
    fetchExtrato(account, '', '');
  };

  const closeExtrato = () => {
    setExtratoConta(null);
    setExtrato([]);
    setExtratoError('');
  };

  // Valores de tipo conforme o ENUM do banco: corrente | poupanca | investimento
  const getAccountTypeLabel = (type: string) => {
    switch (type) {
      case 'corrente':
        return 'Conta Corrente';
      case 'poupanca':
        return 'Poupança';
      case 'investimento':
        return 'Investimento';
      default:
        return 'Outro';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Carregando contas...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.title}>Minhas Contas</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateAccount}>
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="wallet-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyTitle}>Nenhuma conta encontrada</Text>
            <Text style={styles.emptySubtitle}>
              Toque no botão + para criar sua primeira conta
            </Text>
          </View>
        ) : (
          accounts.map((account) => (
            <View key={account.id} style={styles.accountCard}>
              <View style={styles.accountHeader}>
                <View style={styles.accountInfo}>
                  <View style={styles.accountIcon}>
                    <BankLogo name={`${account.name} ${account.bank ?? ''}`} size={32} />
                  </View>
                  <View>
                    <Text style={styles.accountName}>{account.name}</Text>
                    <Text style={styles.accountType}>
                      {getAccountTypeLabel(account.type)}
                      {account.bank ? ` • ${account.bank}` : ''}
                    </Text>
                  </View>
                </View>
                <View style={styles.accountActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditAccount(account)}
                  >
                    <Ionicons name="pencil" size={20} color="#007AFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteAccount(account)}
                  >
                    <Ionicons name="trash" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.balanceContainer}>
                <Text style={styles.balanceLabel}>Saldo atual:</Text>
                <Text style={[
                  styles.balanceValue,
                  { color: account.balance >= 0 ? '#34C759' : '#FF3B30' }
                ]}>
                  {formatCurrency(account.balance, account.currency)}
                </Text>
              </View>

              {account.description && (
                <Text style={styles.accountDescription}>
                  {account.description}
                </Text>
              )}

              <TouchableOpacity
                style={styles.statementButton}
                onPress={() => openExtrato(account)}
              >
                <Ionicons name="list-outline" size={18} color="#2563EB" />
                <Text style={styles.statementButtonText}>Extrato</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={!!extratoConta} animationType="slide" transparent onRequestClose={closeExtrato}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle} numberOfLines={1}>
                Extrato: {extratoConta?.name}{extratoConta?.bank ? ` (${extratoConta.bank})` : ''}
              </Text>
              <TouchableOpacity onPress={closeExtrato} style={styles.modalClose}>
                <Ionicons name="close" size={22} color="#111827" />
              </TouchableOpacity>
            </View>

            <View style={styles.periodRow}>
              <View style={{ flex: 1 }}>
                <DateInput label="Início" value={extratoStart} onChange={setExtratoStart} />
              </View>
              <View style={{ flex: 1 }}>
                <DateInput label="Fim" value={extratoEnd} onChange={setExtratoEnd} />
              </View>
            </View>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => extratoConta && fetchExtrato(extratoConta)}
            >
              <Text style={styles.filterButtonText}>Filtrar</Text>
            </TouchableOpacity>

            {extratoLoading ? (
              <View style={styles.extratoLoading}>
                <ActivityIndicator size="large" color="#2563EB" />
                <Text style={styles.loadingText}>Carregando extrato...</Text>
              </View>
            ) : extratoError ? (
              <Text style={styles.extratoError}>{extratoError}</Text>
            ) : (
              <FlatList
                data={extrato}
                keyExtractor={(item, index) => `${item.tipo}-${item.id}-${index}`}
                style={styles.extratoList}
                contentContainerStyle={{ paddingBottom: 12 }}
                ListEmptyComponent={
                  <Text style={styles.extratoEmpty}>Nenhuma movimentação encontrada.</Text>
                }
                renderItem={({ item }) => (
                  <View style={styles.extratoRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.extratoDate}>{item.data}</Text>
                      <Text style={styles.extratoDesc} numberOfLines={2}>{item.descricao}</Text>
                      <Text style={styles.extratoMeta}>
                        {item.categoria} • {getTipoLabel(item.tipo)}
                      </Text>
                    </View>
                    <Text style={[
                      styles.extratoValue,
                      { color: item.valor < 0 ? '#DC2626' : '#059669' }
                    ]}>
                      {item.valor < 0 ? '-' : '+'}{formatValue(item.valor)}
                    </Text>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
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
  content: {
    flex: 1,
    padding: 20,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 40,
  },
  accountCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  accountHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  accountInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIcon: {
    marginRight: 12,
  },
  accountName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  accountType: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  accountActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  balanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
  },
  balanceLabel: {
    fontSize: 16,
    color: '#666666',
  },
  balanceValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  accountDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  statementButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    paddingVertical: 10,
  },
  statementButtonText: {
    color: '#2563EB',
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  modalClose: {
    padding: 6,
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterButton: {
    marginTop: 10,
    backgroundColor: '#2563EB',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  extratoLoading: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  extratoError: {
    color: '#DC2626',
    textAlign: 'center',
    paddingVertical: 16,
  },
  extratoEmpty: {
    textAlign: 'center',
    color: '#6B7280',
    paddingVertical: 24,
  },
  extratoList: {
    marginTop: 8,
  },
  extratoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  extratoDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  extratoDesc: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginTop: 2,
  },
  extratoMeta: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  extratoValue: {
    fontSize: 14,
    fontWeight: '700',
  },
});
