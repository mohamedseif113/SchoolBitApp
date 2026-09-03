import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { AppText } from '../common/AppText';
import { colors } from '../../theme/colors';

interface AuthTabHeaderProps {
  activeTab: 'login' | 'signup';
  onSelectTab: (tab: 'login' | 'signup') => void;
  isRTL: boolean;
  isDark: boolean;
}

export const AuthTabHeader: React.FC<AuthTabHeaderProps> = ({
  activeTab,
  onSelectTab,
  isRTL,
  isDark,
}) => {
  return (
    <View style={[styles.container, isDark && styles.darkContainer]}>
      <TouchableOpacity
        style={[
          styles.tabBtn,
          activeTab === 'login' && [styles.activeTabBtn, isDark && styles.darkActiveTabBtn],
        ]}
        onPress={() => onSelectTab('login')}
        activeOpacity={0.85}
      >
        <AppText
          variant="bodyBold"
          color={
            activeTab === 'login'
              ? isDark
                ? '#FFFFFF'
                : colors.brandPrimary
              : isDark
              ? '#94A3B8'
              : '#64748B'
          }
          align="center"
        >
          {isRTL ? 'تسجيل الدخول' : 'Sign In'}
        </AppText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tabBtn,
          activeTab === 'signup' && [styles.activeTabBtn, isDark && styles.darkActiveTabBtn],
        ]}
        onPress={() => onSelectTab('signup')}
        activeOpacity={0.85}
      >
        <AppText
          variant="bodyBold"
          color={
            activeTab === 'signup'
              ? isDark
                ? '#FFFFFF'
                : colors.brandPrimary
              : isDark
              ? '#94A3B8'
              : '#64748B'
          }
          align="center"
        >
          {isRTL ? 'تسجيل مدرسة' : 'School Register'}
        </AppText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#EAEFF8',
    borderRadius: 14,
    padding: 4,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  darkContainer: {
    backgroundColor: '#091A38',
    borderColor: '#1E3A6E',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTabBtn: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(10,29,61,0.08)',
      },
      default: {
        shadowColor: '#0A1D3D',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  darkActiveTabBtn: {
    backgroundColor: '#1E3A6E',
  },
});

export default AuthTabHeader;
