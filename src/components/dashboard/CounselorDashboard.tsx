import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import { Icon } from '../common/Icon';
import { CounselorDashboardData } from '../../types/dashboard';

interface CounselorDashboardProps {
  dashboardData?: CounselorDashboardData | any;
  liveTasks?: any[];
  onRefresh?: () => void;
}

export const CounselorDashboard: React.FC<CounselorDashboardProps> = ({
  dashboardData,
}) => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { isRTL } = useAppDirection();

  const { user, school, hasAnyPermission } = useAuthStore();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  const formattedDate = useMemo(() => {
    try {
      const now = new Date();
      if (isRTL) {
        return new Intl.DateTimeFormat('ar-SA', {
          day: '2-digit',
          month: 'long',
        }).format(now);
      }
      return new Intl.DateTimeFormat('en-US', {
        day: '2-digit',
        month: 'short',
      }).format(now);
    } catch {
      return '';
    }
  }, [isRTL]);

  const kpis = dashboardData?.kpis;
  const atriskCount = kpis?.atrisk_cases != null ? kpis.atrisk_cases : '—';
  const pendingSummons = kpis?.pending_summons != null ? kpis.pending_summons : '—';
  const monthlySessions = kpis?.monthly_sessions != null ? kpis.monthly_sessions : '—';
  const resolvedCases = kpis?.resolved_cases != null ? kpis.resolved_cases : '—';
  const todaySessions = kpis?.today_sessions != null ? kpis.today_sessions : '—';

  const priorities: any[] = Array.isArray(dashboardData?.priorities) ? dashboardData.priorities : [];
  const sessions: any[] = Array.isArray(dashboardData?.today_sessions) ? dashboardData.today_sessions : [];

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {/* 1. Header */}
      <View style={[styles.headerBanner, isDark && styles.darkHeaderBanner]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerInfoGroup, isRTL && styles.alignEnd]}>
            <Text style={[styles.greetingText, isDark && styles.darkText, isRTL ? styles.rtlText : styles.ltrText]}>
              {t('dashboard.welcomeBack', 'لوحة التوجيه والإرشاد')} — {user?.name || '—'}
            </Text>
            <Text style={[styles.schoolSubtext, isDark && styles.darkSubtext, isRTL ? styles.rtlText : styles.ltrText]}>
              {school?.name || '—'}
            </Text>
          </View>

          <View style={[styles.headerActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {formattedDate ? (
              <View style={[styles.dateChip, isDark && styles.darkChip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="calendar" size={14} color={isDark ? '#CBD5E1' : '#344054'} />
                <Text style={[styles.dateChipText, isDark && styles.darkChipText]}>{formattedDate}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryActionBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => navigation.navigate('AtRisk')}
              accessibilityRole="button"
              accessibilityLabel={t('navigation.at_risk', 'الطلاب المتعثرون')}
            >
              <Icon name="alertTriangle" size={14} color="#FFFFFF" />
              <Text style={styles.primaryActionBtnText}>
                {t('navigation.at_risk', 'الطلاب المتعثرون')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 2. KPIs Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.kpiRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* At-Risk */}
        <View style={[styles.kpiCard, styles.kpiPinkBorder, isDark && styles.darkCard]}>
          <View style={[styles.kpiCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCirclePink}>
              <Icon name="alertTriangle" size={18} color="#F04438" />
            </View>
            <Text style={[styles.kpiValue, { color: '#F04438' }]}>{atriskCount}</Text>
          </View>
          <Text style={[styles.kpiLabel, isDark && styles.darkSubtext, isRTL ? styles.rtlText : styles.ltrText]}>
            {t('navigation.at_risk', 'حالات التعثر')}
          </Text>
        </View>

        {/* Summons */}
        <View style={[styles.kpiCard, styles.kpiYellowBorder, isDark && styles.darkCard]}>
          <View style={[styles.kpiCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCircleYellow}>
              <Icon name="email" size={18} color="#F79009" />
            </View>
            <Text style={[styles.kpiValue, { color: '#F79009' }]}>{pendingSummons}</Text>
          </View>
          <Text style={[styles.kpiLabel, isDark && styles.darkSubtext, isRTL ? styles.rtlText : styles.ltrText]}>
            {t('navigation.summons', 'استدعاءات معلقة')}
          </Text>
        </View>

        {/* Today's Sessions */}
        <View style={[styles.kpiCard, styles.kpiBlueBorder, isDark && styles.darkCard]}>
          <View style={[styles.kpiCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCircleBlue}>
              <Icon name="calendar" size={18} color="#1246B7" />
            </View>
            <Text style={[styles.kpiValue, { color: '#1246B7' }]}>{todaySessions}</Text>
          </View>
          <Text style={[styles.kpiLabel, isDark && styles.darkSubtext, isRTL ? styles.rtlText : styles.ltrText]}>
            {t('counselor.today_sessions', 'جلسات اليوم')}
          </Text>
        </View>

        {/* Monthly Sessions */}
        <View style={[styles.kpiCard, styles.kpiGreenBorder, isDark && styles.darkCard]}>
          <View style={[styles.kpiCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCircleGreen}>
              <Icon name="check" size={18} color="#12B76A" />
            </View>
            <Text style={[styles.kpiValue, { color: '#12B76A' }]}>{monthlySessions}</Text>
          </View>
          <Text style={[styles.kpiLabel, isDark && styles.darkSubtext, isRTL ? styles.rtlText : styles.ltrText]}>
            {t('counselor.monthly_sessions', 'جلسات الشهر')}
          </Text>
        </View>

        {/* Resolved */}
        <View style={[styles.kpiCard, styles.kpiTealBorder, isDark && styles.darkCard]}>
          <View style={[styles.kpiCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCircleTeal}>
              <Icon name="award" size={0} color="#0E9384" />
            </View>
            <Text style={[styles.kpiValue, { color: '#0E9384' }]}>{resolvedCases}</Text>
          </View>
          <Text style={[styles.kpiLabel, isDark && styles.darkSubtext, isRTL ? styles.rtlText : styles.ltrText]}>
            {t('counselor.resolved_cases', 'حالات محسومة')}
          </Text>
        </View>
      </ScrollView>

      {/* 3. Priority Cases & Sessions */}
      <View style={styles.grid}>
        {/* Priority Cases */}
        <View style={[styles.card, isDark && styles.darkCard]}>
          <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.cardHeaderTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="alertTriangle" size={18} color="#F04438" />
              <Text style={[styles.cardTitle, isDark && styles.darkText]}>
                {t('counselor.priority_cases', 'حالات ذات أولوية')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('AtRisk')}>
              <Text style={styles.viewAllLink}>{t('common.view_all', 'عرض الكل')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.itemList}>
            {priorities.length > 0 ? (
              priorities.map((item, idx) => (
                <View key={String(item.id || idx)} style={[styles.itemRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.itemBullet} />
                  <View style={[styles.itemDetails, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.itemTitle, isDark && styles.darkText, { textAlign: isRTL ? 'right' : 'left' }]}>{item.student_name || 'طالب'}</Text>
                    <Text style={[styles.itemSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>{item.reason || item.class_name || '—'}</Text>
                  </View>
                  <View style={[styles.badge, item.severity === 'high' ? styles.badgeHigh : styles.badgeMedium]}>
                    <Text style={styles.badgeText}>{item.severity === 'high' ? 'عاجل' : 'متابعة'}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
                  {t('counselor.no_priority_cases', 'لا توجد حالات ذات أولوية مسجلة')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Today's Counseling Sessions */}
        <View style={[styles.card, isDark && styles.darkCard]}>
          <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.cardHeaderTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="clock" size={18} color="#1246B7" />
              <Text style={[styles.cardTitle, isDark && styles.darkText]}>
                {t('counselor.today_sessions', 'جلسات اليوم')}
              </Text>
            </View>
          </View>

          <View style={styles.itemList}>
            {sessions.length > 0 ? (
              sessions.map((sess, idx) => (
                <View key={String(sess.id || idx)} style={[styles.itemRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={styles.timeTag}>{sess.time || '—'}</Text>
                  <View style={[styles.itemDetails, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                    <Text style={[styles.itemTitle, isDark && styles.darkText, { textAlign: isRTL ? 'right' : 'left' }]}>{sess.student_name || sess.title || 'جلسة إرشادية'}</Text>
                    <Text style={[styles.itemSubtitle, { textAlign: isRTL ? 'right' : 'left' }]}>{sess.class_name || '—'}</Text>
                  </View>
                  <View style={styles.badgeSuccess}>
                    <Text style={styles.badgeSuccessText}>{sess.status || 'مجدولة'}</Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyBox}>
                <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
                  {t('counselor.no_today_sessions', 'لا توجد جلسات إرشادية مجدولة اليوم')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 4. Quick Actions */}
      <View style={[styles.quickActionsBox, isDark && styles.darkCard]}>
        <Text style={[styles.quickActionsTitle, isDark && styles.darkText, isRTL ? styles.rtlText : styles.ltrText]}>
          ⚡ {t('teacher_dashboard.quick_actions', 'إجراءات سريعة')}
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.quickActionsScroll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {hasAnyPermission('at_risk.view') && (
            <TouchableOpacity style={styles.actionChip} onPress={() => navigation.navigate('AtRisk')}>
              <Icon name="alertTriangle" size={16} color="#1246B7" />
              <Text style={styles.actionChipText}>{t('navigation.at_risk', 'الطلاب المتعثرون')}</Text>
            </TouchableOpacity>
          )}

          {hasAnyPermission('summons.view') && (
            <TouchableOpacity style={styles.actionChip} onPress={() => navigation.navigate('Summons')}>
              <Icon name="email" size={16} color="#1246B7" />
              <Text style={styles.actionChipText}>{t('navigation.summons', 'استدعاء أولياء الأمور')}</Text>
            </TouchableOpacity>
          )}

          {hasAnyPermission('behavior.view') && (
            <TouchableOpacity style={styles.actionChip} onPress={() => navigation.navigate('Behavior')}>
              <Icon name="shield" size={16} color="#1246B7" />
              <Text style={styles.actionChipText}>{t('navigation.behavior', 'المخالفات والسلوك')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.actionChip} onPress={() => navigation.navigate('Tasks')}>
            <Icon name="check" size={16} color="#1246B7" />
            <Text style={styles.actionChipText}>{t('navigation.tasks', 'المهام')}</Text>
          </TouchableOpacity>

          {hasAnyPermission('schedule.view') && (
            <TouchableOpacity style={styles.actionChip} onPress={() => navigation.navigate('Schedule')}>
              <Icon name="calendar" size={16} color="#1246B7" />
              <Text style={styles.actionChipText}>{t('navigation.schedule', 'الجدول')}</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 14, gap: 14 },
  headerBanner: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E1E7F0' },
  darkHeaderBanner: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 },
headerInfoGroup: { flex: 1, minWidth: 180 },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  greetingText: { fontSize: 16, fontWeight: '700', color: '#0A1D3D', marginBottom: 4 },
  schoolSubtext: { fontSize: 12, color: '#77839B', fontWeight: '500' },
  darkText: { color: '#F8FAFC' },
  darkSubtext: { color: '#94A3B8' },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
  headerActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F2F4F7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  darkChip: { backgroundColor: '#1E293B' },
  dateChipText: { fontSize: 11, fontWeight: '600', color: '#344054' },
  darkChipText: { color: '#CBD5E1' },
  primaryActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1246B7', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  primaryActionBtnText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  kpiRow: { flexDirection: 'row', gap: 10, paddingVertical: 2 },
  kpiCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, minWidth: 135, borderWidth: 1, borderColor: '#E1E7F0' },
  darkCard: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  kpiGreenBorder: { borderTopWidth: 3, borderTopColor: '#12B76A' },
  kpiBlueBorder: { borderTopWidth: 3, borderTopColor: '#1246B7' },
  kpiTealBorder: { borderTopWidth: 3, borderTopColor: '#0E9384' },
  kpiYellowBorder: { borderTopWidth: 3, borderTopColor: '#F79009' },
  kpiPinkBorder: { borderTopWidth: 3, borderTopColor: '#F04438' },
  kpiCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  iconCircleGreen: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ECFDF3', justifyContent: 'center', alignItems: 'center' },
  iconCircleBlue: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF4FF', justifyContent: 'center', alignItems: 'center' },
  iconCircleTeal: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F0FDF9', justifyContent: 'center', alignItems: 'center' },
  iconCircleYellow: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FFFAEB', justifyContent: 'center', alignItems: 'center' },
  iconCirclePink: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#FEF3F2', justifyContent: 'center', alignItems: 'center' },
  kpiValue: { fontSize: 20, fontWeight: '800' },
  kpiLabel: { fontSize: 11, fontWeight: '600', color: '#475467' },
  grid: { gap: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E1E7F0' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardHeaderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#0A1D3D' },
  viewAllLink: { fontSize: 12, fontWeight: '600', color: '#1246B7' },
  itemList: { gap: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F2F4F7' },
  itemBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#F04438' },
  itemDetails: { flex: 1 },
  itemTitle: { fontSize: 13, fontWeight: '600', color: '#0A1D3D' },
  itemSubtitle: { fontSize: 10, color: '#77839B', marginTop: 2 },
  timeTag: { fontSize: 11, fontWeight: '700', color: '#1246B7', minWidth: 45 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeHigh: { backgroundColor: '#FEF3F2' },
  badgeMedium: { backgroundColor: '#FFFAEB' },
  badgeText: { fontSize: 10, fontWeight: '700', color: '#F04438' },
  badgeSuccess: { backgroundColor: '#ECFDF3', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeSuccessText: { fontSize: 10, fontWeight: '700', color: '#12B76A' },
  quickActionsBox: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#E1E7F0' },
  quickActionsTitle: { fontSize: 14, fontWeight: '700', color: '#0A1D3D', marginBottom: 12 },
  quickActionsScroll: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  actionChipText: { fontSize: 12, fontWeight: '600', color: '#1246B7' },
  emptyBox: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 12, color: '#77839B', textAlign: 'center' },
});

export default CounselorDashboard;
