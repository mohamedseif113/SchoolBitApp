import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useUiStore } from '../../store/uiStore';
import { AppText } from '../common/AppText';
import { Logo } from '../common/Logo';
import { AuthTabHeader } from './AuthTabHeader';
import { AuthHeroSection } from './AuthHeroSection';
import { AuthFooter } from './AuthFooter';
import { colors } from '../../theme/colors';

interface AuthLayoutProps {
  activeTab: 'login' | 'signup';
  onSelectTab: (tab: 'login' | 'signup') => void;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  activeTab,
  onSelectTab,
  children,
}) => {
  const { i18n } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme, toggleLang } = useUiStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isWide = width >= 860;

  const toggleLanguage = () => {
    toggleLang();
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark ? styles.darkSafeArea : styles.lightSafeArea]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? colors.heroNavy : '#F4F7FB'}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContainer,
            isWide && styles.wideScrollContainer,
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.layoutWrapper, isWide && styles.wideLayoutWrapper]}>
            {/* Form Column */}
            <View style={[styles.formColumn, isWide && styles.wideFormColumn]}>
              {/* Header Row: Language Selector Pill & Top Logo */}
              <View
                style={[
                  styles.headerRow,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <TouchableOpacity
                  style={[styles.langBtn, isDark && styles.darkLangBtn]}
                  onPress={toggleLanguage}
                  activeOpacity={0.8}
                >
                  <AppText
                    variant="captionBold"
                    color={isDark ? '#6EC5FF' : colors.brandPrimary}
                  >
                    {i18n.language === 'ar' ? 'English' : 'عربي'}
                  </AppText>
                </TouchableOpacity>

                <Logo size="medium" />
              </View>

              {/* Navigation Switcher Tabs (تسجيل الدخول / تسجيل مدرسة) */}
              <AuthTabHeader
                activeTab={activeTab}
                onSelectTab={onSelectTab}
                isRTL={isRTL}
                isDark={isDark}
              />

              {/* Form Content */}
              <View style={styles.formContainer}>{children}</View>

              {/* Footer */}
              <AuthFooter isRTL={isRTL} isDark={isDark} />
            </View>

            {/* Hero Showcase Sidebar (Rendered on wide screens) */}
            {isWide && (
              <View style={styles.heroColumn}>
                <AuthHeroSection isRTL={isRTL} mode={activeTab} />
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  lightSafeArea: {
    backgroundColor: '#F4F7FB',
  },
  darkSafeArea: {
    backgroundColor: colors.heroNavy,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: 'center',
  },
  wideScrollContainer: {
    paddingHorizontal: 32,
    paddingVertical: 32,
    alignItems: 'center',
  },
  layoutWrapper: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  wideLayoutWrapper: {
    maxWidth: 1140,
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 32,
  },
  formColumn: {
    flex: 1,
    width: '100%',
  },
  wideFormColumn: {
    flex: 1,
    maxWidth: 540,
  },
  heroColumn: {
    flex: 1,
    maxWidth: 520,
    minHeight: 680,
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  langBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
      },
      default: {
        elevation: 1,
      },
    }),
  },
  darkLangBtn: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
  },
  formContainer: {
    width: '100%',
  },
});

export default AuthLayout;
