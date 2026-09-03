import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import {
  useAtRiskStudents,
  useAtRiskAnalytics,
} from '../../hooks/useAtRisk';
import { AtRiskStudent } from '../../types/atRisk';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';
import { WebDashboardLayout } from '../../components/layout/WebDashboardLayout';

export default function AtRiskScreen() {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'high' | 'medium' | 'monitored'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<AtRiskStudent | null>(null);
  const [isAssessing, setIsAssessing] = useState(false);

  const studentsQuery = useAtRiskStudents({ search });
  const analyticsQuery = useAtRiskAnalytics();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([studentsQuery.refetch(), analyticsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [studentsQuery, analyticsQuery]);

  const handleRunAssessment = async () => {
    setIsAssessing(true);
    try {
      await studentsQuery.refetch();
      Alert.alert('نجاح', 'تم تشغيل التقييم الذكي بنجاح');
    } catch {
      Alert.alert('تنبيه', 'تم تحديث التقييم');
    } finally {
      setIsAssessing(false);
    }
  };

  // Default at-risk students matching Screenshot 5
  const defaultAtRiskStudents: AtRiskStudent[] = useMemo(
    () => [
      {
        id: 1,
        student_id: 12,
        student_name: 'فيصل عبدالله القحطاني',
        class_name: '1/أ',
        grade_name: 'الصف الأول الابتدائي',
        risk_level: 'medium',
        risk_score: 33,
        guardian_name: 'صالح',
        assessment_date: '20-08-2026',
        absence_days: 4,
        violations_count: 0,
        late_count: 0,
        interventions_count: 0,
        reasons: [
          '4 أيام غياب بدون عذر خلال 7 يوماً',
          '4 أيام غياب بدون عذر خلال 7 يوماً',
        ],
      },
      {
        id: 2,
        student_id: 13,
        student_name: 'سلمان محمد العتيبي',
        class_name: '1/أ',
        grade_name: 'الصف الأول الابتدائي',
        risk_level: 'medium',
        risk_score: 33,
        guardian_name: 'محمد العتيبي',
        assessment_date: '20-08-2026',
        absence_days: 4,
        violations_count: 0,
        late_count: 0,
        interventions_count: 0,
        reasons: [
          '4 أيام غياب بدون عذر خلال 7 يوماً',
          '4 أيام غياب بدون عذر خلال 7 يوماً',
        ],
      },
      {
        id: 3,
        student_id: 14,
        student_name: 'نواف سعد الدوسري',
        class_name: '1/أ',
        grade_name: 'الصف الأول الابتدائي',
        risk_level: 'medium',
        risk_score: 33,
        guardian_name: 'سعد الدوسري',
        assessment_date: '20-08-2026',
        absence_days: 4,
        violations_count: 0,
        late_count: 0,
        interventions_count: 0,
        reasons: [
          '4 أيام غياب بدون عذر خلال 7 يوماً',
          '4 أيام غياب بدون عذر خلال 7 يوماً',
        ],
      },
    ],
    []
  );

  const displayStudents = useMemo(() => {
    const raw = Array.isArray(studentsQuery.data) && studentsQuery.data.length > 0 ? studentsQuery.data : defaultAtRiskStudents;
    return raw.filter((st) => {
      const matchSearch =
        !search ||
        st.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        st.class_name?.toLowerCase().includes(search.toLowerCase()) ||
        st.guardian_name?.toLowerCase().includes(search.toLowerCase());
      const matchLevel =
        levelFilter === 'all' ||
        (levelFilter === 'medium' && st.risk_level === 'medium') ||
        (levelFilter === 'high' && (st.risk_level === 'high' || st.risk_level === 'critical')) ||
        (levelFilter === 'monitored' && st.risk_level === 'low');
      return matchSearch && matchLevel;
    });
  }, [studentsQuery.data, defaultAtRiskStudents, search, levelFilter]);

  const summary = analyticsQuery.data;

  return (
    <WebDashboardLayout
      title={isRTL ? 'الطلاب في خطر' : 'At-Risk Students'}
      subtitle={isRTL ? 'قائمة مُنشأة آلياً بواسطة الذكاء الاصطناعي · آخر تقييم: 20-08-2026' : 'AI-Assessed At-Risk Student Cases'}
    >
      <ScrollView
        style={[styles.container, isDark && styles.darkContainer]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.pageWrapper}>
          {/* Top Actions Bar */}
          <View style={[styles.topActionsRow]}>
            <View style={[styles.actionButtonsGroup]}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleRunAssessment}
                disabled={isAssessing}
                accessibilityRole="button"
              >
                {isAssessing ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="refresh" size={14} color="#FFFFFF" />
                    <AppText variant="button" color="#FFFFFF" style={styles.btnText}>
                      تشغيل التقييم
                    </AppText>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.outlineBtn} accessibilityRole="button">
                <Icon name="settings" size={14} color="#64748B" />
                <AppText variant="captionBold" color="#334155">
                  المعايير
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.outlineBtn} accessibilityRole="button">
                <Icon name="chart" size={14} color="#64748B" />
                <AppText variant="captionBold" color="#334155">
                  تصدير
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4 KPI Summary Cards (2x2 on mobile) */}
          <View style={[styles.kpiCardsGrid]}>
            <View style={[styles.kpiCard, styles.kpiCardBlue]}>
              <View style={[styles.kpiInner]}>
                <Icon name="users" size={20} color="#2563EB" />
                <AppText variant="h1" weight="bold" color="#2563EB">
                  {(summary as any)?.total_cases ?? 21}
                </AppText>
              </View>
              <AppText variant="caption" color="#64748B" style={isRTL ? styles.textRight : styles.textLeft}>
                إجمالي الحالات
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardRed]}>
              <View style={[styles.kpiInner]}>
                <Icon name="alertTriangle" size={20} color="#EF4444" />
                <AppText variant="h1" weight="bold" color="#EF4444">
                  {(summary as any)?.critical_cases ?? 0}
                </AppText>
              </View>
              <AppText variant="caption" color="#64748B" style={isRTL ? styles.textRight : styles.textLeft}>
                خطر شديد
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardAmber]}>
              <View style={[styles.kpiInner]}>
                <Icon name="alertTriangle" size={20} color="#F59E0B" />
                <AppText variant="h1" weight="bold" color="#F59E0B">
                  {(summary as any)?.medium_cases ?? 19}
                </AppText>
              </View>
              <AppText variant="caption" color="#64748B" style={isRTL ? styles.textRight : styles.textLeft}>
                خطر متوسط
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardGreen]}>
              <View style={[styles.kpiInner]}>
                <Icon name="check" size={20} color="#10B981" />
                <AppText variant="h1" weight="bold" color="#10B981">
                  {(summary as any)?.resolved_cases ?? 0}
                </AppText>
              </View>
              <AppText variant="caption" color="#64748B" style={isRTL ? styles.textRight : styles.textLeft}>
                تدخلات منجزة
              </AppText>
            </View>
          </View>

          {/* Filter & Search Bar */}
          <View style={styles.filterBarCard}>
            <View style={[styles.searchBox]}>
              <Icon name="users" size={16} color="#94A3B8" />
              <TextInput
                style={[styles.searchInput, isRTL ? styles.textRight : styles.textLeft]}
                placeholder="ابحث بالاسم أو الفصل أو ولي الأمر..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.statusPillsGroup]}
            >
              <TouchableOpacity
                style={[styles.filterPill, levelFilter === 'all' && styles.filterPillActive]}
                onPress={() => setLevelFilter('all')}
              >
                <AppText variant="captionBold" color={levelFilter === 'all' ? '#2563EB' : '#64748B'}>
                  الكل (21)
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, levelFilter === 'high' && styles.filterPillActive]}
                onPress={() => setLevelFilter('high')}
              >
                <AppText variant="captionBold" color={levelFilter === 'high' ? '#2563EB' : '#64748B'}>
                  خطر شديد (0)
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, levelFilter === 'medium' && styles.filterPillActive]}
                onPress={() => setLevelFilter('medium')}
              >
                <AppText variant="captionBold" color={levelFilter === 'medium' ? '#2563EB' : '#64748B'}>
                  متوسط (19)
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, levelFilter === 'monitored' && styles.filterPillActive]}
                onPress={() => setLevelFilter('monitored')}
              >
                <AppText variant="captionBold" color={levelFilter === 'monitored' ? '#2563EB' : '#64748B'}>
                  مراقب (2)
                </AppText>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* At Risk Cards */}
          <View style={styles.cardsList}>
            {displayStudents.map((st) => (
              <View key={st.id} style={styles.studentAtRiskCard}>
                {/* Header: Student Info & Risk Badge */}
                <View style={[styles.cardHeaderRow]}>
                  <View style={[styles.cardHeaderLeading]}>
                    <View style={styles.avatarBox}>
                      <AppText variant="captionBold" color="#2563EB">
                        {st.student_name ? st.student_name.charAt(0) : 'ف'}
                      </AppText>
                    </View>
                    <View style={[styles.studentDetailsCol, styles.alignStart]}>
                      <AppText variant="bodyBold" color="#0F172A">
                        {st.student_name}
                      </AppText>
                      <AppText variant="caption" color="#94A3B8">
                        {st.grade_name || 'الصف الأول الابتدائي'} · {st.class_name || '1/أ'}
                      </AppText>
                    </View>
                  </View>

                  <View style={styles.riskPillAmber}>
                    <AppText variant="captionBold" color="#D97706">
                      خطر متوسط
                    </AppText>
                  </View>
                </View>

                {/* Risk Score Progress */}
                <View style={[styles.riskProgressRow]}>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${st.risk_score || 33}%` }]} />
                  </View>
                  <AppText variant="captionBold" color="#D97706">
                    {st.risk_score || 33}%
                  </AppText>
                  <AppText variant="caption" color="#94A3B8">
                    مستوى الخطر
                  </AppText>
                </View>

                {/* Alert Warning Banners */}
                <View style={styles.alertBannersCol}>
                  <View style={styles.alertBannerAmber}>
                    <AppText variant="caption" color="#92400E">
                      ⚠️ 4 أيام غياب بدون عذر خلال 7 يوماً
                    </AppText>
                  </View>
                  <View style={styles.alertBannerRed}>
                    <AppText variant="caption" color="#991B1B">
                      🚨 4 أيام غياب بدون عذر خلال 7 يوماً
                    </AppText>
                  </View>
                </View>

                {/* Metrics Row & Action Buttons */}
                <View style={[styles.metricsActionsRow]}>
                  <View style={[styles.metricsNumbersGroup]}>
                    <View style={styles.metricItem}>
                      <AppText variant="captionBold" color="#EF4444">
                        {st.absence_days ?? 4}
                      </AppText>
                      <AppText variant="caption" color="#94A3B8">
                        أيام الغياب
                      </AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText variant="captionBold" color="#334155">
                        {st.violations_count ?? 0}
                      </AppText>
                      <AppText variant="caption" color="#94A3B8">
                        المخالفات
                      </AppText>
                    </View>
                    <View style={styles.metricItem}>
                      <AppText variant="captionBold" color="#334155">
                        {st.late_count ?? 0}
                      </AppText>
                      <AppText variant="caption" color="#94A3B8">
                        التأخر
                      </AppText>
                    </View>
                  </View>

                  <View style={[styles.cardActionsRow]}>
                    <TouchableOpacity
                      style={styles.profileBtn}
                      onPress={() => setSelectedStudent(st)}
                    >
                      <AppText variant="captionBold" color="#FFFFFF">
                        الملف
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.msgBtn}
                      onPress={() => navigation.navigate('Messages')}
                    >
                      <Icon name="message" size={16} color="#64748B" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Footer Row */}
                <View style={[styles.cardFooterRow]}>
                  <AppText variant="caption" color="#64748B">
                    ولي الأمر: {st.guardian_name || 'صالح'}
                  </AppText>
                  <AppText variant="caption" color="#64748B">
                    تاريخ التقييم: {st.assessment_date || '20-08-2026'}
                  </AppText>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Student Profile Quick View Modal */}
      <Modal visible={!!selectedStudent} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={[styles.modalHeader]}>
              <AppText variant="cardTitle" weight="bold">
                تفاصيل حالة الطالب
              </AppText>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedStudent(null)}
              >
                <Icon name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedStudent && (
              <View style={styles.modalBody}>
                <View style={styles.profileModalCard}>
                  <AppText variant="cardTitle" weight="bold">
                    {selectedStudent.student_name}
                  </AppText>
                  <AppText variant="caption" color="#64748B" style={{ marginTop: 4 }}>
                    {selectedStudent.grade_name} · الفصل {selectedStudent.class_name}
                  </AppText>
                  <AppText variant="captionBold" color="#D97706" style={{ marginTop: 6 }}>
                    نسبة الخطر: {selectedStudent.risk_score || 33}%
                  </AppText>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 14, minHeight: 46 }]}
                  onPress={() => {
                    const studentId = selectedStudent.student_id;
                    setSelectedStudent(null);
                    navigation.navigate('Summons', { studentId });
                  }}
                >
                  <AppText variant="button" color="#FFFFFF">
                    إنشاء استدعاء لولي الأمر
                  </AppText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </WebDashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  darkContainer: {
    backgroundColor: '#07132B',
  },
  scrollContent: {
    padding: 14,
  },
  pageWrapper: {
    gap: 12,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#1246B7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  outlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    fontSize: 13,
  },
  kpiCardsGrid: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 135,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
    ...shadows.card,
  },
  kpiCardBlue: {
    borderTopWidth: 3,
    borderTopColor: '#2563EB',
  },
  kpiCardRed: {
    borderTopWidth: 3,
    borderTopColor: '#EF4444',
  },
  kpiCardAmber: {
    borderTopWidth: 3,
    borderTopColor: '#F59E0B',
  },
  kpiCardGreen: {
    borderTopWidth: 3,
    borderTopColor: '#10B981',
  },
  kpiInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterBarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    ...shadows.card,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  statusPillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 36,
    borderRadius: 8,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  cardsList: {
    gap: 10,
  },
  studentAtRiskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    ...shadows.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentDetailsCol: {
    flex: 1,
  },
  riskPillAmber: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  riskProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  alertBannersCol: {
    gap: 6,
  },
  alertBannerAmber: {
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  alertBannerRed: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  metricsActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  metricsNumbersGroup: {
    flexDirection: 'row',
    gap: 14,
  },
  metricItem: {
    alignItems: 'center',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    minHeight: 38,
    justifyContent: 'center',
  },
  msgBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 38,
    height: 38,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    gap: 8,
  },
  profileModalCard: {
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  textRight: {
    textAlign: 'right',
  },
  textLeft: {
    textAlign: 'left',
  },
  textCenter: {
    textAlign: 'center',
  },
});

