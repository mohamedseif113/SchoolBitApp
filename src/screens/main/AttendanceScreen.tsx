import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { useUiStore } from '../../store/uiStore';
import { useAttendance } from '../../hooks/useAttendance';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';
import { WebDashboardLayout } from '../../components/layout/WebDashboardLayout';

type TopTab = 'attendance' | 'records' | 'permissions' | 'biotime_setup';
type SubTab = 'daily' | 'periods' | 'live_fingerprint' | 'dismissal' | 'daily_report';
type StatusFilter = 'all' | 'present' | 'late' | 'absent' | 'excused';

interface StudentAttendanceRow {
  id: number;
  name: string;
  national_id: string;
  class_name: string;
  status?: 'present' | 'absent' | 'late' | 'excused' | 'no_school';
}

export default function AttendanceScreen() {
  const { t } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [topTab, setTopTab] = useState<TopTab>('attendance');
  const [subTab, setSubTab] = useState<SubTab>('daily');
  const [currentDateIso, setCurrentDateIso] = useState('2026-09-07');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [datePickerModalOpen, setDatePickerModalOpen] = useState(false);
  const [tempDate, setTempDate] = useState(currentDateIso);
  const [refreshing, setRefreshing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [isSyncingBioTime, setIsSyncingBioTime] = useState(false);

  // New Search & Status Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // Student attendance status state
  const [studentStatuses, setStudentStatuses] = useState<Record<number, string>>({
    1: 'absent',
    2: 'absent',
    3: 'absent',
    4: 'absent',
    5: 'absent',
    6: 'absent',
  });

  const {
    summary,
    classes: apiClasses,
    isLoading,
    isError,
    refetch,
    saveAttendance,
    isSaving,
  } = useAttendance(currentDateIso);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const classOptions = ['all', '1/أ', '1/ب', '2/أ', '2/ب', '3/أ', '3/ب', '4/أ', '5/أ', '6/أ'];

  // Demo students list matching Screenshot 4 from user
  const defaultStudents: StudentAttendanceRow[] = useMemo(
    () => [
      { id: 1, name: 'أنس وليد الحارثي', national_id: '1280998888', class_name: '1/أ' },
      { id: 2, name: 'بدر عايض الغامدي', national_id: '1288888899', class_name: '2/ب' },
      { id: 3, name: 'تركي فريد الزهراني', national_id: '1115078945', class_name: '2/أ' },
      { id: 4, name: 'ثامر عبدالعزيز الفيفي', national_id: '1200000010', class_name: '4/أ' },
      { id: 5, name: 'حسام عادل الشهري', national_id: '1200000015', class_name: '6/أ' },
      { id: 6, name: 'خالد سلطان المطيري', national_id: '1200000002', class_name: '1/أ' },
      { id: 7, name: 'راكان مساعد الدوسري', national_id: '1200000011', class_name: '4/أ' },
      { id: 8, name: 'زياد فهد الرشيدي', national_id: '1200000009', class_name: '3/ب' },
      { id: 9, name: 'سلمان محمد العتيبي', national_id: '1200000003', class_name: '1/أ' },
      { id: 10, name: 'طلال منصور الخالدي', national_id: '1200000014', class_name: '6/أ' },
      { id: 11, name: 'عبدالله حمد السبيعي', national_id: '1200000012', class_name: '5/أ' },
      { id: 12, name: 'فيصل عبدالله القحطاني', national_id: '1200000004', class_name: '1/أ' },
    ],
    []
  );

  // Filter students based on class selection, search query, and status filter
  const displayStudents = useMemo(() => {
    return defaultStudents.filter((st) => {
      // 1. Class filter
      if (selectedClass !== 'all' && st.class_name !== selectedClass) {
        return false;
      }
      // 2. Search query filter (by name or national id)
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const matchesName = st.name.toLowerCase().includes(query);
        const matchesId = st.national_id.includes(query);
        if (!matchesName && !matchesId) return false;
      }
      // 3. Status filter
      if (statusFilter !== 'all') {
        const stStatus = studentStatuses[st.id] || 'no_school';
        if (stStatus !== statusFilter) return false;
      }
      return true;
    });
  }, [defaultStudents, selectedClass, searchQuery, statusFilter, studentStatuses]);

  // Live dynamic calculation of KPI statistics
  const kpiStats = useMemo(() => {
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    defaultStudents.forEach((st) => {
      const status = studentStatuses[st.id];
      if (status === 'present') present++;
      else if (status === 'absent') absent++;
      else if (status === 'late') late++;
      else if (status === 'excused') excused++;
    });

    const total = defaultStudents.length;

    return {
      total,
      present,
      absent,
      late,
      excused,
      absentPercent: total > 0 ? Math.round((absent / total) * 100) : 0,
      presentPercent: total > 0 ? Math.round((present / total) * 100) : 0,
      latePercent: total > 0 ? Math.round((late / total) * 100) : 0,
      excusedPercent: total > 0 ? Math.round((excused / total) * 100) : 0,
    };
  }, [defaultStudents, studentStatuses]);

  const handleSetStatus = (studentId: number, status: string) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? '' : status,
    }));
  };

  const getAvatarBg = (name: string) => {
    const charCode = name.charCodeAt(0) || 0;
    const colorsList = ['#059669', '#2563EB', '#1E40AF', '#0284C7', '#4F46E5', '#0369A1', '#DB2777', '#D97706'];
    return colorsList[charCode % colorsList.length];
  };

  const showToast = (message: string) => {
    setActionNotice(message);
    setTimeout(() => {
      setActionNotice(null);
    }, 3000);
  };

  const handleExportPDF = () => {
    showToast(isRTL ? 'جاري تصدير كشف الحضور بصيغة PDF...' : 'Exporting attendance sheet to PDF...');
  };

  const handleSyncBioTime = () => {
    setIsSyncingBioTime(true);
    setTimeout(() => {
      setIsSyncingBioTime(false);
      showToast(isRTL ? 'تمت مزامنة بيانات البصمة الحية بنجاح' : 'BioTime data synced successfully');
    }, 1200);
  };

  const handleSaveAttendance = async () => {
    try {
      const markedCount = Object.keys(studentStatuses).filter((k) => studentStatuses[Number(k)]).length;
      showToast(
        isRTL ? `تم حفظ حضور ${markedCount} طالب بنجاح` : `Attendance saved for ${markedCount} students successfully`
      );
    } catch (err) {
      showToast(isRTL ? 'حدث خطأ أثناء حفظ الحضور' : 'Error saving attendance');
    }
  };

  return (
    <WebDashboardLayout
      title={isRTL ? 'الحضور اليومي' : 'Daily Attendance'}
      subtitle={isRTL ? 'معلم الصف – تسجيل الحضور والغياب' : 'Class Teacher – Attendance Marking'}
    >
      <ScrollView
        style={[styles.container, isDark && styles.darkContainer]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.pageWrapper}>
          {/* Notification Toast Alert */}
          {actionNotice && (
            <View style={styles.toastNotice}>
              <Icon name="info" size={16} color="#FFFFFF" />
              <AppText variant="captionBold" color="#FFFFFF">
                {actionNotice}
              </AppText>
            </View>
          )}

          {/* Top Horizontal Swipeable Tabs Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.topTabsBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.topTabBtn, topTab === 'attendance' && styles.topTabBtnActive]}
              onPress={() => setTopTab('attendance')}
            >
              <AppText variant="captionBold" color={topTab === 'attendance' ? '#FFFFFF' : '#64748B'}>
                {isRTL ? 'الحضور' : 'Attendance'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.topTabBtn, topTab === 'records' && styles.topTabBtnActive]}
              onPress={() => setTopTab('records')}
            >
              <AppText variant="captionBold" color={topTab === 'records' ? '#FFFFFF' : '#64748B'}>
                {isRTL ? 'سجلات الحضور' : 'Attendance Logs'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.topTabBtn, topTab === 'permissions' && styles.topTabBtnActive]}
              onPress={() => setTopTab('permissions')}
            >
              <AppText variant="captionBold" color={topTab === 'permissions' ? '#FFFFFF' : '#64748B'}>
                {isRTL ? 'الاستئذان والرسائل' : 'Permits & Messages'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.topTabBtn, topTab === 'biotime_setup' && styles.topTabBtnActive]}
              onPress={() => setTopTab('biotime_setup')}
            >
              <AppText variant="captionBold" color={topTab === 'biotime_setup' ? '#FFFFFF' : '#64748B'}>
                {isRTL ? 'إعداد البصمة' : 'BioTime Setup'}
              </AppText>
            </TouchableOpacity>
          </ScrollView>

          {/* MAIN TAB CONTENT RENDERING */}

          {topTab === 'attendance' && (
            <>
              {/* Sub Tabs Row + Action Buttons (PDF / BioTime) */}
              <View style={[styles.subTabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={[styles.subTabsGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                >
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.subTabBtn, subTab === 'daily' && styles.subTabBtnActive]}
                    onPress={() => setSubTab('daily')}
                  >
                    <AppText variant="captionBold" color={subTab === 'daily' ? '#2563EB' : '#64748B'}>
                      {isRTL ? 'اليومي' : 'Daily'}
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.subTabBtn, subTab === 'periods' && styles.subTabBtnActive]}
                    onPress={() => setSubTab('periods')}
                  >
                    <AppText variant="captionBold" color={subTab === 'periods' ? '#2563EB' : '#64748B'}>
                      {isRTL ? 'بالحصص' : 'By Period'}
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.subTabBtn, subTab === 'live_fingerprint' && styles.subTabBtnActive]}
                    onPress={() => setSubTab('live_fingerprint')}
                  >
                    <AppText variant="captionBold" color={subTab === 'live_fingerprint' ? '#2563EB' : '#64748B'}>
                      {isRTL ? 'البصمة الحية' : 'Live BioTime'}
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.subTabBtn, subTab === 'dismissal' && styles.subTabBtnActive]}
                    onPress={() => setSubTab('dismissal')}
                  >
                    <AppText variant="captionBold" color={subTab === 'dismissal' ? '#2563EB' : '#64748B'}>
                      {isRTL ? 'الانصراف' : 'Dismissal'}
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.subTabBtn, subTab === 'daily_report' && styles.subTabBtnActive]}
                    onPress={() => setSubTab('daily_report')}
                  >
                    <AppText variant="captionBold" color={subTab === 'daily_report' ? '#2563EB' : '#64748B'}>
                      {isRTL ? 'الكشف اليومي' : 'Daily Sheet'}
                    </AppText>
                  </TouchableOpacity>
                </ScrollView>

                {/* Action Buttons: PDF and BioTime */}
                <View style={[styles.actionButtonsGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <TouchableOpacity activeOpacity={0.7} style={styles.pdfBtn} onPress={handleExportPDF}>
                    <Icon name="download" size={14} color="#FFFFFF" />
                    <AppText variant="captionBold" color="#FFFFFF">
                      PDF
                    </AppText>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.outlineActionBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={handleSyncBioTime}
                  >
                    {isSyncingBioTime ? (
                      <ActivityIndicator size="small" color="#2563EB" />
                    ) : (
                      <Icon name="activity" size={14} color="#334155" />
                    )}
                    <AppText variant="captionBold" color="#334155">
                      {isRTL ? 'البصمة' : 'BioTime'}
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>

              {/* 4 KPI Summary Cards (Right-to-Left order matching Screenshot) */}
              <View style={[styles.kpiCardsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {/* Present Card */}
                <View style={[styles.kpiCard, styles.kpiCardGreen]}>
                  <AppText variant="h1" weight="bold" color="#10B981" style={styles.textCenter}>
                    {kpiStats.present}
                  </AppText>
                  <AppText variant="captionBold" color="#64748B" style={styles.textCenter}>
                    {isRTL ? 'حاضر' : 'Present'}
                  </AppText>
                  <AppText variant="caption" color="#94A3B8" style={styles.textCenter}>
                    {kpiStats.presentPercent}%
                  </AppText>
                </View>

                {/* Absent Card */}
                <View style={[styles.kpiCard, styles.kpiCardRed]}>
                  <AppText variant="h1" weight="bold" color="#F43F5E" style={styles.textCenter}>
                    {kpiStats.absent}
                  </AppText>
                  <AppText variant="captionBold" color="#64748B" style={styles.textCenter}>
                    {isRTL ? 'غائب' : 'Absent'}
                  </AppText>
                  <AppText variant="caption" color="#94A3B8" style={styles.textCenter}>
                    {kpiStats.absentPercent}%
                  </AppText>
                </View>

                {/* Late Card */}
                <View style={[styles.kpiCard, styles.kpiCardAmber]}>
                  <AppText variant="h1" weight="bold" color="#F59E0B" style={styles.textCenter}>
                    {kpiStats.late}
                  </AppText>
                  <AppText variant="captionBold" color="#64748B" style={styles.textCenter}>
                    {isRTL ? 'متأخر' : 'Late'}
                  </AppText>
                  <AppText variant="caption" color="#94A3B8" style={styles.textCenter}>
                    {kpiStats.latePercent}%
                  </AppText>
                </View>

                {/* Excused Card */}
                <View style={[styles.kpiCard, styles.kpiCardBlue]}>
                  <AppText variant="h1" weight="bold" color="#2563EB" style={styles.textCenter}>
                    {kpiStats.excused}
                  </AppText>
                  <AppText variant="captionBold" color="#64748B" style={styles.textCenter}>
                    {isRTL ? 'بعذر' : 'Excused'}
                  </AppText>
                  <AppText variant="caption" color="#94A3B8" style={styles.textCenter}>
                    {kpiStats.excusedPercent}%
                  </AppText>
                </View>
              </View>

              {/* Filter Bar with Date Picker Button and Class Selector Dropdown */}
              <View style={[styles.filterBarCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {/* Class Dropdown Selector (Right side in RTL) */}
                <View style={[styles.dropdownWrapper, classDropdownOpen && styles.dropdownWrapperOpen]}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={[styles.dropdownTrigger, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => setClassDropdownOpen(!classDropdownOpen)}
                  >
                    <AppText variant="captionBold" color="#334155">
                      {isRTL ? 'الصف:' : 'Class:'}{' '}
                      {selectedClass === 'all' ? (isRTL ? 'كل الفصول' : 'All Classes') : selectedClass}
                    </AppText>
                    <Icon name="chevronDown" size={14} color="#64748B" />
                  </TouchableOpacity>

                  {classDropdownOpen && (
                    <View style={styles.dropdownMenu}>
                      {classOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          activeOpacity={0.7}
                          style={[styles.dropdownOption, selectedClass === opt && styles.dropdownOptionActive]}
                          onPress={() => {
                            setSelectedClass(opt);
                            setClassDropdownOpen(false);
                          }}
                        >
                          <AppText variant="caption" color={selectedClass === opt ? '#2563EB' : '#334155'}>
                            {opt === 'all' ? (isRTL ? 'كل الفصول' : 'All Classes') : opt}
                          </AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* Date Picker Button (Left side in RTL) */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.dateInputBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  onPress={() => {
                    setTempDate(currentDateIso);
                    setDatePickerModalOpen(true);
                  }}
                >
                  <AppText variant="captionBold" color="#334155">
                    {currentDateIso}
                  </AppText>
                  <Icon name="calendar" size={16} color="#64748B" />
                  <AppText variant="caption" color="#64748B">
                    {isRTL ? 'التاريخ' : 'Date'}
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* Quick Status Filter Pills Bar (Matching Web Screenshot) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.statusFilterBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.statusFilterPill, statusFilter === 'all' && styles.statusFilterPillActive]}
                  onPress={() => setStatusFilter('all')}
                >
                  <Icon name="users" size={14} color={statusFilter === 'all' ? '#FFFFFF' : '#64748B'} />
                  <AppText variant="captionBold" color={statusFilter === 'all' ? '#FFFFFF' : '#334155'}>
                    {isRTL ? `الكل (${kpiStats.total})` : `All (${kpiStats.total})`}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.statusFilterPill, statusFilter === 'present' && styles.statusFilterPillPresentActive]}
                  onPress={() => setStatusFilter('present')}
                >
                  <Icon name="check" size={14} color={statusFilter === 'present' ? '#FFFFFF' : '#10B981'} />
                  <AppText variant="captionBold" color={statusFilter === 'present' ? '#FFFFFF' : '#059669'}>
                    {isRTL ? `حاضرين (${kpiStats.present})` : `Present (${kpiStats.present})`}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.statusFilterPill, statusFilter === 'late' && styles.statusFilterPillLateActive]}
                  onPress={() => setStatusFilter('late')}
                >
                  <Icon name="clock" size={14} color={statusFilter === 'late' ? '#FFFFFF' : '#F59E0B'} />
                  <AppText variant="captionBold" color={statusFilter === 'late' ? '#FFFFFF' : '#D97706'}>
                    {isRTL ? `متأخرين (${kpiStats.late})` : `Late (${kpiStats.late})`}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.statusFilterPill, statusFilter === 'absent' && styles.statusFilterPillAbsentActive]}
                  onPress={() => setStatusFilter('absent')}
                >
                  <Icon name="close" size={14} color={statusFilter === 'absent' ? '#FFFFFF' : '#EF4444'} />
                  <AppText variant="captionBold" color={statusFilter === 'absent' ? '#FFFFFF' : '#DC2626'}>
                    {isRTL ? `غائبين (${kpiStats.absent})` : `Absent (${kpiStats.absent})`}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.statusFilterPill, statusFilter === 'excused' && styles.statusFilterPillExcusedActive]}
                  onPress={() => setStatusFilter('excused')}
                >
                  <Icon name="fileText" size={14} color={statusFilter === 'excused' ? '#FFFFFF' : '#2563EB'} />
                  <AppText variant="captionBold" color={statusFilter === 'excused' ? '#FFFFFF' : '#1D4ED8'}>
                    {isRTL ? `بعذر (${kpiStats.excused})` : `Excused (${kpiStats.excused})`}
                  </AppText>
                </TouchableOpacity>
              </ScrollView>

              {/* Subheader Title & Instructions */}
              <View style={[styles.kashfHeaderCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <View style={[styles.kashfTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Icon name="fileText" size={16} color="#334155" />
                  <AppText variant="bodyBold" color="#0F172A">
                    {isRTL ? 'كشف كامل – الحالة من البصمة' : 'Full Sheet – BioTime Status'}
                  </AppText>
                </View>
                <AppText variant="caption" color="#94A3B8" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 2 }}>
                  {isRTL ? 'اضغط على غائب/متأخر لإضافة عذر' : 'Tap on absent/late status to add medical excuse'}
                </AppText>
              </View>

              {/* SEARCH INPUT BAR FOR STUDENT NAME (Matching Web Screenshot) */}
              <View style={[styles.searchBarContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="search" size={18} color="#94A3B8" />
                <TextInput
                  style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={isRTL ? 'البحث عن طالب...' : 'Search student by name or ID...'}
                  placeholderTextColor="#94A3B8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity activeOpacity={0.7} onPress={() => setSearchQuery('')}>
                    <Icon name="close" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* SUB TAB VIEWS */}
              {subTab === 'daily' && (
                <View style={styles.listCard}>
                  {displayStudents.length === 0 ? (
                    <View style={styles.emptyStateContainer}>
                      <Icon name="search" size={32} color="#CBD5E1" />
                      <AppText variant="bodyBold" color="#64748B" style={{ marginTop: 8 }}>
                        {isRTL ? 'لم يتم العثور على أي طالب' : 'No students found'}
                      </AppText>
                    </View>
                  ) : (
                    displayStudents.map((st, idx) => {
                      const currentStatus = studentStatuses[st.id] || 'absent';
                      const avatarBg = getAvatarBg(st.name);

                      return (
                        <View
                          key={st.id}
                          style={[
                            styles.studentAttendanceCard,
                            idx % 2 === 1 && styles.studentAttendanceCardEven,
                          ]}
                        >
                          {/* Row 1: Student Avatar + Name + National ID (full width) */}
                          <View style={[styles.studentInfoGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <View style={[styles.studentAvatarBox, { backgroundColor: avatarBg }]}>
                              <AppText variant="captionBold" color="#FFFFFF" style={{ fontSize: 15 }}>
                                {st.name.charAt(0)}
                              </AppText>
                            </View>
                            <View style={[styles.studentTextCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                              <AppText
                                variant="bodyBold"
                                color="#0F172A"
                                style={{ textAlign: isRTL ? 'right' : 'left', fontSize: 14 }}
                                numberOfLines={1}
                              >
                                {st.name}
                              </AppText>
                              <AppText
                                variant="caption"
                                color="#94A3B8"
                                style={{ textAlign: isRTL ? 'right' : 'left', fontSize: 11 }}
                              >
                                {st.national_id}
                              </AppText>
                            </View>
                          </View>

                          {/* Row 2: Status Buttons (full width, scrollable) */}
                          <View style={[styles.statusButtonsGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={[
                                styles.statusPillBtn,
                                currentStatus === 'present' && styles.statusPillBtnPresentActive,
                              ]}
                              onPress={() => handleSetStatus(st.id, 'present')}
                            >
                              <Icon
                                name="check"
                                size={12}
                                color={currentStatus === 'present' ? '#FFFFFF' : '#10B981'}
                              />
                              <AppText
                                variant="captionBold"
                                color={currentStatus === 'present' ? '#FFFFFF' : '#10B981'}
                              >
                                {isRTL ? 'حاضر' : 'Present'}
                              </AppText>
                            </TouchableOpacity>

                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={[
                                styles.statusPillBtn,
                                currentStatus === 'absent' && styles.statusPillBtnAbsentActive,
                              ]}
                              onPress={() => handleSetStatus(st.id, 'absent')}
                            >
                              <Icon
                                name="close"
                                size={12}
                                color={currentStatus === 'absent' ? '#EF4444' : '#F43F5E'}
                              />
                              <AppText
                                variant="captionBold"
                                color={currentStatus === 'absent' ? '#EF4444' : '#F43F5E'}
                              >
                                {isRTL ? 'غائب' : 'Absent'}
                              </AppText>
                            </TouchableOpacity>

                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={[
                                styles.statusPillBtn,
                                currentStatus === 'late' && styles.statusPillBtnLateActive,
                              ]}
                              onPress={() => handleSetStatus(st.id, 'late')}
                            >
                              <Icon
                                name="clock"
                                size={12}
                                color={currentStatus === 'late' ? '#FFFFFF' : '#F59E0B'}
                              />
                              <AppText
                                variant="captionBold"
                                color={currentStatus === 'late' ? '#FFFFFF' : '#F59E0B'}
                              >
                                {isRTL ? 'متأخر' : 'Late'}
                              </AppText>
                            </TouchableOpacity>

                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={[
                                styles.statusPillBtn,
                                currentStatus === 'excused' && styles.statusPillBtnExcusedActive,
                              ]}
                              onPress={() => handleSetStatus(st.id, 'excused')}
                            >
                              <Icon
                                name="fileText"
                                size={12}
                                color={currentStatus === 'excused' ? '#FFFFFF' : '#2563EB'}
                              />
                              <AppText
                                variant="captionBold"
                                color={currentStatus === 'excused' ? '#FFFFFF' : '#2563EB'}
                              >
                                {isRTL ? 'بعذر' : 'Excused'}
                              </AppText>
                            </TouchableOpacity>

                            <TouchableOpacity
                              activeOpacity={0.7}
                              style={[
                                styles.statusPillBtn,
                                currentStatus === 'no_school' && styles.statusPillBtnNoSchoolActive,
                              ]}
                              onPress={() => handleSetStatus(st.id, 'no_school')}
                            >
                              <AppText
                                variant="captionBold"
                                color={currentStatus === 'no_school' ? '#475569' : '#94A3B8'}
                              >
                                {isRTL ? 'لا دوام' : 'N/A'}
                              </AppText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}

              {subTab === 'periods' && (
                <View style={styles.tabContentCard}>
                  <AppText variant="h3" weight="bold" color="#0F172A" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'حضور الحصص الدراسية' : 'Period Attendance'}
                  </AppText>
                  <AppText variant="body" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 4 }}>
                    {isRTL ? 'تسجيل الحضور والغياب لكل حصة بشكل منفصل:' : 'Mark attendance by class period:'}
                  </AppText>
                  <ScrollView horizontal showsHorizontalScrollIndicator style={{ marginTop: 12 }}>
                    <View style={{ gap: 8 }}>
                      {displayStudents.map((st) => (
                        <View key={st.id} style={[styles.periodRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <AppText variant="captionBold" color="#334155" style={{ width: 140 }}>
                            {st.name}
                          </AppText>
                          {[1, 2, 3, 4, 5, 6].map((p) => (
                            <TouchableOpacity key={p} activeOpacity={0.7} style={styles.periodPill}>
                              <AppText variant="caption" color="#2563EB">
                                {isRTL ? `حـ ${p}` : `P${p}`}
                              </AppText>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ))}
                    </View>
                  </ScrollView>
                </View>
              )}

              {subTab === 'live_fingerprint' && (
                <View style={styles.tabContentCard}>
                  <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Icon name="activity" size={18} color="#10B981" />
                    <AppText variant="h3" weight="bold" color="#0F172A">
                      {isRTL ? 'سجل البصمة الحية (BioTime)' : 'Live BioTime Stream'}
                    </AppText>
                  </View>
                  <View style={{ gap: 8, marginTop: 12 }}>
                    {displayStudents.slice(0, 5).map((st, i) => (
                      <View key={st.id} style={[styles.bioStreamRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={{ flex: 1 }}>
                          <AppText variant="captionBold" color="#0F172A" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {st.name} ({st.class_name})
                          </AppText>
                          <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {isRTL ? `تمت البصمة: 07:4${i * 2} ص` : `Punched at: 07:4${i * 2} AM`}
                          </AppText>
                        </View>
                        <View style={styles.verifiedBadge}>
                          <AppText variant="captionBold" color="#059669">
                            {isRTL ? 'مغلق تلقائي' : 'Verified'}
                          </AppText>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {subTab === 'dismissal' && (
                <View style={styles.tabContentCard}>
                  <AppText variant="h3" weight="bold" color="#0F172A" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'سجل الانصراف الاستثنائي' : 'Early Dismissal Log'}
                  </AppText>
                  <AppText variant="body" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 4 }}>
                    {isRTL ? 'عرض وحصر الطلاب المغادرين مع أولياء الأمور قبل نهاية الدوام' : 'List of early dismissed students'}
                  </AppText>
                </View>
              )}

              {subTab === 'daily_report' && (
                <View style={styles.tabContentCard}>
                  <AppText variant="h3" weight="bold" color="#0F172A" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'الكشف الإحصائي اليومي' : 'Daily Sheet Summary'}
                  </AppText>
                  <AppText variant="body" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 4 }}>
                    {isRTL ? 'تقرير كشف الحضور الشامل لجميع الطلاب والفصول اليوم' : 'Full summary table of daily attendance'}
                  </AppText>
                </View>
              )}

              {/* Floating Save Button */}
              <TouchableOpacity activeOpacity={0.8} style={styles.saveFloatingBtn} onPress={handleSaveAttendance}>
                <Icon name="check" size={18} color="#FFFFFF" />
                <AppText variant="bodyBold" color="#FFFFFF">
                  {isRTL ? 'حفظ الحضور' : 'Save Attendance'}
                </AppText>
              </TouchableOpacity>
            </>
          )}

          {/* TOP TAB 2: RECORDS & HISTORY */}
          {topTab === 'records' && (
            <View style={styles.tabContentCard}>
              <AppText variant="h2" weight="bold" color="#0F172A" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'سجلات الحضور والغياب التاريخية' : 'Attendance Logs & History'}
              </AppText>
              <AppText variant="body" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 4 }}>
                {isRTL ? 'البحث والاستعلام في سجلات الحضور السابقة وحالات الاستئذان:' : 'Search and query historic attendance logs:'}
              </AppText>
              <View style={{ gap: 10, marginTop: 14 }}>
                {displayStudents.map((st) => (
                  <View key={st.id} style={[styles.historyRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={{ flex: 1 }}>
                      <AppText variant="bodyBold" color="#0F172A" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                        {st.name}
                      </AppText>
                      <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                        {st.class_name} · {currentDateIso}
                      </AppText>
                    </View>
                    <View style={styles.statusBadgePresent}>
                      <AppText variant="captionBold" color="#059669">
                        {isRTL ? 'حاضر (منتظم)' : 'Present'}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* TOP TAB 3: PERMITS & MESSAGES */}
          {topTab === 'permissions' && (
            <View style={styles.tabContentCard}>
              <AppText variant="h2" weight="bold" color="#0F172A" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'الاستئذان ورسائل أولياء الأمور' : 'Permits & Parent Messages'}
              </AppText>
              <AppText variant="body" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 4 }}>
                {isRTL ? 'إدارة أعذار الغياب والطلبات المقدمة من أولياء الأمور:' : 'Manage leave requests and parent medical excuses:'}
              </AppText>
              <View style={{ gap: 12, marginTop: 14 }}>
                <View style={styles.permitCard}>
                  <AppText variant="bodyBold" color="#0F172A" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'طلب استئذان بعذر طبي: الطالب تركي الزهراني' : 'Medical Permit: Turki Al-Zahrani'}
                  </AppText>
                  <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 2 }}>
                    {isRTL ? 'السبب: مراجعة مستشفى - التاريخ: 2026-08-29' : 'Reason: Hospital appointment'}
                  </AppText>
                  <View style={[styles.permitActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity activeOpacity={0.7} style={styles.approveBtn} onPress={() => showToast(isRTL ? 'تمت الموافقة على العذر' : 'Excuse approved')}>
                      <AppText variant="captionBold" color="#FFFFFF">{isRTL ? 'موافقة' : 'Approve'}</AppText>
                    </TouchableOpacity>
                    <TouchableOpacity activeOpacity={0.7} style={styles.rejectBtn} onPress={() => showToast(isRTL ? 'تم رفض العذر' : 'Excuse rejected')}>
                      <AppText variant="captionBold" color="#EF4444">{isRTL ? 'رفض' : 'Reject'}</AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* TOP TAB 4: BIOTIME SETUP */}
          {topTab === 'biotime_setup' && (
            <View style={styles.tabContentCard}>
              <AppText variant="h2" weight="bold" color="#0F172A" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'إعدادات ربط أجهزة البصمة (BioTime Setup)' : 'BioTime Device Setup'}
              </AppText>
              <AppText variant="body" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 4 }}>
                {isRTL ? 'توصيل ومزامنة أجهزة البصمة الذكية في المدرسة:' : 'Configure live biometric scanners:'}
              </AppText>
              <View style={{ gap: 14, marginTop: 14 }}>
                <View style={styles.setupInputGroup}>
                  <AppText variant="captionBold" color="#334155" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'عنوان IP للجهاز:' : 'Device IP Address:'}
                  </AppText>
                  <TextInput style={styles.setupInput} defaultValue="192.168.1.150:8080" />
                </View>
                <TouchableOpacity activeOpacity={0.7} style={styles.testConnectBtn} onPress={handleSyncBioTime}>
                  <AppText variant="bodyBold" color="#FFFFFF">
                    {isRTL ? 'اختبار المزامنة والاتصال' : 'Test Sync Connection'}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* DATE PICKER MODAL */}
      <Modal visible={datePickerModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.datePickerModalContent}>
            <AppText variant="h3" weight="bold" color="#0F172A" style={{ textAlign: isRTL ? 'right' : 'left' }}>
              {isRTL ? 'اختر التاريخ' : 'Select Date'}
            </AppText>

            {/* Quick Presets */}
            <View style={[styles.datePresetsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.presetBtn}
                onPress={() => setTempDate('2026-09-07')}
              >
                <AppText variant="captionBold" color="#2563EB">
                  {isRTL ? 'اليوم' : 'Today'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.presetBtn}
                onPress={() => setTempDate('2026-09-06')}
              >
                <AppText variant="captionBold" color="#64748B">
                  {isRTL ? 'أمس' : 'Yesterday'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.presetBtn}
                onPress={() => setTempDate('2026-08-29')}
              >
                <AppText variant="captionBold" color="#64748B">
                  2026-08-29
                </AppText>
              </TouchableOpacity>
            </View>

            <View style={{ marginTop: 12 }}>
              <AppText variant="captionBold" color="#475569" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                {isRTL ? 'صيغة التاريخ (YYYY-MM-DD):' : 'Date Format (YYYY-MM-DD):'}
              </AppText>
              <TextInput
                style={[styles.modalDateInput, { textAlign: isRTL ? 'right' : 'left' }]}
                value={tempDate}
                onChangeText={setTempDate}
                placeholder="YYYY-MM-DD"
              />
            </View>

            <View style={[styles.modalActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.modalApplyBtn}
                onPress={() => {
                  setCurrentDateIso(tempDate);
                  setDatePickerModalOpen(false);
                  showToast(isRTL ? `تم تغيير التاريخ إلى ${tempDate}` : `Date changed to ${tempDate}`);
                }}
              >
                <AppText variant="captionBold" color="#FFFFFF">
                  {isRTL ? 'تطبيق' : 'Apply'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.modalCancelBtn}
                onPress={() => setDatePickerModalOpen(false)}
              >
                <AppText variant="captionBold" color="#64748B">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </AppText>
              </TouchableOpacity>
            </View>
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
    paddingBottom: 80,
  },
  pageWrapper: {
    gap: 12,
  },
  toastNotice: {
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  topTabsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
  },
  topTabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topTabBtnActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  subTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  subTabsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subTabBtn: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 36,
    borderRadius: 8,
  },
  subTabBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pdfBtn: {
    backgroundColor: '#1246B7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 38,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  outlineActionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 38,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    gap: 2,
    ...shadows.card,
  },
  kpiCardGreen: {
    borderTopWidth: 3,
    borderTopColor: '#10B981',
  },
  kpiCardRed: {
    borderTopWidth: 3,
    borderTopColor: '#F43F5E',
  },
  kpiCardAmber: {
    borderTopWidth: 3,
    borderTopColor: '#F59E0B',
  },
  kpiCardBlue: {
    borderTopWidth: 3,
    borderTopColor: '#2563EB',
  },
  filterBarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    zIndex: 100,
    elevation: 8,
    overflow: 'visible',
    ...shadows.card,
  },
  dateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 42,
    gap: 8,
    flex: 1,
    minWidth: 160,
    justifyContent: 'space-between',
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 30,
    flex: 1,
    minWidth: 150,
  },
  dropdownWrapperOpen: {
    zIndex: 1000,
  },
  dropdownTrigger: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    minWidth: 160,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingVertical: 4,
    zIndex: 2000,
    elevation: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  dropdownOption: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdownOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  statusFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  statusFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
  },
  statusFilterPillActive: {
    backgroundColor: '#475569',
    borderColor: '#475569',
  },
  statusFilterPillPresentActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  statusFilterPillLateActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  statusFilterPillAbsentActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  statusFilterPillExcusedActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  kashfHeaderCard: {
    paddingVertical: 4,
    gap: 2,
  },
  kashfTitleRow: {
    alignItems: 'center',
    gap: 6,
  },
  searchBarContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    gap: 10,
    minHeight: 46,
    ...shadows.card,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    padding: 0,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...shadows.card,
  },
  emptyStateContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentAttendanceCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
    gap: 10,
  },
  studentAttendanceCardEven: {
    backgroundColor: '#FAFAFA',
  },
  studentInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  studentAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentTextCol: {
    flex: 1,
  },
  statusButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    width: '100%',
  },
  statusPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statusPillBtnPresentActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  statusPillBtnAbsentActive: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECDD3',
  },
  statusPillBtnLateActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  statusPillBtnExcusedActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#BFDBFE',
  },
  statusPillBtnNoSchoolActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  tabContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  periodRow: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 4,
  },
  periodPill: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cardHeaderRow: {
    alignItems: 'center',
    gap: 8,
  },
  bioStreamRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  verifiedBadge: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveFloatingBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    alignSelf: 'center',
    shadowColor: '#2563EB',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  historyRow: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  statusBadgePresent: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  permitCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  permitActionsRow: {
    gap: 8,
    marginTop: 6,
  },
  approveBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rejectBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  setupInputGroup: {
    gap: 6,
  },
  setupInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
  },
  testConnectBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  datePickerModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    width: '100%',
    maxWidth: 380,
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  datePresetsRow: {
    gap: 8,
    marginTop: 4,
  },
  presetBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  modalDateInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#0F172A',
    marginTop: 4,
  },
  modalActionsRow: {
    gap: 10,
    marginTop: 10,
    justifyContent: 'flex-end',
  },
  modalApplyBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  modalCancelBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  textCenter: {
    textAlign: 'center',
  },
});
