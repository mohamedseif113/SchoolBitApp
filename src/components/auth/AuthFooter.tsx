import React from 'react';
import { View, TouchableOpacity, StyleSheet, Linking, Platform } from 'react-native';
import { AppText } from '../common/AppText';
import { colors } from '../../theme/colors';

interface AuthFooterProps {
  isRTL: boolean;
  isDark: boolean;
}

export const AuthFooter: React.FC<AuthFooterProps> = ({ isRTL, isDark }) => {
  const handleSupportClick = () => {
    Linking.openURL('mailto:support@corbit.sa');
  };

  const handleWebsiteClick = () => {
    Linking.openURL('https://corbit.sa');
  };

  return (
    <View style={styles.footerContainer}>
      {/* Top Action Pills Row */}
      <View style={[styles.pillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity
          style={[styles.actionPill, styles.websitePill, isDark && styles.darkPill]}
          onPress={handleWebsiteClick}
          activeOpacity={0.8}
        >
          <View style={styles.blueDot} />
          <AppText variant="captionBold" color={isDark ? '#6EC5FF' : colors.brandPrimary}>
            {isRTL ? 'موقع كوربت' : 'Corbit Website'}
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionPill, styles.supportPill, isDark && styles.darkPill]}
          onPress={handleSupportClick}
          activeOpacity={0.8}
        >
          <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'}>
            {isRTL ? 'الدعم الفني' : 'Tech Support'}
          </AppText>
          <AppText variant="captionBold" color={isDark ? '#F8FAFC' : '#0A1D3D'}>
            support@corbit.sa
          </AppText>
        </TouchableOpacity>
      </View>

      {/* Copyright & Legal Links Row */}
      <View style={[styles.legalRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <AppText variant="caption" color={isDark ? '#64748B' : '#94A3B8'}>
          Corbit 2026 ©
        </AppText>

        <View style={styles.legalLinks}>
          <TouchableOpacity onPress={() => {}}>
            <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'}>
              {isRTL ? 'الخصوصية' : 'Privacy'}
            </AppText>
          </TouchableOpacity>
          <AppText variant="caption" color={isDark ? '#475467' : '#CBD5E1'}>
            •
          </AppText>
          <TouchableOpacity onPress={() => {}}>
            <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'}>
              {isRTL ? 'الشروط' : 'Terms'}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  pillsRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  actionPill: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
      },
      default: {
        elevation: 1,
      },
    }),
  },
  darkPill: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
  },
  websitePill: {
    borderColor: '#D5E2F8',
  },
  supportPill: {
    borderColor: '#E2E8F0',
  },
  blueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.brandPrimary,
  },
  legalRow: {
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

export default AuthFooter;
