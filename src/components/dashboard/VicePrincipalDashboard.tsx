import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Modal,
  Alert,
} from 'react-native';
import Svg, { Path, Circle, G, Line as SvgLine, Rect } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import { AppText } from '../common/AppText';
import { Icon } from '../common/Icon';
import { ibmPlexArabicFontFamily } from '../../theme/typography';
import { shadows } from '../../theme/spacing';

interface VicePrincipalDashboardProps {
  dashboardData?: any;
  liveTasks?: any[];
  liveSchedule?: any[];
  onRefresh?: () => void;
  onToggleTask?: (taskId: string | number) => void;
  onOpenNewTask?: () => void;
  onOpenMessage?: () => void;
}

export const VicePrincipalDashboard: React.FC<VicePrincipalDashboardProps> = ({
  dashboardData,
  liveTasks = [],
  liveSchedule = [],
  onRefresh,
}) => {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, school } = useAuthStore();
  const { theme } = useUiStore();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const { isRTL } = useAppDirection();
  const isDark = theme === 'dark';

  const [selectedClassModal, setSelectedClassModal] = useState<any | null>(null);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [notifSentAlert, setNotifSentAlert] = useState(false);

  // Real backend metrics with fallback to standard initial values
  const kpis = dashboardData?.kpis;
  const attendanceRate = kpis?.attendance_rate != null ? `${kpis.attendance_rate}%` : '0%';
  const absentCount = kpis?.absent_today != null ? kpis.absent_today : 21;
  const unexcusedCount = kpis?.unexcused_absent != null ? kpis.unexcused_absent : 21;
  const openIncidents = kpis?.open_incidents != null ? kpis.open_incidents : 5;
  const staffPresent = kpis?.staff_present_today != null ? kpis.staff_present_today : 0;
  const staffTotal = kpis?.staff_count != null ? kpis.staff_count : 3;
  const pendingTasks = kpis?.pending_tasks != null ? kpis.pending_tasks : 1;
  const atRiskCount = kpis?.atrisk_count != null ? kpis.atrisk_count : 21;

  // Classrooms performance data
  const rawClasses = dashboardData?.classes_performance || dashboardData?.classes;
  const classesList = Array.isArray(rawClasses) && rawClasses.length > 0
    ? rawClasses
    : [
        { id: '1', class_name: '1/أ', attendance_rate: 0, students_count: 3, incidents_count: 4, room: '101' },
        { id: '2', class_name: '2/أ', attendance_rate: 0, students_count: 2, incidents_count: 2, room: '102' },
        { id: '3', class_name: '3/أ', attendance_rate: 0, students_count: 2, incidents_count: 1, room: '103' },
        { id: '4', class_name: '1/ب', attendance_rate: 0, students_count: 3, incidents_count: 0, room: '104' },
        { id: '5', class_name: '2/ب', attendance_rate: 0, students_count: 3, incidents_count: 0, room: '105' },
        { id: '6', class_name: '3/ب', attendance_rate: 0, students_count: 2, incidents_count: 0, room: '106' },
        { id: '7', class_name: '1/ج', attendance_rate: 0, students_count: 2, incidents_count: 0, room: '107' },
        { id: '8', class_name: '2/ج', attendance_rate: 0, students_count: 2, incidents_count: 0, room: '108' },
        { id: '9', class_name: '3/ج', attendance_rate: 0, students_count: 2, incidents_count: 0, room: '109' },
      ];

  // Incidents distribution breakdown
  const incidentBreakdown = [
    { label: 'تشويش على المعلم', percent: '14%', color: '#1D4ED8' },
    { label: 'استخدام الهاتف', percent: '14%', color: '#0284C7' },
    { label: 'تأخر متكرر', percent: '29%', color: '#E11D48' },
    { label: 'عدم الالتزام بالزي', percent: '14%', color: '#6366F1' },
    { label: 'تنمر على زميل', percent: '14%', color: '#0D9488' },
    { label: 'غش في الاختبار', percent: '14%', color: '#D97706' },
  ];

  // Recent activity list
  const recentActivities = [
    { id: '1', title: 'إكمال مهمة: مهمة اختبار QA — حساب المعلم', time: '02:37 PM', icon: 'checkCircle', color: '#1D4ED8', bg: '#EFF6FF' },
    { id: '2', title: 'تحديث مهمة: مهمة اختبار QA — حساب المعلم', time: '02:45 PM', icon: 'checkCircle', color: '#1D4ED8', bg: '#EFF6FF' },
    { id: '3', title: 'تحديث مهمة: تجربة المهام', time: '02:45 PM', icon: 'checkCircle', color: '#1D4ED8', bg: '#EFF6FF' },
    { id: '4', title: 'تسجيل حضور موظف', time: '07:05 PM', icon: 'edit', color: '#64748B', bg: '#F1F5F9' },
    { id: '5', title: 'إنشاء ملف موظف', time: '09:16 AM', icon: 'fileText', color: '#64748B', bg: '#F1F5F9' },
    { id: '6', title: 'تسجيل حضور موظف', time: '01:11 PM', icon: 'edit', color: '#64748B', bg: '#F1F5F9' },
    { id: '7', title: 'إنشاء نموذج: نموذج جديد', time: '01:10 PM', icon: 'fileText', color: '#1D4ED8', bg: '#EFF6FF' },
    { id: '8', title: 'تسجيل حضور موظف', time: '07:05 PM', icon: 'edit', color: '#64748B', bg: '#F1F5F9' },
  ];

  const handleNotifyParents = () => {
    setNotifSentAlert(true);
    setTimeout(() => setNotifSentAlert(false), 3000);
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, isDark && styles.darkContainer]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── 1. Top 4 Colorful KPI Stat Cards ── */}
      <View style={[styles.kpiGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Card 1: معدل الحضور اليوم (وردي) */}
        <TouchableOpacity
          style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiCardRoseBorder, isDark && styles.darkCard]}
          onPress={() => navigation.navigate('Attendance')}
          activeOpacity={0.8}
        >
          <View style={[styles.kpiHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCircleRose}>
              <Icon name="activity" size={16} color="#E11D48" />
            </View>
            <AppText variant="captionBold" color="#BE123C" style={[styles.kpiCardLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'معدل الحضور اليوم' : 'Today Attendance Rate'}
            </AppText>
          </View>
          <View style={[styles.kpiValueRow, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="hero" weight="extraBold" color="#BE123C" style={styles.kpiBigNumber}>
              {attendanceRate}
            </AppText>
            <AppText variant="caption" color="#94A3B8" style={[styles.kpiSubLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'غائب أسبوعياً' : 'Weekly Absentee Rate'}
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Card 2: غائبو اليوم (أرجواني/وردي) */}
        <TouchableOpacity
          style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiCardPinkBorder, isDark && styles.darkCard]}
          onPress={() => navigation.navigate('Attendance')}
          activeOpacity={0.8}
        >
          <View style={[styles.kpiHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCirclePink}>
              <Icon name="users" size={16} color="#BE185D" />
            </View>
            <AppText variant="captionBold" color="#9D174D" style={[styles.kpiCardLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'غائبو اليوم' : 'Absentees Today'}
            </AppText>
          </View>
          <View style={[styles.kpiValueRow, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="hero" weight="extraBold" color="#9D174D" style={styles.kpiBigNumber}>
              {String(absentCount)}
            </AppText>
            <AppText variant="caption" color="#94A3B8" style={[styles.kpiSubLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? `${unexcusedCount} بلا إبلاغ` : `${unexcusedCount} Unreported`}
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Card 3: مخالفات مفتوحة (أصفر) */}
        <TouchableOpacity
          style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiCardAmberBorder, isDark && styles.darkCard]}
          onPress={() => navigation.navigate('Behavior')}
          activeOpacity={0.8}
        >
          <View style={[styles.kpiHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCircleAmber}>
              <Icon name="alertTriangle" size={16} color="#D97706" />
            </View>
            <AppText variant="captionBold" color="#92400E" style={[styles.kpiCardLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'مخالفات مفتوحة' : 'Open Incidents'}
            </AppText>
          </View>
          <View style={[styles.kpiValueRow, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="hero" weight="extraBold" color="#B45309" style={styles.kpiBigNumber}>
              {String(openIncidents)}
            </AppText>
            <AppText variant="caption" color="#94A3B8" style={[styles.kpiSubLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'مخالفات مفتوحة' : 'Requires Review'}
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Card 4: حضور الكادر ومهام معلقة (أزرق) */}
        <View
          style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiCardBlueBorder, isDark && styles.darkCard]}
        >
          <View style={[styles.kpiDualRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {/* Staff Attendance */}
            <TouchableOpacity
              style={styles.kpiDualSubCol}
              onPress={() => navigation.navigate('HR')}
              activeOpacity={0.7}
            >
              <View style={[styles.kpiHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.iconCircleBlue}>
                  <Icon name="users" size={14} color="#1D4ED8" />
                </View>
              </View>
              <AppText variant="cardTitle" weight="extraBold" color="#1E40AF" style={styles.kpiBigNumber}>
                {`${staffPresent}/${staffTotal}`}
              </AppText>
              <AppText variant="caption" color="#64748B" style={[styles.kpiSubLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'حضور الكادر اليوم' : 'Staff Present'}
              </AppText>
            </TouchableOpacity>

            <View style={styles.kpiDualDivider} />

            {/* Pending Tasks */}
            <TouchableOpacity
              style={styles.kpiDualSubCol}
              onPress={() => navigation.navigate('Tasks')}
              activeOpacity={0.7}
            >
              <View style={[styles.kpiHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.iconCircleCyan}>
                  <Icon name="clipboard" size={14} color="#0284C7" />
                </View>
              </View>
              <AppText variant="cardTitle" weight="extraBold" color="#0369A1" style={styles.kpiBigNumber}>
                {String(pendingTasks)}
              </AppText>
              <AppText variant="caption" color="#64748B" style={[styles.kpiSubLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'مهام معلقة' : 'Pending Tasks'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── 2. Smart Scheduled Reports Dark Luxury Banner (Fully Responsive) ── */}
      <View style={[styles.smartReportsBanner, isDark && styles.darkReportsBanner]}>
        <View
          style={[
            styles.bannerContentRow,
            {
              flexDirection: isDesktop ? (isRTL ? 'row' : 'row-reverse') : 'column',
              alignItems: isDesktop ? 'center' : 'stretch',
            },
          ]}
        >
          {/* Text & Badges Column (Right side in RTL on Desktop, Top on Mobile) */}
          <View
            style={[
              styles.bannerTextCol,
              {
                alignItems: isRTL ? 'flex-end' : 'flex-start',
                flex: isDesktop ? 1 : undefined,
              },
            ]}
          >
            <View
              style={[
                styles.bannerHeaderRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={styles.bannerIconSquare}>
                <Icon name="barChart" size={18} color="#FFFFFF" />
              </View>

              <View
                style={[
                  styles.bannerTitleGroup,
                  { flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' },
                ]}
              >
                <AppText variant="cardTitle" weight="bold" color="#FFFFFF" style={styles.bannerMainTitle}>
                  {isRTL ? 'تقارير ذكية مجدولة' : 'Smart Scheduled Reports'}
                </AppText>
                <View style={styles.newBadgePill}>
                  <AppText variant="caption" color="#38BDF8" style={styles.newBadgeText}>
                    {isRTL ? '✨ جديد' : '✨ NEW'}
                  </AppText>
                </View>
              </View>
            </View>

            <AppText
              variant="caption"
              color="#CBD5E1"
              style={[styles.bannerDescription, { textAlign: isRTL ? 'right' : 'left' }]}
            >
              {isRTL
                ? 'أنشئ تقارير أداء المدرسة تلقائياً وأرسلها للإدارة كل أسبوع — PDF جاهز في بريدك.'
                : 'Automate school performance reports and email them weekly — ready-to-use PDF in your inbox.'}
            </AppText>

            {/* Feature Pills */}
            <View
              style={[
                styles.featurePillsRow,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
              ]}
            >
              <View style={[styles.featurePill, styles.featurePillAccent]}>
                <AppText variant="captionBold" color="#38BDF8" style={styles.featurePillText}>
                  {isRTL ? 'PDF تلقائي' : 'Auto PDF'}
                </AppText>
              </View>
              <View style={styles.featurePill}>
                <AppText variant="caption" color="#E2E8F0" style={styles.featurePillText}>
                  {isRTL ? 'جدولة أسبوعية' : 'Weekly Schedule'}
                </AppText>
              </View>
              <View style={styles.featurePill}>
                <AppText variant="caption" color="#E2E8F0" style={styles.featurePillText}>
                  {isRTL ? 'مقارنة بالمدارس' : 'School Benchmark'}
                </AppText>
              </View>
              <View style={styles.featurePill}>
                <AppText variant="caption" color="#E2E8F0" style={styles.featurePillText}>
                  {isRTL ? 'مشاركة فورية' : 'Instant Share'}
                </AppText>
              </View>
            </View>
          </View>

          {/* Action Buttons Column (Left side in RTL on Desktop, Bottom on Mobile) */}
          <View
            style={[
              styles.bannerActionsCol,
              {
                flexDirection: isDesktop ? 'column' : (isRTL ? 'row-reverse' : 'row'),
                alignItems: isDesktop ? (isRTL ? 'flex-start' : 'flex-end') : 'stretch',
                width: isDesktop ? undefined : '100%',
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.bannerPrimaryBtn, !isDesktop && styles.bannerBtnFlex]}
              onPress={() => navigation.navigate('Reports')}
              activeOpacity={0.8}
            >
              <AppText variant="button" color="#FFFFFF" style={styles.bannerPrimaryBtnText}>
                {isRTL ? 'عرض التقارير ⬅' : 'View Reports ➔'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bannerSecondaryBtn, !isDesktop && styles.bannerBtnFlex]}
              onPress={() => setScheduleModalVisible(true)}
              activeOpacity={0.8}
            >
              <AppText variant="captionBold" color="#E2E8F0" style={styles.bannerSecondaryBtnText}>
                {isRTL ? 'جدولة التقارير' : 'Schedule Reports'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>



      {/* ── 3. Smart Intervention Alert Strip (Pink) ── */}
      <View style={[styles.alertStrip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.alertStripLeading, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Icon name="alertTriangle" size={16} color="#E11D48" />
          <AppText variant="bodyBold" color="#BE123C" style={[styles.alertStripText, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL
              ? `تنبيه ذكي: ${atRiskCount} طالباً في خطر — يُنصح بالتدخل`
              : `Smart Alert: ${atRiskCount} students at risk — intervention recommended`}
          </AppText>
        </View>

        <TouchableOpacity
          style={styles.alertActionBtn}
          onPress={() => navigation.navigate('AtRisk')}
          activeOpacity={0.8}
        >
          <AppText variant="captionBold" color="#FFFFFF">
            {isRTL ? 'عرض' : 'View'}
          </AppText>
        </TouchableOpacity>
      </View>

      {/* ── 4. Charts & Analytics Row (Weekly Bar & Monthly Line) ── */}
      <View style={[styles.twoColRow, isDesktop && styles.twoColRowDesktop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Chart 1: الحضور الأسبوعي (Weekly Attendance) */}
        <View style={[styles.chartCard, isDark && styles.darkCard]}>
          <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.cardTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="calendar" size={18} color="#1D4ED8" />
              <AppText variant="cardTitle" weight="bold" color={isDark ? '#FFFFFF' : '#0F172A'}>
                {isRTL ? 'الحضور الأسبوعي' : 'Weekly Attendance'}
              </AppText>
            </View>
            <View style={styles.avgGreenPill}>
              <AppText variant="captionBold" color="#0B7A55">
                {isRTL ? 'متوسط 1%' : 'Avg 1%'}
              </AppText>
            </View>
          </View>
          <AppText variant="caption" color="#94A3B8" style={[styles.chartSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? '2024-09-01 — 2024-09-07 • عدد الغائبين' : 'Sep 1 - Sep 7 • Absentees Count'}
          </AppText>

          {/* Days Progress Bar Grid */}
          <View style={[styles.weeklyDaysGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {[
              { day: 'الخميس', date: '5/9', count: 21 },
              { day: 'الأربعاء', date: '4/9', count: 21 },
              { day: 'الثلاثاء', date: '3/9', count: 21 },
              { day: 'الإثنين', date: '2/9', count: 21 },
              { day: 'الأحد', date: '1/9', count: 21 },
            ].map((d, index) => (
              <View key={index} style={styles.dayColItem}>
                <AppText variant="caption" color="#94A3B8" style={styles.dayCountText}>
                  {String(d.count)}
                </AppText>
                <View style={styles.dayBarTrack}>
                  <View style={[styles.dayBarFill, { backgroundColor: '#E11D48', height: 4 }]} />
                </View>
                <AppText variant="captionBold" color={isDark ? '#FFFFFF' : '#0F172A'} style={styles.dayNameText}>
                  {d.day}
                </AppText>
                <AppText variant="caption" color="#94A3B8" style={styles.dayDateText}>
                  {d.date}
                </AppText>
              </View>
            ))}
          </View>

          {/* Legend row */}
          <View style={[styles.legendRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.legendChip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.legendSquare, { backgroundColor: '#10B981' }]} />
              <AppText variant="caption" color="#64748B">&gt;95%</AppText>
            </View>
            <View style={[styles.legendChip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.legendSquare, { backgroundColor: '#F59E0B' }]} />
              <AppText variant="caption" color="#64748B">90-95%</AppText>
            </View>
            <View style={[styles.legendChip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.legendSquare, { backgroundColor: '#E11D48' }]} />
              <AppText variant="caption" color="#64748B">&lt;90%</AppText>
            </View>
          </View>
        </View>

        {/* Chart 2: منحنى الحضور الشهري (Monthly Attendance Curve) */}
        <View style={[styles.chartCard, isDark && styles.darkCard]}>
          <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.cardTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="chart" size={18} color="#1D4ED8" />
              <AppText variant="cardTitle" weight="bold" color={isDark ? '#FFFFFF' : '#0F172A'}>
                {isRTL ? 'منحنى الحضور الشهري' : 'Monthly Attendance Curve'}
              </AppText>
            </View>
            <View style={styles.currentPointPill}>
              <AppText variant="captionBold" color="#059669">
                0% ▲
              </AppText>
            </View>
          </View>
          <AppText variant="caption" color="#94A3B8" style={[styles.chartSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
            {isRTL ? 'أبريل — سبتمبر' : 'April — September'}
          </AppText>

          {/* SVG Line Curve Visualization */}
          <View style={styles.svgContainer}>
            <Svg height="120" width="100%" viewBox="0 0 300 120">
              {/* Horizontal Grid lines */}
              <SvgLine x1="0" y1="20" x2="300" y2="20" stroke="#F1F5F9" strokeWidth="1" />
              <SvgLine x1="0" y1="50" x2="300" y2="50" stroke="#F1F5F9" strokeWidth="1" />
              <SvgLine x1="0" y1="80" x2="300" y2="80" stroke="#F1F5F9" strokeWidth="1" />
              <SvgLine x1="0" y1="110" x2="300" y2="110" stroke="#F1F5F9" strokeWidth="1" />

              {/* Curve Line Path */}
              <Path
                d="M 20 110 L 70 110 L 120 110 L 170 110 L 230 65 L 280 110"
                fill="none"
                stroke="#1D4ED8"
                strokeWidth="3.5"
              />

              {/* Points */}
              <Circle cx="20" cy="110" r="5" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="2.5" />
              <Circle cx="70" cy="110" r="5" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="2.5" />
              <Circle cx="120" cy="110" r="5" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="2.5" />
              <Circle cx="170" cy="110" r="5" fill="#FFFFFF" stroke="#1D4ED8" strokeWidth="2.5" />
              
              {/* Highlight August 7% Point */}
              <Circle cx="230" cy="65" r="7" fill="#1D4ED8" />
              <Circle cx="280" cy="110" r="6" fill="#1D4ED8" />
            </Svg>

            {/* X-axis labels */}
            <View style={[styles.curveXAxis, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {['أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس (7%)', 'سبتمبر (0%)'].map((m, i) => (
                <AppText key={i} variant="caption" color="#94A3B8" style={styles.curveLabel}>
                  {m}
                </AppText>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* ── 5. Classrooms Performance Table & Incident Breakdown Donut ── */}
      <View style={[styles.twoColRow, isDesktop && styles.twoColRowDesktop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Right Card: أداء الفصول الدراسية (Classroom Performance Table) */}
        <View style={[styles.chartCard, isDark && styles.darkCard]}>
          <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.cardTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="school" size={18} color="#1D4ED8" />
              <AppText variant="cardTitle" weight="bold" color={isDark ? '#FFFFFF' : '#0F172A'}>
                {isRTL ? 'أداء الفصول الدراسية' : 'Classrooms Performance'}
              </AppText>
            </View>
            <AppText variant="caption" color="#94A3B8">
              {`${classesList.length} ${isRTL ? 'فصل' : 'Classes'}`}
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
          {classesList.map((item, idx) => (
            <View key={String(item.id || idx)} style={[styles.tableDataRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="bodyBold" color={isDark ? '#FFFFFF' : '#0F172A'} style={[styles.tdClass, { textAlign: isRTL ? 'right' : 'left' }]}>
                {item.class_name || `فصل ${idx + 1}`}
              </AppText>

              <View style={[styles.tdAttendance, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.tableProgressTrack}>
                  <View style={[styles.tableProgressFill, { width: `${item.attendance_rate || 0}%` }]} />
                </View>
                <AppText variant="caption" color="#E11D48" style={styles.rateText}>
                  {`${item.attendance_rate || 0}%`}
                </AppText>
              </View>

              <AppText variant="bodyBold" color={isDark ? '#FFFFFF' : '#0F172A'} style={styles.tdStudents}>
                {String(item.students_count || 2)}
              </AppText>

              <View style={styles.tdIncidents}>
                <View
                  style={[
                    styles.incidentPill,
                    item.incidents_count > 0 ? styles.incidentPillYellow : styles.incidentPillGrey,
                  ]}
                >
                  <AppText
                    variant="captionBold"
                    color={item.incidents_count > 0 ? '#B45309' : '#64748B'}
                  >
                    {String(item.incidents_count || 0)}
                  </AppText>
                </View>
              </View>

              <TouchableOpacity
                style={styles.tableActionBtn}
                onPress={() => setSelectedClassModal(item)}
                activeOpacity={0.7}
              >
                <AppText variant="captionBold" color="#1D4ED8">
                  {isRTL ? 'عرض' : 'View'}
                </AppText>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Left Card: توزيع المخالفات (Incident Distribution Donut) */}
        <View style={[styles.chartCard, isDark && styles.darkCard]}>
          <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.cardTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="alertTriangle" size={18} color="#B45309" />
              <AppText variant="cardTitle" weight="bold" color={isDark ? '#FFFFFF' : '#0F172A'}>
                {isRTL ? 'توزيع المخالفات' : 'Incident Distribution'}
              </AppText>
            </View>
            <AppText variant="caption" color="#94A3B8">
              {isRTL ? 'هذا الشهر — 7 مخالفة' : 'This Month — 7'}
            </AppText>
          </View>

          {/* Donut Chart & Legend Row */}
          <View style={[styles.donutSectionRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {/* SVG Donut Chart */}
            <View style={styles.donutGraphicBox}>
              <Svg width="110" height="110" viewBox="0 0 110 110">
                <Circle cx="55" cy="55" r="42" stroke="#F1F5F9" strokeWidth="12" fill="none" />
                <Circle cx="55" cy="55" r="42" stroke="#1D4ED8" strokeWidth="12" strokeDasharray="50 200" strokeDashoffset="0" fill="none" />
                <Circle cx="55" cy="55" r="42" stroke="#0284C7" strokeWidth="12" strokeDasharray="40 200" strokeDashoffset="-50" fill="none" />
                <Circle cx="55" cy="55" r="42" stroke="#E11D48" strokeWidth="12" strokeDasharray="75 200" strokeDashoffset="-90" fill="none" />
                <Circle cx="55" cy="55" r="42" stroke="#6366F1" strokeWidth="12" strokeDasharray="35 200" strokeDashoffset="-165" fill="none" />
                <Circle cx="55" cy="55" r="42" stroke="#D97706" strokeWidth="12" strokeDasharray="35 200" strokeDashoffset="-200" fill="none" />
              </Svg>
              <View style={styles.donutCenterLabel}>
                <AppText variant="cardTitle" weight="extraBold" color="#0F172A">
                  7
                </AppText>
                <AppText variant="caption" color="#94A3B8" style={{ fontSize: 9 }}>
                  {isRTL ? 'مخالفة' : 'Incidents'}
                </AppText>
              </View>
            </View>

            {/* Legend Col */}
            <View style={[styles.legendListCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              {incidentBreakdown.map((item, i) => (
                <View key={i} style={[styles.donutLegendItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.donutDot, { backgroundColor: item.color }]} />
                  <AppText variant="caption" color="#64748B" style={styles.donutLegendText}>
                    {`${item.percent} ${item.label}`}
                  </AppText>
                </View>
              ))}
            </View>
          </View>

          {/* Button to view all incidents */}
          <TouchableOpacity
            style={styles.viewAllIncidentsBtn}
            onPress={() => navigation.navigate('Behavior')}
            activeOpacity={0.7}
          >
            <Icon name="clipboard" size={14} color="#1D4ED8" />
            <AppText variant="captionBold" color="#1D4ED8">
              {isRTL ? 'عرض كل المخالفات' : 'View All Incidents'}
            </AppText>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── 6. Absentees Today & Quick Access Grid (Row 3) ── */}
      <View style={[styles.twoColRow, isDesktop && styles.twoColRowDesktop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Right Card: الطلاب الغائبون اليوم */}
        <View style={[styles.chartCard, isDark && styles.darkCard]}>
          <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.cardTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="users" size={18} color="#0F172A" />
              <View style={isRTL ? styles.alignEnd : styles.alignStart}>
                <AppText variant="cardTitle" weight="bold" color={isDark ? '#FFFFFF' : '#0F172A'}>
                  {isRTL ? 'الطلاب الغائبون اليوم' : 'Absentees Today'}
                </AppText>
                <AppText variant="caption" color="#94A3B8">
                  {isRTL ? `${absentCount} طالباً — ${unexcusedCount} لم يُبلّغ عنهم` : `${absentCount} students absent`}
                </AppText>
              </View>
            </View>

            {/* Actions in header: + تسجيل & إشعار الأولياء */}
            <View style={[styles.absentHeaderActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.registerAttendanceBtn}
                onPress={() => navigation.navigate('Attendance')}
                activeOpacity={0.8}
              >
                <Icon name="plus" size={12} color="#FFFFFF" />
                <AppText variant="captionBold" color="#FFFFFF">
                  {isRTL ? 'تسجيل' : 'Record'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.notifyParentsBtn}
                onPress={handleNotifyParents}
                activeOpacity={0.8}
              >
                <Icon name="bell" size={12} color="#1D4ED8" />
                <AppText variant="captionBold" color="#1D4ED8">
                  {isRTL ? 'إشعار الأولياء' : 'Notify'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* Toast Notification message if sent */}
          {notifSentAlert && (
            <View style={styles.toastNotice}>
              <AppText variant="captionBold" color="#0B7A55">
                {isRTL ? '✓ تم إرسال الإشعارات لأولياء الأمور بنجاح' : '✓ Notifications sent successfully'}
              </AppText>
            </View>
          )}

          {/* Absentees Placeholder / Content state */}
          <View style={styles.allPresentPlaceholder}>
            <View style={styles.checkCircleLarge}>
              <Icon name="check" size={24} color="#10B981" />
            </View>
            <AppText variant="bodyBold" color={isDark ? '#E2E8F0' : '#475467'}>
              {isRTL ? 'كل الطلاب حاضرين اليوم' : 'All students present today'}
            </AppText>
          </View>
        </View>

        {/* Left Card: وصول سريع (Quick Access Grid) */}
        <View style={[styles.chartCard, isDark && styles.darkCard]}>
          <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.cardTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="zap" size={18} color="#1D4ED8" />
              <AppText variant="cardTitle" weight="bold" color={isDark ? '#FFFFFF' : '#0F172A'}>
                {isRTL ? 'وصول سريع' : 'Quick Access'}
              </AppText>
            </View>
          </View>

          {/* 8-Button Grid */}
          <View style={[styles.quickAccessGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {/* 1. الجدول (أزرق) */}
            <TouchableOpacity
              style={[styles.quickAccessTile, styles.tileBlueBorder]}
              onPress={() => navigation.navigate('Schedule')}
              activeOpacity={0.7}
            >
              <Icon name="calendar" size={18} color="#1D4ED8" />
              <AppText variant="captionBold" color="#1D4ED8" style={styles.tileText}>
                {isRTL ? 'الجدول' : 'Schedule'}
              </AppText>
            </TouchableOpacity>

            {/* 2. توزيع الاختبارات (أزرق فاتح) */}
            <TouchableOpacity
              style={[styles.quickAccessTile, styles.tileCyanBorder]}
              onPress={() => navigation.navigate('ExamDistribution')}
              activeOpacity={0.7}
            >
              <Icon name="grid" size={18} color="#0284C7" />
              <AppText variant="captionBold" color="#0284C7" style={styles.tileText}>
                {isRTL ? 'توزيع الاختبارات' : 'Exam Dist'}
              </AppText>
            </TouchableOpacity>

            {/* 3. ملفات الإنجاز (أصفر) */}
            <TouchableOpacity
              style={[styles.quickAccessTile, styles.tileYellowBorder]}
              onPress={() => navigation.navigate('Portfolio')}
              activeOpacity={0.7}
            >
              <Icon name="award" size={18} color="#D97706" />
              <AppText variant="captionBold" color="#D97706" style={styles.tileText}>
                {isRTL ? 'ملفات الإنجاز' : 'Portfolios'}
              </AppText>
            </TouchableOpacity>

            {/* 4. تكامل نور (رمادي مع شارة قريباً) */}
            <TouchableOpacity
              style={[styles.quickAccessTile, styles.tileGreyBorder]}
              onPress={() => Alert.alert(isRTL ? 'تكامل نور' : 'Noor Integration', isRTL ? 'قريباً: المزامنة الآلية مع نظام نور' : 'Coming soon: Automated Noor sync')}
              activeOpacity={0.7}
            >
              <View style={styles.soonPill}>
                <AppText variant="caption" color="#38BDF8" style={styles.soonText}>
                  {isRTL ? 'قريباً' : 'SOON'}
                </AppText>
              </View>
              <Icon name="link" size={18} color="#64748B" />
              <AppText variant="captionBold" color="#64748B" style={styles.tileText}>
                {isRTL ? 'تكامل نور' : 'Noor Sync'}
              </AppText>
            </TouchableOpacity>

            {/* 5. اللجان (أزرق فاتح) */}
            <TouchableOpacity
              style={[styles.quickAccessTile, styles.tileSkyBorder]}
              onPress={() => navigation.navigate('Committees')}
              activeOpacity={0.7}
            >
              <Icon name="users" size={18} color="#0EA5E9" />
              <AppText variant="captionBold" color="#0EA5E9" style={styles.tileText}>
                {isRTL ? 'اللجان' : 'Committees'}
              </AppText>
            </TouchableOpacity>

            {/* 6. أرقام الجلوس (أخضر) */}
            <TouchableOpacity
              style={[styles.quickAccessTile, styles.tileGreenBorder]}
              onPress={() => navigation.navigate('ExamDistribution', { tab: 'seats' })}
              activeOpacity={0.7}
            >
              <Icon name="school" size={18} color="#059669" />
              <AppText variant="captionBold" color="#059669" style={styles.tileText}>
                {isRTL ? 'أرقام الجلوس' : 'Seat Numbers'}
              </AppText>
            </TouchableOpacity>

            {/* 7. الاستبيانات (وردي) */}
            <TouchableOpacity
              style={[styles.quickAccessTile, styles.tilePinkBorder]}
              onPress={() => navigation.navigate('Integrations')}
              activeOpacity={0.7}
            >
              <Icon name="fileText" size={18} color="#DB2777" />
              <AppText variant="captionBold" color="#DB2777" style={styles.tileText}>
                {isRTL ? 'الاستبيانات' : 'Surveys'}
              </AppText>
            </TouchableOpacity>

            {/* 8. التقارير (أرجواني) */}
            <TouchableOpacity
              style={[styles.quickAccessTile, styles.tilePurpleBorder]}
              onPress={() => navigation.navigate('Reports')}
              activeOpacity={0.7}
            >
              <Icon name="chart" size={18} color="#7C3AED" />
              <AppText variant="captionBold" color="#7C3AED" style={styles.tileText}>
                {isRTL ? 'التقارير' : 'Reports'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── 7. Recent Activities Feed (Row 4) ── */}
      <View style={[styles.chartCard, isDark && styles.darkCard]}>
        <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.cardTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Icon name="clock" size={18} color="#1D4ED8" />
            <AppText variant="cardTitle" weight="bold" color={isDark ? '#FFFFFF' : '#0F172A'}>
              {isRTL ? 'آخر النشاطات' : 'Recent Activities'}
            </AppText>
          </View>
          <AppText variant="caption" color="#94A3B8">
            {`${recentActivities.length} ${isRTL ? 'نشاط' : 'Activities'}`}
          </AppText>
        </View>

        {/* Activity Grid Tiles */}
        <View style={[styles.activityGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {recentActivities.map((act) => (
            <View
              key={act.id}
              style={[
                styles.activityTile,
                { flexDirection: isRTL ? 'row-reverse' : 'row' },
                isDark && styles.darkActivityTile,
              ]}
            >
              <View style={[styles.activityIconBox, { backgroundColor: act.bg }]}>
                <Icon name={act.icon as any} size={15} color={act.color} />
              </View>
              <View style={[styles.activityTextCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <AppText variant="captionBold" color={isDark ? '#FFFFFF' : '#0F172A'} numberOfLines={1}>
                  {act.title}
                </AppText>
                <AppText variant="caption" color="#94A3B8" style={{ fontSize: 10 }}>
                  {act.time}
                </AppText>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── Selected Class Details Modal Popup ── */}
      <Modal
        visible={!!selectedClassModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedClassModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <View style={[styles.modalHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.cardTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="school" size={20} color="#1D4ED8" />
                <AppText variant="cardTitle" weight="bold">
                  {isRTL ? `تفاصيل الفصل: ${selectedClassModal?.class_name}` : `Class: ${selectedClassModal?.class_name}`}
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setSelectedClassModal(null)}>
                <Icon name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBodyStats}>
              <View style={[styles.modalStatItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="caption" color="#64748B">{isRTL ? 'عدد الطلاب المقيدين:' : 'Enrolled Students:'}</AppText>
                <AppText variant="bodyBold">{String(selectedClassModal?.students_count || 0)}</AppText>
              </View>
              <View style={[styles.modalStatItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="caption" color="#64748B">{isRTL ? 'معدل الحضور:' : 'Attendance Rate:'}</AppText>
                <AppText variant="bodyBold" color="#E11D48">{`${selectedClassModal?.attendance_rate || 0}%`}</AppText>
              </View>
              <View style={[styles.modalStatItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="caption" color="#64748B">{isRTL ? 'المخالفات المسجلة:' : 'Recorded Incidents:'}</AppText>
                <AppText variant="bodyBold" color="#B45309">{String(selectedClassModal?.incidents_count || 0)}</AppText>
              </View>
            </View>

            <TouchableOpacity
              style={styles.modalViewStudentsBtn}
              onPress={() => {
                setSelectedClassModal(null);
                navigation.navigate('Students');
              }}
            >
              <AppText variant="button" color="#FFFFFF">
                {isRTL ? 'عرض قائمة طلاب هذا الفصل ➔' : 'View Class Students ➔'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Schedule Reports Modal ── */}
      <Modal
        visible={scheduleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setScheduleModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <View style={[styles.modalHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.cardTitleGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="calendar" size={20} color="#1D4ED8" />
                <AppText variant="cardTitle" weight="bold">
                  {isRTL ? 'جدولة التقارير الذكية' : 'Schedule Smart Reports'}
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setScheduleModalVisible(false)}>
                <Icon name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <AppText variant="body" color="#475467" style={{ marginVertical: 12, textAlign: isRTL ? 'right' : 'left' }}>
              {isRTL
                ? 'سيتم إرسال تقرير PDF تحليلي شامل كل يوم خميس إلى بريد وكيل المدرسة والإدارة.'
                : 'A comprehensive analytical PDF report will be emailed every Thursday.'}
            </AppText>

            <TouchableOpacity
              style={styles.modalViewStudentsBtn}
              onPress={() => {
                setScheduleModalVisible(false);
                Alert.alert(isRTL ? 'تم الحفظ' : 'Saved', isRTL ? 'تم تفعيل الجدولة الأسبوعية للتقارير بنجاح' : 'Weekly schedule active');
              }}
            >
              <AppText variant="button" color="#FFFFFF">
                {isRTL ? 'تفعيل الجدولة الآن' : 'Enable Schedule'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 16,
    backgroundColor: '#F8FAFC',
  },
  darkContainer: {
    backgroundColor: '#07132B',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    minHeight: 110,
    justifyContent: 'space-between',
    ...shadows.card,
  },
  kpiCardDesktop: {
    width: '23.8%',
  },
  kpiCardRoseBorder: {
    borderTopWidth: 4,
    borderTopColor: '#E11D48',
  },
  kpiCardPinkBorder: {
    borderTopWidth: 4,
    borderTopColor: '#BE185D',
  },
  kpiCardAmberBorder: {
    borderTopWidth: 4,
    borderTopColor: '#F59E0B',
  },
  kpiCardBlueBorder: {
    borderTopWidth: 4,
    borderTopColor: '#2563EB',
  },
  darkCard: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleRose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCirclePink: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FCE7F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleAmber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleBlue: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleCyan: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiCardLabel: {
    fontSize: 11,
    flex: 1,
  },
  kpiValueRow: {
    gap: 2,
  },
  kpiBigNumber: {
    fontSize: 24,
    lineHeight: 28,
  },
  kpiSubLabel: {
    fontSize: 10,
  },
  kpiDualRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  kpiDualSubCol: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  kpiDualDivider: {
    width: 1,
    height: '80%',
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  smartReportsBanner: {
    backgroundColor: '#070D1C',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    ...shadows.card,
  },
  darkReportsBanner: {
    backgroundColor: '#040814',
    borderColor: '#152138',
  },
  bannerContentRow: {
    justifyContent: 'space-between',
    gap: 16,
    width: '100%',
  },
  bannerTextCol: {
    minWidth: 260,
    gap: 10,
  },
  bannerHeaderRow: {
    alignItems: 'center',
    gap: 10,
  },
  bannerIconSquare: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#1D4ED8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTitleGroup: {
    gap: 8,
  },
  bannerMainTitle: {
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
  bannerDescription: {
    fontSize: 12,
    lineHeight: 20,
    maxWidth: 620,
  },
  featurePillsRow: {
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  featurePill: {
    backgroundColor: '#131D33',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#243352',
  },
  featurePillAccent: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  featurePillText: {
    fontSize: 11,
  },
  bannerActionsCol: {
    gap: 10,
    minWidth: 140,
  },
  bannerBtnFlex: {
    flex: 1,
    minWidth: 130,
  },
  bannerPrimaryBtn: {
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerPrimaryBtnText: {
    fontSize: 12.5,
  },
  bannerSecondaryBtn: {
    backgroundColor: '#131D33',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#243352',
  },
  bannerSecondaryBtnText: {
    fontSize: 12,
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
  alertStripLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  alertStripText: {
    fontSize: 12,
  },
  alertActionBtn: {
    backgroundColor: '#E11D48',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  twoColRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  twoColRowDesktop: {
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
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chartSubtext: {
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
  },
  avgGreenPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  currentPointPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  weeklyDaysGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 10,
  },
  dayColItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  dayCountText: {
    fontSize: 10,
  },
  dayBarTrack: {
    width: '100%',
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  dayBarFill: {
    width: '100%',
    borderRadius: 2,
  },
  dayNameText: {
    fontSize: 11,
  },
  dayDateText: {
    fontSize: 9,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  legendChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendSquare: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  svgContainer: {
    alignItems: 'center',
  },
  curveXAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  curveLabel: {
    fontSize: 9,
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
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  thClass: { flex: 1.2 },
  thAttendance: { flex: 3 },
  thStudents: { flex: 1, textAlign: 'center' },
  thIncidents: { flex: 1.2, textAlign: 'center' },
  thAction: { flex: 1, textAlign: 'center' },
  tdClass: { flex: 1.2, fontSize: 12 },
  tdAttendance: { flex: 3, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tableProgressTrack: { flex: 1, height: 5, backgroundColor: '#F1F5F9', borderRadius: 3, overflow: 'hidden' },
  tableProgressFill: { height: '100%', backgroundColor: '#E11D48', borderRadius: 3 },
  rateText: { fontSize: 10, minWidth: 26 },
  tdStudents: { flex: 1, textAlign: 'center', fontSize: 12 },
  tdIncidents: { flex: 1.2, alignItems: 'center', justifyContent: 'center' },
  incidentPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  incidentPillYellow: { backgroundColor: '#FEF3C7' },
  incidentPillGrey: { backgroundColor: '#F1F5F9' },
  tableActionBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 3,
    borderRadius: 6,
    alignItems: 'center',
  },
  donutSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 10,
  },
  donutGraphicBox: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donutCenterLabel: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legendListCol: {
    gap: 6,
  },
  donutLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  donutDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  donutLegendText: {
    fontSize: 11,
  },
  viewAllIncidentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginTop: 6,
  },
  absentHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  registerAttendanceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1D4ED8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  notifyParentsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  toastNotice: {
    backgroundColor: '#ECFDF5',
    padding: 8,
    borderRadius: 6,
    marginVertical: 6,
    alignItems: 'center',
  },
  allPresentPlaceholder: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  checkCircleLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  quickAccessTile: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    minHeight: 65,
    justifyContent: 'center',
    position: 'relative',
  },
  tileBlueBorder: { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' },
  tileCyanBorder: { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF' },
  tileYellowBorder: { borderColor: '#FDE68A', backgroundColor: '#FEFCE8' },
  tileGreyBorder: { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  tileSkyBorder: { borderColor: '#BAE6FD', backgroundColor: '#F0F9FF' },
  tileGreenBorder: { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' },
  tilePinkBorder: { borderColor: '#FBCFE8', backgroundColor: '#FDF2F8' },
  tilePurpleBorder: { borderColor: '#DDD6FE', backgroundColor: '#F5F3FF' },
  tileText: {
    fontSize: 11,
  },
  soonPill: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  soonText: {
    fontSize: 8,
    fontWeight: 'bold',
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  activityTile: {
    width: '48.5%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    gap: 8,
    minHeight: 52,
  },
  darkActivityTile: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  activityIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityTextCol: {
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    maxWidth: 400,
    borderRadius: 14,
    padding: 18,
    gap: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  modalBodyStats: {
    gap: 8,
    paddingVertical: 6,
  },
  modalStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalViewStudentsBtn: {
    backgroundColor: '#1D4ED8',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  alignEnd: { alignItems: 'flex-end' },
  alignStart: { alignItems: 'flex-start' },
});

export default VicePrincipalDashboard;
