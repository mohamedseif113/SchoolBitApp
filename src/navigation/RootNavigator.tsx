import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View, Image } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import { useAuthStore } from '../store/auth.store';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, []);

  if (isInitializing) {
    return (
      <View style={styles.splash}>
        <Image
          source={require('../../assets/android-icon-foreground.png')}
          style={styles.splashLogo}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#6EC5FF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated && user ? (
        <Stack.Screen name="App" component={AppNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#07132B',
  },
  splashLogo: {
    width: 140,
    height: 140,
    marginBottom: 24,
  },
});
