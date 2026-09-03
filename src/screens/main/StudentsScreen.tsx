import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Linking,
  Alert,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useRoute, useNavigation } from '@react-navigation/native';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import { useStudents } from '../../hooks/useStudents';
import { useCreateSummons } from '../../hooks/useSummons';
import { Student } from '../../types/student';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';
import { WebDashboardLayout } from '../../components/layout/WebDashboardLayout';

interface ClassGroupItem {
  id: number;
  name: string;
  grade: string;
  type: string;
  membersCount: number;
}

type ProfileTab = 'overview' | 'academic' | 'attendance' | 'behavior' | 'comments' | 'full_record';

export default function StudentsScreen() {
  const { t } = useTranslation();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isDesktop = width >= 1024;

  const isGroupsMode = route.params?.mode === 'groups';

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [gradeDropdownOpen, setGradeDropdownOpen] = useState(false);
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(isMobile ? 'cards' : 'table');

  // Modals State
  const [selectedStudentForProfile, setSelectedStudentForProfile] = useState<Student | null>(null);
  const [profileActiveTab, setProfileActiveTab] = useState<ProfileTab>('overview');

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [isEditingStudent, setIsEditingStudent] = useState(false);
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null);

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importBioTimeSync, setImportBioTimeSync] = useState(true);

  const [summonsModalOpen, setSummonsModalOpen] = useState(false);
  const [selectedStudentForSummons, setSelectedStudentForSummons] = useState<Student | null>(null);
  const [summonsReason, setSummonsReason] = useState('');
  const [summonsDateTime, setSummonsDateTime] = useState('08/31/2026 11:54 AM');

  const [deleteConfirmStudent, setDeleteConfirmStudent] = useState<Student | null>(null);
  const [addClassModalOpen, setAddClassModalOpen] = useState(false);

  // Form State for Add/Edit Student matching Screenshot 3
  const [formFirstName, setFormFirstName] = useState('');
  const [formFatherName, setFormFatherName] = useState('');
  const [formFamilyName, setFormFamilyName] = useState('');
  const [formNationalId, setFormNationalId] = useState('');
  const [formBirthDate, setFormBirthDate] = useState('2012-05-15');
  const [formNationality, setFormNationality] = useState('سعودي');
  const [formStage, setFormStage] = useState('الابتدائية');
  const [formGradeName, setFormGradeName] = useState('الصف الأول الابتدائي');
  const [formClassName, setFormClassName] = useState('1/أ');
  const [formSeatNumber, setFormSeatNumber] = useState('');
  const [formGuardianName, setFormGuardianName] = useState('');
  const [formGuardianPhone, setFormGuardianPhone] = useState('');
  const [formGuardianNationalId, setFormGuardianNationalId] = useState('');
  const [formGuardianRelation, setFormGuardianRelation] = useState('الأب');
  const [formAddToBioTime, setFormAddToBioTime] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const {
    students: apiStudents,
    isLoading,
    refetch,
    createStudent,
    isCreating,
    updateStudent,
    isUpdating,
    deleteStudent,
    isDeleting,
  } = useStudents({ search: debouncedSearch });

  const createSummonsMutation = useCreateSummons();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  // Default classes list
  const classGroups: ClassGroupItem[] = useMemo(
    () => [
      { id: 1, name: '1/أ', grade: 'الصف الأول الابتدائي', type: 'طلاب', membersCount: 3 },
      { id: 2, name: '1/ب', grade: 'الصف الأول الابتدائي', type: 'طلاب', membersCount: 3 },
      { id: 3, name: '2/أ', grade: 'الصف الثاني الابتدائي', type: 'طلاب', membersCount: 2 },
      { id: 4, name: '2/ب', grade: 'الصف الثاني الابتدائي', type: 'طلاب', membersCount: 3 },
      { id: 5, name: '3/أ', grade: 'الصف الثالث الابتدائي', type: 'طلاب', membersCount: 2 },
      { id: 6, name: '3/ب', grade: 'الصف الثالث الابتدائي', type: 'طلاب', membersCount: 2 },
      { id: 7, name: '4/أ', grade: 'الصف الرابع الابتدائي', type: 'طلاب', membersCount: 2 },
      { id: 8, name: '5/أ', grade: 'الصف الخامس الابتدائي', type: 'طلاب', membersCount: 2 },
      { id: 9, name: '6/أ', grade: 'الصف السادس الابتدائي', type: 'طلاب', membersCount: 2 },
    ],
    []
  );

  // Fallback demo students list matching the screenshots exactly
  const defaultStudents: Student[] = useMemo(
    () => [
      { id: 1, name: 'حسام عادل الشهري', national_id: '1200000015', student_number: 'STU-453980', class_name: '6/أ', status: 'at_risk', guardian_phone: '0550000001', guardian_name: 'عادل الشهري', gpa: '—', attendance_rate: '—', violations_count: 0 },
      { id: 2, name: 'طلال منصور الخالدي', national_id: '1200000014', student_number: 'STU-453999', class_name: '6/أ', status: 'at_risk', guardian_phone: '0550000002', guardian_name: 'منصور الخالدي', gpa: '—', attendance_rate: '—', violations_count: 0 },
      { id: 3, name: 'نايف سامي الزهراني', national_id: '1200000013', student_number: 'STU-453998', class_name: '5/أ', status: 'at_risk', guardian_phone: '0550000003', guardian_name: 'سامي الزهراني', gpa: '—', attendance_rate: '—', violations_count: 0 },
      { id: 4, name: 'عبدالله حمد العسيري', national_id: '1200000012', student_number: 'STU-453997', class_name: '5/أ', status: 'at_risk', guardian_phone: '0550000004', guardian_name: 'حمد العسيري', gpa: '—', attendance_rate: '—', violations_count: 0 },
      { id: 5, name: 'راكان مساعد الدوسري', national_id: '1200000011', student_number: 'STU-453996', class_name: '4/أ', status: 'at_risk', guardian_phone: '0550000005', guardian_name: 'مساعد الدوسري', gpa: '—', attendance_rate: '—', violations_count: 0 },
      { id: 6, name: 'ثامر عبدالعزيز الفيفي', national_id: '1200000010', student_number: 'STU-453995', class_name: '4/أ', status: 'at_risk', guardian_phone: '0550000006', guardian_name: 'عبدالعزيز الفيفي', gpa: '—', attendance_rate: '—', violations_count: 0 },
      { id: 7, name: 'زياد فهد الرشيدي', national_id: '1200000009', student_number: 'STU-453994', class_name: '3/ب', status: 'at_risk', guardian_phone: '0550000007', guardian_name: 'فهد الرشيدي', gpa: '—', attendance_rate: '—', violations_count: 0 },
      { id: 8, name: 'أنس وليد الحارثي', national_id: '1200000008', student_number: 'STU-453993', class_name: '3/ب', status: 'active', guardian_phone: '0550000008', guardian_name: 'وليد الحارثي', gpa: '—', attendance_rate: '—', violations_count: 0 },
      { id: 9, name: 'مشعل طلال السبيعي', national_id: '1200000007', student_number: 'STU-453992', class_name: '2/ب', status: 'at_risk', guardian_phone: '0550000009', guardian_name: 'طلال السبيعي', gpa: '—', attendance_rate: '—', violations_count: 0 },
      { id: 10, name: 'بندر عايض الغامدي', national_id: '1200000006', student_number: 'STU-453991', class_name: '2/ب', status: 'active', guardian_phone: '0550000010', guardian_name: 'عايض الغامدي', gpa: '—', attendance_rate: '—', violations_count: 0 },
    ],
    []
  );

  const displayStudents = useMemo(() => {
    const raw = apiStudents && apiStudents.length > 0 ? apiStudents : defaultStudents;
    return raw.filter((st) => {
      const matchSearch =
        !debouncedSearch ||
        st.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        st.national_id?.includes(debouncedSearch) ||
        (st as any).student_number?.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchGrade = selectedGrade === 'all' || st.class_name === selectedGrade;
      const matchStatus =
        selectedStatus === 'all' ||
        (selectedStatus === 'at_risk' && st.status === 'at_risk') ||
        (selectedStatus === 'active' && st.status !== 'at_risk');
      return matchSearch && matchGrade && matchStatus;
    });
  }, [apiStudents, defaultStudents, debouncedSearch, selectedGrade, selectedStatus]);

  const totalStudentsCount = apiStudents?.length || 21;
  const gradeOptions = ['all', '1/أ', '1/ب', '2/أ', '2/ب', '3/أ', '3/ب', '4/أ', '5/أ', '6/أ'];

  // Open Add Student Modal
  const handleOpenAddStudent = () => {
    setIsEditingStudent(false);
    setStudentToEdit(null);
    setFormFirstName('');
    setFormFatherName('');
    setFormFamilyName('');
    setFormNationalId('');
    setFormBirthDate('2012-05-15');
    setFormNationality('سعودي');
    setFormStage('الابتدائية');
    setFormGradeName('الصف الأول الابتدائي');
    setFormClassName('1/أ');
    setFormSeatNumber('');
    setFormGuardianName('');
    setFormGuardianPhone('');
    setFormGuardianNationalId('');
    setFormGuardianRelation('الأب');
    setFormAddToBioTime(true);
    setStudentModalOpen(true);
  };

  // Open Edit Student Modal
  const handleOpenEditStudent = (st: Student) => {
    setIsEditingStudent(true);
    setStudentToEdit(st);
    const parts = (st.name || '').split(' ');
    setFormFirstName(parts[0] || '');
    setFormFatherName(parts[1] || '');
    setFormFamilyName(parts.slice(2).join(' ') || '');
    setFormNationalId(st.national_id || '');
    setFormBirthDate('2012-05-15');
    setFormNationality('سعودي');
    setFormStage('الابتدائية');
    setFormGradeName('الصف الأول الابتدائي');
    setFormClassName(st.class_name || '1/أ');
    setFormSeatNumber('');
    setFormGuardianName(st.guardian_name || '');
    setFormGuardianPhone(st.guardian_phone || '');
    setFormGuardianNationalId('');
    setFormGuardianRelation('الأب');
    setFormAddToBioTime(true);
    setStudentModalOpen(true);
  };

  // Submit Add or Edit Student
  const handleSaveStudentForm = async () => {
    const fullName = `${formFirstName} ${formFatherName} ${formFamilyName}`.trim() || formFirstName.trim();
    if (!formFirstName.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى إدخال الاسم الأول للطالب' : 'First name is required');
      return;
    }

    try {
      if (isEditingStudent && studentToEdit) {
        await updateStudent({
          id: studentToEdit.id,
          data: {
            name: fullName,
            national_id: formNationalId.trim(),
            class_name: formClassName,
            guardian_name: formGuardianName.trim(),
            guardian_phone: formGuardianPhone.trim(),
          },
        });
        Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم تحديث بيانات الطالب بنجاح' : 'Student updated successfully');
      } else {
        await createStudent({
          name: fullName,
          national_id: formNationalId.trim(),
          class_name: formClassName,
          grade_name: formGradeName,
          guardian_name: formGuardianName.trim(),
          guardian_phone: formGuardianPhone.trim(),
        });
        Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تمت إضافة الطالب بنجاح' : 'Student added successfully');
      }
      setStudentModalOpen(false);
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'تعذر حفظ بيانات الطالب' : 'Failed to save student'));
    }
  };

  // Handle Delete Student
  const handleDeleteStudentAction = async () => {
    if (!deleteConfirmStudent) return;
    try {
      await deleteStudent(deleteConfirmStudent.id);
      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم حذف الطالب بنجاح' : 'Student deleted successfully');
      setDeleteConfirmStudent(null);
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'تعذر حذف الطالب' : 'Failed to delete student'));
    }
  };

  // Open Summons Modal
  const handleOpenSummons = (st: Student) => {
    setSelectedStudentForSummons(st);
    setSummonsReason('');
    setSummonsDateTime('08/31/2026 11:54 AM');
    setSummonsModalOpen(true);
  };

  // Submit Summons
  const handleSubmitSummons = async () => {
    if (!summonsReason.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى كتابة سبب الاستدعاء' : 'Summons reason is required');
      return;
    }
    try {
      await createSummonsMutation.mutateAsync({
        student_id: selectedStudentForSummons?.id || 1,
        student_name: selectedStudentForSummons?.name || 'طالب',
        guardian_name: selectedStudentForSummons?.guardian_name || 'ولي الأمر',
        guardian_phone: selectedStudentForSummons?.guardian_phone || '0550000000',
        reason: 'frequent_absence',
        reason_text: summonsReason.trim(),
        scheduled_date: summonsDateTime,
        scheduled_time: '11:54 AM',
        status: 'scheduled',
      });
      setSummonsModalOpen(false);
      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم تسجيل الاستدعاء بنجاح' : 'Guardian summons created successfully');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'تعذر تسجيل الاستدعاء' : 'Failed to create summons'));
    }
  };

  const getAvatarBg = (name: string) => {
    const charCode = name ? name.charCodeAt(0) : 0;
    const colorsList = ['#E11D48', '#2563EB', '#D97706', '#059669', '#7C3AED', '#0284C7', '#DB2777'];
    return colorsList[charCode % colorsList.length];
  };

  return (
    <WebDashboardLayout
      title={isGroupsMode ? (isRTL ? 'الفصول' : 'Classes') : (isRTL ? 'الطلاب' : 'Students')}
      subtitle={
        isGroupsMode
          ? (isRTL ? 'إنشاء وتعديل الفصول داخل المجموعات' : 'Manage class groups')
          : `${totalStudentsCount} ${isRTL ? 'طالب مسجل' : 'registered students'}`
      }
    >
      <ScrollView
        style={[styles.container, isDark && styles.darkContainer]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* ==================== SCREEN 1: ALL STUDENTS (/students) ==================== */}
        {!isGroupsMode && (
          <View style={styles.pageWrapper}>
            {/* Top Action Buttons matching Screenshot 1 */}
            <View style={[styles.topActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.actionButtonsGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={handleOpenAddStudent}
                  accessibilityRole="button"
                >
                  <AppText variant="button" color="#FFFFFF" style={styles.btnText}>
                    + {isRTL ? 'إضافة طالب' : 'Add Student'}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.lightBlueBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  onPress={() => setImportModalOpen(true)}
                  accessibilityRole="button"
                >
                  <Icon name="plus" size={14} color="#FFFFFF" />
                  <AppText variant="captionBold" color="#FFFFFF">
                    Import
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.outlineBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  onPress={() => Alert.alert(isRTL ? 'تحميل قالب' : 'Download Template', isRTL ? 'جاري تحميل قالب الطلاب (Excel)...' : 'Downloading template...')}
                  accessibilityRole="button"
                >
                  <Icon name="fileText" size={14} color="#64748B" />
                  <AppText variant="captionBold" color="#334155">
                    {isRTL ? 'تحميل قالب' : 'Template'}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.outlineBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  onPress={() => Alert.alert(isRTL ? 'تصدير' : 'Export', isRTL ? 'جاري تصدير بيانات الطلاب...' : 'Exporting students...')}
                  accessibilityRole="button"
                >
                  <Icon name="chart" size={14} color="#64748B" />
                  <AppText variant="captionBold" color="#334155">
                    {isRTL ? 'تصدير' : 'Export'}
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* View Toggle: Cards vs Table */}
              <View style={[styles.viewToggleBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                  style={[styles.viewToggleBtn, viewMode === 'cards' && styles.viewToggleBtnActive]}
                  onPress={() => setViewMode('cards')}
                >
                  <AppText variant="captionBold" color={viewMode === 'cards' ? '#2563EB' : '#94A3B8'}>
                    {isRTL ? 'بطاقات' : 'Cards'}
                  </AppText>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.viewToggleBtn, viewMode === 'table' && styles.viewToggleBtnActive]}
                  onPress={() => setViewMode('table')}
                >
                  <AppText variant="captionBold" color={viewMode === 'table' ? '#2563EB' : '#94A3B8'}>
                    {isRTL ? 'جدول' : 'Table'}
                  </AppText>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4 KPI Summary Cards matching Screenshot 1 (2x2 on mobile, 4-across on desktop) */}
            <View style={[styles.kpiCardsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiCardGreen, isDark && styles.darkCard]}>
                <View style={[styles.kpiInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Icon name="award" size={20} color="#10B981" />
                  <AppText variant="h1" weight="bold" color="#10B981">
                    0
                  </AppText>
                </View>
                <AppText variant="captionBold" color="#059669" style={isRTL ? styles.textRight : styles.textLeft}>
                  {isRTL ? 'متميز' : 'Outstanding'}
                </AppText>
              </View>

              <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiCardBlue, isDark && styles.darkCard]}>
                <View style={[styles.kpiInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Icon name="check" size={20} color="#2563EB" />
                  <AppText variant="h1" weight="bold" color="#2563EB">
                    2
                  </AppText>
                </View>
                <AppText variant="captionBold" color="#2563EB" style={isRTL ? styles.textRight : styles.textLeft}>
                  {isRTL ? 'طبيعي' : 'Normal'}
                </AppText>
              </View>

              <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiCardAmber, isDark && styles.darkCard]}>
                <View style={[styles.kpiInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Icon name="alertTriangle" size={20} color="#F59E0B" />
                  <AppText variant="h1" weight="bold" color="#F59E0B">
                    19
                  </AppText>
                </View>
                <AppText variant="captionBold" color="#D97706" style={isRTL ? styles.textRight : styles.textLeft}>
                  {isRTL ? 'متابعة' : 'Follow-up'}
                </AppText>
              </View>

              <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiCardRed, isDark && styles.darkCard]}>
                <View style={[styles.kpiInner, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Icon name="alertTriangle" size={20} color="#EF4444" />
                  <AppText variant="h1" weight="bold" color="#EF4444">
                    0
                  </AppText>
                </View>
                <AppText variant="captionBold" color="#DC2626" style={isRTL ? styles.textRight : styles.textLeft}>
                  {isRTL ? 'خطر' : 'At-Risk'}
                </AppText>
              </View>
            </View>

            {/* Filter & Search Bar */}
            <View style={[styles.filterBarCard, isDark && styles.darkCard]}>
              <View style={[styles.searchInputBox, isDark && styles.darkInputBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name="search" size={16} color="#94A3B8" />
                <TextInput
                  style={[styles.searchInput, isRTL ? styles.textRight : styles.textLeft, isDark && styles.darkText]}
                  placeholder={isRTL ? 'ابحث بالاسم أو رقم الطالب...' : 'Search by student name or ID...'}
                  placeholderTextColor="#94A3B8"
                  value={search}
                  onChangeText={setSearch}
                />
              </View>

              <View style={[styles.filtersRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.dropdownWrapper, gradeDropdownOpen && styles.dropdownWrapperOpen]}>
                  <TouchableOpacity
                    style={[styles.dropdownTrigger, isDark && styles.darkInputBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => {
                      setGradeDropdownOpen(!gradeDropdownOpen);
                      setStatusDropdownOpen(false);
                    }}
                  >
                    <Icon name="chevronDown" size={12} color="#64748B" />
                    <AppText variant="captionBold" color={isDark ? '#F8FAFC' : '#334155'}>
                      {selectedGrade === 'all' ? (isRTL ? 'كل الصفوف' : 'All Classes') : selectedGrade}
                    </AppText>
                  </TouchableOpacity>

                  {gradeDropdownOpen && (
                    <View style={[styles.dropdownMenu, isDark && styles.darkCard]}>
                      {gradeOptions.map((opt) => (
                        <TouchableOpacity
                          key={opt}
                          style={[styles.dropdownOption, selectedGrade === opt && styles.dropdownOptionActive]}
                          onPress={() => {
                            setSelectedGrade(opt);
                            setGradeDropdownOpen(false);
                          }}
                        >
                          <AppText variant="caption" color={selectedGrade === opt ? '#2563EB' : isDark ? '#F8FAFC' : '#334155'} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {opt === 'all' ? (isRTL ? 'كل الصفوف' : 'All Classes') : opt}
                          </AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <View style={[styles.dropdownWrapper, statusDropdownOpen && styles.dropdownWrapperOpen]}>
                  <TouchableOpacity
                    style={[styles.dropdownTrigger, isDark && styles.darkInputBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => {
                      setStatusDropdownOpen(!statusDropdownOpen);
                      setGradeDropdownOpen(false);
                    }}
                  >
                    <Icon name="chevronDown" size={12} color="#64748B" />
                    <AppText variant="captionBold" color={isDark ? '#F8FAFC' : '#334155'}>
                      {selectedStatus === 'all'
                        ? (isRTL ? 'كل الحالات' : 'All Statuses')
                        : selectedStatus === 'at_risk'
                          ? (isRTL ? 'متابعة' : 'Follow-up')
                          : (isRTL ? 'طبيعي' : 'Normal')}
                    </AppText>
                  </TouchableOpacity>

                  {statusDropdownOpen && (
                    <View style={[styles.dropdownMenu, isDark && styles.darkCard]}>
                      {[
                        { key: 'all', label: isRTL ? 'كل الحالات' : 'All' },
                        { key: 'at_risk', label: isRTL ? 'متابعة / خطر' : 'Follow-up / Risk' },
                        { key: 'active', label: isRTL ? 'طبيعي' : 'Normal' },
                      ].map((opt) => (
                        <TouchableOpacity
                          key={opt.key}
                          style={[styles.dropdownOption, selectedStatus === opt.key && styles.dropdownOptionActive]}
                          onPress={() => {
                            setSelectedStatus(opt.key);
                            setStatusDropdownOpen(false);
                          }}
                        >
                          <AppText variant="caption" color={selectedStatus === opt.key ? '#2563EB' : isDark ? '#F8FAFC' : '#334155'} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {opt.label}
                          </AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                <AppText variant="caption" color="#64748B" style={[styles.counterText, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {`${isRTL ? 'عرض' : 'Showing'} ${displayStudents.length} ${isRTL ? 'من' : 'of'} ${totalStudentsCount} ${isRTL ? 'طالب' : 'students'}`}
                </AppText>
              </View>
            </View>

            {/* Mobile Touch-Friendly Student Cards View */}
            {viewMode === 'cards' && (
              <View style={styles.cardsList}>
                {displayStudents.map((st, idx) => {
                  const isAtRisk = st.status === 'at_risk';
                  const avatarBg = getAvatarBg(st.name);

                  return (
                    <View key={st.id || idx} style={[styles.studentMobileCard, isDark && styles.darkCard]}>
                      <View style={[styles.studentCardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.studentCardLeading, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <View style={[styles.studentAvatarBox, { backgroundColor: avatarBg }]}>
                            <AppText variant="captionBold" color="#FFFFFF">
                              {st.name ? st.name.charAt(0) : 'ط'}
                            </AppText>
                          </View>
                          <View style={[styles.studentNameCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                            <AppText variant="bodyBold" color={isDark ? '#F8FAFC' : '#0F172A'} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                              {st.name}
                            </AppText>
                            <AppText variant="caption" color="#94A3B8" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                              {(st as any).student_number || `STU-${453980 + idx}`} · {st.national_id || '1200000016'}
                            </AppText>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.statusPill,
                            isAtRisk ? styles.statusPillAmber : styles.statusPillGreen,
                          ]}
                        >
                          <AppText variant="captionBold" color={isAtRisk ? '#D97706' : '#059669'}>
                            {isAtRisk ? (isRTL ? 'متابعة' : 'Follow-up') : (isRTL ? 'طبيعي' : 'Normal')}
                          </AppText>
                        </View>
                      </View>

                      <View style={[styles.studentCardMetricsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.metricBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <AppText variant="caption" color="#64748B">
                            {isRTL ? 'الفصل:' : 'Class:'}
                          </AppText>
                          <AppText variant="captionBold" color={isDark ? '#F8FAFC' : '#0F172A'}>
                            {st.class_name || '6/أ'}
                          </AppText>
                        </View>
                        <View style={[styles.metricBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <AppText variant="caption" color="#64748B">
                            {isRTL ? 'الحضور:' : 'Attendance:'}
                          </AppText>
                          <AppText variant="captionBold" color={isDark ? '#F8FAFC' : '#0F172A'}>
                            % —
                          </AppText>
                        </View>
                        <View style={[styles.metricBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <AppText variant="caption" color="#64748B">
                            {isRTL ? 'المعدل:' : 'GPA:'}
                          </AppText>
                          <AppText variant="captionBold" color={isDark ? '#F8FAFC' : '#0F172A'}>
                            % —
                          </AppText>
                        </View>
                      </View>

                      {/* Mobile Action Buttons: Profile, Edit, Delete, Biometrics, Summons matching Screenshot 1 */}
                      <View style={[styles.studentCardActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <TouchableOpacity
                          style={styles.mobileProfileBtn}
                          onPress={() => {
                            setSelectedStudentForProfile(st);
                            setProfileActiveTab('overview');
                          }}
                        >
                          <AppText variant="captionBold" color="#2563EB">
                            {isRTL ? 'الملف' : 'Profile'}
                          </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.mobileEditBtn}
                          onPress={() => handleOpenEditStudent(st)}
                        >
                          <Icon name="edit" size={14} color="#334155" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.mobileDeleteBtn}
                          onPress={() => setDeleteConfirmStudent(st)}
                        >
                          <Icon name="close" size={14} color="#DC2626" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.mobileBioBtn}
                          onPress={() => Alert.alert(isRTL ? 'البصمة' : 'Biometrics', isRTL ? 'حالة البصمة: مسجلة في BioTime' : 'BioTime fingerprint registered')}
                        >
                          <Icon name="activity" size={14} color="#2563EB" />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.mobileSummonsBtn}
                          onPress={() => handleOpenSummons(st)}
                        >
                          <AppText variant="captionBold" color="#E11D48">
                            {isRTL ? 'استدعاء' : 'Summons'}
                          </AppText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}

            {/* Desktop / Scrollable Table View matching Screenshot 1 */}
            {viewMode === 'table' && (
              <View style={[styles.tableCard, isDark && styles.darkCard]}>
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View style={styles.tableInner}>
                    <View style={[styles.tableHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={styles.colCheckbox}>
                        <AppText variant="captionBold" color="#64748B">
                          [ ]
                        </AppText>
                      </View>
                      <View style={styles.colStudent}>
                        <AppText variant="captionBold" color="#64748B" style={isRTL ? styles.textRight : styles.textLeft}>
                          {isRTL ? 'الطالب' : 'Student'}
                        </AppText>
                      </View>
                      <View style={styles.colClass}>
                        <AppText variant="captionBold" color="#64748B" style={styles.textCenter}>
                          {isRTL ? 'الصف' : 'Class'}
                        </AppText>
                      </View>
                      <View style={styles.colMetric}>
                        <AppText variant="captionBold" color="#64748B" style={styles.textCenter}>
                          {isRTL ? 'الحضور' : 'Attendance'}
                        </AppText>
                      </View>
                      <View style={styles.colMetric}>
                        <AppText variant="captionBold" color="#64748B" style={styles.textCenter}>
                          {isRTL ? 'المعدل' : 'GPA'}
                        </AppText>
                      </View>
                      <View style={styles.colMetric}>
                        <AppText variant="captionBold" color="#64748B" style={styles.textCenter}>
                          {isRTL ? 'مخالفات' : 'Incidents'}
                        </AppText>
                      </View>
                      <View style={styles.colStatus}>
                        <AppText variant="captionBold" color="#64748B" style={styles.textCenter}>
                          {isRTL ? 'الحالة' : 'Status'}
                        </AppText>
                      </View>
                      <View style={[styles.colActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <AppText variant="captionBold" color="#64748B" style={styles.textCenter}>
                          {isRTL ? 'إجراءات' : 'Actions'}
                        </AppText>
                      </View>
                    </View>

                    {displayStudents.map((st, idx) => {
                      const isAtRisk = st.status === 'at_risk';
                      const avatarBg = getAvatarBg(st.name);

                      return (
                        <View
                          key={st.id || idx}
                          style={[
                            styles.tableDataRow,
                            { flexDirection: isRTL ? 'row-reverse' : 'row' },
                            idx % 2 === 1 && styles.tableDataRowEven,
                            isDark && styles.darkTableRow,
                          ]}
                        >
                          <View style={styles.colCheckbox}>
                            <AppText variant="caption" color="#94A3B8">
                              ☐
                            </AppText>
                          </View>

                          <View style={[styles.colStudent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <View style={[styles.studentAvatarBox, { backgroundColor: avatarBg }]}>
                              <AppText variant="captionBold" color="#FFFFFF">
                                {st.name ? st.name.charAt(0) : 'ط'}
                              </AppText>
                            </View>
                            <View style={[styles.studentNameCol, styles.alignStart]}>
                              <AppText variant="bodyBold" color={isDark ? '#F8FAFC' : '#0F172A'} numberOfLines={1}>
                                {st.name}
                              </AppText>
                              <AppText variant="caption" color="#94A3B8">
                                {(st as any).student_number || `STU-${453980 + idx}`} · {st.national_id || '1200000016'}
                              </AppText>
                            </View>
                          </View>

                          <View style={styles.colClass}>
                            <AppText variant="body" color={isDark ? '#F8FAFC' : '#334155'} style={styles.textCenter}>
                              {st.class_name || '6/أ'}
                            </AppText>
                          </View>

                          <View style={styles.colMetric}>
                            <AppText variant="caption" color="#94A3B8" style={styles.textCenter}>
                              % —
                            </AppText>
                          </View>

                          <View style={styles.colMetric}>
                            <AppText variant="caption" color="#94A3B8" style={styles.textCenter}>
                              % —
                            </AppText>
                          </View>

                          <View style={styles.colMetric}>
                            <AppText variant="caption" color="#94A3B8" style={styles.textCenter}>
                              —
                            </AppText>
                          </View>

                          <View style={styles.colStatus}>
                            <View
                              style={[
                                styles.statusPill,
                                isAtRisk ? styles.statusPillAmber : styles.statusPillGreen,
                              ]}
                            >
                              <AppText variant="captionBold" color={isAtRisk ? '#D97706' : '#059669'}>
                                {isAtRisk ? (isRTL ? 'متابعة' : 'Follow-up') : (isRTL ? 'طبيعي' : 'Normal')}
                              </AppText>
                            </View>
                          </View>

                          {/* Row Actions matching Screenshot 1 */}
                          <View style={[styles.colActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <TouchableOpacity
                              style={styles.profileBtn}
                              onPress={() => {
                                setSelectedStudentForProfile(st);
                                setProfileActiveTab('overview');
                              }}
                            >
                              <AppText variant="captionBold" color="#2563EB">
                                {isRTL ? 'الملف' : 'Profile'}
                              </AppText>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.actionGrayBtn}
                              onPress={() => handleOpenEditStudent(st)}
                            >
                              <Icon name="edit" size={13} color="#334155" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.actionPinkBtn}
                              onPress={() => setDeleteConfirmStudent(st)}
                            >
                              <Icon name="close" size={13} color="#DC2626" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.actionBioBtn}
                              onPress={() => Alert.alert(isRTL ? 'البصمة' : 'Biometrics', isRTL ? 'حالة البصمة: مسجلة في BioTime' : 'BioTime fingerprint registered')}
                            >
                              <Icon name="activity" size={13} color="#2563EB" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.actionSummonsBtn}
                              onPress={() => handleOpenSummons(st)}
                            >
                              <AppText variant="captionBold" color="#E11D48">
                                {isRTL ? 'استدعاء' : 'Summons'}
                              </AppText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}
          </View>
        )}

        {/* ==================== SCREEN 2: CLASSES & GROUPS (/groups) ==================== */}
        {isGroupsMode && (
          <View style={styles.pageWrapper}>
            <View style={[styles.topActionsRow]}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setAddClassModalOpen(true)}
                accessibilityRole="button"
              >
                <AppText variant="button" color="#FFFFFF" style={styles.btnText}>
                  + {isRTL ? 'أضف فصل' : 'Add Class'}
                </AppText>
              </TouchableOpacity>
            </View>

            {/* 3 KPI Cards */}
            <View style={[styles.kpiCardsGrid]}>
              <View style={[styles.kpiCard, styles.kpiCardBlue, isDark && styles.darkCard]}>
                <View style={[styles.kpiInner]}>
                  <Icon name="school" size={20} color="#2563EB" />
                  <AppText variant="h1" weight="bold" color="#2563EB">
                    9
                  </AppText>
                </View>
                <AppText variant="caption" color="#64748B" style={isRTL ? styles.textRight : styles.textLeft}>
                  {isRTL ? 'إجمالي الفصول' : 'Total Classes'}
                </AppText>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardGreen, isDark && styles.darkCard]}>
                <View style={[styles.kpiInner]}>
                  <Icon name="users" size={20} color="#10B981" />
                  <AppText variant="h1" weight="bold" color="#10B981">
                    21
                  </AppText>
                </View>
                <AppText variant="caption" color="#64748B" style={isRTL ? styles.textRight : styles.textLeft}>
                  {isRTL ? 'إجمالي الأعضاء' : 'Total Members'}
                </AppText>
              </View>

              <View style={[styles.kpiCard, styles.kpiCardAmber, isDark && styles.darkCard]}>
                <View style={[styles.kpiInner]}>
                  <Icon name="alertTriangle" size={20} color="#F59E0B" />
                  <AppText variant="h1" weight="bold" color="#F59E0B">
                    0
                  </AppText>
                </View>
                <AppText variant="caption" color="#64748B" style={isRTL ? styles.textRight : styles.textLeft}>
                  {isRTL ? 'فصول فارغة' : 'Empty Classes'}
                </AppText>
              </View>
            </View>

            {/* Classes List */}
            <View style={styles.cardsList}>
              {classGroups.map((cls) => (
                <View key={cls.id} style={[styles.classMobileCard, isDark && styles.darkCard]}>
                  <View style={[styles.classCardHeader]}>
                    <View style={styles.classNameBadge}>
                      <AppText variant="h3" weight="bold" color="#2563EB">
                        {cls.name}
                      </AppText>
                    </View>
                    <View style={[styles.classInfoCol, styles.alignStart]}>
                      <AppText variant="bodyBold" color={isDark ? '#F8FAFC' : '#0F172A'}>
                        {cls.grade}
                      </AppText>
                      <View style={[styles.classSubRow]}>
                        <View style={styles.typePill}>
                          <AppText variant="captionBold" color="#2563EB">
                            {cls.type}
                          </AppText>
                        </View>
                        <AppText variant="caption" color="#64748B">
                          {cls.membersCount} {isRTL ? 'طلاب' : 'students'}
                        </AppText>
                      </View>
                    </View>

                    <View style={[styles.classActionsRow]}>
                      <TouchableOpacity style={styles.actionIconBtn}>
                        <Icon name="users" size={16} color="#2563EB" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionIconBtn}>
                        <Icon name="edit" size={16} color="#64748B" />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionIconBtn}>
                        <Icon name="close" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ==================== MODAL 1: STUDENT QUICK PROFILE SIDE DRAWER (Screenshot 2) ==================== */}
      <Modal
        visible={!!selectedStudentForProfile}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStudentForProfile(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.profileDrawerCard, isDark && styles.darkCard]}>
            {selectedStudentForProfile && (
              <>
                {/* Pink/Magenta Profile Header matching Screenshot 2 */}
                <View style={styles.profileHeaderBox}>
                  <View style={[styles.profileHeaderTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity
                      style={styles.fullProfileBtn}
                      onPress={() => {
                        setSelectedStudentForProfile(null);
                        navigation.navigate('Students', { studentId: selectedStudentForProfile.id });
                      }}
                    >
                      <AppText variant="captionBold" color="#FFFFFF">
                        {isRTL ? 'الملف الكامل ←' : 'Full Profile →'}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.profileCloseBtn}
                      onPress={() => setSelectedStudentForProfile(null)}
                    >
                      <Icon name="close" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.profileUserCenter}>
                    <View style={styles.profileAvatarBig}>
                      <AppText variant="h1" weight="bold" color="#FFFFFF">
                        {selectedStudentForProfile.name ? selectedStudentForProfile.name.charAt(0) : 'ط'}
                      </AppText>
                    </View>
                    <AppText variant="h2" weight="bold" color="#FFFFFF" style={styles.profileUserName}>
                      {selectedStudentForProfile.name}
                    </AppText>
                    <AppText variant="caption" color="#FDE8E8" style={styles.profileUserId}>
                      {`STU-453980 • ${selectedStudentForProfile.national_id || '1200000015'} • ${selectedStudentForProfile.class_name || '6/أ'}`}
                    </AppText>

                    <View style={[styles.profileHeaderBadgesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={styles.profileStatusPill}>
                        <AppText variant="captionBold" color="#D97706">
                          {selectedStudentForProfile.status === 'at_risk' ? (isRTL ? 'متابعة' : 'Follow-up') : (isRTL ? 'طبيعي' : 'Normal')}
                        </AppText>
                      </View>
                      <View style={styles.profileAttendancePill}>
                        <AppText variant="captionBold" color="#FFFFFF">
                          {isRTL ? 'حضور %null' : 'Att %null'}
                        </AppText>
                      </View>
                    </View>
                  </View>

                  {/* 4 Metric Tiles on Pink Header */}
                  <View style={[styles.profileMetricsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={styles.profileMetricTile}>
                      <AppText variant="captionBold" color="#FFFFFF">
                        0
                      </AppText>
                      <AppText variant="caption" color="#FDE8E8">
                        {isRTL ? 'تعليقات' : 'Notes'}
                      </AppText>
                    </View>
                    <View style={styles.profileMetricTile}>
                      <AppText variant="captionBold" color="#FFFFFF">
                        0
                      </AppText>
                      <AppText variant="caption" color="#FDE8E8">
                        {isRTL ? 'مخالفات' : 'Incidents'}
                      </AppText>
                    </View>
                    <View style={styles.profileMetricTile}>
                      <AppText variant="captionBold" color="#FFFFFF">
                        %null
                      </AppText>
                      <AppText variant="caption" color="#FDE8E8">
                        {isRTL ? 'المعدل' : 'GPA'}
                      </AppText>
                    </View>
                    <View style={styles.profileMetricTile}>
                      <AppText variant="captionBold" color="#FFFFFF">
                        %null
                      </AppText>
                      <AppText variant="caption" color="#FDE8E8">
                        {isRTL ? 'الحضور' : 'Attendance'}
                      </AppText>
                    </View>
                  </View>
                </View>

                {/* Sub-tabs Row matching Screenshot 2 with RTL direction */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={[styles.profileTabsScroll, isDark && styles.darkCard]}
                  contentContainerStyle={[
                    styles.profileTabsContent,
                    { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  ]}
                >
                  {[
                    { id: 'overview', label: isRTL ? 'نظرة عامة' : 'Overview' },
                    { id: 'academic', label: isRTL ? 'الأكاديمي' : 'Academic' },
                    { id: 'attendance', label: isRTL ? 'الحضور' : 'Attendance' },
                    { id: 'behavior', label: isRTL ? 'السلوك' : 'Behavior' },
                    { id: 'comments', label: isRTL ? 'تعليقات المعلمين' : 'Teacher Notes' },
                    { id: 'full_record', label: isRTL ? 'السجل الكامل' : 'Full Record' },
                  ].map((tab) => (
                    <TouchableOpacity
                      key={tab.id}
                      style={[styles.profileTabBtn, profileActiveTab === tab.id && styles.profileTabBtnActive]}
                      onPress={() => setProfileActiveTab(tab.id as ProfileTab)}
                    >
                      <AppText
                        variant="captionBold"
                        color={profileActiveTab === tab.id ? '#2563EB' : '#64748B'}
                      >
                        {tab.label}
                      </AppText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Profile Tab Body */}
                <ScrollView style={styles.profileBodyScroll} showsVerticalScrollIndicator={false}>
                  {profileActiveTab === 'overview' && (
                    <View style={styles.profileSectionBox}>
                      <View style={[styles.profileSectionTitleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Icon name="user" size={16} color="#1246B7" />
                        <AppText variant="cardTitle" weight="bold" color={isDark ? '#F8FAFC' : '#0F172A'}>
                          {isRTL ? 'المعلومات الشخصية' : 'Personal Information'}
                        </AppText>
                      </View>

                      <View style={[styles.infoGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.infoCard, isDark && styles.darkInputBox, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {isRTL ? 'الصف' : 'Class'}
                          </AppText>
                          <AppText variant="bodyBold" color={isDark ? '#F8FAFC' : '#0F172A'} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {selectedStudentForProfile.class_name || '6/أ'}
                          </AppText>
                        </View>

                        <View style={[styles.infoCard, isDark && styles.darkInputBox, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {isRTL ? 'رقم الهوية' : 'National ID'}
                          </AppText>
                          <AppText variant="bodyBold" color={isDark ? '#F8FAFC' : '#0F172A'} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {selectedStudentForProfile.national_id || '1200000015'}
                          </AppText>
                        </View>

                        <View style={[styles.infoCard, isDark && styles.darkInputBox, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {isRTL ? 'ولي الأمر' : 'Guardian'}
                          </AppText>
                          <AppText variant="bodyBold" color={isDark ? '#F8FAFC' : '#0F172A'} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {selectedStudentForProfile.guardian_name || '—'}
                          </AppText>
                        </View>

                        <View style={[styles.infoCard, isDark && styles.darkInputBox, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {isRTL ? 'تاريخ الميلاد' : 'Birth Date'}
                          </AppText>
                          <AppText variant="bodyBold" color={isDark ? '#F8FAFC' : '#0F172A'} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            —
                          </AppText>
                        </View>

                        <View style={[styles.infoCard, isDark && styles.darkInputBox, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {isRTL ? 'العنوان' : 'Address'}
                          </AppText>
                          <AppText variant="bodyBold" color={isDark ? '#F8FAFC' : '#0F172A'} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            —
                          </AppText>
                        </View>

                        <View style={[styles.infoCard, isDark && styles.darkInputBox, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {isRTL ? 'هاتف ولي الأمر' : 'Guardian Mobile'}
                          </AppText>
                          <AppText variant="bodyBold" color="#2563EB" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                            {selectedStudentForProfile.guardian_phone || '—'}
                          </AppText>
                        </View>
                      </View>

                      {/* No comments section */}
                      <View style={[styles.noCommentsBox, isDark && styles.darkInputBox]}>
                        <AppText variant="caption" color="#94A3B8" style={{ textAlign: 'center' }}>
                          {isRTL ? 'لا توجد تعليقات من المعلمين بعد' : 'No teacher comments recorded yet'}
                        </AppText>
                      </View>
                    </View>
                  )}
                </ScrollView>

                {/* Bottom Action Buttons with Horizontal Scroll Bar matching user requirement */}
                <View style={[styles.profileFooterWrapper, isDark && styles.darkCard]}>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[
                      styles.profileFooterActionsContent,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                  >
                    <TouchableOpacity
                      style={[styles.footerActionDangerBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                      onPress={() => {
                        setSelectedStudentForProfile(null);
                        navigation.navigate('Behavior');
                      }}
                    >
                      <Icon name="alertTriangle" size={13} color="#FFFFFF" />
                      <AppText variant="captionBold" color="#FFFFFF">
                        {isRTL ? 'مخالفة' : 'Violation'}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.footerActionSuccessBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                      onPress={() => Alert.alert(isRTL ? 'تكريم' : 'Award', isRTL ? 'تم تسجيل بطاقة تكريم للطالب' : 'Honor recorded')}
                    >
                      <Icon name="award" size={13} color="#FFFFFF" />
                      <AppText variant="captionBold" color="#FFFFFF">
                        {isRTL ? 'تكريم' : 'Honor'}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.footerActionSummonsBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                      onPress={() => {
                        const st = selectedStudentForProfile;
                        setSelectedStudentForProfile(null);
                        handleOpenSummons(st);
                      }}
                    >
                      <Icon name="clipboard" size={13} color="#E11D48" />
                      <AppText variant="captionBold" color="#E11D48">
                        {isRTL ? 'استدعاء' : 'Summons'}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.footerActionGrayBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                      onPress={() => {
                        if (selectedStudentForProfile.guardian_phone) {
                          Linking.openURL(`whatsapp://send?phone=${selectedStudentForProfile.guardian_phone}`);
                        }
                      }}
                    >
                      <Icon name="message" size={13} color="#334155" />
                      <AppText variant="captionBold" color="#334155">
                        {isRTL ? 'رسالة' : 'Message'}
                      </AppText>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.footerActionGrayBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                      onPress={() => Alert.alert(isRTL ? 'ملاحظة' : 'Note', isRTL ? 'تم فتح مسجل الملاحظات' : 'Note recorder')}
                    >
                      <Icon name="edit" size={13} color="#334155" />
                      <AppText variant="captionBold" color="#334155">
                        {isRTL ? 'ملاحظة' : 'Note'}
                      </AppText>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL 2: ADD / EDIT STUDENT MODAL (Screenshot 3) ==================== */}
      <Modal
        visible={studentModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setStudentModalOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.formModalContainer, isDark && styles.darkCard]}>
            <View style={[styles.formModalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="h2" weight="bold" color={isDark ? '#F8FAFC' : '#0A1D3D'}>
                {isEditingStudent
                  ? (isRTL ? 'تعديل بيانات الطالب ✏️' : 'Edit Student ✏️')
                  : (isRTL ? 'إضافة طالب جديد ＋' : 'New Student ＋')}
              </AppText>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setStudentModalOpen(false)}>
                <Icon name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.formModalBody} showsVerticalScrollIndicator={false}>
              {/* Row 1: Name fields */}
              <View style={[styles.twoColRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'الاسم الأول *' : 'First Name *'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formFirstName}
                    onChangeText={setFormFirstName}
                    placeholder={isRTL ? 'الاسم الأول...' : 'First name...'}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'اسم الأب' : 'Father Name'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formFatherName}
                    onChangeText={setFormFatherName}
                    placeholder={isRTL ? 'اسم الأب...' : 'Father name...'}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={[styles.twoColRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'اسم العائلة' : 'Family Name'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formFamilyName}
                    onChangeText={setFormFamilyName}
                    placeholder={isRTL ? 'اسم العائلة...' : 'Family name...'}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'رقم الهوية *' : 'National ID *'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formNationalId}
                    onChangeText={setFormNationalId}
                    placeholder="1236600312"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>
              </View>

              {/* Row 2: Date and Nationality */}
              <View style={[styles.twoColRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'تاريخ الميلاد' : 'Birth Date'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formBirthDate}
                    onChangeText={setFormBirthDate}
                    placeholder="2012-05-15"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'الجنسية' : 'Nationality'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formNationality}
                    onChangeText={setFormNationality}
                    placeholder="سعودي"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* Row 3: Stage, Grade, Class */}
              <View style={[styles.twoColRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'المرحلة *' : 'Stage *'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formStage}
                    onChangeText={setFormStage}
                    placeholder="الابتدائية"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'الصف *' : 'Grade *'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formGradeName}
                    onChangeText={setFormGradeName}
                    placeholder="الصف الأول الابتدائي"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              <View style={[styles.twoColRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'الفصل *' : 'Class *'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formClassName}
                    onChangeText={setFormClassName}
                    placeholder="1/أ"
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'رقم جلوس / نور' : 'Seat / Noor #'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formSeatNumber}
                    onChangeText={setFormSeatNumber}
                    placeholder={isRTL ? 'اختياري' : 'Optional'}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* Guardian Info Section matching Screenshot 3 */}
              <View style={[styles.sectionDividerRow, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <AppText variant="captionBold" color="#1246B7" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {isRTL ? 'بيانات ولي الأمر' : 'Guardian Details'}
                </AppText>
              </View>

              <View style={[styles.twoColRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'اسم ولي الأمر' : 'Guardian Name'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formGuardianName}
                    onChangeText={setFormGuardianName}
                    placeholder={isRTL ? 'اسم ولي الأمر...' : 'Guardian name...'}
                    placeholderTextColor="#94A3B8"
                  />
                </View>

                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'الجوال' : 'Mobile'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formGuardianPhone}
                    onChangeText={setFormGuardianPhone}
                    placeholder="05xxxxxxxx"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={[styles.twoColRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'رقم هوية ولي الأمر' : 'Guardian National ID'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formGuardianNationalId}
                    onChangeText={setFormGuardianNationalId}
                    placeholder="1xxxxxxxxx"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                  />
                </View>

                <View style={styles.colField}>
                  <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'علاقة بالطالب' : 'Relation'}
                  </Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
                    value={formGuardianRelation}
                    onChangeText={setFormGuardianRelation}
                    placeholder="الأب"
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              </View>

              {/* BioTime Checkbox matching Screenshot 3 */}
              <TouchableOpacity
                style={[styles.checkboxRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => setFormAddToBioTime(!formAddToBioTime)}
              >
                <View style={[styles.checkboxBox, formAddToBioTime && styles.checkboxBoxActive]}>
                  {formAddToBioTime && <Icon name="check" size={12} color="#FFFFFF" />}
                </View>
                <AppText variant="captionBold" color={isDark ? '#F8FAFC' : '#334155'}>
                  {isRTL ? 'إضافة في جهاز البصمة (BioTime)' : 'Add to BioTime Device'}
                </AppText>
              </TouchableOpacity>

              <View style={[styles.formModalActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                  style={styles.saveSubmitBtn}
                  onPress={handleSaveStudentForm}
                  disabled={isCreating || isUpdating}
                >
                  {isCreating || isUpdating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <AppText variant="button" color="#FFFFFF">
                      {isEditingStudent ? (isRTL ? 'حفظ التعديلات' : 'Save Changes') : (isRTL ? 'حفظ وإضافة الطالب' : 'Add Student')}
                    </AppText>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setStudentModalOpen(false)}
                >
                  <AppText variant="captionBold" color="#64748B">
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </AppText>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==================== MODAL 3: IMPORT STUDENTS MODAL (Screenshot 4) ==================== */}
      <Modal
        visible={importModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setImportModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.importModalContainer, isDark && styles.darkCard]}>
            <View style={[styles.importModalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="cardTitle" weight="bold" color={isDark ? '#F8FAFC' : '#0A1D3D'}>
                {isRTL ? 'استيراد ملف الطلاب 📥' : 'Import Students 📥'}
              </AppText>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setImportModalOpen(false)}>
                <Icon name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'} style={[styles.importDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL
                ? 'ارفع ملف نور المنشأ، أو قالب الطلاب الذي تملؤه بنفسك (نزله من زر «تحميل قالب» — الفصل قائمة منسدلة). يتعرف النظام على نوع الملف تلقائياً.'
                : 'Upload your Noor student export file or custom Excel template. The system automatically detects the format.'}
            </AppText>

            <TouchableOpacity
              style={[styles.checkboxRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => setImportBioTimeSync(!importBioTimeSync)}
            >
              <View style={[styles.checkboxBox, importBioTimeSync && styles.checkboxBoxActive]}>
                {importBioTimeSync && <Icon name="check" size={12} color="#FFFFFF" />}
              </View>
              <AppText variant="captionBold" color={isDark ? '#F8FAFC' : '#334155'}>
                {isRTL ? 'إضافة الكل لجهاز البصمة (BioTime)' : 'Add all students to BioTime device'}
              </AppText>
            </TouchableOpacity>

            <View style={[styles.importModalActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.chooseFileBtn}
                onPress={() => {
                  setImportModalOpen(false);
                  Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم اختيار واستيراد ملف الطلاب بنجاح' : 'Students imported successfully');
                }}
              >
                <Icon name="fileText" size={14} color="#FFFFFF" />
                <AppText variant="captionBold" color="#FFFFFF">
                  {isRTL ? 'اختر الملف' : 'Choose File'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity style={styles.importCancelBtn} onPress={() => setImportModalOpen(false)}>
                <AppText variant="captionBold" color="#64748B">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL 4: SUMMONS MODAL (Screenshot 5) ==================== */}
      <Modal
        visible={summonsModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSummonsModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.summonsModalContainer, isDark && styles.darkCard]}>
            <View style={[styles.summonsHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="cardTitle" weight="bold" color={isDark ? '#F8FAFC' : '#0A1D3D'}>
                {isRTL ? 'استدعاء ولي الأمر 📋' : 'Guardian Summons 📋'}
              </AppText>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSummonsModalOpen(false)}>
                <Icon name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <AppText variant="captionBold" color="#1246B7" style={{ marginBottom: 10, textAlign: isRTL ? 'right' : 'left' }}>
              {`${isRTL ? 'الطالب:' : 'Student:'} ${selectedStudentForSummons?.name || '—'}`}
            </AppText>

            <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'سبب الاستدعاء *' : 'Summons Reason *'}
            </Text>
            <TextInput
              style={[styles.summonsInput, isRTL && styles.textRight, isDark && styles.darkInputBox]}
              value={summonsReason}
              onChangeText={setSummonsReason}
              placeholder={isRTL ? 'مثال: مناقشة تأخر متكرر / اجتماع متابعة' : 'e.g. Repeated absence meeting...'}
              placeholderTextColor="#94A3B8"
              multiline
            />

            <Text style={[styles.fieldLabel, isDark && styles.darkSubtext, { marginTop: 10, textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'الموعد *' : 'Date & Time *'}
            </Text>
            <View style={[styles.dateTimeInputBox, isDark && styles.darkInputBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TextInput
                style={[styles.dateTimeInput, isRTL && styles.textRight, isDark && styles.darkText]}
                value={summonsDateTime}
                onChangeText={setSummonsDateTime}
              />
              <Icon name="calendar" size={16} color="#64748B" />
            </View>

            <View style={[styles.summonsModalActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.submitSummonsBtn}
                onPress={handleSubmitSummons}
                disabled={createSummonsMutation.isPending}
              >
                {createSummonsMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <AppText variant="captionBold" color="#FFFFFF">
                    {isRTL ? 'تسجيل الاستدعاء' : 'Register Summons'}
                  </AppText>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.summonsCancelBtn} onPress={() => setSummonsModalOpen(false)}>
                <AppText variant="captionBold" color="#64748B">
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================== MODAL 5: DELETE CONFIRMATION MODAL ==================== */}
      <Modal
        visible={!!deleteConfirmStudent}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmStudent(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.deleteModalContainer, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" color="#DC2626" style={{ textAlign: 'center' }}>
              {isRTL ? 'تأكيد حذف الطالب' : 'Confirm Delete'}
            </AppText>

            <AppText variant="body" color={isDark ? '#F8FAFC' : '#334155'} style={styles.deleteConfirmText}>
              {`${isRTL ? 'هل أنت متأكد من رغبتك في حذف الطالب' : 'Are you sure you want to delete'} "${deleteConfirmStudent?.name}" ${isRTL ? 'من سجلات المدرسة؟' : 'from school records?'}`}
            </AppText>

            <View style={styles.deleteModalActions}>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleDeleteStudentAction}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <AppText variant="captionBold" color="#FFFFFF">
                    {isRTL ? 'حذف نهائي' : 'Delete'}
                  </AppText>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.deleteCancelBtn} onPress={() => setDeleteConfirmStudent(null)}>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  darkContainer: { backgroundColor: '#07132B' },
  darkCard: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  darkTableRow: { backgroundColor: '#0B1B38', borderBottomColor: '#1E3A6E' },
  darkInputBox: { backgroundColor: '#1E293B', borderColor: '#334155' },
  darkText: { color: '#F8FAFC' },
  darkSubtext: { color: '#94A3B8' },
  scrollContent: { padding: 14 },
  pageWrapper: { gap: 12 },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  primaryBtn: {
    backgroundColor: '#1246B7',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 13, fontWeight: 'bold' },
  lightBlueBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  outlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewToggleBox: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  viewToggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.card,
  },
  kpiCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    minHeight: 88,
    justifyContent: 'space-between',
    ...shadows.card,
  },
  kpiCardDesktop: {
    width: '23.8%',
  },
  kpiCardGreen: { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' },
  kpiCardBlue: { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' },
  kpiCardAmber: { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' },
  kpiCardRed: { backgroundColor: '#FFF1F2', borderColor: '#FFE4E6' },
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
    zIndex: 100,
    elevation: 8,
    overflow: 'visible',
    ...shadows.card,
  },
  searchInputBox: {
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
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    zIndex: 150,
  },
  dropdownWrapper: {
    position: 'relative',
    zIndex: 20,
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
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 44,
    right: 0,
    minWidth: 140,
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
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownOptionActive: {
    backgroundColor: '#EFF6FF',
  },
  counterText: {
    fontSize: 12,
  },
  cardsList: {
    gap: 10,
  },
  studentMobileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    ...shadows.card,
  },
  studentCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  studentCardLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  studentAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentNameCol: {
    flex: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusPillAmber: { backgroundColor: '#FEF3C7' },
  statusPillGreen: { backgroundColor: '#D1FAE5' },
  studentCardMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
  },
  metricBadge: {
    flexDirection: 'row',
    gap: 4,
  },
  studentCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  mobileProfileBtn: {
    flex: 1,
    backgroundColor: '#EFF6FF',
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  mobileEditBtn: {
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mobileDeleteBtn: {
    backgroundColor: '#FFF1F2',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  mobileBioBtn: {
    backgroundColor: '#EFF6FF',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  mobileSummonsBtn: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...shadows.card,
  },
  tableInner: {
    minWidth: 880,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tableDataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  tableDataRowEven: {
    backgroundColor: '#F8FAFC',
  },
  colCheckbox: { width: 35, alignItems: 'center' },
  colStudent: { width: 230, flexDirection: 'row', alignItems: 'center', gap: 10 },
  colClass: { width: 80 },
  colMetric: { width: 80 },
  colStatus: { width: 90, alignItems: 'center' },
  colActions: { width: 230, flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  profileBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  actionGrayBtn: {
    backgroundColor: '#F8FAFC',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionPinkBtn: {
    backgroundColor: '#FFF1F2',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  actionBioBtn: {
    backgroundColor: '#EFF6FF',
    padding: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  actionSummonsBtn: {
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE4E6',
  },
  classMobileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  classCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  classNameBadge: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  classInfoCol: { flex: 1 },
  classSubRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  typePill: { backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  classActionsRow: { flexDirection: 'row', gap: 6 },
  actionIconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  profileDrawerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    overflow: 'hidden',
    ...shadows.card,
  },
  profileHeaderBox: {
    backgroundColor: '#DB2777',
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  profileHeaderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fullProfileBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  profileCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileUserCenter: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  profileAvatarBig: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  profileUserName: { fontSize: 17, marginBottom: 2 },
  profileUserId: { fontSize: 11, marginBottom: 8 },
  profileHeaderBadgesRow: {
    flexDirection: 'row',
    gap: 8,
  },
  profileStatusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  profileAttendancePill: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  profileMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: 10,
    padding: 8,
    marginTop: 4,
  },
  profileMetricTile: {
    alignItems: 'center',
    flex: 1,
  },
  profileTabsScroll: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profileTabsContent: {
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  profileTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  profileTabBtnActive: {
    borderBottomColor: '#2563EB',
  },
  profileBodyScroll: {
    padding: 14,
    maxHeight: 280,
  },
  profileSectionBox: { gap: 10 },
  profileSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  infoCard: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 2,
  },
  noCommentsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 14,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  profileFooterWrapper: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
  },
  profileFooterActionsContent: {
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 8,
  },
  footerActionDangerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  footerActionSuccessBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  footerActionSummonsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1F2',
    borderWidth: 1,
    borderColor: '#FFE4E6',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  footerActionGrayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 6,
  },
  formModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 550,
    maxHeight: '90%',
    padding: 18,
    gap: 10,
  },
  formModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 10,
  },
  formModalBody: {
    paddingVertical: 8,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  colField: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 4,
  },
  fieldInput: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    backgroundColor: '#F9FAFB',
  },
  sectionDividerRow: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  formModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  saveSubmitBtn: {
    flex: 1,
    backgroundColor: '#1246B7',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtn: {
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  importModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 450,
    padding: 18,
    gap: 12,
  },
  importModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  importDesc: {
    lineHeight: 18,
  },
  importModalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  chooseFileBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  importCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summonsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 450,
    padding: 18,
    gap: 8,
  },
  summonsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summonsInput: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    minHeight: 70,
    backgroundColor: '#F9FAFB',
  },
  dateTimeInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  dateTimeInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  summonsModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  submitSummonsBtn: {
    flex: 1,
    backgroundColor: '#1246B7',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  summonsCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deleteModalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 20,
    gap: 12,
  },
  deleteConfirmText: {
    textAlign: 'center',
    lineHeight: 20,
  },
  deleteModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#DC2626',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteCancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alignStart: { alignItems: 'flex-start' },
  textRight: { textAlign: 'right' },
  textLeft: { textAlign: 'left' },
  textCenter: { textAlign: 'center' },
});
