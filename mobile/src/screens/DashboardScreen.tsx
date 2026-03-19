import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useBackendAuth } from '../contexts/BackendAuthContext';
import { apiService } from '../services/api';

export const DashboardScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, signOut } = useBackendAuth();
  
  const [dashboardData, setDashboardData] = useState({
    totalBalance: 0,
    totalIncome: 0,
    totalExpenses: 0,
    recentTransactions: []
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Recarregar dados quando a tela receber foco
  useFocusEffect(
    React.useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await apiService.getDashboard();
      setDashboardData(data);
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      Alert.alert('Erro', 'Não foi possível carregar os dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const formatDisplayDate = (s: any) => {
    if (!s) return '';
    if (typeof s === 'string') {
      const m = s.match(/^\d{2}\/\d{2}\/\d{4}$/);
      if (m) return s; // já está em DD/MM/YYYY
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR');
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // Handlers para os botões do menu
  const handleContas = () => {
    navigation.navigate('Accounts' as never);
  };

  const handleDespesas = () => {
    navigation.navigate('Expenses' as never);
  };

  const handleReceitas = () => {
    navigation.navigate('Incomes' as never);
  };

  const handleCartoes = () => {
    navigation.navigate('CreditCards' as never);
  };

  const handleRelatorios = () => {
    navigation.navigate('Reports' as never);
  };

  const handleConfiguracoes = () => {
    navigation.navigate('Profile' as never);
  };

  const handleTransferencias = () => {
    navigation.navigate('Transfers' as never);
  };

  const handleOrcamentos = () => {
    navigation.navigate('Budgets' as never);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name}!</Text>
            <Text style={styles.subtitle}>Bem-vindo ao seu painel financeiro</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Carregando dados...</Text>
          </View>
        ) : (
          <>
            {/* Resumo Financeiro */}
            <View style={styles.summaryContainer}>
              <Text style={styles.sectionTitle}>Resumo Financeiro</Text>
              
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Saldo Total</Text>
                <Text style={styles.summaryValue}>{formatCurrency(dashboardData.totalBalance)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, styles.halfCard, styles.incomeCard]}>
                  <Text style={styles.summaryLabel}>Receitas</Text>
                  <Text style={[styles.summaryValueSmall, styles.incomeText]}>{formatCurrency(dashboardData.totalIncome)}</Text>
                </View>
                
                <View style={[styles.summaryCard, styles.halfCard, styles.expenseCard]}>
                  <Text style={styles.summaryLabel}>Despesas</Text>
                  <Text style={[styles.summaryValueSmall, styles.expenseText]}>{formatCurrency(dashboardData.totalExpenses)}</Text>
                </View>
              </View>
            </View>

            {/* Menu de Navegação */}
            <View style={styles.menuContainer}>
              <Text style={styles.sectionTitle}>Menu Principal</Text>
              
              <View style={styles.menuGrid}>
                <TouchableOpacity style={styles.menuItem} onPress={handleContas}>
                  <Text style={styles.menuIcon}>💳</Text>
                  <Text style={styles.menuText}>Contas</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleDespesas}>
                  <Text style={styles.menuIcon}>💸</Text>
                  <Text style={styles.menuText}>Despesas</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleReceitas}>
                  <Text style={styles.menuIcon}>💰</Text>
                  <Text style={styles.menuText}>Receitas</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleCartoes}>
                  <Text style={styles.menuIcon}>🏦</Text>
                  <Text style={styles.menuText}>Cartões</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleRelatorios}>
                  <Text style={styles.menuIcon}>📊</Text>
                  <Text style={styles.menuText}>Relatórios</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleConfiguracoes}>
                  <Text style={styles.menuIcon}>⚙️</Text>
                  <Text style={styles.menuText}>Configurações</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleTransferencias}>
                  <Text style={styles.menuIcon}>🔁</Text>
                  <Text style={styles.menuText}>Transferências</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleOrcamentos}>
                  <Text style={styles.menuIcon}>🧾</Text>
                  <Text style={styles.menuText}>Orçamentos</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Transações Recentes */}
            <View style={styles.transactionsContainer}>
              <Text style={styles.sectionTitle}>Transações Recentes</Text>
              {dashboardData.recentTransactions && dashboardData.recentTransactions.length > 0 ? (
                dashboardData.recentTransactions.map((transaction: any, index: number) => (
                  <View key={index} style={styles.transactionItem}>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionDescription}>{transaction.description}</Text>
                      <Text style={styles.transactionDate}>{formatDisplayDate(transaction.date)}</Text>
                    </View>
                    <Text style={[
                      styles.transactionAmount,
                      transaction.type === 'income' ? styles.incomeText : styles.expenseText
                    ]}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                    </Text>
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Nenhuma transação encontrada</Text>
                  <Text style={styles.emptySubtext}>Suas transações aparecerão aqui</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    padding: 8,
  },
  logoutText: {
    color: '#007AFF',
    fontSize: 16,
  },
  summaryContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryValueSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfCard: {
    width: '48%',
  },
  incomeCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  expenseCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#F44336',
  },
  incomeText: {
    color: '#4CAF50',
  },
  expenseText: {
    color: '#F44336',
  },
  menuContainer: {
    padding: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuItem: {
    backgroundColor: 'white',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  menuIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recentContainer: {
    padding: 20,
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  transactionsContainer: {
    padding: 20,
  },
  transactionItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  transactionDate: {
    fontSize: 14,
    color: '#666',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});