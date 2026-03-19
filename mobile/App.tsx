import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { BackendAuthProvider } from './src/contexts/BackendAuthContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <BackendAuthProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </BackendAuthProvider>
  );
}
