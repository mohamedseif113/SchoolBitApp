import React, { useEffect, useMemo } from 'react';
import { I18nManager, StatusBar, View, ActivityIndicator, Image } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme, LinkingOptions } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  IBMPlexSansArabic_100Thin,
  IBMPlexSansArabic_200ExtraLight,
  IBMPlexSansArabic_300Light,
  IBMPlexSansArabic_400Regular,
  IBMPlexSansArabic_500Medium,
  IBMPlexSansArabic_600SemiBold,
  IBMPlexSansArabic_700Bold,
} from '@expo-google-fonts/ibm-plex-sans-arabic';
import {
  Cairo_400Regular,
  Cairo_500Medium,
  Cairo_600SemiBold,
  Cairo_700Bold,
  Cairo_800ExtraBold,
} from '@expo-google-fonts/cairo';

import './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';
import { useUiStore } from './src/store/uiStore';
import { colors } from './src/theme/colors';
import { applyGlobalTypography } from './src/theme/typography';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const linking: LinkingOptions<any> = {
  prefixes: ['/', 'schoolbit://'],
  config: {
    screens: {
      Auth: {
        screens: {
          LoginScreen: 'login',
          TwoFaScreen: '2fa',
          ForgotPasswordScreen: 'forgot-password',
          SignupScreen: 'signup',
        },
      },
      App: {
        screens: {
          MainTabs: {
            screens: {
              Dashboard: 'dashboard',
              Students: 'students',
              Attendance: 'attendance/quick-mark',
              Tasks: 'tasks',
            },
          },
          Schedule: 'schedule',
          Messages: 'messages',
          Reports: 'reports',
          Finance: 'finance',
          Settings: 'settings',
          Behavior: 'behavior',
          Summons: 'summons',
          Committees: 'committees',
          Homework: 'homework',
          HR: 'staff',
          Portfolio: 'portfolio',
          ExamDistribution: 'examdist',
          AtRisk: 'atrisk',
          Noor: 'noor',
          Integrations: 'forms',
          WhatsApp: 'whatsapp',
        },
      },
    },
  },
};

export default function App() {
  const { lang, theme, hydrate } = useUiStore();

  const [fontsLoaded] = useFonts({
    IBMPlexSansArabic_100Thin,
    IBMPlexSansArabic_200ExtraLight,
    IBMPlexSansArabic_300Light,
    IBMPlexSansArabic_400Regular,
    IBMPlexSansArabic_500Medium,
    IBMPlexSansArabic_600SemiBold,
    IBMPlexSansArabic_700Bold,
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
    Cairo_800ExtraBold,
  });

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    applyGlobalTypography(lang || 'ar');
  }, [lang]);

  const navTheme = useMemo(() => {
    const isDark = theme === 'dark';
    const baseTheme = isDark ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        background: isDark ? '#07132B' : '#F8FAFC',
        card: isDark ? '#0F244A' : '#FFFFFF',
        text: isDark ? '#F8FAFC' : '#0A1D3D',
        border: isDark ? '#1E3A6E' : '#E2E8F0',
        primary: '#1246B7',
      },
      fonts: {
        regular: { fontFamily: 'IBMPlexSansArabic_400Regular', fontWeight: '400' as any },
        medium: { fontFamily: 'IBMPlexSansArabic_500Medium', fontWeight: '500' as any },
        bold: { fontFamily: 'IBMPlexSansArabic_700Bold', fontWeight: '700' as any },
        heavy: { fontFamily: 'IBMPlexSansArabic_700Bold', fontWeight: '800' as any },
      },
    };
  }, [theme]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#07132B' }}>
        <Image
          source={require('./assets/android-icon-foreground.png')}
          style={{ width: 140, height: 140, marginBottom: 24 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="large" color="#6EC5FF" />
      </View>
    );
  }

  // Ensure global typography defaults apply synchronously before render
  applyGlobalTypography(lang || 'ar');

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar
          barStyle={theme === 'dark' ? 'light-content' : 'dark-content'}
          backgroundColor={theme === 'dark' ? '#07132B' : '#FFFFFF'}
        />
        <NavigationContainer theme={navTheme} linking={linking}>
          <RootNavigator />
        </NavigationContainer>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
