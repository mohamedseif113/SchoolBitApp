import React, { useMemo } from 'react';
import {
  View,
  Text,
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
import { colors, withOpacity } from '../../theme/colors';
import { Icon } from '../common/Icon';
import { TeacherDashboardData } from '../../types/dashboard';

interface TeacherDashboardProps {
  dashboardData?: TeacherDashboardData | any;
  liveTasks?: any[];
  liveSchedule?: any[];
  onRefresh?: () => void;
  onToggleTask?: (taskId: string | number) => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  dashboardData,
  liveTasks = [],
  liveSchedule = [],
  onToggleTask,
}) => {
  const { t, i18n } = useTranslation();
  const navigation = useNavigation<any>();
  const { isRTL } = useAppDirection();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const { user, school, hasPermission, hasAnyPermission } = useAuthStore();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  // Dynamic formatted date
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

  // Real backend metrics (zero fabricated literals)
  const kpis = dashboardData?.kpis;
  const totalStudents = kpis?.students_today != null ? kpis.students_today : '—';
  const completedClasses =
    kpis?.periods_today != null
      ? `${kpis.periods_done ?? 0}/${kpis.periods_today}`
      : '—';
  const attendanceRate =
    kpis?.attendance_rate != null ? `${kpis.attendance_rate}%` : '—';
  const pendingTasks = kpis?.pending_tasks != null ? kpis.pending_tasks : '—';
  const overdueTasks = kpis?.overdue_tasks != null ? kpis.overdue_tasks : '—';

  // Real periods data from dashboard or fallback to live schedule
  const rawPeriods = dashboardData?.today_periods;
  const periodsList: any[] = Array.isArray(rawPeriods) && rawPeriods.length > 0
    ? rawPeriods
    : liveSchedule;

  // Real tasks data from dashboard or live tasks
  const rawTasks = dashboardData?.tasks;
  const tasksList: any[] = Array.isArray(rawTasks) && rawTasks.length > 0
    ? rawTasks
    : liveTasks.slice(0, 5);

  // Real class performance
  const classPerformance: any[] = Array.isArray(dashboardData?.class_performance)
    ? dashboardData.class_performance
    : [];

  // Top and follow-up students
  const isLinked = !!dashboardData?.is_linked;
  const topStudents: any[] = Array.isArray(dashboardData?.top_students)
    ? dashboardData.top_students
    : [];
  const needsFollowup: any[] = Array.isArray(dashboardData?.needs_followup_students)
    ? dashboardData.needs_followup_students
    : [];

  // Ongoing class detection
  const ongoingPeriod = periodsList.find(
    (p) => p.status === 'ongoing' || p.status === 'now'
  );

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Header Banner & Action Button */}
      <View style={[styles.headerBanner, isDark && styles.darkHeaderBanner]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerInfoGroup, isRTL && styles.alignEnd]}>
            <Text
              style={[
                styles.greetingText,
                isDark && styles.darkText,
                isRTL ? styles.rtlText : styles.ltrText,
              ]}
            >
              {t('teacher_dashboard.welcome', 'لوحتي')} — {user?.name || '—'}
            </Text>
            <Text
              style={[
                styles.statusSubtext,
                isDark && styles.darkSubtext,
                isRTL ? styles.rtlText : styles.ltrText,
              ]}
            >
              {ongoingPeriod
                ? `${t('dashboard.timetable.statusNow', 'حصة جارية')}: ${ongoingPeriod.subject || ongoingPeriod.title || '—'} (${ongoingPeriod.class_name || ongoingPeriod.room || '—'})`
                : (school?.name || t('teacher_dashboard.no_ongoing_class', 'لا توجد حصة جارية حالياً'))}
            </Text>
          </View>

          <View style={[styles.headerActionsRow]}>
            {formattedDate ? (
              <View style={[styles.dateChip, isDark && styles.darkChip]}>
                <Icon name="calendar" size={14} color={isDark ? '#CBD5E1' : '#344054'} />
                <Text style={[styles.dateChipText, isDark && styles.darkChipText]}>
                  {formattedDate}
                </Text>
              </View>
            ) : null}

            {/* Quick My Tasks Header Button */}
            <TouchableOpacity
              style={[styles.headerSecondaryBtn, isDark && styles.darkSecondaryBtn]}
              onPress={() => navigation.navigate('Tasks')}
              accessibilityRole="button"
              accessibilityLabel={t('navigation.tasks', 'مهامي')}
            >
              <Icon name="clipboard" size={14} color={isDark ? '#E2E8F0' : '#344054'} />
              <Text style={[styles.headerSecondaryBtnText, isDark && styles.darkSecondaryBtnText]}>
                {t('navigation.tasks', 'مهامي')}
              </Text>
            </TouchableOpacity>

            {/* Mark Attendance Header Button */}
            <TouchableOpacity
              style={styles.markAttendanceHeaderBtn}
              onPress={() => navigation.navigate('Attendance')}
              accessibilityRole="button"
              accessibilityLabel={t('teacher_dashboard.mark_attendance', 'تسجيل حضور')}
            >
              <Icon name="clipboard" size={14} color="#FFFFFF" />
              <Text style={styles.markAttendanceHeaderBtnText}>
                {t('teacher_dashboard.mark_attendance', 'تسجيل حضور')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 2. 5-Metric Summary Cards Grid (2-column responsive on mobile, 5 in a row on desktop) */}
      <View style={[styles.kpiGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {/* Metric 1: Class Students */}
        <TouchableOpacity
          style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiGreenBorder, isDark && styles.darkCard]}
          onPress={() => navigation.navigate('Students')}
          accessibilityRole="button"
        >
          <View style={[styles.kpiCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCircleGreen}>
              <Icon name="users" size={18} color="#12B76A" />
            </View>
            <Text style={[styles.kpiValue, { color: '#12B76A' }]}>{totalStudents}</Text>
          </View>
          <Text
            style={[
              styles.kpiLabel,
              isDark && styles.darkSubtext,
              isRTL ? styles.rtlText : styles.ltrText,
            ]}
            numberOfLines={1}
          >
            {t('teacher_dashboard.class_students', 'طلابي اليوم')}
          </Text>
        </TouchableOpacity>

        {/* Metric 2: Completed Classes */}
        <TouchableOpacity
          style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiBlueBorder, isDark && styles.darkCard]}
          onPress={() => navigation.navigate('Schedule')}
          accessibilityRole="button"
        >
          <View style={[styles.kpiCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCircleBlue}>
              <Icon name="calendar" size={18} color="#1246B7" />
            </View>
            <Text style={[styles.kpiValue, { color: '#1246B7' }]}>{completedClasses}</Text>
          </View>
          <Text
            style={[
              styles.kpiLabel,
              isDark && styles.darkSubtext,
              isRTL ? styles.rtlText : styles.ltrText,
            ]}
            numberOfLines={1}
          >
            {t('teacher_dashboard.completed_classes', 'حصص مكتملة')}
          </Text>
        </TouchableOpacity>

        {/* Metric 3: Attendance Rate */}
        <TouchableOpacity
          style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiTealBorder, isDark && styles.darkCard]}
          onPress={() => navigation.navigate('Attendance')}
          accessibilityRole="button"
        >
          <View style={[styles.kpiCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCircleTeal}>
              <Icon name="chart" size={18} color="#0E9384" />
            </View>
            <Text style={[styles.kpiValue, { color: '#0E9384' }]}>{attendanceRate}</Text>
          </View>
          <Text
            style={[
              styles.kpiLabel,
              isDark && styles.darkSubtext,
              isRTL ? styles.rtlText : styles.ltrText,
            ]}
            numberOfLines={1}
          >
            {t('teacher_dashboard.attendance_rate', 'نسبة الحضور')}
          </Text>
        </TouchableOpacity>

        {/* Metric 4: Pending Tasks */}
        <TouchableOpacity
          style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiYellowBorder, isDark && styles.darkCard]}
          onPress={() => navigation.navigate('Tasks')}
          accessibilityRole="button"
        >
          <View style={[styles.kpiCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCircleYellow}>
              <Icon name="clipboard" size={18} color="#F79009" />
            </View>
            <Text style={[styles.kpiValue, { color: '#F79009' }]}>{pendingTasks}</Text>
          </View>
          <Text
            style={[
              styles.kpiLabel,
              isDark && styles.darkSubtext,
              isRTL ? styles.rtlText : styles.ltrText,
            ]}
            numberOfLines={1}
          >
            {t('teacher_dashboard.pending_tasks', 'مهام معلقة')}
          </Text>
        </TouchableOpacity>

        {/* Metric 5: Overdue Tasks */}
        <TouchableOpacity
          style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiPinkBorder, isDark && styles.darkCard]}
          onPress={() => navigation.navigate('Tasks')}
          accessibilityRole="button"
        >
          <View style={[styles.kpiCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.iconCirclePink}>
              <Icon name="clock" size={18} color="#F04438" />
            </View>
            <Text style={[styles.kpiValue, { color: '#F04438' }]}>{overdueTasks}</Text>
          </View>
          <Text
            style={[
              styles.kpiLabel,
              isDark && styles.darkSubtext,
              isRTL ? styles.rtlText : styles.ltrText,
            ]}
            numberOfLines={1}
          >
            {t('teacher_dashboard.overdue_tasks', 'مهام متأخرة')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Middle Section: Today's Classes & Pending Tasks */}
      <View style={styles.middleGrid}>
        {/* Today's Classes */}
        <View style={[styles.widgetCard, isDark && styles.darkCard]}>
          <View style={[styles.widgetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.widgetHeaderTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="clock" size={18} color="#1246B7" />
              <Text style={[styles.widgetTitle, isDark && styles.darkText]}>
                {t('teacher_dashboard.todays_classes', 'حصصي اليوم')}
              </Text>
            </View>
            {kpis?.periods_today != null ? (
              <View style={styles.completedBadge}>
                <Text style={styles.completedBadgeText}>
                  {`${kpis.periods_done ?? 0}/${kpis.periods_today} ${t('common.completed', 'مكتملة')}`}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Class Items */}
          <View style={styles.classList}>
            {periodsList.length > 0 ? (
              periodsList.map((cls, index) => {
                const isCompleted = cls.is_done || cls.status === 'completed' || cls.status === 'انتهت';
                const isOngoing = cls.status === 'ongoing' || cls.status === 'now' || cls.status === 'جارية';
                const timeText = cls.time || (cls.start_time ? `${cls.start_time} - ${cls.end_time || ''}` : `الحصة ${cls.period || index + 1}`);
                const classLabel = cls.class_name || cls.classroom || cls.cls || '—';
                const roomLabel = cls.room ? `قاعة ${cls.room}` : 'قاعة —';
                const subjectLabel = cls.subject || cls.title || '—';

                return (
                  <View
                    key={String(cls.id || index)}
                    style={[
                      styles.classItemRow,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <Text style={styles.classTimeText}>{timeText}</Text>
                    <View style={styles.classPillSmall}>
                      <Text style={styles.classPillSmallText}>{classLabel}</Text>
                    </View>
                    <View style={[styles.classDetailsGroup, isRTL ? styles.alignEnd : styles.alignStart]}>
                      <Text
                        style={[
                          styles.classSubjectText,
                          isDark && styles.darkText,
                          isRTL ? styles.rtlText : styles.ltrText,
                        ]}
                        numberOfLines={1}
                      >
                        {subjectLabel}
                      </Text>
                      <Text
                        style={[
                          styles.classRoomText,
                          isRTL ? styles.rtlText : styles.ltrText,
                        ]}
                      >
                        {roomLabel}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusCompletedBadge,
                        isOngoing && styles.statusOngoingBadge,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusCompletedBadgeText,
                          isOngoing && styles.statusOngoingBadgeText,
                        ]}
                      >
                        {isCompleted
                          ? `✓ ${t('dashboard.timetable.statusDone', 'انتهت')}`
                          : isOngoing
                          ? `● ${t('dashboard.timetable.statusNow', 'جارية')}`
                          : t('dashboard.timetable.statusUpcoming', 'قادمة')}
                      </Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
                  {t('teacher_dashboard.no_classes_today', 'لا توجد حصص مجدولة لليوم')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Pending Tasks */}
        <View style={[styles.widgetCard, isDark && styles.darkCard]}>
          <View style={[styles.widgetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.widgetHeaderTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="clipboard" size={18} color="#F79009" />
              <Text style={[styles.widgetTitle, isDark && styles.darkText]}>
                {t('teacher_dashboard.pending_tasks_title', 'مهامي المعلقة')}
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Tasks')}>
              <Text style={styles.viewAllText}>{t('common.view_all', 'عرض الكل')}</Text>
            </TouchableOpacity>
          </View>

          {/* Task Items */}
          <View style={styles.taskList}>
            {tasksList.length > 0 ? (
              tasksList.map((task, index) => {
                const isCompleted = !!task.completed || task.status === 'completed';
                const isOverdue = !!task.is_overdue || task.status === 'overdue';
                const dateText = task.due_date || task.due || '—';

                return (
                  <View
                    key={String(task.id || index)}
                    style={[
                      styles.taskItemRow,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                      index === tasksList.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.taskCheckbox,
                        isCompleted && styles.taskCheckboxChecked,
                      ]}
                      onPress={() => onToggleTask && onToggleTask(task.id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isCompleted }}
                    >
                      {isCompleted ? <Icon name="check" size={12} color="#FFFFFF" /> : null}
                    </TouchableOpacity>

                    <View style={[styles.taskDetailsGroup, isRTL ? styles.alignEnd : styles.alignStart]}>
                      <Text
                        style={[
                          styles.taskTitleText,
                          isCompleted && styles.taskTitleCompleted,
                          isDark && styles.darkText,
                          isRTL ? styles.rtlText : styles.ltrText,
                        ]}
                        numberOfLines={1}
                      >
                        {task.title}
                      </Text>
                      <View style={[styles.taskMetaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Icon name="calendar" size={11} color={colors.tx2} />
                        <Text style={styles.taskDateText}>{dateText}</Text>
                      </View>
                    </View>

                    {isOverdue ? (
                      <View style={styles.overdueBadge}>
                        <Text style={styles.overdueBadgeText}>
                          {t('dashboard.tasksList.overdue', 'متأخر')}
                        </Text>
                      </View>
                    ) : isCompleted ? (
                      <View style={styles.statusCompletedBadge}>
                        <Text style={styles.statusCompletedBadgeText}>
                          ✓ {t('dashboard.tasksList.done', 'مكتملة')}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.ontimeBadge}>
                        <Text style={styles.ontimeBadgeText}>
                          {t('dashboard.tasksList.ontime', 'بوقته')}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
                  {t('teacher_dashboard.no_pending_tasks', 'لا توجد مهام معلقة')}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* 4. Lower Section: Class Performance & Student Insights */}
      <View style={styles.middleGrid}>
        {/* Class Performance */}
        <View style={[styles.widgetCard, isDark && styles.darkCard]}>
          <View style={[styles.widgetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.widgetHeaderTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="chart" size={18} color="#1246B7" />
              <View style={isRTL ? styles.alignEnd : styles.alignStart}>
                <Text style={[styles.widgetTitle, isDark && styles.darkText, isRTL ? styles.rtlText : styles.ltrText]}>
                  {t('teacher_dashboard.class_performance', 'أداء صفوفي')}
                </Text>
                <Text style={[styles.widgetSubtext, isRTL ? styles.rtlText : styles.ltrText]}>
                  {t('teacher_dashboard.academic_and_attendance', 'المتوسط الأكاديمي ونسبة الحضور')}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.performanceList}>
            {classPerformance.length > 0 ? (
              classPerformance.map((item, index) => {
                const className = item.class_name || item.cls || `فصل ${index + 1}`;
                const avgText = item.average != null ? `${item.average}%` : '—';
                const attText = item.attendance_rate != null ? `${item.attendance_rate}%` : item.att != null ? `${item.att}%` : '—';

                return (
                  <View
                    key={String(index)}
                    style={[
                      styles.performanceRow,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                      index === classPerformance.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={index % 2 === 0 ? styles.classPillGreen : styles.classPillBlue}>
                      <Text style={index % 2 === 0 ? styles.classPillGreenText : styles.classPillBlueText}>
                        {className}
                      </Text>
                    </View>
                    <Text style={[styles.performanceMetricsText, isDark && styles.darkSubtext]}>
                      {`معدل ${avgText}   حضور ${attText}`}
                    </Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, isDark && styles.darkSubtext]}>
                  {t('teacher_dashboard.no_performance_data', 'لا توجد بيانات أداء للصفوف')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Student Insights */}
        <View style={[styles.widgetCard, isDark && styles.darkCard]}>
          <View style={[styles.widgetHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.widgetHeaderTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="users" size={18} color="#1246B7" />
              <Text style={[styles.widgetTitle, isDark && styles.darkText]}>
                {t('teacher_dashboard.student_insights', 'لمحة عن الطلاب')}
              </Text>
            </View>
          </View>

          <View style={styles.insightsList}>
            {/* Top Students */}
            <View style={[styles.insightRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="award" size={18} color="#1246B7" />
              <View style={[styles.insightTextGroup, isRTL ? styles.alignEnd : styles.alignStart]}>
                <Text style={[styles.insightTitleText, isDark && styles.darkText, isRTL ? styles.rtlText : styles.ltrText]}>
                  {t('teacher_dashboard.top_students', 'المتميزون')}
                </Text>
                <Text style={[styles.insightSubtext, isRTL ? styles.rtlText : styles.ltrText]}>
                  {isLinked
                    ? (topStudents.length ? `${topStudents.length} ${t('teacher_dashboard.students_count_unit', 'طلاب متميزين')}` : t('teacher_dashboard.no_top_students', 'لا يوجد طلاب'))
                    : t('teacher_dashboard.appears_after_linking', 'يظهر بعد ربط وحدة الدرجات')}
                </Text>
              </View>
              <Text style={styles.insightCountText}>
                {isLinked ? topStudents.length : '—'}
              </Text>
            </View>

            {/* Needs Follow-up */}
            <View style={[styles.insightRow, { flexDirection: isRTL ? 'row-reverse' : 'row', borderBottomWidth: 0 }]}>
              <Icon name="info" size={18} color="#F79009" />
              <View style={[styles.insightTextGroup, isRTL ? styles.alignEnd : styles.alignStart]}>
                <Text style={[styles.insightTitleText, isDark && styles.darkText, isRTL ? styles.rtlText : styles.ltrText]}>
                  {t('teacher_dashboard.needs_followup', 'يحتاجون متابعة')}
                </Text>
                <Text style={[styles.insightSubtext, isRTL ? styles.rtlText : styles.ltrText]}>
                  {isLinked
                    ? (needsFollowup.length ? `${needsFollowup.length} ${t('teacher_dashboard.students_count_unit', 'طلاب بحاجة لمتابعة')}` : t('teacher_dashboard.no_followup_students', 'لا يوجد طلاب'))
                    : t('teacher_dashboard.appears_after_linking', 'يظهر بعد ربط وحدة الدرجات')}
                </Text>
              </View>
              <Text style={styles.insightCountText}>
                {isLinked ? needsFollowup.length : '—'}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 5. Quick Actions Row */}
      <View style={[styles.quickActionsContainer, isDark && styles.darkCard]}>
        <Text
          style={[
            styles.quickActionsSectionTitle,
            isDark && styles.darkText,
            isRTL ? styles.rtlText : styles.ltrText,
          ]}
        >
          ⚡ {t('teacher_dashboard.quick_actions', 'إجراءات سريعة')}
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.quickActionsScroll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {/* 1. Mark Attendance */}
          {hasAnyPermission('attendance.students.view', 'attendance.view') && (
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => navigation.navigate('Attendance')}
              accessibilityRole="button"
              accessibilityLabel={t('teacher_dashboard.mark_attendance', 'تسجيل حضور')}
            >
              <Icon name="clipboard" size={16} color="#1246B7" />
              <Text style={styles.actionChipText}>
                {t('teacher_dashboard.mark_attendance', 'تسجيل حضور')}
              </Text>
            </TouchableOpacity>
          )}

          {/* 2. Homework & Grades */}
          {hasAnyPermission('homework.assignment.view', 'homework.view') && (
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => navigation.navigate('Homework')}
              accessibilityRole="button"
              accessibilityLabel={t('teacher_dashboard.upload_grades', 'الواجبات والدرجات')}
            >
              <Icon name="fileText" size={16} color="#1246B7" />
              <Text style={styles.actionChipText}>
                {t('navigation.homework', 'الواجبات')}
              </Text>
            </TouchableOpacity>
          )}

          {/* 3. Students */}
          {hasAnyPermission('employees.view', 'students.view') && (
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => navigation.navigate('Students')}
              accessibilityRole="button"
              accessibilityLabel={t('navigation.students', 'طلابي')}
            >
              <Icon name="users" size={16} color="#1246B7" />
              <Text style={styles.actionChipText}>
                {t('navigation.students', 'طلابي')}
              </Text>
            </TouchableOpacity>
          )}

          {/* 4. Schedule */}
          {hasAnyPermission('schedule.view') && (
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => navigation.navigate('Schedule')}
              accessibilityRole="button"
              accessibilityLabel={t('navigation.schedule', 'جدولي الدراسي')}
            >
              <Icon name="calendar" size={16} color="#1246B7" />
              <Text style={styles.actionChipText}>
                {t('navigation.schedule', 'جدولي الدراسي')}
              </Text>
            </TouchableOpacity>
          )}

          {/* 5. Tasks */}
          <TouchableOpacity
            style={styles.actionChip}
            onPress={() => navigation.navigate('Tasks')}
            accessibilityRole="button"
            accessibilityLabel={t('navigation.tasks', 'المهام')}
          >
            <Icon name="check" size={16} color="#1246B7" />
            <Text style={styles.actionChipText}>
              {t('navigation.tasks', 'المهام')}
            </Text>
          </TouchableOpacity>

          {/* 6. Portfolio */}
          {hasAnyPermission('portfolio.view') && (
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => navigation.navigate('Portfolio')}
              accessibilityRole="button"
              accessibilityLabel={t('navigation.portfolio', 'ملف إنجازي')}
            >
              <Icon name="award" size={16} color="#1246B7" />
              <Text style={styles.actionChipText}>
                {t('navigation.portfolio', 'ملف إنجازي')}
              </Text>
            </TouchableOpacity>
          )}

          {/* 7. Committees */}
          {hasAnyPermission('committees.view') && (
            <TouchableOpacity
              style={styles.actionChip}
              onPress={() => navigation.navigate('Committees')}
              accessibilityRole="button"
              accessibilityLabel={t('navigation.committees', 'لجاني وكشوفي')}
            >
              <Icon name="school" size={16} color="#1246B7" />
              <Text style={styles.actionChipText}>
                {t('navigation.committees', 'لجاني وكشوفي')}
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 14,
    gap: 14,
  },
  headerBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E7F0',
  },
  darkHeaderBanner: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerInfoGroup: {
    flex: 1,
    minWidth: 180,
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  greetingText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0A1D3D',
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 12,
    color: '#77839B',
    fontWeight: '500',
  },
  darkText: {
    color: '#F8FAFC',
  },
  darkSubtext: {
    color: '#94A3B8',
  },
  rtlText: {
    textAlign: 'right',
  },
  ltrText: {
    textAlign: 'left',
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F2F4F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  darkChip: {
    backgroundColor: '#1E293B',
  },
  dateChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#344054',
  },
  darkChipText: {
    color: '#CBD5E1',
  },
  headerSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  darkSecondaryBtn: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  headerSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#344054',
  },
  darkSecondaryBtnText: {
    color: '#E2E8F0',
  },
  markAttendanceHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1246B7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  markAttendanceHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 2,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    width: '48.5%',
    borderWidth: 1,
    borderColor: '#E1E7F0',
    justifyContent: 'space-between',
    minHeight: 95,
  },
  kpiCardDesktop: {
    width: '18.5%',
  },
  darkCard: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
  },
  kpiGreenBorder: {
    borderTopWidth: 3,
    borderTopColor: '#12B76A',
  },
  kpiBlueBorder: {
    borderTopWidth: 3,
    borderTopColor: '#1246B7',
  },
  kpiTealBorder: {
    borderTopWidth: 3,
    borderTopColor: '#0E9384',
  },
  kpiYellowBorder: {
    borderTopWidth: 3,
    borderTopColor: '#F79009',
  },
  kpiPinkBorder: {
    borderTopWidth: 3,
    borderTopColor: '#F04438',
  },
  kpiCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircleGreen: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleBlue: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF4FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleTeal: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleYellow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFAEB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCirclePink: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  kpiLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475467',
  },
  middleGrid: {
    gap: 14,
  },
  widgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E7F0',
  },
  widgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  widgetHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  widgetTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A1D3D',
  },
  widgetSubtext: {
    fontSize: 10,
    color: '#77839B',
    marginTop: 2,
  },
  completedBadge: {
    backgroundColor: '#F0FDF9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A6F4C5',
  },
  completedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0B7A55',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1246B7',
  },
  classList: {
    gap: 10,
  },
  classItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  classTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1246B7',
    minWidth: 45,
  },
  classPillSmall: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  classPillSmallText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1246B7',
  },
  classDetailsGroup: {
    flex: 1,
  },
  classSubjectText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A1D3D',
  },
  classRoomText: {
    fontSize: 10,
    color: '#77839B',
    marginTop: 2,
  },
  statusCompletedBadge: {
    backgroundColor: '#ECFDF3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusCompletedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#12B76A',
  },
  statusOngoingBadge: {
    backgroundColor: '#EEF4FF',
  },
  statusOngoingBadgeText: {
    color: '#1246B7',
  },
  taskList: {
    gap: 8,
  },
  taskItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#D0D5DD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCheckboxChecked: {
    backgroundColor: '#1246B7',
    borderColor: '#1246B7',
  },
  taskDetailsGroup: {
    flex: 1,
  },
  taskTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A1D3D',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#77839B',
  },
  taskMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  taskDateText: {
    fontSize: 10,
    color: '#77839B',
  },
  overdueBadge: {
    backgroundColor: '#FEF3F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  overdueBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F04438',
  },
  ontimeBadge: {
    backgroundColor: '#ECFDF3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ontimeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#12B76A',
  },
  performanceList: {
    gap: 10,
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  classPillGreen: {
    backgroundColor: '#ECFDF3',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classPillGreenText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#12B76A',
  },
  classPillBlue: {
    backgroundColor: '#EEF4FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  classPillBlueText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1246B7',
  },
  performanceMetricsText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#344054',
  },
  insightsList: {
    gap: 10,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F4F7',
  },
  insightTextGroup: {
    flex: 1,
  },
  insightTitleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A1D3D',
  },
  insightSubtext: {
    fontSize: 10,
    color: '#77839B',
    marginTop: 2,
  },
  insightCountText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#344054',
  },
  quickActionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E7F0',
  },
  quickActionsSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0A1D3D',
    marginBottom: 12,
  },
  quickActionsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  actionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1246B7',
  },
  emptyContainer: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: '#77839B',
    textAlign: 'center',
  },
});

export default TeacherDashboard;

