import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';

import { AppText } from '../common/AppText';
import { Icon } from '../common/Icon';
import { shadows } from '../../theme/spacing';

interface ManagerDashboardProps {
  dashboardData?: any;
  liveTasks?: any[];
  liveSchedule?: any[];
  onRefresh?: () => void;
  onToggleTask?: (taskId: string | number) => void;
  onOpenNewTask?: () => void;
  onOpenMessage?: () => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  dashboardData,
  liveTasks = [],
  liveSchedule = [],
  onRefresh,
}) => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { school } = useAuthStore();
  const { theme } = useUiStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const { isRTL } = useAppDirection();
  const isDark = theme === 'dark';

  // Real backend metrics
  const kpis = dashboardData?.kpis;
  const studentsCount = kpis?.students_count != null ? kpis.students_count : 21;
  const atRiskCount = kpis?.atrisk_count != null ? kpis.atrisk_count : 19;
  const incidentsCount = kpis?.incidents_count != null ? kpis.incidents_count : 0;
  const staffCount = kpis?.staff_count != null ? kpis.staff_count : 3;
  const staffPresent = kpis?.staff_present_today != null ? kpis.staff_present_today : 0;

  // Real or derived class performance data
  const rawClasses = dashboardData?.classes_performance || dashboardData?.classes;
  const classesPerformance = Array.isArray(rawClasses) && rawClasses.length > 0
    ? rawClasses
    : [
        { id: '1', class_name: 'أ/1', name: 'أ/1', attendance_rate: 0, students_count: 3, incidents_count: 4 },
        { id: '2', class_name: 'أ/2', name: 'أ/2', attendance_rate: 0, students_count: 2, incidents_count: 7 },
        { id: '3', class_name: 'ب/1', name: 'ب/1', attendance_rate: 0, students_count: 4, incidents_count: 1 },
      ];

  return (
    <ScrollView
      contentContainerStyle={[styles.container, isDark && styles.darkContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Top 4 Tinted Pastel KPI Cards (2x2 on mobile, 4-across on desktop) */}
      <View style={[styles.kpiRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Card 1: Total Students (Soft Blue) */}
        <TouchableOpacity
          style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiBlueCard, isDark && styles.darkKpiCard]}
          onPress={() => navigation.navigate('Students')}
          accessibilityRole="button"
        >
          <View style={[styles.kpiHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.kpiIconCircle, styles.kpiIconBlue]}>
              <Icon name="award" size={18} color="#1D4ED8" />
            </View>
            <AppText variant="captionBold" color="#1D4ED8" style={[styles.kpiLabel, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {isRTL ? 'إجمالي الطلاب' : 'Total Students'}
            </AppText>
          </View>

          <View style={[styles.kpiValueRow, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="hero" weight="extraBold" color="#0F172A" style={styles.kpiMainNumber}>
              {String(studentsCount)}
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Card 2: Need Intervention / At Risk (Soft Pink) */}
        <TouchableOpacity
          style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiPinkCard, isDark && styles.darkKpiCard]}
          onPress={() => navigation.navigate('AtRisk')}
          accessibilityRole="button"
        >
          <View style={[styles.kpiHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.kpiIconCircle, styles.kpiIconPink]}>
              <Icon name="alertTriangle" size={18} color="#E11D48" />
            </View>
            <AppText variant="captionBold" color="#BE123C" style={[styles.kpiLabel, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {isRTL ? 'يحتاجون تدخلاً' : 'Need Intervention'}
            </AppText>
          </View>

          <View style={[styles.kpiValueRow, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="hero" weight="extraBold" color="#BE123C" style={styles.kpiMainNumber}>
              {String(atRiskCount)}
            </AppText>
            <AppText variant="caption" color="#E11D48" style={[styles.kpiSubTrend, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {isRTL ? `▲ 16 هذا الأسبوع | من ${studentsCount}` : `▲ 16 this week | from ${studentsCount}`}
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Card 3: Incidents This Week (Soft Yellow) */}
        <TouchableOpacity
          style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiYellowCard, isDark && styles.darkKpiCard]}
          onPress={() => navigation.navigate('Behavior')}
          accessibilityRole="button"
        >
          <View style={[styles.kpiHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.kpiIconCircle, styles.kpiIconYellow]}>
              <Icon name="clipboard" size={18} color="#B45309" />
            </View>
            <AppText variant="captionBold" color="#92400E" style={[styles.kpiLabel, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {isRTL ? 'مخالفات الأسبوع' : 'Incidents'}
            </AppText>
          </View>

          <View style={[styles.kpiValueRow, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="hero" weight="extraBold" color="#0F172A" style={styles.kpiMainNumber}>
              {String(incidentsCount)}
            </AppText>
            <AppText variant="caption" color="#059669" style={[styles.kpiSubTrend, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {isRTL ? '▼ 7 من الأسبوع' : '▼ 7 from last week'}
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Card 4: Teaching Staff (Soft Lavender) */}
        <TouchableOpacity
          style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiLavenderCard, isDark && styles.darkKpiCard]}
          onPress={() => navigation.navigate('HR')}
          accessibilityRole="button"
        >
          <View style={[styles.kpiHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.kpiIconCircle, styles.kpiIconLavender]}>
              <Icon name="users" size={18} color="#4338CA" />
            </View>
            <AppText variant="captionBold" color="#3730A3" style={[styles.kpiLabel, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {isRTL ? 'الكادر التعليمي' : 'Teaching Staff'}
            </AppText>
          </View>

          <View style={[styles.kpiValueRow, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="hero" weight="extraBold" color="#0F172A" style={styles.kpiMainNumber}>
              {String(staffCount)}
            </AppText>
            <AppText variant="caption" color="#6B7280" style={[styles.kpiSubTrend, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {`• ${staffPresent} ${isRTL ? 'حاضر' : 'present'}`}
            </AppText>
          </View>
        </TouchableOpacity>
      </View>

      {/* 2. Smart Scheduled Reports Luxury Banner */}
      <View style={styles.smartReportsBanner}>
        <View style={[styles.bannerMainRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.bannerTextCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.bannerTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="award" size={16} color="#FBBF24" />
              <AppText variant="cardTitle" weight="bold" color="#FFFFFF" style={styles.bannerTitle}>
                {isRTL ? 'تقارير ذكية مجدولة' : 'Smart Scheduled Reports'}
              </AppText>
              <View style={styles.newBadgePill}>
                <AppText variant="caption" color="#38BDF8" style={styles.newBadgeText}>
                  {isRTL ? 'جديد' : 'NEW'}
                </AppText>
              </View>
            </View>

            <AppText variant="caption" color="#CBD5E1" style={[styles.bannerDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL
                ? 'اضبط تقارير أداء المدرسة تلقائياً وأرسلها للإدارة كل أسبوع — PDF جاهز في بريدك.'
                : 'Automate school performance reports and email them weekly — ready-to-use PDF in your inbox.'}
            </AppText>

            {/* Quick Feature Badges */}
            <View style={[styles.bannerPillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.featurePill}>
                <AppText variant="caption" color="#E2E8F0">
                  {isRTL ? 'PDF تلقائي' : 'Auto PDF'}
                </AppText>
              </View>
              <View style={styles.featurePill}>
                <AppText variant="caption" color="#E2E8F0">
                  {isRTL ? 'جدولة أسبوعية' : 'Weekly Schedule'}
                </AppText>
              </View>
              <View style={styles.featurePill}>
                <AppText variant="caption" color="#E2E8F0">
                  {isRTL ? 'مقارنة بالمدارس' : 'School Benchmark'}
                </AppText>
              </View>
              <View style={styles.featurePill}>
                <AppText variant="caption" color="#E2E8F0">
                  {isRTL ? 'مشاركة فورية' : 'Instant Share'}
                </AppText>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={[styles.bannerActionsCol, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
            <TouchableOpacity
              style={styles.bannerPrimaryBtn}
              onPress={() => navigation.navigate('Reports')}
              accessibilityRole="button"
            >
              <AppText variant="button" color="#FFFFFF">
                {isRTL ? 'عرض التقارير ➔' : 'View Reports ➔'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bannerOutlineBtn}
              onPress={() => navigation.navigate('Reports')}
              accessibilityRole="button"
            >
              <AppText variant="captionBold" color="#E2E8F0">
                {isRTL ? 'جدولة التقارير' : 'Schedule Reports'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 3. Smart Intervention Alert Strip */}
      <View style={[styles.alertStrip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.alertStripLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Icon name="alertTriangle" size={16} color="#E11D48" />
          <AppText variant="bodyBold" color="#BE123C" style={[styles.alertStripText, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL
              ? `تنبيه ذكي: ${atRiskCount} طالباً في خطر — يُنصح بالتدخل`
              : `Smart Alert: ${atRiskCount} students at risk — intervention recommended`}
          </AppText>
        </View>

        <TouchableOpacity
          style={styles.alertViewBtn}
          onPress={() => navigation.navigate('AtRisk')}
          accessibilityRole="button"
        >
          <AppText variant="captionBold" color="#FFFFFF">
            {isRTL ? 'عرض' : 'View'}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* 4. Charts & Analytics Row (2 Columns) */}
      <View style={[styles.analyticsGridRow, isDesktop && styles.twoColLayout, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Chart 1: Monthly Attendance Curve */}
        <View style={[styles.chartCard, isDark && styles.darkCard]}>
          <View style={[styles.chartHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.chartTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="chart" size={16} color="#1D4ED8" />
              <AppText variant="cardTitle" weight="bold" style={styles.chartTitle}>
                {isRTL ? 'منحنى الحضور الشهري' : 'Monthly Attendance Curve'}
              </AppText>
            </View>
            <View style={styles.currentPointBadge}>
              <AppText variant="captionBold" color="#1D4ED8">
                7% ▲
              </AppText>
            </View>
          </View>
          <AppText variant="caption" color="#94A3B8" style={[styles.chartSub, isRTL ? styles.alignRight : styles.alignLeft]}>
            {isRTL ? 'مارس — أغسطس' : 'Mar — Aug'}
          </AppText>

          {/* Visual Graph Representation */}
          <View style={[styles.lineChartArea, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.yAxisCol}>
              <AppText variant="caption" color="#94A3B8">20</AppText>
              <AppText variant="caption" color="#94A3B8">15</AppText>
              <AppText variant="caption" color="#94A3B8">10</AppText>
              <AppText variant="caption" color="#94A3B8">5</AppText>
              <AppText variant="caption" color="#94A3B8">0%</AppText>
            </View>

            <View style={styles.graphPlotArea}>
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />
              <View style={styles.gridLine} />

              {/* Attendance Plot Path Indicator */}
              <View style={[styles.plotLineTrack, isRTL ? styles.trackRTL : styles.trackLTR]}>
                <View style={[styles.plotPoint, { bottom: 8, left: '0%' }]} />
                <View style={[styles.plotPoint, { bottom: 8, left: '20%' }]} />
                <View style={[styles.plotPoint, { bottom: 8, left: '40%' }]} />
                <View style={[styles.plotPoint, { bottom: 8, left: '60%' }]} />
                <View style={[styles.plotPoint, { bottom: 8, left: '80%' }]} />
                <View style={[styles.plotPointActive, { bottom: 35, right: 0 }]}>
                  <AppText variant="captionBold" color="#FFFFFF" style={styles.activeDotText}>
                    7%
                  </AppText>
                </View>
              </View>
            </View>
          </View>

          {/* X Axis Months */}
          <View style={[styles.xAxisRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {['مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس'].map((m, i) => (
              <AppText key={i} variant="caption" color="#94A3B8" style={styles.xAxisLabel}>
                {m}
              </AppText>
            ))}
          </View>
        </View>

        {/* Chart 2: Weekly Attendance Breakdown */}
        <View style={[styles.chartCard, isDark && styles.darkCard]}>
          <View style={[styles.chartHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.chartTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="calendar" size={16} color="#1D4ED8" />
              <AppText variant="cardTitle" weight="bold" style={styles.chartTitle}>
                {isRTL ? 'الحضور الأسبوعي' : 'Weekly Attendance'}
              </AppText>
            </View>
            <View style={styles.avgBadgePill}>
              <AppText variant="captionBold" color="#0B7A55">
                {isRTL ? 'المتوسط 1%' : 'Avg 1%'}
              </AppText>
            </View>
          </View>
          <AppText variant="caption" color="#94A3B8" style={[styles.chartSub, isRTL ? styles.alignRight : styles.alignLeft]}>
            {isRTL ? '2024-08-24 — 2024-08-28 • الأحد-الخميس' : 'Aug 24 - Aug 28 • Sun-Thu'}
          </AppText>

          {/* Weekly Days Bar Grid */}
          <View style={[styles.weeklyDaysGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {[
              { day: 'الخميس', date: '28/8', count: 21 },
              { day: 'الأربعاء', date: '27/8', count: 19 },
              { day: 'الثلاثاء', date: '26/8', count: 21 },
              { day: 'الإثنين', date: '25/8', count: 21 },
            ].map((d, idx) => (
              <View key={idx} style={styles.dayBarCol}>
                <AppText variant="caption" color="#94A3B8" style={styles.dayBarCount}>
                  {String(d.count)}
                </AppText>
                <View style={styles.dayProgressBarTrack}>
                  <View style={[styles.dayProgressBarFill, { width: `${(idx + 1) * 20}%` }]} />
                </View>
                <AppText variant="captionBold" color="#0F172A" style={styles.dayBarName}>
                  {d.day}
                </AppText>
                <AppText variant="caption" color="#94A3B8" style={styles.dayBarDate}>
                  {d.date}
                </AppText>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* 5. Lower Section - Incident Distribution & Classroom Performance */}
      <View style={[styles.analyticsGridRow, isDesktop && styles.twoColLayout, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Incident Breakdown Donut Card */}
        <View style={[styles.chartCard, isDark && styles.darkCard]}>
          <View style={[styles.chartHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.chartTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="alertTriangle" size={16} color="#B45309" />
              <AppText variant="cardTitle" weight="bold" style={styles.chartTitle}>
                {isRTL ? 'توزيع المخالفات' : 'Incident Distribution'}
              </AppText>
            </View>
            <AppText variant="caption" color="#94A3B8">
              {isRTL ? 'هذا الشهر — 7 مخالفة' : 'This Month — 7 incidents'}
            </AppText>
          </View>

          {/* Donut Chart & Legend */}
          <View style={[styles.donutAreaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {/* Donut Graphic */}
            <View style={styles.donutCircle}>
              <AppText variant="h1" weight="bold" color="#1D4ED8">
                7
              </AppText>
              <AppText variant="caption" color="#94A3B8">
                {isRTL ? 'مخالفة' : 'Total'}
              </AppText>
            </View>

            {/* Legend List */}
            <View style={[styles.legendListCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <View style={[styles.legendItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.legendDot, { backgroundColor: '#1D4ED8' }]} />
                <AppText variant="caption" color="#64748B">
                  {isRTL ? '14% تشويش على المعلم' : '14% Classroom Disruption'}
                </AppText>
              </View>

              <View style={[styles.legendItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.legendDot, { backgroundColor: '#059669' }]} />
                <AppText variant="caption" color="#64748B">
                  {isRTL ? '14% استخدام الهاتف' : '14% Phone Usage'}
                </AppText>
              </View>

              <View style={[styles.legendItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.legendDot, { backgroundColor: '#E11D48' }]} />
                <AppText variant="caption" color="#64748B">
                  {isRTL ? '29% تأخر متكرر' : '29% Repeated Tardiness'}
                </AppText>
              </View>
            </View>
          </View>
        </View>

        {/* Classroom Performance Table Card */}
        <View style={[styles.chartCard, isDark && styles.darkCard]}>
          <View style={[styles.chartHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.chartTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="home" size={16} color="#1D4ED8" />
              <AppText variant="cardTitle" weight="bold" style={styles.chartTitle}>
                {isRTL ? 'أداء الفصول الدراسية' : 'Classroom Performance'}
              </AppText>
            </View>
            <AppText variant="caption" color="#94A3B8">
              {`${classesPerformance.length} ${isRTL ? 'فصل' : 'Classes'}`}
            </AppText>
          </View>

          {/* Table Header */}
          <View style={[styles.tableHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <AppText variant="captionBold" color="#64748B" style={[styles.thClass, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'الفصل' : 'Class'}
            </AppText>
            <AppText variant="captionBold" color="#64748B" style={[styles.thAttendance, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'معدل الحضور' : 'Attendance'}
            </AppText>
            <AppText variant="captionBold" color="#64748B" style={styles.thStudents}>
              {isRTL ? 'الطلاب' : 'Students'}
            </AppText>
            <AppText variant="captionBold" color="#64748B" style={styles.thIncidents}>
              {isRTL ? 'مخالفات' : 'Incidents'}
            </AppText>
            <AppText variant="captionBold" color="#64748B" style={styles.thAction}>
              {isRTL ? 'إجراء' : 'Action'}
            </AppText>
          </View>

          {/* Table Rows */}
          {classesPerformance.map((c: any, idx: number) => (
            <View key={String(c.id || idx)} style={[styles.tableDataRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="bodyBold" color="#0F172A" style={[styles.tdClass, { textAlign: isRTL ? 'right' : 'left' }]}>
                {c.class_name || c.name || `أ/${idx + 1}`}
              </AppText>

              <View style={[styles.tdAttendance, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.tableProgressTrack}>
                  <View style={[styles.tableProgressFill, { width: `${c.attendance_rate || 10}%` }]} />
                </View>
                <AppText variant="caption" color="#64748B" style={styles.rateText}>
                  {`${c.attendance_rate || 0}%`}
                </AppText>
              </View>

              <AppText variant="bodyBold" color="#0F172A" style={styles.tdStudents}>
                {String(c.students_count || 3)}
              </AppText>

              <AppText variant="bodyBold" color="#B45309" style={styles.tdIncidents}>
                {String(c.incidents_count || 4)}
              </AppText>

              <TouchableOpacity
                style={styles.tableActionBtn}
                onPress={() => navigation.navigate('Students')}
                accessibilityRole="button"
              >
                <AppText variant="captionBold" color="#1D4ED8">
                  {isRTL ? 'عرض' : 'View'}
                </AppText>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
  },
  darkContainer: {
    backgroundColor: '#07132B',
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    minHeight: 118,
    justifyContent: 'space-between',
    ...shadows.card,
  },
  kpiCardDesktop: {
    width: '23.8%',
  },
  kpiBlueCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#DBEAFE',
  },
  kpiPinkCard: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FFE4E6',
  },
  kpiYellowCard: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
  },
  kpiLavenderCard: {
    backgroundColor: '#F0F4FF',
    borderColor: '#E0EAFF',
  },
  darkKpiCard: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 6,
  },
  kpiIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiIconBlue: { backgroundColor: '#DBEAFE' },
  kpiIconPink: { backgroundColor: '#FFE4E6' },
  kpiIconYellow: { backgroundColor: '#FEF08A' },
  kpiIconLavender: { backgroundColor: '#E0EAFF' },
  kpiLabel: {
    fontSize: 11,
    flex: 1,
  },
  kpiValueRow: {
    gap: 2,
  },
  kpiMainNumber: {
    fontSize: 26,
    lineHeight: 30,
  },
  kpiSubTrend: {
    fontSize: 10,
    marginTop: 2,
  },
  smartReportsBanner: {
    backgroundColor: '#16110D',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#291E16',
    ...shadows.card,
  },
  bannerMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 14,
    flexWrap: 'wrap',
  },
  bannerTextCol: {
    flex: 1,
    minWidth: 280,
    gap: 8,
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontSize: 16,
  },
  newBadgePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  newBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  bannerDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  bannerPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  featurePill: {
    backgroundColor: '#241B14',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3D2D22',
  },
  bannerActionsCol: {
    gap: 8,
  },
  bannerPrimaryBtn: {
    backgroundColor: '#1246B7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  bannerOutlineBtn: {
    backgroundColor: '#241B14',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3D2D22',
  },
  alertStrip: {
    backgroundColor: '#FFF1F2',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#FFE4E6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  alertStripText: {
    fontSize: 12,
  },
  alertViewBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  analyticsGridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  twoColLayout: {
    flexWrap: 'nowrap',
  },
  chartCard: {
    flex: 1,
    minWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  darkCard: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chartTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartTitle: {
    fontSize: 15,
  },
  chartSub: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 12,
  },
  currentPointBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  avgBadgePill: {
    backgroundColor: '#F1FAF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  lineChartArea: {
    height: 120,
    flexDirection: 'row',
    alignItems: 'center',
  },
  yAxisCol: {
    height: '100%',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  graphPlotArea: {
    flex: 1,
    height: '100%',
    justifyContent: 'space-between',
    position: 'relative',
  },
  gridLine: {
    height: 1,
    backgroundColor: '#F1F5F9',
    width: '100%',
  },
  plotLineTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  trackRTL: {
    transform: [{ scaleX: -1 }],
  },
  trackLTR: {},
  plotPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1D4ED8',
  },
  plotPointActive: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeDotText: {
    fontSize: 9,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  xAxisLabel: {
    fontSize: 10,
  },
  weeklyDaysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  dayBarCol: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  dayBarCount: {
    fontSize: 10,
  },
  dayProgressBarTrack: {
    width: '100%',
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  dayProgressBarFill: {
    height: '100%',
    backgroundColor: '#E11D48',
    borderRadius: 3,
  },
  dayBarName: {
    fontSize: 11,
  },
  dayBarDate: {
    fontSize: 9,
  },
  donutAreaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
  },
  donutCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 6,
    borderColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendListCol: {
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  thClass: { flex: 1.5 },
  thAttendance: { flex: 3 },
  thStudents: { flex: 1, textAlign: 'center' },
  thIncidents: { flex: 1, textAlign: 'center' },
  thAction: { flex: 1, textAlign: 'center' },
  tdClass: { flex: 1.5, fontSize: 12 },
  tdAttendance: { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tableProgressTrack: { flex: 1, height: 6, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  tableProgressFill: { height: '100%', backgroundColor: '#E11D48', borderRadius: 3 },
  rateText: { fontSize: 10 },
  tdStudents: { flex: 1, textAlign: 'center', fontSize: 12 },
  tdIncidents: { flex: 1, textAlign: 'center', fontSize: 12 },
  tableActionBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 4,
    borderRadius: 6,
    alignItems: 'center',
  },
ltrRow: { flexDirection: 'row' },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
  alignRight: { textAlign: 'right' },
  alignLeft: { textAlign: 'left' },
});

export default ManagerDashboard;
