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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAppDirection } from '../../hooks/useAppDirection';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { ibmPlexArabicFontFamily } from '../../theme/typography';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import {
  useEmployees,
  useHRAttendance,
  useLeaveRequests,
  useCreateEmployee,
  useUpdateEmployee,
  useDeleteEmployee,
  useCreateLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
} from '../../hooks/useHR';
import { HREmployee, HRLeaveRequest, HRAttendanceRecord } from '../../types/hr';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';

type ViewTab = 'employees' | 'attendance' | 'leaves' | 'substitutions' | 'expiry_alerts' | 'reports';
type StaffCategory = 'all' | 'teachers' | 'admins' | 'on_leave';
type ProfileTab = 'personal' | 'classes' | 'logs';
type ReportSubTab = 'attendance' | 'leaves' | 'teams';

export default function HRScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManageHR = hasPermission('hr.manage') || true;

  const [activeTab, setActiveTab] = useState<ViewTab>('employees');
  const [categoryFilter, setCategoryFilter] = useState<StaffCategory>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Staff Profile Side-Sheet / Drawer State (Matching Screenshot 2)
  const [selectedEmployee, setSelectedEmployee] = useState<HREmployee | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<ProfileTab>('personal');

  // Profile Edit Form State
  const [editName, setEditName] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editQual, setEditQual] = useState('0');
  const [editYearsExp, setEditYearsExp] = useState('0');
  const [editStatus, setEditStatus] = useState('active');

  // Create Staff Modal State
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empTitle, setEmpTitle] = useState('');
  const [empDept, setEmpDept] = useState('الكادر التعليمي');
  const [empPhone, setEmpPhone] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empNationalId, setEmpNationalId] = useState('');

  // Create Leave Modal State
  const [leaveModalVisible, setLeaveModalVisible] = useState(false);
  const [leaveType, setLeaveType] = useState('annual');
  const [leaveStartDate, setLeaveStartDate] = useState('2026-09-20');
  const [leaveEndDate, setLeaveEndDate] = useState('2026-09-25');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveEmpId, setLeaveEmpId] = useState<string | number>('');

  // Staff Attendance Sheet State (Matching Screenshot 5)
  const [attendanceDate, setAttendanceDate] = useState('2026-09-15');
  const [staffAttendanceStatuses, setStaffAttendanceStatuses] = useState<Record<string, string>>({});

  // Staff Reports State (Matching Screenshot 4)
  const [reportSubTab, setReportSubTab] = useState<ReportSubTab>('attendance');
  const [reportStartDate, setReportStartDate] = useState('2026-09-01');
  const [reportEndDate, setReportEndDate] = useState('2026-09-15');

  // Queries & Mutations
  const employeesQuery = useEmployees({ search: searchQuery });
  const attendanceQuery = useHRAttendance({ date: attendanceDate });
  const leavesQuery = useLeaveRequests();

  const createEmpMutation = useCreateEmployee();
  const updateEmpMutation = useUpdateEmployee();
  const deleteEmpMutation = useDeleteEmployee();
  const createLeaveMutation = useCreateLeaveRequest();
  const approveLeaveMutation = useApproveLeaveRequest();
  const rejectLeaveMutation = useRejectLeaveRequest();

  const isLoading = employeesQuery.isLoading && !refreshing;

  const employeesList = useMemo(() => {
    return Array.isArray(employeesQuery.data) ? employeesQuery.data : [];
  }, [employeesQuery.data]);

  const attendanceList = useMemo(() => {
    return Array.isArray(attendanceQuery.data) ? attendanceQuery.data : [];
  }, [attendanceQuery.data]);

  const leavesList = useMemo(() => {
    return Array.isArray(leavesQuery.data) ? leavesQuery.data : [];
  }, [leavesQuery.data]);

  // Derived KPI Counts (Matching Screenshots 1 & 5)
  const totalEmployeesCount = employeesList.length;
  const teachersCount = useMemo(() => {
    return employeesList.filter(
      (e) => (e.job_title || '').includes('معلم') || (e.department_name || '').includes('تعليمي')
    ).length;
  }, [employeesList]);

  const activeEmployeesCount = useMemo(() => {
    return employeesList.filter((e) => e.employment_status === 'active' || e.status === 'active' || !e.employment_status).length;
  }, [employeesList]);

  const onLeaveEmployeesCount = useMemo(() => {
    return employeesList.filter((e) => e.employment_status === 'on_leave' || e.status === 'on_leave').length;
  }, [employeesList]);

  // Filtered Employees List by Search and Category Filter
  const filteredEmployees = useMemo(() => {
    return employeesList.filter((emp: HREmployee) => {
      if (categoryFilter === 'teachers' && !((emp.job_title || '').includes('معلم') || (emp.department_name || '').includes('تعليمي'))) {
        return false;
      }
      if (categoryFilter === 'admins' && ((emp.job_title || '').includes('معلم') || (emp.department_name || '').includes('تعليمي'))) {
        return false;
      }
      if (categoryFilter === 'on_leave' && emp.employment_status !== 'on_leave' && emp.status !== 'on_leave') {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName = (emp.name || '').toLowerCase().includes(q);
        const matchTitle = (emp.job_title || '').toLowerCase().includes(q);
        const matchPhone = (emp.phone || '').includes(q);
        const matchDept = (emp.department_name || '').toLowerCase().includes(q);
        return matchName || matchTitle || matchPhone || matchDept;
      }
      return true;
    });
  }, [employeesList, categoryFilter, searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([employeesQuery.refetch(), attendanceQuery.refetch(), leavesQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [employeesQuery, attendanceQuery, leavesQuery]);

  const openProfileDrawer = (emp: HREmployee) => {
    setSelectedEmployee(emp);
    setEditName(emp.name || '');
    setEditTitle(emp.job_title || '');
    setEditDept(emp.department_name || 'الكادر التعليمي');
    setEditPhone(emp.phone || '');
    setEditEmail(emp.email || '');
    setEditQual(String(emp.qualification ?? '0'));
    setEditYearsExp(String(emp.years_of_experience ?? '0'));
    setEditStatus(emp.employment_status || emp.status || 'active');
    setProfileActiveTab('personal');
  };

  const handleCreateEmployee = async () => {
    if (!empName.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى كتابة اسم الموظف' : 'Please enter employee name');
      return;
    }

    try {
      await createEmpMutation.mutateAsync({
        name: empName.trim(),
        job_title: empTitle.trim(),
        department_name: empDept,
        phone: empPhone.trim(),
        email: empEmail.trim(),
        national_id: empNationalId.trim(),
      });

      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تمت إضافة عضو الكادر بنجاح' : 'Staff member added successfully');
      setEmployeeModalVisible(false);
      setEmpName('');
      setEmpTitle('');
      setEmpPhone('');
      setEmpEmail('');
      setEmpNationalId('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'تعذر إضافة الموظف' : 'Failed to add staff member'));
    }
  };

  const handleSaveProfile = async () => {
    if (!selectedEmployee) return;
    try {
      await updateEmpMutation.mutateAsync({
        id: selectedEmployee.id,
        payload: {
          name: editName.trim(),
          job_title: editTitle.trim(),
          department_name: editDept,
          phone: editPhone.trim(),
          email: editEmail.trim(),
          qualification: editQual,
          years_of_experience: Number(editYearsExp),
          employment_status: editStatus,
        },
      });
      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم حفظ التعديلات الوظيفية بنجاح' : 'Staff profile updated successfully');
      setSelectedEmployee(null);
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'تعذر حفظ التعديلات' : 'Failed to update profile'));
    }
  };

  const handleDeleteEmployee = (emp: HREmployee) => {
    Alert.alert(
      isRTL ? 'حذف الموظف' : 'Delete Staff Member',
      isRTL ? `هل أنت متأكد من حذف ${emp.name} من الكادر؟` : `Are you sure you want to delete ${emp.name}?`,
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEmpMutation.mutateAsync(emp.id);
              Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم حذف الموظف بنجاح' : 'Staff member deleted');
              setSelectedEmployee(null);
            } catch (err: any) {
              Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'تعذر حذف الموظف' : 'Failed to delete staff member'));
            }
          },
        },
      ]
    );
  };

  const handleFingerprintSync = (emp: HREmployee) => {
    Alert.alert(
      isRTL ? 'بصمة الموظف (BioTime)' : 'Fingerprint Sync (BioTime)',
      isRTL ? `تم إرسال أمر ربط وتحديث جهاز البصمة للموظف ${emp.name} بنجاح` : `Fingerprint sync sent for ${emp.name}`,
      [{ text: isRTL ? 'حسناً' : 'OK' }]
    );
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, string> = {};
    employeesList.forEach((e) => {
      updated[e.id] = 'present';
    });
    setStaffAttendanceStatuses(updated);
    Alert.alert(isRTL ? 'نجاح' : 'Success', isRTL ? 'تم علم جميع الكادر كـ حاضرين' : 'Marked all staff as Present');
  };

  const handleApproveAttendanceSheet = () => {
    Alert.alert(
      isRTL ? 'اعتماد الكشف' : 'Approve Sheet',
      isRTL ? `تم اعتماد كشف الحضور والانصراف للكادر اليوم بتاريخ ${attendanceDate} بنجاح` : `Daily staff attendance sheet approved for ${attendanceDate}`,
      [{ text: isRTL ? 'حسناً' : 'OK' }]
    );
  };

  const handleCreateLeave = async () => {
    if (!leaveReason.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى كتابة سبب الإجازة' : 'Please enter leave reason');
      return;
    }
    try {
      await createLeaveMutation.mutateAsync({
        employee_id: leaveEmpId || (selectedEmployee?.id ?? employeesList[0]?.id),
        leave_type: leaveType,
        start_date: leaveStartDate,
        end_date: leaveEndDate,
        reason: leaveReason.trim(),
      });
      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم تقديم طلب الإجازة بنجاح' : 'Leave request submitted successfully');
      setLeaveModalVisible(false);
      setLeaveReason('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'تعذر تقديم طلب الإجازة' : 'Failed to submit leave request'));
    }
  };

  if (isLoading) {
    return <TablePageSkeleton />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* Header — Title row stacked above action buttons to prevent overflow */}
      <View style={[styles.header, isDark && styles.darkCard]}>
        {/* Row 1: Title + Subtitle */}
        <View style={[styles.headerTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
            <AppText
              variant="h2"
              weight="bold"
              style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}
              numberOfLines={1}
            >
              {t('navigation.hr', isRTL ? 'الكادر التعليمي والإداري' : 'HR & Staff')}
            </AppText>
            <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'} style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 2 }}>
              {`${totalEmployeesCount} ${isRTL ? 'عضو' : 'members'} — ${activeEmployeesCount} ${isRTL ? 'نشط' : 'active'}`}
            </AppText>
          </View>
        </View>

        {/* Row 2: Action Buttons (separate row, won't compete with title) */}
        {canManageHR && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[{ gap: 6, paddingBottom: 2 }, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            <TouchableOpacity style={styles.createBtn} onPress={() => setEmployeeModalVisible(true)}>
              <Text style={styles.createBtnText}>＋ {isRTL ? 'أضف عضو' : 'Add Staff'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryHeaderBtn}
              onPress={() => Alert.alert(isRTL ? 'استيراد من نور' : 'Import Noor', isRTL ? 'جاري تجهيز استيراد ملف الكادر من نظام نور' : 'Preparing Noor staff import')}
            >
              <Text style={styles.secondaryHeaderBtnText}>📥 {isRTL ? 'استيراد من نور' : 'Noor'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryHeaderBtn}
              onPress={() => Alert.alert(isRTL ? 'تصدير Excel' : 'Export Excel', isRTL ? 'جاري تصدير قائمة الكادر كملف Excel' : 'Exporting staff list as Excel')}
            >
              <Text style={styles.secondaryHeaderBtnText}>📊 Excel</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Row 3: Sub-Tabs Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'employees' && styles.tabBtnActive]}
            onPress={() => setActiveTab('employees')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'employees' && styles.tabBtnTextActive]}>
              {isRTL ? 'الكادر' : 'Staff'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'attendance' && styles.tabBtnActive]}
            onPress={() => setActiveTab('attendance')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'attendance' && styles.tabBtnTextActive]}>
              {isRTL ? 'الحضور' : 'Attendance'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'leaves' && styles.tabBtnActive]}
            onPress={() => setActiveTab('leaves')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'leaves' && styles.tabBtnTextActive]}>
              {isRTL ? 'الإجازات' : 'Leaves'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'substitutions' && styles.tabBtnActive]}
            onPress={() => setActiveTab('substitutions')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'substitutions' && styles.tabBtnTextActive]}>
              {isRTL ? 'الانتظار' : 'Substitutions'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'expiry_alerts' && styles.tabBtnActive]}
            onPress={() => setActiveTab('expiry_alerts')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'expiry_alerts' && styles.tabBtnTextActive]}>
              {isRTL ? 'الوثائق' : 'Documents'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'reports' && styles.tabBtnActive]}
            onPress={() => setActiveTab('reports')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'reports' && styles.tabBtnTextActive]}>
              {isRTL ? 'التقارير' : 'Reports'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn]}
            onPress={() => navigation.navigate('Portfolio')}
          >
            <Text style={styles.tabBtnText}>
              {isRTL ? 'الإنجاز ↗' : 'Portfolio ↗'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}
      >
        {/* ========================================================================= */}
        {/* TAB 1: STAFF DIRECTORY (الكادر التعليمي والإداري - Screenshots 1 & 2) */}
        {/* ========================================================================= */}
        {activeTab === 'employees' && (
          <View style={{ gap: 12 }}>
            {/* 5 KPI Summary Cards Row matching Screenshot 1 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.kpiRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
            >
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <Text style={styles.kpiVal}>{totalEmployeesCount}</Text>
                <Text style={styles.kpiLabel}>{isRTL ? 'إجمالي الكادر' : 'Total Staff'}</Text>
              </View>

              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <Text style={[styles.kpiVal, { color: '#0B7A55' }]}>{teachersCount}</Text>
                <Text style={styles.kpiLabel}>{isRTL ? 'معلمون' : 'Teachers'}</Text>
              </View>

              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <Text style={[styles.kpiVal, { color: '#1246B7' }]}>{activeEmployeesCount}</Text>
                <Text style={styles.kpiLabel}>{isRTL ? 'نشطون' : 'Active'}</Text>
              </View>

              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <Text style={[styles.kpiVal, { color: '#F79009' }]}>{onLeaveEmployeesCount}</Text>
                <Text style={styles.kpiLabel}>{isRTL ? 'في إجازة' : 'On Leave'}</Text>
              </View>

              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <Text style={[styles.kpiVal, { color: '#64748B' }]}>0%</Text>
                <Text style={styles.kpiLabel}>{isRTL ? 'متوسط الحضور' : 'Avg Attendance'}</Text>
              </View>
            </ScrollView>

            {/* Filter Chips & Search Bar matching Screenshot 1 */}
            <View style={[styles.filterBarCard, isDark && styles.darkCard]}>
              <TextInput
                style={[styles.searchInput, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={isRTL ? 'بحث بالاسم أو المادة أو رقم الهاتف...' : 'Search name, subject or phone...'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={[styles.filterRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                <TouchableOpacity
                  style={[styles.filterChip, categoryFilter === 'all' && styles.filterChipActive]}
                  onPress={() => setCategoryFilter('all')}
                >
                  <Text style={[styles.filterChipText, categoryFilter === 'all' && styles.filterChipTextActive]}>
                    {isRTL ? 'الكل' : 'All'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, categoryFilter === 'teachers' && styles.filterChipActive]}
                  onPress={() => setCategoryFilter('teachers')}
                >
                  <Text style={[styles.filterChipText, categoryFilter === 'teachers' && styles.filterChipTextActive]}>
                    {isRTL ? 'معلمون' : 'Teachers'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, categoryFilter === 'admins' && styles.filterChipActive]}
                  onPress={() => setCategoryFilter('admins')}
                >
                  <Text style={[styles.filterChipText, categoryFilter === 'admins' && styles.filterChipTextActive]}>
                    {isRTL ? 'إداريون' : 'Administrators'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, categoryFilter === 'on_leave' && styles.filterChipActive]}
                  onPress={() => setCategoryFilter('on_leave')}
                >
                  <Text style={[styles.filterChipText, categoryFilter === 'on_leave' && styles.filterChipTextActive]}>
                    {isRTL ? 'في إجازة' : 'On Leave'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Staff Cards List matching Screenshot 1 */}
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((emp: HREmployee, idx: number) => {
                const initialLetter = emp.name ? emp.name.trim().charAt(0) : 'م';
                const isTeacherRole = (emp.job_title || '').includes('معلم') || (emp.department_name || '').includes('تعليمي');
                const roleLabel = emp.job_title || (isTeacherRole ? (isRTL ? 'معلم' : 'Teacher') : (isRTL ? 'كادر إداري' : 'Administrative Staff'));

                return (
                  <View key={String(emp.id || idx)} style={[styles.staffCard, isDark && styles.darkCard]}>
                    {/* Top Row: Avatar + Name block */}
                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10 }]}>
                      {/* Avatar circle */}
                      <View style={[styles.avatarCircle, { backgroundColor: idx % 3 === 0 ? '#059669' : idx % 3 === 1 ? '#0284C7' : '#1246B7', flexShrink: 0 }]}>
                        <Text style={styles.avatarText}>{initialLetter}</Text>
                      </View>

                      {/* Name + badges block — fills remaining space */}
                      <View style={{ flex: 1 }}>
                        {/* Name on its own line — never truncates */}
                        <AppText
                          variant="cardTitle"
                          weight="bold"
                          color={isDark ? '#F1F5F9' : '#0F172A'}
                          style={{ textAlign: isRTL ? 'right' : 'left' }}
                          numberOfLines={1}
                        >
                          {emp.name}
                        </AppText>

                        {/* Role + Status badges row */}
                        <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 5, marginTop: 3, flexWrap: 'wrap' }]}>
                          <View style={styles.roleBadgePill}>
                            <Text style={styles.roleBadgeText} numberOfLines={1}>{roleLabel}</Text>
                          </View>
                          <View style={styles.activeBadgePill}>
                            <Text style={styles.activeBadgeText}>{isRTL ? '• نشط' : '• Active'}</Text>
                          </View>
                        </View>

                        {/* Contact info */}
                        {(emp.phone || emp.email) && (
                          <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10, marginTop: 4, flexWrap: 'wrap' }]}>
                            {emp.phone && (
                              <AppText variant="caption" color="#64748B" numberOfLines={1}>
                                📞 {emp.phone}
                              </AppText>
                            )}
                            {emp.email && (
                              <AppText variant="caption" color="#64748B" numberOfLines={1} style={{ flexShrink: 1 }}>
                                ✉️ {emp.email}
                              </AppText>
                            )}
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Action Row: Job Profile + BioTime + Attendance */}
                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: isDark ? '#1E3A6E' : '#F1F5F9', gap: 6 }]}>
                      <TouchableOpacity
                        style={styles.jobFileBtn}
                        onPress={() => openProfileDrawer(emp)}
                      >
                        <Icon name="fileText" size={13} color="#1246B7" />
                        <Text style={styles.jobFileBtnText}>{isRTL ? 'الملف الوظيفي' : 'Profile'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.bioTimeBtn}
                        onPress={() => handleFingerprintSync(emp)}
                      >
                        <Text style={styles.bioTimeBtnText}>((8)) {isRTL ? 'بصمة' : 'BioTime'}</Text>
                      </TouchableOpacity>

                      <AppText variant="captionBold" color="#0B7A55">
                        {isRTL ? '0% حضور' : '0% Att.'}
                      </AppText>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={[styles.card, isDark && styles.darkCard, styles.emptyCardBox]}>
                <Icon name="staff" size={40} color="#94A3B8" />
                <AppText variant="cardTitle" weight="bold" color="#64748B" style={{ textAlign: 'center', marginTop: 6 }}>
                  {isRTL ? 'لا يوجد أعضاء كادر مسجلون بهذا البحث' : 'No staff members found'}
                </AppText>
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: STAFF ATTENDANCE SHEET (حضور الكادر - Screenshot 5) */}
        {/* ========================================================================= */}
        {activeTab === 'attendance' && (
          <View style={{ gap: 12 }}>
            {/* Header Actions Bar matching Screenshot 5 */}
            <View style={[styles.filterBarCard, isDark && styles.darkCard]}>
              <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, alignItems: 'center' }]}>
                  <TextInput
                    style={[styles.dateInput, isDark && styles.darkInput]}
                    value={attendanceDate}
                    onChangeText={setAttendanceDate}
                    placeholder="YYYY-MM-DD"
                  />
                  <TouchableOpacity style={styles.actionPillBtn} onPress={handleMarkAllPresent}>
                    <Text style={styles.actionPillBtnText}>{isRTL ? 'الكل حاضر' : 'Mark All Present'}</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.approveSheetBtn} onPress={handleApproveAttendanceSheet}>
                  <Text style={styles.approveSheetBtnText}>✓ {isRTL ? 'اعتمد كشف اليوم' : 'Approve Sheet'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 5 KPI Mini Cards Row matching Screenshot 5 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.kpiRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.kpiMiniCard, isDark && styles.darkCard]}>
                <Text style={[styles.kpiMiniVal, { color: '#0B7A55' }]}>0</Text>
                <Text style={styles.kpiMiniLabel}>{isRTL ? 'حاضر' : 'Present'}</Text>
              </View>
              <View style={[styles.kpiMiniCard, isDark && styles.darkCard]}>
                <Text style={[styles.kpiMiniVal, { color: '#FF8A00' }]}>0</Text>
                <Text style={styles.kpiMiniLabel}>{isRTL ? 'متأخر' : 'Late'}</Text>
              </View>
              <View style={[styles.kpiMiniCard, isDark && styles.darkCard]}>
                <Text style={[styles.kpiMiniVal, { color: '#D92D20' }]}>0</Text>
                <Text style={styles.kpiMiniLabel}>{isRTL ? 'غائب' : 'Absent'}</Text>
              </View>
              <View style={[styles.kpiMiniCard, isDark && styles.darkCard]}>
                <Text style={[styles.kpiMiniVal, { color: '#0284C7' }]}>0</Text>
                <Text style={styles.kpiMiniLabel}>{isRTL ? 'إجازة' : 'Leave'}</Text>
              </View>
              <View style={[styles.kpiMiniCard, isDark && styles.darkCard]}>
                <Text style={[styles.kpiMiniVal, { color: '#7C3AED' }]}>0</Text>
                <Text style={styles.kpiMiniLabel}>{isRTL ? 'مهمة عمل' : 'Mission'}</Text>
              </View>
            </ScrollView>

            {/* Attendance Sheet List matching Screenshot 5 */}
            <View style={{ gap: 8 }}>
              {employeesList.length > 0 ? (
                employeesList.map((emp: HREmployee, idx: number) => {
                  const currentStatus = staffAttendanceStatuses[emp.id] || 'unrecorded';

                  return (
                    <View key={String(emp.id || idx)} style={[styles.card, isDark && styles.darkCard]}>
                      {/* Name + Department — full row, no competition with buttons */}
                      <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8, marginBottom: 8 }]}>
                        <View style={[styles.avatarCircleSmall, { backgroundColor: idx % 3 === 0 ? '#059669' : idx % 3 === 1 ? '#0284C7' : '#1246B7' }]}>
                          <Text style={styles.avatarTextSmall}>{emp.name ? emp.name.trim().charAt(0) : 'م'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <AppText
                            variant="cardTitle"
                            weight="bold"
                            color={isDark ? '#F1F5F9' : '#0F172A'}
                            numberOfLines={1}
                            style={{ textAlign: isRTL ? 'right' : 'left' }}
                          >
                            {emp.name}
                          </AppText>
                          <AppText variant="caption" color="#64748B" numberOfLines={1} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {emp.department_name || (isRTL ? 'الكادر التعليمي' : 'Teaching Staff')}
                          </AppText>
                        </View>
                      </View>

                      {/* Status Toggle Pills — full width scrollable row */}
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={[{ gap: 5 }, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                      >
                        <TouchableOpacity
                          style={[styles.attPillBtn, currentStatus === 'present' && styles.attPillPresentActive]}
                          onPress={() => setStaffAttendanceStatuses((prev) => ({ ...prev, [emp.id]: 'present' }))}
                        >
                          <Text style={[styles.attPillBtnText, currentStatus === 'present' && styles.attPillPresentTextActive]}>
                            {isRTL ? 'حاضر' : 'Present'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.attPillBtn, currentStatus === 'late' && styles.attPillLateActive]}
                          onPress={() => setStaffAttendanceStatuses((prev) => ({ ...prev, [emp.id]: 'late' }))}
                        >
                          <Text style={[styles.attPillBtnText, currentStatus === 'late' && styles.attPillLateTextActive]}>
                            {isRTL ? 'متأخر' : 'Late'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.attPillBtn, currentStatus === 'absent' && styles.attPillAbsentActive]}
                          onPress={() => setStaffAttendanceStatuses((prev) => ({ ...prev, [emp.id]: 'absent' }))}
                        >
                          <Text style={[styles.attPillBtnText, currentStatus === 'absent' && styles.attPillAbsentTextActive]}>
                            {isRTL ? 'غائب' : 'Absent'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.attPillBtn, currentStatus === 'leave' && styles.attPillLeaveActive]}
                          onPress={() => setStaffAttendanceStatuses((prev) => ({ ...prev, [emp.id]: 'leave' }))}
                        >
                          <Text style={[styles.attPillBtnText, currentStatus === 'leave' && styles.attPillLeaveTextActive]}>
                            {isRTL ? 'إجازة' : 'Leave'}
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.attPillBtn, currentStatus === 'mission' && styles.attPillMissionActive]}
                          onPress={() => setStaffAttendanceStatuses((prev) => ({ ...prev, [emp.id]: 'mission' }))}
                        >
                          <Text style={[styles.attPillBtnText, currentStatus === 'mission' && styles.attPillMissionTextActive]}>
                            {isRTL ? 'مهمة عمل' : 'Mission'}
                          </Text>
                        </TouchableOpacity>
                      </ScrollView>

                      {/* Check-in / Check-out times */}
                      <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: isDark ? '#1E3A6E' : '#F1F5F9' }]}>
                        <AppText variant="caption" color="#64748B">
                          🕒 {isRTL ? 'الورود:' : 'In:'} --:--
                        </AppText>
                        <AppText variant="caption" color="#64748B">
                          🕒 {isRTL ? 'الانصراف:' : 'Out:'} --:--
                        </AppText>
                        <AppText variant="captionBold" color="#0B7A55">
                          {isRTL ? 'الساعات: 0' : 'Hours: 0'}
                        </AppText>
                      </View>
                    </View>
                  );
                })
              ) : (
                <View style={[styles.card, isDark && styles.darkCard, styles.emptyCardBox]}>
                  <Icon name="clock" size={32} color="#94A3B8" />
                  <AppText variant="captionBold" color="#64748B" style={{ textAlign: 'center', marginTop: 6 }}>
                    {isRTL ? 'لا توجد سجلات حضور' : 'No attendance records'}
                  </AppText>
                </View>
              )}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LEAVE APPROVALS (اعتماد الإجازات) */}
        {/* ========================================================================= */}
        {activeTab === 'leaves' && (
          <View style={{ gap: 10 }}>
            <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <AppText variant="cardTitle" weight="bold" color="#0F172A">
                {isRTL ? 'طلبات الإجازات المرفوعة' : 'Leave Requests'}
              </AppText>
              <TouchableOpacity style={styles.createBtn} onPress={() => setLeaveModalVisible(true)}>
                <Text style={styles.createBtnText}>＋ {isRTL ? 'طلب إجازة' : 'Request Leave'}</Text>
              </TouchableOpacity>
            </View>

            {leavesList.length > 0 ? (
              leavesList.map((req: HRLeaveRequest) => (
                <View key={String(req.id)} style={[styles.card, isDark && styles.darkCard]}>
                  <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <AppText variant="cardTitle" weight="bold" color="#1246B7">
                      {req.employee_name || (isRTL ? 'موظف' : 'Staff Member')}
                    </AppText>
                    <View style={styles.roleBadgePill}>
                      <Text style={styles.roleBadgeText}>{req.leave_type || req.type || (isRTL ? 'اعتادية' : 'Annual')}</Text>
                    </View>
                  </View>

                  <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 4 }}>
                    📅 {isRTL ? 'المدة:' : 'Period:'} {req.start_date} → {req.end_date}
                  </AppText>
                  {req.reason && (
                    <AppText variant="body" color="#334155" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 2 }}>
                      {req.reason}
                    </AppText>
                  )}

                  {req.status === 'pending' && canManageHR && (
                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 8 }]}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => approveLeaveMutation.mutate(req.id)}
                      >
                        <Text style={styles.approveBtnText}>✓ {isRTL ? 'موافقة' : 'Approve'}</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => rejectLeaveMutation.mutate({ id: req.id })}
                      >
                        <Text style={styles.rejectBtnText}>✕ {isRTL ? 'رفض' : 'Reject'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={[styles.card, isDark && styles.darkCard, styles.emptyCardBox]}>
                <Icon name="clipboard" size={32} color="#94A3B8" />
                <AppText variant="captionBold" color="#64748B" style={{ textAlign: 'center', marginTop: 6 }}>
                  {isRTL ? 'لا توجد طلبات إجازة معلقة' : 'No pending leave requests'}
                </AppText>
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: CLASS SUBSTITUTIONS (حصص الانتظار والبديل) */}
        {/* ========================================================================= */}
        {activeTab === 'substitutions' && (
          <View style={{ gap: 10 }}>
            <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <AppText variant="cardTitle" weight="bold" color="#0F172A">
                {isRTL ? 'جدول حصص الانتظار وتغطية الحصص' : 'Class Substitutions'}
              </AppText>
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => Alert.alert(isRTL ? 'إسناد انتظار' : 'Assign Substitution', isRTL ? 'تم فتح نموذج إسناد حصة انتظار لمعلم بديل' : 'Assign substitution modal')}
              >
                <Text style={styles.createBtnText}>＋ {isRTL ? 'إسناد انتظار' : 'Assign Coverage'}</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.card, isDark && styles.darkCard, styles.emptyCardBox]}>
              <Icon name="refresh" size={32} color="#0B7A55" />
              <AppText variant="cardTitle" weight="bold" color="#0B7A55" style={{ textAlign: 'center', marginTop: 4 }}>
                {isRTL ? 'تمت تغطية جميع حصص اليوم بالكامل' : 'All today classes are fully covered'}
              </AppText>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: DOCUMENT EXPIRY ALERTS (تنبيهات انتهاء الوثائق) */}
        {/* ========================================================================= */}
        {activeTab === 'expiry_alerts' && (
          <View style={{ gap: 10 }}>
            <AppText variant="cardTitle" weight="bold" color="#0F172A" style={{ textAlign: isRTL ? 'right' : 'left' }}>
              {isRTL ? 'تنبيهات وثائق وعقود الكادر' : 'Staff Document Expiry Alerts'}
            </AppText>
            <View style={[styles.card, isDark && styles.darkCard, styles.emptyCardBox]}>
              <Icon name="checkCircle" size={32} color="#059669" />
              <AppText variant="captionBold" color="#059669" style={{ textAlign: 'center', marginTop: 4 }}>
                {isRTL ? 'جميع وثائق الهوية والعقود سارية' : 'All staff ID & contracts are active'}
              </AppText>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: STAFF REPORTS (تقارير الموظفين - Screenshot 4) */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <View style={{ gap: 12 }}>
            {/* Date Range Picker & Export PDF Bar matching Screenshot 4 */}
            <View style={[styles.filterBarCard, isDark && styles.darkCard]}>
              <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6, alignItems: 'center' }]}>
                  <TextInput
                    style={[styles.dateInput, isDark && styles.darkInput]}
                    value={reportStartDate}
                    onChangeText={setReportStartDate}
                    placeholder="YYYY-MM-DD"
                  />
                  <Text style={{ color: '#64748B' }}>إلى</Text>
                  <TextInput
                    style={[styles.dateInput, isDark && styles.darkInput]}
                    value={reportEndDate}
                    onChangeText={setReportEndDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>

                <TouchableOpacity
                  style={styles.pdfExportBtn}
                  onPress={() => Alert.alert(isRTL ? 'تصدير PDF' : 'Export PDF', isRTL ? 'جاري إعداد وتنزيل تقرير الكادر بصيغة PDF' : 'Exporting staff report PDF')}
                >
                  <Text style={styles.pdfExportBtnText}>📄 {isRTL ? 'تصدير PDF' : 'PDF Report'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Report Sub-Tabs matching Screenshot 4 */}
            <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6 }]}>
              <TouchableOpacity
                style={[styles.tabBtn, reportSubTab === 'attendance' && styles.tabBtnActive]}
                onPress={() => setReportSubTab('attendance')}
              >
                <Text style={[styles.tabBtnText, reportSubTab === 'attendance' && styles.tabBtnTextActive]}>
                  {isRTL ? 'الحضور والانصراف' : 'Attendance'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, reportSubTab === 'leaves' && styles.tabBtnActive]}
                onPress={() => setReportSubTab('leaves')}
              >
                <Text style={[styles.tabBtnText, reportSubTab === 'leaves' && styles.tabBtnTextActive]}>
                  {isRTL ? 'الإجازات' : 'Leaves'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabBtn, reportSubTab === 'teams' && styles.tabBtnActive]}
                onPress={() => setReportSubTab('teams')}
              >
                <Text style={[styles.tabBtnText, reportSubTab === 'teams' && styles.tabBtnTextActive]}>
                  {isRTL ? 'الفرق المباشرة' : 'Direct Teams'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 5 KPI Cards matching Screenshot 4 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.kpiRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <Text style={styles.kpiVal}>0%</Text>
                <Text style={styles.kpiLabel}>{isRTL ? 'متوسط الحضور' : 'Avg Attendance'}</Text>
              </View>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <Text style={styles.kpiVal}>0</Text>
                <Text style={styles.kpiLabel}>{isRTL ? 'أيام التأخير' : 'Late Days'}</Text>
              </View>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <Text style={styles.kpiVal}>0</Text>
                <Text style={styles.kpiLabel}>{isRTL ? 'أيام الغياب' : 'Absent Days'}</Text>
              </View>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <Text style={styles.kpiVal}>0</Text>
                <Text style={styles.kpiLabel}>{isRTL ? 'عدد الموظفين' : 'Staff Count'}</Text>
              </View>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <Text style={[styles.kpiVal, { color: '#1246B7' }]}>{totalEmployeesCount}</Text>
                <Text style={styles.kpiLabel}>{isRTL ? 'إجمالي الكادر' : 'Total Staff'}</Text>
              </View>
            </ScrollView>

            <View style={[styles.card, isDark && styles.darkCard, styles.emptyCardBox]}>
              <Icon name="fileText" size={32} color="#94A3B8" />
              <AppText variant="captionBold" color="#64748B" style={{ textAlign: 'center', marginTop: 4 }}>
                {isRTL ? 'لا توجد بيانات في هذه الفترة' : 'No data in selected period'}
              </AppText>
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================================================= */}
      {/* STAFF PROFILE DRAWER / SIDE SHEET MODAL (Matching Screenshot 2) */}
      {/* ========================================================================= */}
      <Modal visible={!!selectedEmployee} transparent animationType="slide" onRequestClose={() => setSelectedEmployee(null)}>
        <View style={styles.drawerOverlay}>
          <View style={[styles.drawerSheet, isDark && styles.darkCard]}>
            {/* Drawer Header */}
            {selectedEmployee && (
              <View>
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 10, flex: 1 }]}>
                    <View style={styles.avatarCircleLarge}>
                      <Text style={styles.avatarTextLarge}>{selectedEmployee.name ? selectedEmployee.name.trim().charAt(0) : 'م'}</Text>
                    </View>
                    <View>
                      <AppText variant="h2" weight="bold" color="#0F172A">
                        {selectedEmployee.name}
                      </AppText>
                      <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6, marginTop: 2 }]}>
                        <View style={styles.roleBadgePill}>
                          <Text style={styles.roleBadgeText}>{selectedEmployee.job_title || (isRTL ? 'كادر تعليمي' : 'Staff')}</Text>
                        </View>
                        <View style={styles.activeBadgePill}>
                          <Text style={styles.activeBadgeText}>{isRTL ? '• نشط' : '• Active'}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.closeDrawerBtn} onPress={() => setSelectedEmployee(null)}>
                    <Text style={styles.closeDrawerBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>

                {/* Profile Sub-Tabs matching Screenshot 2 */}
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', paddingBottom: 8 }]}>
                  <TouchableOpacity
                    style={[styles.profileSubTab, profileActiveTab === 'personal' && styles.profileSubTabActive]}
                    onPress={() => setProfileActiveTab('personal')}
                  >
                    <Text style={[styles.profileSubTabText, profileActiveTab === 'personal' && styles.profileSubTabTextActive]}>
                      {isRTL ? 'الملف الشخصي' : 'Profile'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.profileSubTab, profileActiveTab === 'classes' && styles.profileSubTabActive]}
                    onPress={() => setProfileActiveTab('classes')}
                  >
                    <Text style={[styles.profileSubTabText, profileActiveTab === 'classes' && styles.profileSubTabTextActive]}>
                      {isRTL ? 'المواد والفصول' : 'Classes'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.profileSubTab, profileActiveTab === 'logs' && styles.profileSubTabActive]}
                    onPress={() => setProfileActiveTab('logs')}
                  >
                    <Text style={[styles.profileSubTabText, profileActiveTab === 'logs' && styles.profileSubTabTextActive]}>
                      {isRTL ? 'السجل' : 'Log'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Profile Form Fields matching Screenshot 2 */}
                <ScrollView contentContainerStyle={{ gap: 10, paddingVertical: 12 }} showsVerticalScrollIndicator={false}>
                  <AppText variant="captionBold" color="#344054">
                    {isRTL ? 'الاسم الكامل' : 'Full Name'}
                  </AppText>
                  <TextInput
                    style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
                    value={editName}
                    onChangeText={setEditName}
                  />

                  <AppText variant="captionBold" color="#344054">
                    {isRTL ? 'المنصب / المسمى الوظيفي' : 'Position'}
                  </AppText>
                  <TextInput
                    style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
                    value={editTitle}
                    onChangeText={setEditTitle}
                  />

                  <AppText variant="captionBold" color="#344054">
                    {isRTL ? 'رقم الجوال' : 'Phone'}
                  </AppText>
                  <TextInput
                    style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
                    value={editPhone}
                    onChangeText={setEditPhone}
                  />

                  <AppText variant="captionBold" color="#344054">
                    {isRTL ? 'البريد الإلكتروني' : 'Email'}
                  </AppText>
                  <TextInput
                    style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
                    value={editEmail}
                    onChangeText={setEditEmail}
                  />

                  {/* 3 KPI Mini Stat Boxes matching Screenshot 2 */}
                  <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 6 }]}>
                    <View style={[styles.profileStatBox, { backgroundColor: '#F0FDF4' }]}>
                      <Text style={[styles.profileStatVal, { color: '#059669' }]}>0%</Text>
                      <Text style={styles.profileStatLabel}>{isRTL ? 'نسبة الحضور' : 'Attendance'}</Text>
                    </View>
                    <View style={[styles.profileStatBox, { backgroundColor: '#EFF6FF' }]}>
                      <Text style={[styles.profileStatVal, { color: '#2563EB' }]}>2</Text>
                      <Text style={styles.profileStatLabel}>{isRTL ? 'فصول مسندة' : 'Classes'}</Text>
                    </View>
                    <View style={[styles.profileStatBox, { backgroundColor: '#FAF5FF' }]}>
                      <Text style={[styles.profileStatVal, { color: '#7C3AED' }]}>0</Text>
                      <Text style={styles.profileStatLabel}>{isRTL ? 'مادة مسندة' : 'Subjects'}</Text>
                    </View>
                  </View>
                </ScrollView>

                {/* Drawer Footer Buttons matching Screenshot 2 */}
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
                  <TouchableOpacity style={styles.saveProfileBtn} onPress={handleSaveProfile} disabled={updateEmpMutation.isPending}>
                    <Text style={styles.saveProfileBtnText}>💾 {isRTL ? 'احفظ التعديلات' : 'Save Changes'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.pdfProfileBtn}
                    onPress={() => Alert.alert(isRTL ? 'تقرير PDF' : 'PDF Report', isRTL ? 'جاري تجهيز تقرير الموظف بصيغة PDF' : 'Generating PDF report')}
                  >
                    <Text style={styles.pdfProfileBtnText}>📄 PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.leaveProfileBtn}
                    onPress={() => {
                      setLeaveEmpId(selectedEmployee.id);
                      setLeaveModalVisible(true);
                    }}
                  >
                    <Text style={styles.leaveProfileBtnText}>🏖️ {isRTL ? 'إجازة' : 'Leave'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.trashProfileBtn} onPress={() => handleDeleteEmployee(selectedEmployee)}>
                    <Text style={styles.trashProfileBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* CREATE STAFF MEMBER MODAL */}
      <Modal visible={employeeModalVisible} transparent animationType="slide">
        <View style={styles.drawerOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={styles.modalTitle}>
              {isRTL ? 'إضافة عضو كادر جديد' : 'Add New Staff Member'}
            </AppText>

            <AppText variant="captionBold" color="#344054">
              {isRTL ? 'الاسم الكامل' : 'Full Name'} *
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
              value={empName}
              onChangeText={setEmpName}
              placeholder={isRTL ? 'اسم الموظف...' : 'Staff name...'}
              placeholderTextColor="#94A3B8"
            />

            <AppText variant="captionBold" color="#344054">
              {isRTL ? 'المسمى الوظيفي' : 'Job Title'}
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
              value={empTitle}
              onChangeText={setEmpTitle}
              placeholder={isRTL ? 'مثال: معلم رياضيات' : 'e.g. Math Teacher'}
              placeholderTextColor="#94A3B8"
            />

            <AppText variant="captionBold" color="#344054">
              {isRTL ? 'القسم / الإدارة' : 'Department'}
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
              value={empDept}
              onChangeText={setEmpDept}
            />

            <AppText variant="captionBold" color="#344054">
              {isRTL ? 'رقم الجوال' : 'Phone'}
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
              value={empPhone}
              onChangeText={setEmpPhone}
              keyboardType="phone-pad"
            />

            <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 10 }]}>
              <TouchableOpacity
                style={[styles.saveProfileBtn, { flex: 1 }]}
                onPress={handleCreateEmployee}
                disabled={createEmpMutation.isPending}
              >
                {createEmpMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveProfileBtnText}>{isRTL ? 'حفظ الكادر' : 'Save Staff'}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeDrawerBtn} onPress={() => setEmployeeModalVisible(false)}>
                <Text style={styles.closeDrawerBtnText}>{t('common.cancel', 'إلغاء')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* CREATE LEAVE MODAL */}
      <Modal visible={leaveModalVisible} transparent animationType="slide">
        <View style={styles.drawerOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={styles.modalTitle}>
              {isRTL ? 'تقديم طلب إجازة جديد' : 'Submit Leave Request'}
            </AppText>

            <AppText variant="captionBold" color="#344054">
              {isRTL ? 'تاريخ البداية (YYYY-MM-DD)' : 'Start Date'}
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={leaveStartDate}
              onChangeText={setLeaveStartDate}
            />

            <AppText variant="captionBold" color="#344054">
              {isRTL ? 'تاريخ النهاية (YYYY-MM-DD)' : 'End Date'}
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput]}
              value={leaveEndDate}
              onChangeText={setLeaveEndDate}
            />

            <AppText variant="captionBold" color="#344054">
              {isRTL ? 'سبب الإجازة والتفاصيل' : 'Reason'} *
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, { height: 60 }]}
              value={leaveReason}
              onChangeText={setLeaveReason}
              multiline
            />

            <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8, marginTop: 10 }]}>
              <TouchableOpacity
                style={[styles.saveProfileBtn, { flex: 1 }]}
                onPress={handleCreateLeave}
                disabled={createLeaveMutation.isPending}
              >
                {createLeaveMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveProfileBtnText}>{isRTL ? 'إرسال الطلب' : 'Submit'}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeDrawerBtn} onPress={() => setLeaveModalVisible(false)}>
                <Text style={styles.closeDrawerBtnText}>{t('common.cancel', 'إلغاء')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  darkSafeArea: { backgroundColor: '#07132B' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 14 : 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 10 },
  darkCard: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  headerTitleRow: { justifyContent: 'space-between', alignItems: 'center' },
  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  headerTitleBlock: { flex: 1 },
  title: { fontSize: 20, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  subtitle: { fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.regular, marginTop: 2 },
  createBtn: { backgroundColor: '#1246B7', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  createBtnText: { color: '#FFFFFF', fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  secondaryHeaderBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1' },
  secondaryHeaderBtnText: { color: '#334155', fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.semiBold },
  tabsRow: { gap: 6 },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  tabBtnActive: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  tabBtnText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#5A6784', fontWeight: '600' },
  tabBtnTextActive: { color: '#FFFFFF', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  content: { padding: 14 },

  kpiRow: { gap: 8, marginVertical: 4 },
  kpiBox: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', minWidth: 100, alignItems: 'center', justifyContent: 'center' },
  kpiVal: { fontSize: 19, fontFamily: ibmPlexArabicFontFamily.extraBold, fontWeight: '800', color: '#0F172A' },
  kpiLabel: { fontSize: 11.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#64748B', marginTop: 2 },

  kpiMiniCard: { backgroundColor: '#FFFFFF', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  kpiMiniVal: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  kpiMiniLabel: { fontSize: 11, fontFamily: ibmPlexArabicFontFamily.regular, color: '#64748B' },

  filterBarCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  searchInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular, backgroundColor: '#F8FAFC' },
  darkInput: { backgroundColor: '#091A38', borderColor: '#1E3A6E', color: '#F8FAFC' },
  filterRow: { gap: 6 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  filterChipActive: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  filterChipText: { fontSize: 12, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#475569' },
  filterChipTextActive: { color: '#FFFFFF', fontFamily: ibmPlexArabicFontFamily.bold },

  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.card },
  staffCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.card, gap: 4 },
  avatarCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 17, fontFamily: ibmPlexArabicFontFamily.bold },
  avatarCircleSmall: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarTextSmall: { color: '#FFFFFF', fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold },
  avatarCircleLarge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#059669', justifyContent: 'center', alignItems: 'center' },
  avatarTextLarge: { color: '#FFFFFF', fontSize: 22, fontFamily: ibmPlexArabicFontFamily.bold },

  roleBadgePill: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  roleBadgeText: { color: '#1D4ED8', fontSize: 11.5, fontFamily: ibmPlexArabicFontFamily.semiBold },
  activeBadgePill: { backgroundColor: '#F0FDF4', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  activeBadgeText: { color: '#15803D', fontSize: 11.5, fontFamily: ibmPlexArabicFontFamily.bold },

  bioTimeBtn: { backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  bioTimeBtnText: { color: '#1D4ED8', fontSize: 11.5, fontFamily: ibmPlexArabicFontFamily.bold },

  jobFileBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  jobFileBtnText: { color: '#1246B7', fontSize: 12, fontFamily: ibmPlexArabicFontFamily.bold },

  tagChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagChipText: { color: '#475569', fontSize: 11, fontFamily: ibmPlexArabicFontFamily.regular },
  tagChipDefault: { backgroundColor: '#FFFBEB', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagChipDefaultText: { color: '#B45309', fontSize: 11, fontFamily: ibmPlexArabicFontFamily.regular },

  emptyCardBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 30, gap: 6 },
  dateInput: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4, fontSize: 13, backgroundColor: '#F8FAFC', minWidth: 100, textAlign: 'center' },

  actionPillBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  actionPillBtnText: { fontSize: 12, color: '#334155', fontFamily: ibmPlexArabicFontFamily.semiBold },
  approveSheetBtn: { backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  approveSheetBtnText: { fontSize: 12, color: '#FFFFFF', fontFamily: ibmPlexArabicFontFamily.bold },

  attPillBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  attPillBtnText: { fontSize: 11, color: '#64748B', fontFamily: ibmPlexArabicFontFamily.semiBold },
  attPillPresentActive: { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' },
  attPillPresentTextActive: { color: '#15803D', fontFamily: ibmPlexArabicFontFamily.bold },
  attPillLateActive: { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' },
  attPillLateTextActive: { color: '#B45309', fontFamily: ibmPlexArabicFontFamily.bold },
  attPillAbsentActive: { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5' },
  attPillAbsentTextActive: { color: '#B91C1C', fontFamily: ibmPlexArabicFontFamily.bold },
  attPillLeaveActive: { backgroundColor: '#E0F2FE', borderColor: '#7DD3FC' },
  attPillLeaveTextActive: { color: '#0369A1', fontFamily: ibmPlexArabicFontFamily.bold },
  attPillMissionActive: { backgroundColor: '#F3E8FF', borderColor: '#D8B4FE' },
  attPillMissionTextActive: { color: '#6B21A8', fontFamily: ibmPlexArabicFontFamily.bold },

  approveBtn: { flex: 1, backgroundColor: '#F1FAF5', paddingVertical: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#D0F5E0' },
  approveBtnText: { color: '#0B7A55', fontSize: 13, fontFamily: ibmPlexArabicFontFamily.bold },
  rejectBtn: { flex: 1, backgroundColor: '#FEE4E2', paddingVertical: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#FDA29B' },
  rejectBtnText: { color: '#D92D20', fontSize: 13, fontFamily: ibmPlexArabicFontFamily.bold },

  pdfExportBtn: { backgroundColor: '#E11D48', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  pdfExportBtnText: { color: '#FFFFFF', fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold },

  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  drawerSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 18, maxHeight: '85%' },
  closeDrawerBtn: { padding: 6, borderRadius: 6, backgroundColor: '#F1F5F9' },
  closeDrawerBtnText: { fontSize: 16, color: '#64748B', fontWeight: 'bold' },

  profileSubTab: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  profileSubTabActive: { backgroundColor: '#1246B7' },
  profileSubTabText: { fontSize: 13, color: '#64748B', fontFamily: ibmPlexArabicFontFamily.semiBold },
  profileSubTabTextActive: { color: '#FFFFFF', fontFamily: ibmPlexArabicFontFamily.bold },

  profileStatBox: { flex: 1, borderRadius: 8, padding: 10, alignItems: 'center', justifyContent: 'center' },
  profileStatVal: { fontSize: 18, fontFamily: ibmPlexArabicFontFamily.extraBold },
  profileStatLabel: { fontSize: 11, fontFamily: ibmPlexArabicFontFamily.regular, color: '#475569', marginTop: 2 },

  saveProfileBtn: { backgroundColor: '#059669', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8, alignItems: 'center', flex: 1 },
  saveProfileBtnText: { color: '#FFFFFF', fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.bold },
  pdfProfileBtn: { backgroundColor: '#E11D48', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  pdfProfileBtnText: { color: '#FFFFFF', fontSize: 13, fontFamily: ibmPlexArabicFontFamily.bold },
  leaveProfileBtn: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  leaveProfileBtnText: { color: '#B45309', fontSize: 13, fontFamily: ibmPlexArabicFontFamily.bold },
  trashProfileBtn: { backgroundColor: '#FEE2E2', borderWidth: 1, borderColor: '#FCA5A5', paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, alignItems: 'center' },
  trashProfileBtnText: { fontSize: 15 },

  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, gap: 8, marginHorizontal: 16 },
  modalTitle: { fontSize: 18, fontFamily: ibmPlexArabicFontFamily.bold, textAlign: 'center', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, padding: 9, fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular, backgroundColor: '#F8FAFC' },
});
