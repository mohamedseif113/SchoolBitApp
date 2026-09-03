import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '../../theme/colors';
import { ibmPlexArabicFontFamily } from '../../theme/typography';
import { useAuthStore } from '../../store/auth.store';
import { useAppDirection } from '../../hooks/useAppDirection';
import { Icon, IconName } from '../common/Icon';

export interface MenuItem {
  routeName: string;
  labelKey: string;
  defaultLabel: string;
  icon: IconName;
  permission?: string;
}

export const SECONDARY_MENU_ITEMS: MenuItem[] = [
  { routeName: 'Schedule', labelKey: 'navigation.schedule', defaultLabel: 'الجدول الدراسي', icon: 'calendar', permission: 'schedule.view' },
  { routeName: 'Messages', labelKey: 'navigation.messaging', defaultLabel: 'الرسائل والتنبيهات', icon: 'message', permission: 'messages.view' },
  { routeName: 'Reports', labelKey: 'navigation.reports', defaultLabel: 'التقارير والإحصائيات', icon: 'chart', permission: 'reports.view' },
  { routeName: 'Finance', labelKey: 'navigation.finance', defaultLabel: 'المالية والرسوم', icon: 'creditCard', permission: 'finance.view' },
  { routeName: 'Behavior', labelKey: 'navigation.behavior', defaultLabel: 'إدارة السلوك', icon: 'shield', permission: 'behavior.view' },
  { routeName: 'Summons', labelKey: 'navigation.summons', defaultLabel: 'استدعاء ولي الأمر', icon: 'fileText', permission: 'summons.view' },
  { routeName: 'Committees', labelKey: 'navigation.committees', defaultLabel: 'اللجان المدرسية', icon: 'building', permission: 'committees.view' },
  { routeName: 'Homework', labelKey: 'navigation.homework', defaultLabel: 'الواجبات والمهام', icon: 'bookOpen', permission: 'homework.view' },
  { routeName: 'HR', labelKey: 'navigation.hr', defaultLabel: 'الموارد البشرية', icon: 'staff', permission: 'hr.view' },
  { routeName: 'Portfolio', labelKey: 'navigation.portfolio', defaultLabel: 'ملفات الأداء', icon: 'award', permission: 'portfolio.view' },
  { routeName: 'ExamDistribution', labelKey: 'navigation.exam_distribution', defaultLabel: 'توزيع الامتحانات', icon: 'grid', permission: 'exams.view' },
  { routeName: 'AtRisk', labelKey: 'navigation.at_risk', defaultLabel: 'الطلاب المتعثرون', icon: 'alertTriangle', permission: 'at_risk.view' },
  { routeName: 'Noor', labelKey: 'navigation.noor', defaultLabel: 'مزامنة نظام نور', icon: 'school', permission: 'noor.view' },
  { routeName: 'Integrations', labelKey: 'navigation.integrations', defaultLabel: 'الربط البرمجي', icon: 'link', permission: 'integrations.manage' },
  { routeName: 'WhatsApp', labelKey: 'navigation.whatsapp', defaultLabel: 'بوابة الواتساب', icon: 'phone', permission: 'whatsapp.manage' },
  { routeName: 'Settings', labelKey: 'navigation.settings', defaultLabel: 'الإعدادات', icon: 'settings' },
];

interface MoreMenuModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectModule: (routeName: string) => void;
  currentRoute?: string;
}

export const MoreMenuModal: React.FC<MoreMenuModalProps> = ({
  visible,
  onClose,
  onSelectModule,
  currentRoute,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useAppDirection();

  const isOwner = useAuthStore((s) => s.isOwner);
  const permissions = useAuthStore((s) => s.permissions);
  const role = (useAuthStore((s) => s.role) || '').toLowerCase();
  const logout = useAuthStore((s) => s.logout);

  const isPortalUser =
    role.includes('student') ||
    role.includes('parent') ||
    ['طالب', 'طالبة', 'ولي أمر', 'ولي_أمر'].includes(role);

  // Filter modules based on authorization & role
  const availableItems = SECONDARY_MENU_ITEMS.filter((item) => {
    if (isPortalUser) {
      return item.routeName === 'Settings';
    }
    if (isOwner) return true;
    if (!item.permission) return true;
    if (permissions.length === 0) return true;
    return permissions.includes(item.permission);
  });

  const handleLogout = () => {
    Alert.alert(
      t('auth.logout', 'تسجيل الخروج'),
      t('auth.logout_confirm', 'هل أنت متأكد أنك تريد تسجيل الخروج؟'),
      [
        { text: t('auth.cancel', 'إلغاء'), style: 'cancel' },
        {
          text: t('auth.logout', 'تسجيل الخروج'),
          style: 'destructive',
          onPress: async () => {
            onClose();
            await logout();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => { }}>
            <View style={styles.sheetContainer}>
              {/* Sheet Indicator Handle */}
              <View style={styles.handleBar} />

              {/* Title Header */}
              <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.titleText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {t('navigation.more_menu', 'المزيد من الخدمات والوحدات')}
                </Text>
                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel={t('common.close', 'إغلاق')}
                >
                  <Icon name="close" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* 2-Column Responsive Grid + Account Section */}
              <ScrollView contentContainerStyle={styles.scrollGrid} showsVerticalScrollIndicator={false}>
                <View style={[styles.gridContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {availableItems.map((item) => {
                    const isActive = currentRoute === item.routeName;
                    return (
                      <TouchableOpacity
                        key={item.routeName}
                        style={[styles.gridCard, isActive && styles.gridCardActive]}
                        onPress={() => {
                          onSelectModule(item.routeName);
                          onClose();
                        }}
                        accessibilityRole="button"
                        accessibilityLabel={t(item.labelKey, item.defaultLabel)}
                      >
                        <View style={[styles.cardInnerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <Icon
                            name={item.icon}
                            size={20}
                            color={isActive ? colors.brandPrimary || '#1D4ED8' : colors.navy}
                          />
                          <Text style={[styles.cardLabel, isActive && styles.cardLabelActive, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                            {t(item.labelKey, item.defaultLabel)}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Dedicated Global Logout Action */}
                <View style={styles.accountSection}>
                  <TouchableOpacity
                    style={[styles.logoutBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={handleLogout}
                    accessibilityRole="button"
                    accessibilityLabel={t('auth.logout', 'تسجيل الخروج')}
                  >
                    <Icon name="logOut" size={18} color="#D92D20" />
                    <Text style={styles.logoutText}>
                      {t('auth.logout', 'تسجيل الخروج')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(10, 29, 61, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: Dimensions.get('window').height * 0.75,
    elevation: 12,
    shadowColor: '#0A1D3D',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D5DD',
    alignSelf: 'center',
    marginBottom: 12,
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
  },
  titleText: {
    fontSize: 18.5,
    fontFamily: ibmPlexArabicFontFamily.bold,
    fontWeight: '800',
    color: '#0A1D3D',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
  },
  scrollGrid: {
    paddingBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  gridCardActive: {
    backgroundColor: '#EFF4FF',
    borderColor: '#1D4ED8',
  },
  cardInnerRow: {
    alignItems: 'center',
    gap: 10,
  },
  cardLabel: {
    fontSize: 14.5,
    fontFamily: ibmPlexArabicFontFamily.semiBold,
    fontWeight: '600',
    color: '#344054',
    flex: 1,
  },
  cardLabelActive: {
    color: '#1D4ED8',
    fontFamily: ibmPlexArabicFontFamily.bold,
    fontWeight: '800',
  },
  accountSection: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 14,
  },
  logoutBtn: {
    backgroundColor: '#FEF3F2',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#FEE4E2',
  },
  logoutText: {
    fontSize: 16,
    fontFamily: ibmPlexArabicFontFamily.bold,
    fontWeight: '800',
    color: '#D92D20',
  },
});

export default MoreMenuModal;
