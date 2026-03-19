import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const BackendAuthContext = createContext<AuthContextType | undefined>(undefined);

export const useBackendAuth = () => {
  const context = useContext(BackendAuthContext);
  if (!context) {
    throw new Error('useBackendAuth must be used within a BackendAuthProvider');
  }
  return context;
};

interface BackendAuthProviderProps {
  children: React.ReactNode;
}

export const BackendAuthProvider: React.FC<BackendAuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar se o usuário está autenticado ao inicializar
  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      setLoading(true);
      const isAuthenticated = await apiService.isAuthenticated();
      
      if (isAuthenticated) {
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Erro ao verificar estado de autenticação:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      console.log('Iniciando login para:', email);
      const response = await apiService.login(email, password);
      console.log('Resposta do login:', response);
      setUser(response.user);
      console.log('Usuário definido:', response.user);
    } catch (error) {
      console.error('Erro no login:', error);
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      
      console.log('Iniciando registro para:', { name, email });
      // Primeiro registra o usuário
      await apiService.register(name, email, password);
      console.log('Registro bem-sucedido, fazendo login automático...');
      
      // Depois faz login automaticamente
      const response = await apiService.login(email, password);
      console.log('Login automático bem-sucedido:', response);
      setUser(response.user);
      console.log('Usuário definido após registro:', response.user);
    } catch (error) {
      console.error('Erro no registro:', error);
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <BackendAuthContext.Provider value={value}>
      {children}
    </BackendAuthContext.Provider>
  );
};

export default BackendAuthProvider;