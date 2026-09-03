import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { useAppDirection } from '../../hooks/useAppDirection';

interface AccessDeniedScreenProps {
  messageKey?: string;
  defaultMessage?: string;
}

export const AccessDeniedScreen: React.FC<AccessDeniedScreenProps> = ({
  messageKey = 'errors.access_denied',
  defaultMessage = 'ليس لديك صلاحية للوصول إلى هذه الصفحة',
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { isRTL } = useAppDirection();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>🛡️</Text>
        </View>

        <Text style={[styles.title, isRTL ? styles.rtlText : styles.ltrText]}>
          {t('errors.access_denied_title', 'غير مصرح')}
        </Text>

        <Text style={[styles.message, isRTL ? styles.rtlText : styles.ltrText]}>
          {t(messageKey, defaultMessage)}
        </Text>

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs' as never);
            }
          }}
          accessibilityRole="button"
          accessibilityLabel={t('common.back', 'رجوع')}
        >
          <Text style={styles.backBtnText}>
            {isRTL ? 'العودة للرئيسية ↩️' : '⬅️ Return to Main'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F2F4F7',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE4E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0A1D3D',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#5A6784',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  backBtn: {
    backgroundColor: '#1246B7',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    elevation: 2,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  rtlText: {
    textAlign: 'center',
  },
  ltrText: {
    textAlign: 'center',
  },
});

export default AccessDeniedScreen;
