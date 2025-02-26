import { SafeAreaView, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { RouteProvider } from '@/contexts/RouteContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { LoadingProvider } from '@/contexts/LoadingContext';
import { UserProvider } from '@/contexts/UserContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { Routes } from '@/app/(screens)/Routes';
import { ThemedView } from '@/components/ThemedView';

export default function PagesLayout() {
  return (
    <LoadingProvider>
        <ToastProvider>
            <UserProvider>
                <AuthProvider>
                    <RouteProvider>
                        <ThemedView style={styles.fullScreenArea}>
                            <SafeAreaView style={styles.safeArea}>
                                <Stack screenOptions={{ headerShown: false }}>
                                    <Stack.Screen name={Routes.Login} options={{ headerShown: false }} />
                                    <Stack.Screen name={Routes.Home} options={{ headerShown: false }} />
                                    <Stack.Screen name={Routes.DepositFunds} options={{ headerShown: false }} />
                                    <Stack.Screen name={Routes.StrategySelection} options={{ headerShown: false }} />
                                    <Stack.Screen name={Routes.HowItWorks} options={{ headerShown: false }} />
                                    <Stack.Screen name={Routes.BacktestResults} options={{ headerShown: false }} />
                                </Stack>
                            </SafeAreaView>
                        </ThemedView>
                    </RouteProvider>
                </AuthProvider>
            </UserProvider>
        </ToastProvider>
    </LoadingProvider>
  );
}

const styles = StyleSheet.create({
  fullScreenArea: {
    flex: 1
  },
  
  safeArea: {
      flex: 1
  },
});