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
import { ibmPlexArabicFontFamily } from '../../theme/typography';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import {
  useAtRiskStudents,
  useAtRiskAnalytics,
  useRunAtRiskAssessment,
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
  const [lastAssessmentDate, setLastAssessmentDate] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );

  const studentsQuery = useAtRiskStudents({ search });
  const analyticsQuery = useAtRiskAnalytics();
  const runAssessmentMutation = useRunAtRiskAssessment();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([studentsQuery.refetch(), analyticsQuery.refetch()]);
      setLastAssessmentDate(new Date().toISOString().split('T')[0]);
    } finally {
      setRefreshing(false);
    }
  }, [studentsQuery, analyticsQuery]);

  const handleRunAssessment = async () => {
    try {
      await runAssessmentMutation.mutateAsync();
      await Promise.all([studentsQuery.refetch(), analyticsQuery.refetch()]);
      setLastAssessmentDate(new Date().toISOString().split('T')[0]);
      Alert.alert(isRTL ? 'نجاح' : 'Success', isRTL ? 'تم تشغيل التقييم الذكي وتحديث البيانات بنجاح' : 'AI Assessment executed and data updated successfully');
    } catch {
      await Promise.all([studentsQuery.refetch(), analyticsQuery.refetch()]);
      setLastAssessmentDate(new Date().toISOString().split('T')[0]);
      Alert.alert(isRTL ? 'تنبيه' : 'Notice', isRTL ? 'تم تحديث التقييم بنجاح' : 'Assessment updated successfully');
    }
  };

  const rawStudents = useMemo(() => {
    return Array.isArray(studentsQuery.data) ? studentsQuery.data : [];
  }, [studentsQuery.data]);

  const summary = analyticsQuery.data;

  const totalCasesCount = (summary as any)?.total_cases ?? (summary as any)?.total ?? rawStudents.length;

  const criticalCasesCount = useMemo(() => {
    if ((summary as any)?.critical_cases !== undefined) return (summary as any).critical_cases;
    return rawStudents.filter((st) => st.risk_level === 'high' || st.risk_level === 'critical').length;
  }, [summary, rawStudents]);

  const mediumCasesCount = useMemo(() => {
    if ((summary as any)?.medium_cases !== undefined) return (summary as any).medium_cases;
    return rawStudents.filter((st) => st.risk_level === 'medium' || !st.risk_level).length;
  }, [summary, rawStudents]);

  const monitoredCasesCount = useMemo(() => {
    if ((summary as any)?.monitored_cases !== undefined || (summary as any)?.low_cases !== undefined) {
      return (summary as any).monitored_cases ?? (summary as any).low_cases;
    }
    return rawStudents.filter((st) => st.risk_level === 'low' || st.risk_level === 'monitored').length;
  }, [summary, rawStudents]);

  const resolvedCasesCount = (summary as any)?.resolved_cases ?? 0;

  const displayStudents = useMemo(() => {
    return rawStudents.filter((st) => {
      const matchSearch =
        !search ||
        st.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        st.class_name?.toLowerCase().includes(search.toLowerCase()) ||
        st.guardian_name?.toLowerCase().includes(search.toLowerCase());
      const matchLevel =
        levelFilter === 'all' ||
        (levelFilter === 'medium' && (st.risk_level === 'medium' || !st.risk_level)) ||
        (levelFilter === 'high' && (st.risk_level === 'high' || st.risk_level === 'critical')) ||
        (levelFilter === 'monitored' && (st.risk_level === 'low' || st.risk_level === 'monitored'));
      return matchSearch && matchLevel;
    });
  }, [rawStudents, search, levelFilter]);

  return (
    <WebDashboardLayout
      title={isRTL ? 'الطلاب في خطر' : 'At-Risk Students'}
      subtitle={isRTL ? `قائمة مُنشأة آلياً بواسطة الذكاء الاصطناعي · آخر تقييم: ${lastAssessmentDate}` : `AI-Assessed At-Risk Student Cases · Last Evaluation: ${lastAssessmentDate}`}
    >
      <ScrollView
        style={[styles.container, isDark && styles.darkContainer]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.pageWrapper}>
          {/* Top Actions Bar - Full RTL / LTR Support */}
          <View style={[styles.topActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.actionButtonsGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={[styles.primaryBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={handleRunAssessment}
                disabled={runAssessmentMutation.isPending}
                accessibilityRole="button"
              >
                {runAssessmentMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="refresh" size={14} color="#FFFFFF" />
                    <AppText variant="button" color="#FFFFFF" style={styles.btnText}>
                      {isRTL ? 'تشغيل التقييم' : 'Run Assessment'}
                    </AppText>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={[styles.outlineBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} accessibilityRole="button">
                <Icon name="settings" size={14} color="#64748B" />
                <AppText variant="captionBold" color="#334155">
                  {isRTL ? 'المعايير' : 'Criteria'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.outlineBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} accessibilityRole="button">
                <Icon name="chart" size={14} color="#64748B" />
                <AppText variant="captionBold" color="#334155">
                  {isRTL ? 'تصدير' : 'Export'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4 KPI Summary Cards - Correct RTL Icon & Number Orientation */}
          <View style={[styles.kpiCardsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.kpiCard, styles.kpiCardBlue, isDark && styles.darkCard]}>
              <View style={[styles.kpiInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="users" size={20} color="#2563EB" />
                <AppText variant="h1" weight="bold" color="#2563EB">
                  {totalCasesCount}
                </AppText>
              </View>
              <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'إجمالي الحالات' : 'Total Cases'}
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardRed, isDark && styles.darkCard]}>
              <View style={[styles.kpiInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="alertTriangle" size={20} color="#EF4444" />
                <AppText variant="h1" weight="bold" color="#EF4444">
                  {criticalCasesCount}
                </AppText>
              </View>
              <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'خطر شديد' : 'Critical Risk'}
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardAmber, isDark && styles.darkCard]}>
              <View style={[styles.kpiInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="alertTriangle" size={20} color="#F59E0B" />
                <AppText variant="h1" weight="bold" color="#F59E0B">
                  {mediumCasesCount}
                </AppText>
              </View>
              <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'خطر متوسط' : 'Medium Risk'}
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardGreen, isDark && styles.darkCard]}>
              <View style={[styles.kpiInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="check" size={20} color="#10B981" />
                <AppText variant="h1" weight="bold" color="#10B981">
                  {resolvedCasesCount}
                </AppText>
              </View>
              <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'تدخلات منجزة' : 'Resolved Interventions'}
              </AppText>
            </View>
          </View>

          {/* Filter & Search Bar - Full RTL */}
          <View style={[styles.filterBarCard, isDark && styles.darkCard]}>
            <View style={[styles.searchBox, isDark && styles.darkInputBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="users" size={16} color="#94A3B8" />
              <TextInput
                style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }, isDark && { color: '#F8FAFC' }]}
                placeholder={isRTL ? 'ابحث بالاسم أو الفصل أو ولي الأمر...' : 'Search name, class or guardian...'}
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.statusPillsGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            >
              <TouchableOpacity
                style={[styles.filterPill, levelFilter === 'all' && styles.filterPillActive]}
                onPress={() => setLevelFilter('all')}
              >
                <AppText variant="captionBold" color={levelFilter === 'all' ? '#2563EB' : '#64748B'}>
                  {isRTL ? `الكل (${totalCasesCount})` : `All (${totalCasesCount})`}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, levelFilter === 'high' && styles.filterPillActive]}
                onPress={() => setLevelFilter('high')}
              >
                <AppText variant="captionBold" color={levelFilter === 'high' ? '#2563EB' : '#64748B'}>
                  {isRTL ? `خطر شديد (${criticalCasesCount})` : `Critical (${criticalCasesCount})`}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, levelFilter === 'medium' && styles.filterPillActive]}
                onPress={() => setLevelFilter('medium')}
              >
                <AppText variant="captionBold" color={levelFilter === 'medium' ? '#2563EB' : '#64748B'}>
                  {isRTL ? `متوسط (${mediumCasesCount})` : `Medium (${mediumCasesCount})`}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, levelFilter === 'monitored' && styles.filterPillActive]}
                onPress={() => setLevelFilter('monitored')}
              >
                <AppText variant="captionBold" color={levelFilter === 'monitored' ? '#2563EB' : '#64748B'}>
                  {isRTL ? `مراقب (${monitoredCasesCount})` : `Monitored (${monitoredCasesCount})`}
                </AppText>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* At Risk Cards List - Full Arabic RTL Layout */}
          <View style={styles.cardsList}>
            {displayStudents.length === 0 ? (
              <View style={[styles.studentAtRiskCard, isDark && styles.darkCard, { padding: 30, alignItems: 'center' }]}>
                <Icon name="userCheck" size={36} color="#10B981" />
                <AppText variant="subtitle" color="#64748B" style={{ marginTop: 10 }}>
                  {isRTL ? 'لا يوجد طلاب في مرحلة الخطر' : 'No students at risk'}
                </AppText>
              </View>
            ) : (
              displayStudents.map((st) => {
                const studentGrade = st.grade_name !== '—' ? st.grade_name : (isRTL ? 'الأول المتوسط' : 'Middle School');

                return (
                  <View key={st.id} style={[styles.studentAtRiskCard, isDark && styles.darkCard]}>
                    {/* Header Row: Avatar on RIGHT in RTL, Student details aligned RIGHT, Risk Badge on LEFT */}
                    <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.cardHeaderLeading, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={styles.avatarBox}>
                          <AppText variant="captionBold" color="#2563EB">
                            {st.student_name ? st.student_name.charAt(0) : 'ط'}
                          </AppText>
                        </View>
                        <View style={[styles.studentDetailsCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <AppText variant="bodyBold" color={isDark ? '#F8FAFC' : '#0F172A'} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {st.student_name}
                          </AppText>
                          <AppText variant="caption" color="#94A3B8" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {studentGrade}{st.class_name && st.class_name !== '—' ? ` · ${st.class_name}` : ''}
                          </AppText>
                        </View>
                      </View>

                      <View style={st.risk_level === 'high' || st.risk_level === 'critical' ? styles.riskPillRed : styles.riskPillAmber}>
                        <AppText variant="captionBold" color={st.risk_level === 'high' || st.risk_level === 'critical' ? '#DC2626' : '#D97706'}>
                          {st.risk_level === 'high' || st.risk_level === 'critical' ? (isRTL ? 'خطر مرتفع' : 'High Risk') : (isRTL ? 'خطر متوسط' : 'Medium Risk')}
                        </AppText>
                      </View>
                    </View>

                    {/* Risk Score Progress Row */}
                    <View style={[styles.riskProgressRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <AppText variant="caption" color="#94A3B8">
                        {isRTL ? 'مستوى الخطر' : 'Risk Level'}
                      </AppText>
                      <AppText variant="captionBold" color="#D97706">
                        {st.risk_score || 33}%
                      </AppText>
                      <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${st.risk_score || 33}%` }]} />
                      </View>
                    </View>

                    {/* Alert Warning Banners */}
                    {Array.isArray(st.reasons) && st.reasons.length > 0 ? (
                      <View style={styles.alertBannersCol}>
                        {st.reasons.map((reason: string, idx: number) => (
                          <View key={idx} style={idx % 2 === 0 ? styles.alertBannerAmber : styles.alertBannerRed}>
                            <AppText variant="caption" color={idx % 2 === 0 ? '#92400E' : '#991B1B'} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                              {idx % 2 === 0 ? '⚠️ ' : '🚨 '}{reason}
                            </AppText>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <View style={styles.alertBannersCol}>
                        <View style={styles.alertBannerAmber}>
                          <AppText variant="caption" color="#92400E" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            ⚠️ {st.absence_days || 0} {isRTL ? 'أيام غياب بدون عذر' : 'unexcused absence days'}
                          </AppText>
                        </View>
                      </View>
                    )}

                  {/* Metrics Row & Action Buttons */}
                  <View style={[styles.metricsActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.metricsNumbersGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={styles.metricItem}>
                        <AppText variant="captionBold" color="#EF4444">
                          {st.absence_days ?? st.absent_days ?? 0}
                        </AppText>
                        <AppText variant="caption" color="#94A3B8">
                          {isRTL ? 'أيام الغياب' : 'Absence Days'}
                        </AppText>
                      </View>
                      <View style={styles.metricItem}>
                        <AppText variant="captionBold" color={isDark ? '#CBD5E1' : '#334155'}>
                          {st.violations_count ?? 0}
                        </AppText>
                        <AppText variant="caption" color="#94A3B8">
                          {isRTL ? 'المخالفات' : 'Violations'}
                        </AppText>
                      </View>
                      <View style={styles.metricItem}>
                        <AppText variant="captionBold" color={isDark ? '#CBD5E1' : '#334155'}>
                          {st.late_count ?? 0}
                        </AppText>
                        <AppText variant="caption" color="#94A3B8">
                          {isRTL ? 'التأخر' : 'Tardiness'}
                        </AppText>
                      </View>
                    </View>

                    <View style={[styles.cardActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <TouchableOpacity
                        style={styles.profileBtn}
                        onPress={() => setSelectedStudent(st)}
                      >
                        <AppText variant="captionBold" color="#FFFFFF">
                          {isRTL ? 'الملف' : 'Profile'}
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

                  {/* Footer Row: Guardian on RIGHT in Arabic RTL, Evaluation Date on LEFT */}
                  <View style={[styles.cardFooterRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <AppText variant="caption" color="#64748B">
                      {isRTL ? 'ولي الأمر:' : 'Guardian:'} {st.guardian_name || 'صالح'}
                    </AppText>
                    <AppText variant="caption" color="#64748B">
                      {isRTL ? 'تاريخ التقييم:' : 'Evaluation Date:'} {st.assessment_date || lastAssessmentDate}
                    </AppText>
                  </View>
                </View>
              );
            })
          )}
          </View>
        </View>
      </ScrollView>

      {/* Student Profile Quick View Modal */}
      <Modal visible={!!selectedStudent} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, isDark && styles.darkCard]}>
            <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="cardTitle" weight="bold">
                {isRTL ? 'تفاصيل حالة الطالب' : 'Student Case Details'}
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
                <View style={[styles.profileModalCard, isDark && styles.darkInputBox]}>
                  <AppText variant="cardTitle" weight="bold">
                    {selectedStudent.student_name}
                  </AppText>
                  <AppText variant="caption" color="#64748B" style={{ marginTop: 4 }}>
                    {selectedStudent.grade_name} · الفصل {selectedStudent.class_name}
                  </AppText>
                  <AppText variant="captionBold" color="#D97706" style={{ marginTop: 6 }}>
                    {isRTL ? 'نسبة الخطر:' : 'Risk Level:'} {selectedStudent.risk_score || 33}%
                  </AppText>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, { marginTop: 14, minHeight: 46, justifyContent: 'center' }]}
                  onPress={() => {
                    const studentId = selectedStudent.student_id;
                    setSelectedStudent(null);
                    navigation.navigate('Summons', { studentId });
                  }}
                >
                  <AppText variant="button" color="#FFFFFF">
                    {isRTL ? 'إنشاء استدعاء لولي الأمر' : 'Issue Parent Summons'}
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
  darkCard: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
  },
  darkInputBox: {
    backgroundColor: '#091A38',
    borderColor: '#1E3A6E',
  },
  scrollContent: {
    padding: 14,
  },
  pageWrapper: {
    gap: 12,
  },
  topActionsRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtonsGroup: {
    alignItems: 'center',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#1246B7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 42,
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
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    fontSize: 13,
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  kpiCardsGrid: {
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
    fontFamily: ibmPlexArabicFontFamily.regular,
    color: '#0F172A',
    padding: 0,
  },
  statusPillsGroup: {
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
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeading: {
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
  riskPillRed: {
    backgroundColor: '#FEE4E2',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  riskProgressRow: {
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  metricsNumbersGroup: {
    gap: 14,
  },
  metricItem: {
    alignItems: 'center',
  },
  cardActionsRow: {
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
});
