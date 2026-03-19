import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useBackendAuth } from '../contexts/BackendAuthContext';
import { LoginScreen } from '../screens/LoginScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { AccountsScreen } from '../screens/AccountsScreen';
import { AccountFormScreen } from '../screens/AccountFormScreen';
import { ExpensesScreen } from '../screens/ExpensesScreen';
import { ExpenseFormScreen } from '../screens/ExpenseFormScreen';
import { IncomesScreen } from '../screens/IncomesScreen';
import { IncomeFormScreen } from '../screens/IncomeFormScreen';
import { CreditCardsScreen } from '../screens/CreditCardsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { TransfersScreen } from '../screens/TransfersScreen';
import { BudgetsScreen } from '../screens/BudgetsScreen';
import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { user, loading } = useBackendAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {user ? (
          // Usuário autenticado - mostrar telas principais
          <>
            <Stack.Screen 
              name="Dashboard" 
              component={DashboardScreen} 
            />
            <Stack.Screen 
              name="Accounts" 
              component={AccountsScreen} 
              options={{ title: 'Contas' }} 
            />
            <Stack.Screen 
              name="AccountForm" 
              component={AccountFormScreen} 
              options={{ title: 'Conta' }} 
            />
            <Stack.Screen 
              name="Expenses" 
              component={ExpensesScreen} 
              options={{ title: 'Despesas' }} 
            />
            <Stack.Screen 
              name="ExpenseForm" 
              component={ExpenseFormScreen} 
              options={{ title: 'Despesa' }} 
            />
            <Stack.Screen 
              name="Incomes" 
              component={IncomesScreen} 
              options={{ title: 'Receitas' }} 
            />
          <Stack.Screen 
            name="IncomeForm" 
            component={IncomeFormScreen} 
            options={{ title: 'Receita' }} 
          />
          <Stack.Screen 
            name="CreditCards" 
            component={CreditCardsScreen} 
            options={{ title: 'Cartões' }} 
          />
          <Stack.Screen 
            name="Reports" 
            component={ReportsScreen} 
            options={{ title: 'Relatórios' }} 
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'Configurações' }} 
          />
          <Stack.Screen 
            name="Transfers" 
            component={TransfersScreen} 
            options={{ title: 'Transferências' }} 
          />
          <Stack.Screen 
            name="Budgets" 
            component={BudgetsScreen} 
            options={{ title: 'Orçamentos' }} 
          />
          </>
        ) : (
          // Usuário não autenticado - mostrar login
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});