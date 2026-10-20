import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { BackendAuthProvider } from './src/contexts/BackendAuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <BackendAuthProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </BackendAuthProvider>
    </SafeAreaProvider>
  );
}
