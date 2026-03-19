// Tipos para autenticação
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

// Tipos para contas
export interface Account {
  id: string;
  name: string;
  type: 'corrente' | 'poupança' | 'investimento';
  balance: number;
  currency: 'BRL' | 'USD' | 'EUR';
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para despesas
export interface Expense {
  id: string;
  description: string;
  value: number;
  category: string;
  accountId: string;
  userId: string;
  dueDate: Date;
  paidAt?: Date;
  installmentNumber?: number;
  installmentTotal?: number;
  status: 'paga' | 'pendente' | 'atrasada';
  isRecurring: boolean;
  autoDebit: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para receitas
export interface Income {
  id: string;
  description: string;
  value: number;
  category: string;
  accountId: string;
  userId: string;
  receivedAt: Date;
  isRecurring: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para cartões de crédito
export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos para navegação
export type RootStackParamList = {
  Login: undefined;
  Dashboard: undefined;
  Accounts: undefined;
  AccountForm: { accountId?: string };
  Expenses: undefined;
  ExpenseForm: { expenseId?: string };
  Incomes: undefined;
  IncomeForm: { incomeId?: string };
  CreditCards: undefined;
  Reports: undefined;
  Profile: undefined;
  Transfers: undefined;
  Budgets: undefined;
};

// Tipos para contexto de autenticação
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}