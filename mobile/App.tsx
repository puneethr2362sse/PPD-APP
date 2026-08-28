import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/context/AuthContext';
import { HistoryProvider } from './src/context/HistoryContext';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <HistoryProvider>
          <StatusBar style="light" backgroundColor="#090D16" />
          <AppNavigator />
        </HistoryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
