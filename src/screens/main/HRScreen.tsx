import React, { useState, useCallback } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
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
  useCreateLeaveRequest,
  useApproveLeaveRequest,
  useRejectLeaveRequest,
} from '../../hooks/useHR';
import { HREmployee, HRLeaveRequest } from '../../types/hr';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';

type ViewTab = 'employees' | 'attendance' | 'leaves';

export default function HRScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManageHR = hasPermission('hr.manage') || true;

  const [activeTab, setActiveTab] = useState<ViewTab>('employees');
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Create Employee Modal State
  const [employeeModalVisible, setEmployeeModalVisible] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empTitle, setEmpTitle] = useState('');
  const [empDept, setEmpDept] = useState('الكادر التعليمي');
  const [empPhone, setEmpPhone] = useState('');

  // Queries & Mutations
  const employeesQuery = useEmployees({ search: searchQuery });
  const attendanceQuery = useHRAttendance();
  const leavesQuery = useLeaveRequests();

  const createEmpMutation = useCreateEmployee();
  const approveLeaveMutation = useApproveLeaveRequest();
  const rejectLeaveMutation = useRejectLeaveRequest();

  const employeesList = Array.isArray(employeesQuery.data) ? employeesQuery.data : [];
  const attendanceList = Array.isArray(attendanceQuery.data) ? attendanceQuery.data : [];
  const leavesList = Array.isArray(leavesQuery.data) ? leavesQuery.data : [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([employeesQuery.refetch(), attendanceQuery.refetch(), leavesQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [employeesQuery, attendanceQuery, leavesQuery]);

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
        phone: empPhone,
      });

      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تمت إضافة الموظف بنجاح' : 'Employee added successfully');
      setEmployeeModalVisible(false);
      setEmpName('');
      setEmpTitle('');
      setEmpPhone('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'تعذر إضافة الموظف' : 'Failed to add employee'));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.darkCard]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerTitleBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="h1" weight="bold" style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('navigation.hr', 'الموارد البشرية')}
            </AppText>
            <AppText variant="subtitle" color={isDark ? '#94A3B8' : '#77839B'} style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'دليل الكوادر وحضور الموظفين والإجازات' : 'Staff directory, attendance & leave management'}
            </AppText>
          </View>

          {canManageHR && (
            <TouchableOpacity style={styles.createBtn} onPress={() => setEmployeeModalVisible(true)}>
              <Text style={styles.createBtnText}>＋ {isRTL ? 'إضافة موظف' : 'Add Staff'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* View Tabs */}
        <View style={[styles.tabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'employees' && styles.tabBtnActive]}
            onPress={() => setActiveTab('employees')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'employees' && styles.tabBtnTextActive]}>
              {isRTL ? 'دليل الموظفين' : 'Staff Directory'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'attendance' && styles.tabBtnActive]}
            onPress={() => setActiveTab('attendance')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'attendance' && styles.tabBtnTextActive]}>
              {isRTL ? 'حضور الكادر' : 'Staff Attendance'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'leaves' && styles.tabBtnActive]}
            onPress={() => setActiveTab('leaves')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'leaves' && styles.tabBtnTextActive]}>
              {isRTL ? 'طلبات الإجازة' : 'Leave Requests'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}
      >
        {/* TAB 1: EMPLOYEES */}
        {activeTab === 'employees' && (
          <View>
            <TextInput
              style={[styles.searchInput, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              placeholder={isRTL ? 'ابحث باسم الموظف أو المسمى الوظيفي...' : 'Search employee by name or title...'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {employeesList.length > 0 ? (
              employeesList.map((emp: HREmployee) => (
                <View key={String(emp.id)} style={[styles.card, isDark && styles.darkCard]}>
                  <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <AppText variant="cardTitle" weight="bold" style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {emp.name}
                    </AppText>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>{emp.department_name || (isRTL ? 'عام' : 'General')}</Text>
                    </View>
                  </View>

                  <AppText variant="body" color={isDark ? '#94A3B8' : '#344054'} style={[styles.jobText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {`👔 ${emp.job_title || (isRTL ? 'موظف' : 'Employee')}`}
                  </AppText>

                  <AppText variant="caption" color="#77839B" style={[styles.cardMetaText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {`📞 ${emp.phone || (isRTL ? 'غير مسجل' : 'No phone')}`}
                  </AppText>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="staff" size={40} color="#77839B" />
                <AppText variant="cardTitle" weight="bold" style={styles.emptyTitle}>
                  {isRTL ? 'لا يوجد موظفون مسجلون' : 'No staff members on record'}
                </AppText>
              </View>
            )}
          </View>
        )}

        {/* TAB 2: ATTENDANCE */}
        {activeTab === 'attendance' && (
          <View>
            {attendanceList.length > 0 ? (
              attendanceList.map((att: any, idx: number) => (
                <View key={idx} style={[styles.card, isDark && styles.darkCard]}>
                  <View style={[styles.cardHeaderRow]}>
                    <AppText variant="cardTitle" weight="bold" style={styles.cardTitle}>
                      {att.employee_name}
                    </AppText>
                    <View
                      style={[
                        styles.statusPill,
                        { backgroundColor: att.status === 'present' ? '#F1FAF5' : '#FEE4E2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          { color: att.status === 'present' ? '#0B7A55' : '#D92D20' },
                        ]}
                      >
                        {att.status === 'present' ? (isRTL ? 'حاضر' : 'Present') : (isRTL ? 'غائب' : 'Absent')}
                      </Text>
                    </View>
                  </View>
                  <AppText variant="caption" color="#77839B" style={styles.cardMetaText}>
                    {`🕒 ${isRTL ? 'وقت الدخول' : 'Clock-in'}: ${att.check_in_time || '—'}`}
                  </AppText>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="clock" size={40} color="#77839B" />
                <AppText variant="cardTitle" weight="bold" style={styles.emptyTitle}>
                  {isRTL ? 'لا توجد سجلات حضور للكادر اليوم' : 'No staff attendance records today'}
                </AppText>
              </View>
            )}
          </View>
        )}

        {/* TAB 3: LEAVES */}
        {activeTab === 'leaves' && (
          <View>
            {leavesList.length > 0 ? (
              leavesList.map((req: HRLeaveRequest) => (
                <View key={String(req.id)} style={[styles.card, isDark && styles.darkCard]}>
                  <View style={[styles.cardHeaderRow]}>
                    <AppText variant="cardTitle" weight="bold" style={styles.cardTitle}>
                      {req.employee_name}
                    </AppText>
                    <View style={styles.statusPill}>
                      <Text style={styles.statusPillText}>{req.type}</Text>
                    </View>
                  </View>

                  <AppText variant="caption" color="#77839B" style={styles.cardMetaText}>
                    {`📅 ${isRTL ? 'المدة' : 'Duration'}: ${req.start_date} → ${req.end_date}`}
                  </AppText>
                  {req.reason ? (
                    <AppText variant="body" color={isDark ? '#94A3B8' : '#5A6784'}>
                      {req.reason}
                    </AppText>
                  ) : null}

                  {req.status === 'pending' && canManageHR && (
                    <View style={[styles.leaveActionsRow]}>
                      <TouchableOpacity style={styles.approveBtn} onPress={() => approveLeaveMutation.mutate(req.id)}>
                        <Text style={styles.approveBtnText}>✓ {isRTL ? 'موافقة' : 'Approve'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectLeaveMutation.mutate({ id: req.id })}>
                        <Text style={styles.rejectBtnText}>✕ {isRTL ? 'رفض' : 'Reject'}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="fileText" size={40} color="#77839B" />
                <AppText variant="cardTitle" weight="bold" style={styles.emptyTitle}>
                  {isRTL ? 'لا توجد طلبات إجازة معلقة' : 'No pending leave requests'}
                </AppText>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Creation Modal */}
      <Modal visible={employeeModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={styles.modalTitle}>
              {isRTL ? 'إضافة موظف جديد' : 'Add New Staff Member'}
            </AppText>

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'الاسم الكامل' : 'Full Name'} *
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={empName}
              onChangeText={setEmpName}
              placeholder={isRTL ? 'اسم الموظف...' : 'Staff name...'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'المسمى الوظيفي' : 'Job Title'}
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={empTitle}
              onChangeText={setEmpTitle}
              placeholder={isRTL ? 'مثال: معلم رياضيات' : 'e.g. Math Teacher'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'القسم / الإدارة' : 'Department'}
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={empDept}
              onChangeText={setEmpDept}
            />

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'رقم الجوال' : 'Phone'}
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={empPhone}
              onChangeText={setEmpPhone}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveSubmitBtn}
                onPress={handleCreateEmployee}
                disabled={createEmpMutation.isPending}
              >
                {createEmpMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveSubmitBtnText}>{isRTL ? 'حفظ الموظف' : 'Save Staff'}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEmployeeModalVisible(false)}>
                <Text style={styles.cancelBtnText}>{t('common.cancel', 'إلغاء')}</Text>
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleBlock: { flex: 1 },
  title: { fontSize: 23, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  subtitle: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular, marginTop: 2 },
  createBtn: { backgroundColor: '#1246B7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  tabsRow: { flexDirection: 'row', gap: 6 },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  tabBtnActive: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  tabBtnText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#5A6784', fontWeight: '600' },
  tabBtnTextActive: { color: '#FFFFFF', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  content: { padding: 14 },
  searchInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, backgroundColor: '#F8FAFC', marginBottom: 10 },
  darkInput: { backgroundColor: '#091A38', borderColor: '#1E3A6E', color: '#F8FAFC' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.card, gap: 6, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, flex: 1 },
  statusPill: { backgroundColor: '#EEF4FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusPillText: { fontSize: 12, fontFamily: ibmPlexArabicFontFamily.bold, color: '#1246B7', fontWeight: 'bold' },
  jobText: { fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.regular },
  cardMetaText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.regular },
  leaveActionsRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  approveBtn: { flex: 1, backgroundColor: '#F1FAF5', paddingVertical: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#D0F5E0' },
  approveBtnText: { color: '#0B7A55', fontSize: 13, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  rejectBtn: { flex: 1, backgroundColor: '#FEE4E2', paddingVertical: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#FDA29B' },
  rejectBtnText: { color: '#D92D20', fontSize: 13, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, gap: 8 },
  modalTitle: { fontSize: 18.5, fontFamily: ibmPlexArabicFontFamily.bold, textAlign: 'center', marginBottom: 6 },
  label: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#344054', marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, backgroundColor: '#F8FAFC' },
  modalActions: { gap: 6, marginTop: 10 },
  saveSubmitBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveSubmitBtnText: { color: '#fff', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { paddingVertical: 8, alignItems: 'center' },
  cancelBtnText: { color: '#77839B', fontFamily: ibmPlexArabicFontFamily.semiBold, fontSize: 14 },
  ltrRow: { flexDirection: 'row' },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
});
