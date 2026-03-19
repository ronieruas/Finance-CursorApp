import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuração da API
function resolveApiBaseUrl(): string {
  const isWeb = Platform.OS === 'web';

  const envCommon = process.env.EXPO_PUBLIC_API_URL as string | undefined;
  if (envCommon && envCommon.length > 0) return envCommon;

  const webEnv = process.env.EXPO_PUBLIC_WEB_API_BASE_URL as string | undefined;
  const nativeEnv = process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined;
  if (isWeb && webEnv && webEnv.length > 0) return webEnv;
  if (!isWeb && nativeEnv && nativeEnv.length > 0) return nativeEnv;

  const extra = (Constants?.expoConfig as any)?.extra || (Constants as any)?.manifest?.extra;
  if (!isWeb && extra && extra.API_BASE_URL) return String(extra.API_BASE_URL);

  const hostUri: string | undefined =
    (Constants as any)?.manifest?.debuggerHost || (Constants?.expoConfig as any)?.hostUri;
  if (hostUri && !isWeb) {
    const ip = hostUri.split(':')[0];
    return `http://${ip}:3001`;
  }

  if (isWeb) return 'http://localhost:3001';
  if (Platform.OS === 'android') return 'http://10.0.2.2:3001';
  return 'http://localhost:3001';
}

const API_BASE_URL = resolveApiBaseUrl();

// Tipos para as respostas da API
export interface User {
  id: number;
  name: string;
  email: string;
  role?: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Account {
  id: number;
  name: string;
  type: string;
  balance: number;
  user_id: number;
  description?: string;
}

export interface CreditCard {
  id: number;
  name: string;
  bank?: string;
  brand?: string;
  limit_value?: number;
  due_day: number;
  closing_day: number;
  status?: string;
}

export interface Expense {
  id: number;
  description: string;
  value: number;
  due_date: string;
  category: string;
  account_id: number;
  user_id: number;
}

export interface Income {
  id: number;
  description: string;
  value: number;
  date: string;
  account_id: number;
  user_id: number;
  category?: string;
}

// Classe para gerenciar as chamadas da API
class ApiService {
  private baseURL: string;
  private overrideURL?: string;
  private overrideLoaded?: boolean;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.overrideURL = undefined;
    this.overrideLoaded = false;
    
    // Log da base URL para diagnóstico de conectividade
    try {
      console.log('[API] baseURL:', this.baseURL);
    } catch {}
  }

  // Método para fazer requisições HTTP
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    if (!this.overrideLoaded) {
      try {
        const ov = await AsyncStorage.getItem('API_BASE');
        if (ov && ov.trim()) this.overrideURL = ov.trim();
      } catch {}
      this.overrideLoaded = true;
    }
    const effectiveBase = (this.overrideURL && this.overrideURL.length > 0) ? this.overrideURL : this.baseURL;
    const url = `${effectiveBase}${endpoint}`;
    // Log da URL completa da requisição para facilitar debug
    try {
      const method = (options && (options as any).method) || 'GET';
      console.log('[API] request:', { url, method });
    } catch {}
    
    // Adicionar token de autenticação se disponível
    const token = await AsyncStorage.getItem('authToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as any),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      return await response.json();
    } catch (error: any) {
      const msg = String(error?.message || '');
      const hostUri: string | undefined = (Constants as any)?.manifest?.debuggerHost || (Constants?.expoConfig as any)?.hostUri;
      const shouldFallback = msg.includes('Network request failed') || msg.includes('Failed to fetch') || msg.includes('ECONNREFUSED') || msg.includes('connect');
      if (Platform.OS !== 'web' && hostUri && shouldFallback) {
        const ip = hostUri.split(':')[0];
        const fallbackBase = `http://${ip}:3001`;
        if (effectiveBase !== fallbackBase) {
          this.overrideURL = fallbackBase;
          this.overrideLoaded = true;
          try { await AsyncStorage.setItem('API_BASE', fallbackBase); } catch {}
          const fbUrl = `${fallbackBase}${endpoint}`;
          const response2 = await fetch(fbUrl, config);
          if (!response2.ok) {
            const errorData2 = await response2.json().catch(() => ({}));
            throw new Error(errorData2.error || `HTTP ${response2.status}`);
          }
          return await response2.json();
        }
      }
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Ping simples para verificar disponibilidade da API
  async health(): Promise<any> {
    return this.request<any>('/health');
  }

  // Métodos de autenticação
  async login(email: string, password: string): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Salvar token no AsyncStorage
    if (response.token) {
      await AsyncStorage.setItem('authToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  }

  async register(name: string, email: string, password: string): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('user');
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  // Métodos para contas
  async getAccounts(): Promise<Account[]> {
    return this.request<Account[]>('/accounts');
  }

  async getCreditCards(): Promise<CreditCard[]> {
    return this.request<CreditCard[]>('/creditCards');
  }

  async createCreditCard(payload: { bank: string; brand?: string; limit_value: number; due_day: number; closing_day: number; name: string; status?: string }): Promise<any> {
    return this.request<any>('/creditCards', { method: 'POST', body: JSON.stringify(payload) });
  }

  async updateCreditCard(id: number, payload: { bank: string; brand?: string; limit_value: number; due_day: number; closing_day: number; name: string; status?: string }): Promise<any> {
    return this.request<any>(`/creditCards/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async deleteCreditCard(id: number): Promise<any> {
    return this.request<any>(`/creditCards/${id}`, { method: 'DELETE' });
  }

  async getBudgets(): Promise<any[]> {
    return this.request<any[]>('/budgets');
  }

  async createBudget(payload: { name: string; type: 'geral' | 'cartao'; credit_card_id?: number; period_start: string; period_end: string; planned_value: number }): Promise<any> {
    return this.request<any>('/budgets', { method: 'POST', body: JSON.stringify(payload) });
  }

  async updateBudget(id: number, payload: { name: string; type: 'geral' | 'cartao'; credit_card_id?: number; period_start: string; period_end: string; planned_value: number }): Promise<any> {
    return this.request<any>(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }

  async deleteBudget(id: number): Promise<any> {
    return this.request<any>(`/budgets/${id}`, { method: 'DELETE' });
  }

  async payCreditCardBill(cardId: number, params: { account_id: number; payment_date?: string; is_full_payment?: boolean; auto_debit?: boolean; bill_month?: string }): Promise<any> {
    const payload = {
      account_id: params.account_id,
      value: 0,
      payment_date: params.payment_date || new Date().toISOString().slice(0,10),
      is_full_payment: params.is_full_payment ?? true,
      auto_debit: params.auto_debit ?? false,
      bill_month: params.bill_month,
    };
    return this.request<any>(`/creditCards/${cardId}/pay`, { method: 'POST', body: JSON.stringify(payload) });
  }

  async getCreditCardBill(cardId: number): Promise<{ atual: any[]; proxima: any[]; periods: { atual: { start: string; end: string; start_date: string; end_date: string; vencimento?: string; vencimento_date?: string }; proxima: { start: string; end: string; start_date: string; end_date: string; vencimento?: string; vencimento_date?: string } } }> {
    return this.request<any>(`/creditCards/${cardId}/bill`);
  }

  async createAccount(account: Omit<Account, 'id' | 'user_id'>): Promise<Account> {
    return this.request<Account>('/accounts', {
      method: 'POST',
      body: JSON.stringify(account),
    });
  }

  async updateAccount(id: number, account: Partial<Account>): Promise<Account> {
    return this.request<Account>(`/accounts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(account),
    });
  }

  async deleteAccount(id: number): Promise<void> {
    return this.request<void>(`/accounts/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos para despesas
  async getExpenses(filters?: { start?: string; end?: string; category?: string; status?: string; account_id?: number; credit_card_id?: number; type?: 'conta'|'cartao' }): Promise<Expense[]> {
    const params = new URLSearchParams();
    if (filters?.start) params.append('start', filters.start);
    if (filters?.end) params.append('end', filters.end);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.account_id) params.append('account_id', String(filters.account_id));
    if (filters?.credit_card_id) params.append('credit_card_id', String(filters.credit_card_id));
    if (filters?.type) params.append('type', filters.type);
    const path = params.toString() ? `/expenses?${params.toString()}` : '/expenses';
    const list = await this.request<any[]>(path);
    return Array.isArray(list)
      ? list.map((e: any) => ({
          id: e.id,
          description: e.description,
          value: Number(e.value ?? 0),
          due_date: e.due_date ?? e.date,
          category: e.category ?? 'other',
          account_id: e.account_id,
          user_id: e.user_id,
        }))
      : [];
  }

  async createExpense(expense: { description: string; amount: number; category: string; date: string; accountId: number }): Promise<Expense> {
    // Mapear para formato do backend
    const toISO = (s: any) => {
      if (!s) return undefined;
      if (typeof s === 'string') {
        const m = s.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/);
        if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0,10);
    };
    const payload: any = {
      description: expense.description,
      value: Number(expense.amount ?? 0),
      category: expense.category,
      due_date: toISO(expense.date),
      account_id: Number(expense.accountId),
      status: 'pendente',
      type: 'conta',
    };
    return this.request<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Lançamento em cartão de crédito
  async createCardExpense(params: { card: CreditCard; description: string; amount: number; purchase_date: string; category?: string; status?: string; installment_total?: number }): Promise<Expense[]> {
    const { card, description, amount, purchase_date, category, status = 'pendente', installment_total } = params;
    const toISO = (s: string) => {
      const m = s.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/);
      if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      const d = new Date(s);
      const yy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yy}-${mm}-${dd}`;
    };
    const payload: any = {
      type: 'cartao',
      credit_card_id: card.id,
      description,
      value: Number(amount),
      purchase_date: toISO(purchase_date),
      category: category || 'other',
      status,
      installment_type: installment_total && installment_total > 1 ? 'parcelado' : 'avista',
      installment_total: installment_total && installment_total > 1 ? installment_total : 1,
    };
    return this.request<Expense[]>('/expenses', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getTransfers(filters?: { start?: string; end?: string; from_account_id?: number | 'terceiros'; to_account_id?: number | 'terceiros'; description?: string; from_third_party?: boolean; to_third_party?: boolean }): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.start && filters?.end) { params.append('start', filters.start); params.append('end', filters.end); }
    if (filters?.from_account_id && filters.from_account_id !== 'terceiros') params.append('from_account_id', String(filters.from_account_id));
    if (filters?.to_account_id && filters.to_account_id !== 'terceiros') params.append('to_account_id', String(filters.to_account_id));
    if (filters?.from_account_id === 'terceiros' || filters?.from_third_party) params.append('from_third_party', 'true');
    if (filters?.to_account_id === 'terceiros' || filters?.to_third_party) params.append('to_third_party', 'true');
    if (filters?.description) params.append('description', filters.description);
    const path = params.toString() ? `/transfers?${params.toString()}` : '/transfers';
    return this.request<any[]>(path);
  }

  async createTransfer(payload: { from_account_id?: number; to_account_id?: number; value: number; description?: string; date: string }): Promise<any> {
    return this.request<any>('/transfers', { method: 'POST', body: JSON.stringify(payload) });
  }

  async updateExpense(id: number, expense: Partial<Expense>): Promise<Expense> {
    return this.request<Expense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(expense),
    });
  }

  async deleteExpense(id: number): Promise<void> {
    return this.request<void>(`/expenses/${id}`, {
      method: 'DELETE',
    });
  }

  // Métodos para receitas
  async getIncomes(filters?: { start?: string; end?: string }): Promise<Income[]> {
    const params = new URLSearchParams();
    if (filters?.start) params.append('start', filters.start);
    if (filters?.end) params.append('end', filters.end);
    const path = params.toString() ? `/incomes?${params.toString()}` : '/incomes';
    const list = await this.request<any[]>(path);
    return Array.isArray(list)
      ? list.map((i: any) => ({
          id: i.id,
          description: i.description,
          value: Number(i.value ?? 0),
          date: i.date,
          category: i.category ?? 'other',
          account_id: i.account_id,
          user_id: i.user_id,
        }))
      : [];
  }

  async createIncome(income: { description: string; amount: number; category?: string; date: string; accountId: number }): Promise<Income> {
    const toISO = (s: any) => {
      if (!s) return undefined;
      if (typeof s === 'string') {
        const m = s.match(/^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/);
        if (m) return `${m[3]}-${m[2]}-${m[1]}`;
      }
      const d = new Date(s);
      return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0,10);
    };
    const payload: any = {
      description: income.description,
      value: Number(income.amount ?? 0),
      category: income.category,
      date: toISO(income.date),
      account_id: Number(income.accountId),
    };
    return this.request<Income>('/incomes', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async updateIncome(id: number, income: Partial<Income>): Promise<Income> {
    return this.request<Income>(`/incomes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(income),
    });
  }

  async deleteIncome(id: number): Promise<void> {
    return this.request<void>(`/incomes/${id}`, {
      method: 'DELETE',
    });
  }

  // Método para dashboard
  async getDashboard(): Promise<any> {
    const raw = await this.request<any>('/dashboard');
    const totalBalance = Number(raw?.saldoTotalReais ?? 0);
    const totalIncome = Number(raw?.receitasMesVigente ?? 0);
    const totalExpenses = Number(raw?.despesasMesVigente ?? 0);
    const recentTransactions = Array.isArray(raw?.recentes)
      ? raw.recentes.map((t: any) => ({
          description: t?.descricao ?? t?.description ?? '',
          date: t?.data ?? t?.date ?? '',
          amount: Number(t?.valor ?? t?.value ?? 0),
          type: t?.tipo ?? t?.type ?? '',
        }))
      : [];
    return { totalBalance, totalIncome, totalExpenses, recentTransactions };
  }

  // Resumo por cartões
  async getCardSummary(filters?: { start?: string; end?: string }): Promise<Array<{ card_id: number; card_name: string; gastos_mes: number; fatura_atual: number; fatura_fechada_valor: number; fatura_fechada_status: string }>> {
    const params = new URLSearchParams();
    if (filters?.start) params.append('start', filters.start);
    if (filters?.end) params.append('end', filters.end);
    const path = params.toString() ? `/dashboard?${params.toString()}` : '/dashboard'
    const raw = await this.request<any>(path);
    const list = Array.isArray(raw?.gastosPorCartao) ? raw.gastosPorCartao : [];
    return list.map((c: any) => ({
      card_id: c.card_id,
      card_name: c.card_name,
      gastos_mes: Number(c.gastos_mes ?? 0),
      fatura_atual: Number(c.fatura_atual ?? 0),
      fatura_fechada_valor: Number(c.fatura_fechada_valor ?? 0),
      fatura_fechada_status: String(c.fatura_fechada_status ?? ''),
    }));
  }

  // Resumo mensal
  async getMonthlySummary(timestamp?: number): Promise<{ totalIncomes: number; totalExpenses: number; totalCreditCardBills: number; balance: number }> {
    const qs = typeof timestamp === 'number' ? `?timestamp=${encodeURIComponent(String(timestamp))}` : '';
    const res = await this.request<any>(`/dashboard/monthly-summary${qs}`);
    return {
      totalIncomes: Number(res?.totalIncomes ?? 0),
      totalExpenses: Number(res?.totalExpenses ?? 0),
      totalCreditCardBills: Number(res?.totalCreditCardBills ?? 0),
      balance: Number(res?.balance ?? 0),
    };
  }

  // Método para verificar se o usuário está autenticado
  async isAuthenticated(): Promise<boolean> {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  }

  // Método para obter usuário atual
  async getCurrentUser(): Promise<User | null> {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getBaseURL(): string {
    return (this.overrideURL && this.overrideURL.length > 0) ? this.overrideURL : this.baseURL;
  }

  async setBaseURL(url: string): Promise<void> {
    let input = (url || '').trim().replace(/\/$/, '');
    if (!input) return;
    const isPortOnly = /^\d{2,5}$/.test(input) || /^:?\d{2,5}$/.test(input);
    const hasScheme = /^https?:\/\//i.test(input);
    const hasHost = /^(https?:\/\/)?[^:]+(:\d{2,5})?$/.test(input);
    const hostUri: string | undefined = (Constants as any)?.manifest?.debuggerHost || (Constants?.expoConfig as any)?.hostUri;
    if (isPortOnly && hostUri) {
      const ip = hostUri.split(':')[0];
      input = `http://${ip}:${input.replace(/^:/,'')}`;
    } else if (!hasScheme && hasHost) {
      input = `http://${input}`;
    }
    this.overrideURL = input;
    this.overrideLoaded = true;
    try { await AsyncStorage.setItem('API_BASE', input); } catch {}
  }
}

// Exportar instância única do serviço
export const apiService = new ApiService();
export default apiService;
