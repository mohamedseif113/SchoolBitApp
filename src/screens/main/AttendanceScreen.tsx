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
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import { useAttendance } from '../../hooks/useAttendance';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';
import { WebDashboardLayout } from '../../components/layout/WebDashboardLayout';

type TopTab = 'attendance' | 'records' | 'permissions' | 'biotime_setup';
type SubTab = 'daily' | 'periods' | 'live_fingerprint' | 'dismissal' | 'daily_report';

interface StudentAttendanceRow {
  id: number;
  name: string;
  national_id: string;
  class_name: string;
  status?: 'present' | 'absent' | 'late' | 'excused' | 'no_school';
}

export default function AttendanceScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [topTab, setTopTab] = useState<TopTab>('attendance');
  const [subTab, setSubTab] = useState<SubTab>('daily');
  const [currentDateIso, setCurrentDateIso] = useState('2026-08-29');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [classDropdownOpen, setClassDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Student statuses state
  const [studentStatuses, setStudentStatuses] = useState<Record<number, string>>({});

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

  // Demo students list matching Screenshot 3
  const defaultStudents: StudentAttendanceRow[] = useMemo(
    () => [
      { id: 1, name: 'بدر عايض الغامدي', national_id: '1200000006', class_name: '2/ب' },
      { id: 2, name: 'تركي فهد الزهراني', national_id: '1115678905', class_name: '2/أ' },
      { id: 3, name: 'ثامر عبدالعزيز الفيفي', national_id: '1200000010', class_name: '4/أ' },
      { id: 4, name: 'حسام عادل الشهري', national_id: '1200000015', class_name: '6/أ' },
      { id: 5, name: 'راكان مساعد الدوسري', national_id: '1200000011', class_name: '4/أ' },
      { id: 6, name: 'زياد فهد الرشيدي', national_id: '1200000009', class_name: '3/ب' },
      { id: 7, name: 'سلمان محمد العتيبي', national_id: '1200000003', class_name: '1/أ' },
      { id: 8, name: 'طلال منصور الخالدي', national_id: '1200000014', class_name: '6/أ' },
      { id: 9, name: 'عبدالله حمد السبيعي', national_id: '1200000012', class_name: '5/أ' },
      { id: 10, name: 'فيصل عبدالله القحطاني', national_id: '1200000004', class_name: '1/أ' },
    ],
    []
  );

  const displayStudents = useMemo(() => {
    if (selectedClass === 'all') return defaultStudents;
    return defaultStudents.filter((st) => st.class_name === selectedClass);
  }, [defaultStudents, selectedClass]);

  const handleSetStatus = (studentId: number, status: string) => {
    setStudentStatuses((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? '' : status,
    }));
  };

  const getAvatarBg = (name: string) => {
    const charCode = name.charCodeAt(0) || 0;
    const colorsList = ['#2563EB', '#059669', '#7C3AED', '#DB2777', '#D97706', '#0284C7'];
    return colorsList[charCode % colorsList.length];
  };

  return (
    <WebDashboardLayout
      title={isRTL ? 'الحضور اليومي' : 'Daily Attendance'}
      subtitle={isRTL ? 'معلم الصف - تسجيل الحضور والغياب' : 'Class Teacher - Attendance Marking'}
    >
      <ScrollView
        style={[styles.container, isDark && styles.darkContainer]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.pageWrapper}>
          {/* Top Horizontal Swipeable Tabs Bar */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.topTabsBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            <TouchableOpacity
              style={[styles.topTabBtn, topTab === 'attendance' && styles.topTabBtnActive]}
              onPress={() => setTopTab('attendance')}
            >
              <AppText variant="captionBold" color={topTab === 'attendance' ? '#FFFFFF' : '#64748B'}>
                {isRTL ? 'الحضور' : 'Attendance'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topTabBtn, topTab === 'records' && styles.topTabBtnActive]}
              onPress={() => setTopTab('records')}
            >
              <AppText variant="captionBold" color={topTab === 'records' ? '#FFFFFF' : '#64748B'}>
                {isRTL ? 'سجلات الحضور' : 'Attendance Logs'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topTabBtn, topTab === 'permissions' && styles.topTabBtnActive]}
              onPress={() => setTopTab('permissions')}
            >
              <AppText variant="captionBold" color={topTab === 'permissions' ? '#FFFFFF' : '#64748B'}>
                {isRTL ? 'الاستئذان والرسائل' : 'Permits & Messages'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topTabBtn, topTab === 'biotime_setup' && styles.topTabBtnActive]}
              onPress={() => setTopTab('biotime_setup')}
            >
              <AppText variant="captionBold" color={topTab === 'biotime_setup' ? '#FFFFFF' : '#64748B'}>
                {isRTL ? 'إعداد البصمة' : 'BioTime Setup'}
              </AppText>
            </TouchableOpacity>
          </ScrollView>

          {/* Sub Tabs Row */}
          <View style={[styles.subTabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.subTabsGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            >
              <TouchableOpacity
                style={[styles.subTabBtn, subTab === 'daily' && styles.subTabBtnActive]}
                onPress={() => setSubTab('daily')}
              >
                <AppText variant="captionBold" color={subTab === 'daily' ? '#2563EB' : '#64748B'}>
                  {isRTL ? 'اليومي' : 'Daily'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTabBtn, subTab === 'periods' && styles.subTabBtnActive]}
                onPress={() => setSubTab('periods')}
              >
                <AppText variant="captionBold" color={subTab === 'periods' ? '#2563EB' : '#64748B'}>
                  {isRTL ? 'بالحصص' : 'By Period'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTabBtn, subTab === 'live_fingerprint' && styles.subTabBtnActive]}
                onPress={() => setSubTab('live_fingerprint')}
              >
                <AppText variant="captionBold" color={subTab === 'live_fingerprint' ? '#2563EB' : '#64748B'}>
                  {isRTL ? 'البصمة الحية' : 'Live BioTime'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTabBtn, subTab === 'dismissal' && styles.subTabBtnActive]}
                onPress={() => setSubTab('dismissal')}
              >
                <AppText variant="captionBold" color={subTab === 'dismissal' ? '#2563EB' : '#64748B'}>
                  {isRTL ? 'الانصراف' : 'Dismissal'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.subTabBtn, subTab === 'daily_report' && styles.subTabBtnActive]}
                onPress={() => setSubTab('daily_report')}
              >
                <AppText variant="captionBold" color={subTab === 'daily_report' ? '#2563EB' : '#64748B'}>
                  {isRTL ? 'الكشف اليومي' : 'Daily Sheet'}
                </AppText>
              </TouchableOpacity>
            </ScrollView>

            {/* Action Buttons: PDF and Fingerprint */}
            <View style={[styles.actionButtonsGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity style={styles.pdfBtn}>
                <AppText variant="captionBold" color="#FFFFFF">
                  PDF
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.outlineActionBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="activity" size={14} color="#334155" />
                <AppText variant="captionBold" color="#334155">
                  {isRTL ? 'البصمة' : 'BioTime'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* 4 KPI Summary Cards (2x2 on mobile) */}
          <View style={[styles.kpiCardsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.kpiCard, styles.kpiCardGreen]}>
              <AppText variant="h1" weight="bold" color="#10B981" style={styles.textCenter}>
                {summary?.present_count ?? 0}
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.textCenter}>
                {isRTL ? 'حاضر' : 'Present'}
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardRed]}>
              <AppText variant="h1" weight="bold" color="#EF4444" style={styles.textCenter}>
                {summary?.absent_count ?? 0}
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.textCenter}>
                {isRTL ? 'غائب' : 'Absent'}
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardAmber]}>
              <AppText variant="h1" weight="bold" color="#F59E0B" style={styles.textCenter}>
                {summary?.late_count ?? 0}
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.textCenter}>
                {isRTL ? 'متأخر' : 'Late'}
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardBlue]}>
              <AppText variant="h1" weight="bold" color="#2563EB" style={styles.textCenter}>
                0
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.textCenter}>
                {isRTL ? 'بعذر' : 'Excused'}
              </AppText>
            </View>
          </View>

          {/* Filter Bar with Date and Class Dropdown */}
          <View style={[styles.filterBarCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.dateInputBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="calendar" size={16} color="#64748B" />
              <AppText variant="captionBold" color="#334155">
                {isRTL ? 'التاريخ:' : 'Date:'}
              </AppText>
              <TextInput
                style={[styles.dateInput, { textAlign: isRTL ? 'right' : 'left' }]}
                value={currentDateIso}
                onChangeText={setCurrentDateIso}
              />
            </View>

            <View style={[styles.dropdownWrapper, classDropdownOpen && styles.dropdownWrapperOpen]}>
              <TouchableOpacity
                style={[styles.dropdownTrigger, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => setClassDropdownOpen(!classDropdownOpen)}
              >
                <AppText variant="captionBold" color="#334155">
                  {isRTL ? 'الصف:' : 'Class:'} {selectedClass === 'all' ? (isRTL ? 'كل الفصول' : 'All Classes') : selectedClass}
                </AppText>
                <Icon name="chevronDown" size={12} color="#64748B" />
              </TouchableOpacity>

              {classDropdownOpen && (
                <View style={styles.dropdownMenu}>
                  {classOptions.map((opt) => (
                    <TouchableOpacity
                      key={opt}
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
          </View>

          {/* Student Attendance List with Touch-Friendly Status Controls */}
          <View style={styles.listCard}>
            {displayStudents.map((st, idx) => {
              const currentStatus = studentStatuses[st.id] || 'no_school';
              const avatarBg = getAvatarBg(st.name);

              return (
                <View
                  key={st.id}
                  style={[
                    styles.studentAttendanceCard,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    idx % 2 === 1 && styles.studentAttendanceCardEven,
                  ]}
                >
                  {/* Student Header */}
                  <View style={[styles.studentInfoGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.studentAvatarBox, { backgroundColor: avatarBg }]}>
                      <AppText variant="captionBold" color="#FFFFFF">
                        {st.name.charAt(0)}
                      </AppText>
                    </View>
                    <View style={[styles.studentTextCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <AppText variant="bodyBold" color="#0F172A" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                        {st.name}
                      </AppText>
                      <AppText variant="caption" color="#94A3B8" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                        {st.national_id} · {st.class_name}
                      </AppText>
                    </View>
                  </View>

                  {/* Attendance Marking Buttons (Wrapped for Mobile Touch) */}
                  <View style={[styles.statusButtonsGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity
                      style={[
                        styles.statusBtn,
                        currentStatus === 'present' && styles.statusBtnPresentActive,
                      ]}
                      onPress={() => handleSetStatus(st.id, 'present')}
                    >
                      <AppText
                        variant="captionBold"
                        color={currentStatus === 'present' ? '#FFFFFF' : '#10B981'}
                      >
                        {isRTL ? 'حاضر' : 'Present'}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusBtn,
                        currentStatus === 'absent' && styles.statusBtnAbsentActive,
                      ]}
                      onPress={() => handleSetStatus(st.id, 'absent')}
                    >
                      <AppText
                        variant="captionBold"
                        color={currentStatus === 'absent' ? '#FFFFFF' : '#EF4444'}
                      >
                        {isRTL ? 'غائب' : 'Absent'}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusBtn,
                        currentStatus === 'late' && styles.statusBtnLateActive,
                      ]}
                      onPress={() => handleSetStatus(st.id, 'late')}
                    >
                      <AppText
                        variant="captionBold"
                        color={currentStatus === 'late' ? '#FFFFFF' : '#F59E0B'}
                      >
                        {isRTL ? 'متأخر' : 'Late'}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusBtn,
                        currentStatus === 'excused' && styles.statusBtnExcusedActive,
                      ]}
                      onPress={() => handleSetStatus(st.id, 'excused')}
                    >
                      <AppText
                        variant="captionBold"
                        color={currentStatus === 'excused' ? '#FFFFFF' : '#2563EB'}
                      >
                        {isRTL ? 'بعذر' : 'Excused'}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.statusBtn,
                        currentStatus === 'no_school' && styles.statusBtnNoSchoolActive,
                      ]}
                      onPress={() => handleSetStatus(st.id, 'no_school')}
                    >
                      <AppText
                        variant="captionBold"
                        color={currentStatus === 'no_school' ? '#64748B' : '#94A3B8'}
                      >
                        {isRTL ? 'لا دوام' : 'N/A'}
                      </AppText>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
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
    justifyContent: 'center',
  },
  outlineActionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    gap: 4,
    ...shadows.card,
  },
  kpiCardGreen: {
    borderTopWidth: 3,
    borderTopColor: '#10B981',
  },
  kpiCardRed: {
    borderTopWidth: 3,
    borderTopColor: '#EF4444',
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
  },
  dateInput: {
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
    flex: 1,
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
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...shadows.card,
  },
  studentAttendanceCard: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  studentAttendanceCardEven: {
    backgroundColor: '#FAFAFA',
  },
  studentInfoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  studentAvatarBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentTextCol: {
    flex: 1,
  },
  statusButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  statusBtn: {
    flex: 1,
    minWidth: 54,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 8,
    paddingHorizontal: 6,
    minHeight: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBtnPresentActive: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  statusBtnAbsentActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  statusBtnLateActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },
  statusBtnExcusedActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  statusBtnNoSchoolActive: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
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


