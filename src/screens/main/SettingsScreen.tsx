import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { ibmPlexArabicFontFamily } from '../../theme/typography';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import { useAppDirection } from '../../hooks/useAppDirection';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';

export default function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();

  const { user, school, role, isOwner, hasPermission, logout } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();
  const queryClient = useQueryClient();

  const isDark = theme === 'dark';
  const canManageAdminSettings = isOwner || hasPermission('settings.manage') || hasPermission('school.manage');

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout', 'تسجيل الخروج'),
      t('auth.logout_confirm', 'هل أنت متأكد أنك تريد تسجيل الخروج؟'),
      [
        { text: t('common.cancel', 'إلغاء'), style: 'cancel' },
        {
          text: t('auth.logout', 'تسجيل الخروج'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            queryClient.clear();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkContainer]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <AppText variant="h1" weight="bold" style={styles.title}>
          {t('navigation.settings', 'الإعدادات والتفضيلات')}
        </AppText>
        <AppText variant="subtitle" color={isDark ? '#94A3B8' : '#77839B'} style={styles.subtitle}>
          {isRTL ? 'إعدادات الحساب والتطبيق وتفضيلات النظام' : 'Account profile, appearance & preferences'}
        </AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Section 1: Account Profile Card */}
        <View style={[styles.card, isDark && styles.darkCard, styles.profileCard]}>
          <View style={[styles.avatar, isDark && styles.darkAvatar]}>
            <Text style={styles.avatarText}>
              {(user?.name || 'User').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={[styles.profileInfo, styles.alignStart]}>
            <AppText variant="cardTitle" weight="bold" style={styles.userName}>
              {user?.name || (isRTL ? 'مستخدم المنصة' : 'User')}
            </AppText>
            <AppText variant="caption" color={isDark ? '#94A3B8' : '#77839B'} style={styles.userEmail}>
              {user?.email || 'user@school.sa'}
            </AppText>
            <View style={[styles.roleBadgeContainer]}>
              <AppText variant="captionBold" color="#1246B7" style={styles.schoolName}>
                {school?.name || 'SchoolBit'}
              </AppText>
              {role && (
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>{String(role).toUpperCase()}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Section 2: App Preferences */}
        <View style={[styles.card, isDark && styles.darkCard]}>
          <AppText variant="cardTitle" weight="bold" style={styles.sectionTitle}>
            ⚙️ {isRTL ? 'التفضيلات والمظهر' : 'Preferences & Appearance'}
          </AppText>

          {/* Dark Mode Toggle */}
          <View style={[styles.row]}>
            <View style={[styles.rowLeft]}>
              <Icon name={isDark ? 'moon' : 'sun'} size={20} color={isDark ? '#FFD700' : '#1246B7'} />
              <AppText variant="bodyBold" style={styles.rowLabel}>
                {isRTL ? 'المظهر الداكن' : 'Dark Theme'}
              </AppText>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#D0D5DD', true: '#1246B7' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section 3: Logout Action */}
        <View style={[styles.card, isDark && styles.darkCard]}>
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityRole="button"
          >
            <Text style={styles.logoutText}>🚪 {t('auth.logout', 'تسجيل الخروج')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  darkContainer: { backgroundColor: '#07132B' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 4,
  },
  darkHeader: { backgroundColor: '#0F244A', borderBottomColor: '#1E3A6E' },
  title: { fontSize: 23, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  subtitle: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular },
  content: { padding: 14, gap: 12 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  profileCard: {
    gap: 14,
    alignItems: 'center',
  },
  darkCard: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#1246B7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  darkAvatar: { backgroundColor: '#1E3A6E' },
  avatarText: { fontSize: 20, color: '#FFFFFF', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  profileInfo: { flex: 1, gap: 2 },
  userName: { fontSize: 17.5, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  userEmail: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.regular },
  roleBadgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  schoolName: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.regular },
  rolePill: { backgroundColor: '#EEF4FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  rolePillText: { fontSize: 12, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#1246B7' },
  sectionTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', marginBottom: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular },
  logoutButton: {
    backgroundColor: '#FEE4E2',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FDA29B',
  },
  logoutText: { color: '#D92D20', fontSize: 15, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  ltrRow: { flexDirection: 'row' },
  alignStart: { alignItems: 'flex-start' },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
});
