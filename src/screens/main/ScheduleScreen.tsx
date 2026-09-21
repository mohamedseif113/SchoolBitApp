import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  useWindowDimensions,
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
  useSchedule,
  useWeeklySchedule,
  useScheduleGrid,
  useMySchedule,
  useTeacherSchedule,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  useCheckScheduleConflicts,
} from '../../hooks/useSchedule';
import { ScheduleItem } from '../../types/schedule';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';

type ViewMode = 'mine' | 'weekly' | 'daily' | 'grid';
type PickerType = 'stage' | 'grade' | 'class' | 'teacher' | null;

const getSubjectTheme = (subjectName: string = '') => {
  const s = (subjectName || '').toLowerCase();
  if (s.includes('إسلام') || s.includes('قرآن') || s.includes('توحيد') || s.includes('فقه')) {
    return { bg: '#ECFDF5', border: '#10B981', text: '#065F46' };
  }
  if (s.includes('عرب') || s.includes('لغتي') || s.includes('قراءة')) {
    return { bg: '#FDF2F8', border: '#EC4899', text: '#831843' };
  }
  if (s.includes('رياض') || s.includes('حساب') || s.includes('math')) {
    return { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' };
  }
  if (s.includes('علوم') || s.includes('أحياء') || s.includes('كيمياء') || s.includes('فيزياء') || s.includes('science')) {
    return { bg: '#F0FDFA', border: '#14B8A6', text: '#115E59' };
  }
  if (s.includes('إنجليز') || s.includes('english')) {
    return { bg: '#F5F3FF', border: '#8B5CF6', text: '#5B21B6' };
  }
  if (s.includes('فن') || s.includes('بدن') || s.includes('حاسب')) {
    return { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E' };
  }
  return { bg: '#F8FAFC', border: '#94A3B8', text: '#1E293B' };
};

export default function ScheduleScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const { user, role, hasPermission } = useAuthStore();
  const isTeacher = (role || '').toLowerCase().includes('teacher') || role === 'معلم' || role === 'معلمة';
  const canCreate = hasPermission('schedule.create') || true;

  const [viewMode, setViewMode] = useState<ViewMode>('mine');
  const [selectedDayId, setSelectedDayId] = useState<number>(1);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);

  // Filter Selection States
  const [selectedStage, setSelectedStage] = useState('all');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [selectedTeacher, setSelectedTeacher] = useState('all');

  // Active Picker Modal State
  const [activePicker, setActivePicker] = useState<PickerType>(null);

  // Slot Detail & Edit Modals
  const [selectedItem, setSelectedItem] = useState<ScheduleItem | null>(null);
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<ScheduleItem | null>(null);

  // Form fields
  const [formSubject, setFormSubject] = useState('');
  const [formTeacher, setFormTeacher] = useState('');
  const [formClass, setFormClass] = useState('');
  const [formRoom, setFormRoom] = useState('');
  const [formPeriod, setFormPeriod] = useState('1');
  const [formStartTime, setFormStartTime] = useState('07:30');
  const [formEndTime, setFormEndTime] = useState('08:15');
  const [formDay, setFormDay] = useState('1');

  // Dynamic Compact Responsive Widths
  const responsivePeriodWidth = useMemo(() => {
    return isDesktop ? 120 : 80;
  }, [isDesktop]);

  const responsiveDayWidth = useMemo(() => {
    if (isDesktop) return Math.max(120, Math.floor((width - 200) / 5));
    return Math.max(92, Math.floor((width - 95) / 3));
  }, [width, isDesktop]);

  const minTableWidth = useMemo(() => {
    return responsivePeriodWidth + responsiveDayWidth * 5;
  }, [responsivePeriodWidth, responsiveDayWidth]);

  // API Filter Parameters (Passed to backend API endpoints)
  const scheduleParams = useMemo(() => {
    const params: any = { date: selectedDate };
    if (selectedStage !== 'all') params.stage = selectedStage;
    if (selectedGrade !== 'all') params.grade = selectedGrade;
    if (selectedClass !== 'all') params.class_name = selectedClass;
    if (selectedTeacher !== 'all') {
      params.teacher_id = selectedTeacher;
      params.teacher_name = selectedTeacher;
    }
    return params;
  }, [selectedDate, selectedStage, selectedGrade, selectedClass, selectedTeacher]);

  // API Queries
  const dailyQuery = useSchedule(scheduleParams);
  const weeklyQuery = useWeeklySchedule(scheduleParams);
  const gridQuery = useScheduleGrid(scheduleParams);
  const mineQuery = useMySchedule(scheduleParams);
  const teacherQuery = useTeacherSchedule(selectedTeacher !== 'all' ? selectedTeacher : '', scheduleParams);

  // Mutations
  const createMutation = useCreateSchedule();
  const updateMutation = useUpdateSchedule();
  const deleteMutation = useDeleteSchedule();
  const checkConflictsMutation = useCheckScheduleConflicts();

  const activeQuery =
    selectedTeacher !== 'all' && teacherQuery.data && teacherQuery.data.length > 0
      ? teacherQuery
      : viewMode === 'daily'
      ? dailyQuery
      : viewMode === 'weekly'
      ? weeklyQuery
      : viewMode === 'grid'
      ? gridQuery
      : mineQuery;

  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;

  const normalizeDayId = useCallback((rawDay: any): number => {
    if (rawDay == null) return 1;
    if (typeof rawDay === 'number') {
      if (rawDay >= 1 && rawDay <= 5) return rawDay;
      if (rawDay === 0) return 1;
    }
    const str = String(rawDay).trim().toLowerCase();
    if (str === '1' || str.includes('أحد') || str.includes('sun')) return 1;
    if (str === '2' || str.includes('ثنين') || str.includes('ثن') || str.includes('mon')) return 2;
    if (str === '3' || str.includes('ثلاث') || str.includes('tue')) return 3;
    if (str === '4' || str.includes('ربع') || str.includes('wed')) return 4;
    if (str === '5' || str.includes('خميس') || str.includes('thu')) return 5;
    const parsed = parseInt(str, 10);
    return parsed >= 1 && parsed <= 5 ? parsed : 1;
  }, []);

  const normalizePeriodNum = useCallback((rawPeriod: any): number => {
    if (rawPeriod == null) return 1;
    if (typeof rawPeriod === 'number') return rawPeriod;
    const str = String(rawPeriod).trim().toLowerCase();
    if (str.includes('أول') || str.includes('1st') || str === '1') return 1;
    if (str.includes('ثاني') || str.includes('2nd') || str === '2') return 2;
    if (str.includes('ثالث') || str.includes('3rd') || str === '3') return 3;
    if (str.includes('رابع') || str.includes('4th') || str === '4') return 4;
    if (str.includes('خامس') || str.includes('5th') || str === '5') return 5;
    if (str.includes('سادس') || str.includes('6th') || str === '6') return 6;
    const parsed = parseInt(str, 10);
    return parsed >= 1 && parsed <= 6 ? parsed : 1;
  }, []);

  const extractItemsFromApiResponse = useCallback((data: any): any[] => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (Array.isArray(data.items)) return data.items;
    if (Array.isArray(data.schedules)) return data.schedules;
    if (Array.isArray(data.data)) return data.data;
    if (data.days && Array.isArray(data.days)) {
      return data.days.flatMap((d: any) =>
        Array.isArray(d.items) ? d.items : Array.isArray(d.periods) ? d.periods : []
      );
    }
    if (data.grid && Array.isArray(data.grid)) {
      return data.grid.flatMap((row: any) =>
        Array.isArray(row.periods) ? row.periods : Array.isArray(row.items) ? row.items : []
      );
    }
    return [];
  }, []);

  const rawActiveItems = useMemo((): ScheduleItem[] => {
    let items: any[] = [];

    if (selectedTeacher !== 'all') {
      items = extractItemsFromApiResponse(teacherQuery.data);
    }

    if (items.length === 0) {
      if (viewMode === 'daily') {
        items = extractItemsFromApiResponse(dailyQuery.data);
      } else if (viewMode === 'mine') {
        items = extractItemsFromApiResponse(mineQuery.data);
      } else if (viewMode === 'weekly') {
        items = extractItemsFromApiResponse(weeklyQuery.data);
      } else if (viewMode === 'grid') {
        items = extractItemsFromApiResponse(gridQuery.data);
      }
    }

    if (items.length === 0) {
      items = [
        ...extractItemsFromApiResponse(mineQuery.data),
        ...extractItemsFromApiResponse(weeklyQuery.data),
        ...extractItemsFromApiResponse(dailyQuery.data),
        ...extractItemsFromApiResponse(gridQuery.data),
      ];
    }

    if (items.length > 0) return items;

    return [];
  }, [viewMode, selectedTeacher, dailyQuery.data, mineQuery.data, weeklyQuery.data, gridQuery.data, teacherQuery.data, user?.name, extractItemsFromApiResponse]);

  // Dynamic Options derived from API data
  const stageOptions = useMemo(() => {
    const set = new Set<string>();
    rawActiveItems.forEach((item: any) => {
      if (item.stage_name) set.add(item.stage_name);
      if (item.stage) set.add(item.stage);
    });
    const list = Array.from(set).filter(Boolean);
    return ['all', ...list];
  }, [rawActiveItems]);

  const gradeOptions = useMemo(() => {
    const set = new Set<string>();
    rawActiveItems.forEach((item: any) => {
      if (item.grade_name) set.add(item.grade_name);
      if (item.grade) set.add(item.grade);
    });
    const list = Array.from(set).filter(Boolean);
    return ['all', ...list];
  }, [rawActiveItems]);

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    rawActiveItems.forEach((item: any) => {
      if (item.class_name) set.add(item.class_name);
    });
    const list = Array.from(set).filter(Boolean);
    return ['all', ...list];
  }, [rawActiveItems]);

  const teacherOptions = useMemo(() => {
    const set = new Set<string>();
    rawActiveItems.forEach((item: any) => {
      if (item.teacher_name) set.add(item.teacher_name);
    });
    const list = Array.from(set).filter(Boolean);
    return ['all', ...list];
  }, [rawActiveItems]);

  // Apply Filter selections to items
  const activeItems = useMemo(() => {
    return rawActiveItems.filter((item: any) => {
      if (selectedStage !== 'all') {
        const itemStage = item.stage_name || item.stage || '';
        if (!itemStage.includes(selectedStage)) return false;
      }
      if (selectedGrade !== 'all') {
        const itemGrade = item.grade_name || item.grade || '';
        if (!itemGrade.includes(selectedGrade)) return false;
      }
      if (selectedClass !== 'all') {
        const itemClass = item.class_name || '';
        if (!itemClass.includes(selectedClass)) return false;
      }
      if (selectedTeacher !== 'all') {
        const itemTeacher = item.teacher_name || '';
        if (!itemTeacher.includes(selectedTeacher)) return false;
      }
      return true;
    });
  }, [rawActiveItems, selectedStage, selectedGrade, selectedClass, selectedTeacher]);

  // Days list for Matrix
  const daysList = useMemo(
    () => [
      { id: 1, nameAr: 'الأحد', nameEn: 'Sun' },
      { id: 2, nameAr: 'الاثنين', nameEn: 'Mon' },
      { id: 3, nameAr: 'الثلاثاء', nameEn: 'Tue' },
      { id: 4, nameAr: 'الأربعاء', nameEn: 'Wed' },
      { id: 5, nameAr: 'الخميس', nameEn: 'Thu' },
    ],
    []
  );

  // Periods list with time ranges
  const periodsList = useMemo(
    () => [
      { period: 1, nameAr: 'الحصة الأولى', nameEn: '1st Period', time: '07:30 - 08:15', isBreak: false },
      { period: 2, nameAr: 'الحصة الثانية', nameEn: '2nd Period', time: '08:15 - 09:00', isBreak: false },
      { period: 3, nameAr: 'الحصة الثالثة', nameEn: '3rd Period', time: '09:00 - 09:45', isBreak: false },
      { period: 'break', nameAr: 'فسحة', nameEn: 'Break', time: '09:45 - 10:00', isBreak: true },
      { period: 4, nameAr: 'الحصة الرابعة', nameEn: '4th Period', time: '10:00 - 10:45', isBreak: false },
      { period: 5, nameAr: 'الحصة الخامسة', nameEn: '5th Period', time: '10:45 - 11:30', isBreak: false },
      { period: 6, nameAr: 'الحصة السادسة', nameEn: '6th Period', time: '11:30 - 12:15', isBreak: false },
    ],
    []
  );

  const findSlotForCell = (dayId: number, periodNum: number) => {
    return activeItems.find((item: any) => {
      const itemDay = normalizeDayId(item.day_of_week || item.day || item.day_id || item.day_name);
      const itemPeriod = normalizePeriodNum(item.period_number || item.period || item.period_id);
      return itemDay === dayId && itemPeriod === periodNum;
    });
  };

  const assignedClassesCount = useMemo(() => {
    return activeItems.length;
  }, [activeItems]);

  const uniqueClassesCount = useMemo(() => {
    const set = new Set(activeItems.map((i: any) => i.class_name).filter(Boolean));
    return set.size;
  }, [activeItems]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await activeQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [activeQuery]);

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setFormSubject('');
    setFormTeacher('');
    setFormClass('');
    setFormRoom('');
    setFormPeriod('1');
    setFormStartTime('07:30');
    setFormEndTime('08:15');
    setFormDay('1');
    setIsFormModalVisible(true);
  };

  const handleSaveSlot = async () => {
    if (!formSubject.trim() || !formClass.trim()) {
      Alert.alert(t('common.error', 'خطأ'), isRTL ? 'يرجى إدخال اسم المادة والفصل' : 'Please enter subject and class name');
      return;
    }

    const payload = {
      subject_name: formSubject.trim(),
      teacher_name: formTeacher.trim(),
      class_name: formClass.trim(),
      room_name: formRoom.trim(),
      period: parseInt(formPeriod, 10) || 1,
      start_time: formStartTime.trim(),
      end_time: formEndTime.trim(),
      day: parseInt(formDay, 10) || 1,
      date: selectedDate,
    };

    try {
      if (isEditing && selectedItem) {
        await updateMutation.mutateAsync({ id: selectedItem.id, ...payload });
        Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم تحديث الحصة بنجاح' : 'Class slot updated successfully');
      } else {
        await createMutation.mutateAsync(payload);
        Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تمت إضافة الحصة بنجاح' : 'Class slot added successfully');
      }
      setIsFormModalVisible(false);
      setSelectedItem(null);
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل حفظ الحصة' : 'Failed to save class slot'));
    }
  };

  // Label display helper for filter chips
  const getFilterDisplayLabel = (type: PickerType) => {
    switch (type) {
      case 'stage':
        return selectedStage === 'all'
          ? (isRTL ? '— كل المراحل —' : '— All Stages —')
          : selectedStage;
      case 'grade':
        return selectedGrade === 'all'
          ? (isRTL ? '— اختر الصف —' : '— Select Grade —')
          : selectedGrade;
      case 'class':
        return selectedClass === 'all'
          ? (isRTL ? '— اختر الفصل —' : '— Select Class —')
          : selectedClass;
      case 'teacher':
        return selectedTeacher === 'all'
          ? (isRTL ? 'كل المعلمون' : 'All Teachers')
          : selectedTeacher;
      default:
        return '';
    }
  };

  const getPickerOptions = (type: PickerType) => {
    switch (type) {
      case 'stage':
        return stageOptions;
      case 'grade':
        return gradeOptions;
      case 'class':
        return classOptions;
      case 'teacher':
        return teacherOptions;
      default:
        return [];
    }
  };

  const handleSelectOption = (value: string) => {
    if (activePicker === 'stage') setSelectedStage(value);
    if (activePicker === 'grade') setSelectedGrade(value);
    if (activePicker === 'class') setSelectedClass(value);
    if (activePicker === 'teacher') setSelectedTeacher(value);
    setActivePicker(null);
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* 1. Web-Style Header Banner (Responsive & RTL Compliant) */}
      <View style={[styles.headerBanner, isDark && styles.darkCard]}>
        <View style={[styles.headerTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerTitleGroup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="h1" weight="bold" color={isDark ? '#F8FAFC' : '#0A1D3D'} style={[styles.webHeaderTitle, isRTL ? styles.rtlText : styles.ltrText]}>
              {t('navigation.schedule', 'جدولي الدراسي')}
            </AppText>
            <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'} style={[styles.webHeaderSubtitle, isRTL ? styles.rtlText : styles.ltrText]}>
              {isRTL ? 'حصصي المسندة من الإدارة (عرض فقط)' : 'Assigned classes from management (View only)'}
            </AppText>
          </View>

          {canCreate && (
            <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal}>
              <Icon name="plus" size={14} color="#FFFFFF" />
              <Text style={styles.addBtnText}>{isRTL ? 'إضافة حصة' : 'Add Slot'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* View Mode Tabs (جدولي الأسبوعي / اليومي / الشبكي) */}
        <View style={[styles.modeTabsRow, isDark && styles.darkSubCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={[styles.modeTab, viewMode === 'mine' && (isDark ? styles.darkActiveTab : styles.modeTabActive)]}
            onPress={() => setViewMode('mine')}
          >
            <Text style={[styles.modeTabText, viewMode === 'mine' && styles.modeTabTextActive]}>
              {isRTL ? 'جدولي (أسبوعي)' : 'My Schedule (Weekly)'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, viewMode === 'daily' && (isDark ? styles.darkActiveTab : styles.modeTabActive)]}
            onPress={() => setViewMode('daily')}
          >
            <Text style={[styles.modeTabText, viewMode === 'daily' && styles.modeTabTextActive]}>
              {isRTL ? 'اليومي' : 'Daily'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, viewMode === 'weekly' && (isDark ? styles.darkActiveTab : styles.modeTabActive)]}
            onPress={() => setViewMode('weekly')}
          >
            <Text style={[styles.modeTabText, viewMode === 'weekly' && styles.modeTabTextActive]}>
              {isRTL ? 'عرض الأسبوع' : 'Full Week'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeTab, viewMode === 'grid' && (isDark ? styles.darkActiveTab : styles.modeTabActive)]}
            onPress={() => setViewMode('grid')}
          >
            <Text style={[styles.modeTabText, viewMode === 'grid' && styles.modeTabTextActive]}>
              {isRTL ? 'الشبكي' : 'Grid'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content ScrollView */}
      <ScrollView
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}
      >
        {/* 2. Top KPI 5-Card Summary Grid (Explicit Right-Alignment in Arabic RTL) */}
        <View style={[styles.kpiGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Metric 1: Distributed Classes (حصص موزعة) */}
          <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiBlueCard, isDark && styles.darkCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.kpiCardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="calendar" size={13} color="#1D4ED8" />
              <AppText variant="captionBold" color="#1E40AF" style={[styles.kpiLabelText, isRTL ? styles.rtlText : styles.ltrText]}>
                {isRTL ? 'حصص موزعة' : 'Distributed Classes'}
              </AppText>
            </View>
            <AppText variant="hero" weight="extraBold" color="#1D4ED8" style={[styles.kpiNumber, { textAlign: isRTL ? 'right' : 'left' }]}>
              {assignedClassesCount}
            </AppText>
          </View>

          {/* Metric 2: Active Teachers (معلمون نشطون) */}
          <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiBlueCard, isDark && styles.darkCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.kpiCardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="users" size={13} color="#2563EB" />
              <AppText variant="captionBold" color="#1E40AF" style={[styles.kpiLabelText, isRTL ? styles.rtlText : styles.ltrText]}>
                {isRTL ? 'معلمون نشطون' : 'Active Teachers'}
              </AppText>
            </View>
            <AppText variant="hero" weight="extraBold" color="#2563EB" style={[styles.kpiNumber, { textAlign: isRTL ? 'right' : 'left' }]}>
              1
            </AppText>
          </View>

          {/* Metric 3: Classes / Subjects (الفصول) */}
          <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiGreenCard, isDark && styles.darkCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.kpiCardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="school" size={13} color="#059669" />
              <AppText variant="captionBold" color="#065F46" style={[styles.kpiLabelText, isRTL ? styles.rtlText : styles.ltrText]}>
                {isRTL ? 'الفصول' : 'Classes'}
              </AppText>
            </View>
            <AppText variant="hero" weight="extraBold" color="#059669" style={[styles.kpiNumber, { textAlign: isRTL ? 'right' : 'left' }]}>
              {uniqueClassesCount}
            </AppText>
          </View>

          {/* Metric 4: Free Slots (فراغات) */}
          <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiYellowCard, isDark && styles.darkCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.kpiCardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="clock" size={13} color="#D97706" />
              <AppText variant="captionBold" color="#92400E" style={[styles.kpiLabelText, isRTL ? styles.rtlText : styles.ltrText]}>
                {isRTL ? 'فراغات' : 'Free Slots'}
              </AppText>
            </View>
            <AppText variant="hero" weight="extraBold" color="#D97706" style={[styles.kpiNumber, { textAlign: isRTL ? 'right' : 'left' }]}>
              16
            </AppText>
          </View>

          {/* Metric 5: Conflicts (تعارضات) */}
          <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiPinkCard, isDark && styles.darkCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <View style={[styles.kpiCardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="alertTriangle" size={13} color="#10B981" />
              <AppText variant="captionBold" color="#065F46" style={[styles.kpiLabelText, isRTL ? styles.rtlText : styles.ltrText]}>
                {isRTL ? 'تعارضات' : 'Conflicts'}
              </AppText>
            </View>
            <AppText variant="hero" weight="extraBold" color="#10B981" style={[styles.kpiNumber, { textAlign: isRTL ? 'right' : 'left' }]}>
              0
            </AppText>
          </View>
        </View>

        {/* 3. Filter Bar (Functional Select Options + RTL) */}
        <View style={[styles.filterBarCard, isDark && styles.darkCard]}>
          <View style={[styles.filterInputsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {/* Stage Selector */}
            <View style={styles.filterFieldBox}>
              <Text style={[styles.filterLabelText, isDark && styles.darkSubtext, isRTL ? styles.rtlText : styles.ltrText]}>
                {isRTL ? 'المرحلة الدراسية' : 'School Stage'}
              </Text>
              <TouchableOpacity
                style={[styles.selectChip, isDark && styles.darkSubCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => setActivePicker('stage')}
                accessibilityRole="button"
              >
                <Text style={[styles.selectChipText, isDark && styles.darkText, { flex: 1 }, isRTL ? styles.rtlText : styles.ltrText]} numberOfLines={1}>
                  {getFilterDisplayLabel('stage')}
                </Text>
                <Icon name="chevronDown" size={12} color={colors.tx2} />
              </TouchableOpacity>
            </View>

            {/* Grade Selector */}
            <View style={styles.filterFieldBox}>
              <Text style={[styles.filterLabelText, isDark && styles.darkSubtext, isRTL ? styles.rtlText : styles.ltrText]}>
                {isRTL ? 'الصف' : 'Grade'}
              </Text>
              <TouchableOpacity
                style={[styles.selectChip, isDark && styles.darkSubCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => setActivePicker('grade')}
                accessibilityRole="button"
              >
                <Text style={[styles.selectChipText, isDark && styles.darkText, { flex: 1 }, isRTL ? styles.rtlText : styles.ltrText]} numberOfLines={1}>
                  {getFilterDisplayLabel('grade')}
                </Text>
                <Icon name="chevronDown" size={12} color={colors.tx2} />
              </TouchableOpacity>
            </View>

            {/* Class Selector */}
            <View style={styles.filterFieldBox}>
              <Text style={[styles.filterLabelText, isDark && styles.darkSubtext, isRTL ? styles.rtlText : styles.ltrText]}>
                {isRTL ? 'الفصل' : 'Class'}
              </Text>
              <TouchableOpacity
                style={[styles.selectChip, isDark && styles.darkSubCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => setActivePicker('class')}
                accessibilityRole="button"
              >
                <Text style={[styles.selectChipText, isDark && styles.darkText, { flex: 1 }, isRTL ? styles.rtlText : styles.ltrText]} numberOfLines={1}>
                  {getFilterDisplayLabel('class')}
                </Text>
                <Icon name="chevronDown" size={12} color={colors.tx2} />
              </TouchableOpacity>
            </View>

            {/* Teacher Selector */}
            <View style={styles.filterFieldBox}>
              <Text style={[styles.filterLabelText, isDark && styles.darkSubtext, isRTL ? styles.rtlText : styles.ltrText]}>
                {isRTL ? 'المعلم' : 'Teacher'}
              </Text>
              <TouchableOpacity
                style={[styles.selectChip, isDark && styles.darkSubCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => setActivePicker('teacher')}
                accessibilityRole="button"
              >
                <Text style={[styles.selectChipText, isDark && styles.darkText, { flex: 1 }, isRTL ? styles.rtlText : styles.ltrText]} numberOfLines={1}>
                  {getFilterDisplayLabel('teacher')}
                </Text>
                <Icon name="chevronDown" size={12} color={colors.tx2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Buttons: Print & PDF */}
          <View style={[styles.actionButtonsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={[styles.printBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => Alert.alert(isRTL ? 'طباعة' : 'Print', isRTL ? 'جاري إرسال الجدول للطباعة...' : 'Sending timetable to printer...')}
              accessibilityRole="button"
            >
              <Icon name="award" size={14} color="#334155" />
              <Text style={styles.printBtnText}>{isRTL ? 'اطبع' : 'Print'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pdfBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => Alert.alert(isRTL ? 'تصدير PDF' : 'Export PDF', isRTL ? 'جاري تجهيز ملف PDF للجدول...' : 'Preparing PDF file...')}
              accessibilityRole="button"
            >
              <Icon name="fileText" size={14} color="#1246B7" />
              <Text style={styles.pdfBtnText}>PDF</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Vertical Stacked Period Card Boxes (الجدول بوكسات متتالية تحت بعضها) */}
        {isLoading && !refreshing ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#1246B7" />
            <AppText variant="body" color="#77839B" style={styles.loadingText}>
              {isRTL ? 'جارٍ تحميل جدول الحصص...' : 'Loading timetable...'}
            </AppText>
          </View>
        ) : viewMode !== 'grid' ? (
          <View style={styles.verticalPeriodContainer}>
            {/* Day Selector Chips Bar (Tab Row for 5 Days) */}
            <View style={[styles.daySelectorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {daysList.map((d) => {
                const active = d.id === selectedDayId;
                return (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.dayChip, active && styles.dayChipActive]}
                    onPress={() => setSelectedDayId(d.id)}
                  >
                    <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                      {isRTL ? d.nameAr : d.nameEn}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* List of Period Box Cards Stacked Vertically */}
            <View style={styles.verticalPeriodList}>
              {periodsList.map((pDef, pIdx) => {
                if (pDef.isBreak) {
                  return (
                    <View key="break-card" style={styles.verticalBreakCard}>
                      <Text style={styles.verticalBreakText}>
                        ☕ {isRTL ? 'فسحة - استراحة الطلاب' : 'Break'} (09:45 - 10:00)
                      </Text>
                    </View>
                  );
                }

                const periodNum = pDef.period as number;
                const slot = findSlotForCell(selectedDayId, periodNum);
                const theme = slot ? getSubjectTheme(slot.subject_name || slot.subject) : null;

                return (
                  <View key={`period-box-${periodNum}`} style={[styles.periodBoxCard, isDark && styles.darkCard]}>
                    {/* Period Header Bar */}
                    <View style={[styles.periodBoxHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={styles.periodBadgePill}>
                        <Text style={styles.periodBadgePillText}>
                          {isRTL ? pDef.nameAr : pDef.nameEn}
                        </Text>
                      </View>
                      <Text style={styles.periodTimePillText}>🕒 {pDef.time}</Text>
                    </View>

                    {/* Slot Card or Empty Slot */}
                    {slot && theme ? (
                      <TouchableOpacity
                        style={[
                          styles.periodSubjectBox,
                          {
                            backgroundColor: theme.bg,
                            borderRightColor: isRTL ? theme.border : 'transparent',
                            borderLeftColor: isRTL ? 'transparent' : theme.border,
                            borderRightWidth: isRTL ? 4 : 0,
                            borderLeftWidth: isRTL ? 0 : 4,
                          },
                        ]}
                        onPress={() => setSelectedItem(slot)}
                        accessibilityRole="button"
                      >
                        <View style={[styles.periodSubjectTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <Text style={[styles.periodSubjectTitle, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                            {slot.subject_name || slot.subject || (isRTL ? 'مادة دراسية' : 'Subject')}
                          </Text>
                          <View style={[styles.classPillSmall, { backgroundColor: theme.border + '22' }]}>
                            <Text style={[styles.classPillSmallText, { color: theme.text }]}>
                              {slot.class_name || '1/أ'}
                            </Text>
                          </View>
                        </View>

                        <View style={[styles.periodSubjectDetailsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <Text style={[styles.periodTeacherText, { textAlign: isRTL ? 'right' : 'left' }]}>
                            👤 {slot.teacher_name || user?.name || (isRTL ? 'معلم الفصل' : 'Teacher')}
                          </Text>
                          {slot.room_name ? (
                            <Text style={[styles.periodRoomText, { textAlign: isRTL ? 'right' : 'left' }]}>
                              📍 قاعة {slot.room_name}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.emptyPeriodBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                        onPress={() => {
                          setFormDay(String(selectedDayId));
                          setFormPeriod(String(periodNum));
                          handleOpenAddModal();
                        }}
                      >
                        <Text style={styles.emptyPeriodBoxText}>
                          ＋ {isRTL ? 'إضافة حصة في هذا الموعد' : 'Add session here'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          /* Matrix Grid View */
          <View style={[styles.matrixCard, isDark && styles.darkCard]}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={true}
              contentContainerStyle={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                minWidth: '100%',
              }}
            >
              <View style={[styles.matrixTable, { minWidth: minTableWidth }]}>
                {/* Table Header Row (RTL direction from right to left) */}
                <View style={[styles.matrixHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.matrixPeriodHeaderCell, { width: responsivePeriodWidth }]}>
                    <Text style={[styles.matrixHeaderCellText, isRTL ? styles.rtlText : styles.ltrText]}>
                      {isRTL ? 'الحصة' : 'Period'}
                    </Text>
                  </View>
                  {daysList.map((day) => (
                    <View key={day.id} style={[styles.matrixDayHeaderCell, { width: responsiveDayWidth }]}>
                      <Text style={[styles.matrixHeaderCellText, isRTL ? styles.rtlText : styles.ltrText]}>
                        {isRTL ? day.nameAr : day.nameEn}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Table Period Rows */}
                {periodsList.map((pDef, pIdx) => {
                  if (pDef.isBreak) {
                    return (
                      <View
                        key="break-row"
                        style={[
                          styles.matrixBreakRow,
                          { flexDirection: isRTL ? 'row-reverse' : 'row' },
                        ]}
                      >
                        <View style={[styles.matrixPeriodCell, { width: responsivePeriodWidth }]}>
                          <Text style={styles.breakPeriodText}>{isRTL ? pDef.nameAr : pDef.nameEn}</Text>
                          <Text style={styles.breakTimeText}>{pDef.time}</Text>
                        </View>
                        <View style={[styles.breakBarSpan, { width: responsiveDayWidth * 5 }]}>
                          <Text style={styles.breakBarText}>
                            — {isRTL ? 'فسحة' : 'Break'} ({pDef.time}) —
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  const periodNum = pDef.period as number;

                  return (
                    <View
                      key={`period-${periodNum}`}
                      style={[
                        styles.matrixRow,
                        { flexDirection: isRTL ? 'row-reverse' : 'row' },
                        pIdx === periodsList.length - 1 && { borderBottomWidth: 0 },
                      ]}
                    >
                      {/* Period Header Cell */}
                      <View style={[styles.matrixPeriodCell, { width: responsivePeriodWidth }]}>
                        <Text style={[styles.periodNameText, isDark && styles.darkText, isRTL ? styles.rtlText : styles.ltrText]}>
                          {isRTL ? pDef.nameAr : pDef.nameEn}
                        </Text>
                        <Text style={[styles.periodTimeText, isRTL ? styles.rtlText : styles.ltrText]}>{pDef.time}</Text>
                      </View>

                      {/* 5 Day Cells */}
                      {daysList.map((day) => {
                        const slot = findSlotForCell(day.id, periodNum);
                        const theme = slot ? getSubjectTheme(slot.subject_name || slot.subject) : null;

                        return (
                          <View key={`cell-${day.id}-${periodNum}`} style={[styles.matrixCell, { width: responsiveDayWidth }]}>
                            {slot && theme ? (
                              <TouchableOpacity
                                style={[
                                  styles.subjectCard,
                                  {
                                    backgroundColor: theme.bg,
                                    borderLeftColor: isRTL ? 'transparent' : theme.border,
                                    borderRightColor: isRTL ? theme.border : 'transparent',
                                    borderLeftWidth: isRTL ? 0 : 3,
                                    borderRightWidth: isRTL ? 3 : 0,
                                  },
                                  isDark && styles.darkSubCard,
                                ]}
                                onPress={() => setSelectedItem(slot)}
                                accessibilityRole="button"
                              >
                                <View style={[styles.subjectHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                                  <Icon name="fileText" size={10} color={theme.border} />
                                  <Text
                                    style={[
                                      styles.subjectTitleText,
                                      { color: isDark ? '#F8FAFC' : theme.text },
                                      isRTL ? styles.rtlText : styles.ltrText,
                                    ]}
                                    numberOfLines={1}
                                  >
                                    {slot.subject_name || slot.subject || (isRTL ? 'مادة' : 'Subject')}
                                  </Text>
                                </View>

                                <Text
                                  style={[
                                    styles.subjectSubtitleText,
                                    isRTL ? styles.rtlText : styles.ltrText,
                                  ]}
                                  numberOfLines={1}
                                >
                                  {`${slot.class_name || '1/أ'} • ${slot.teacher_name || user?.name || (isRTL ? 'المعلم' : 'Teacher')}`}
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              <View style={styles.emptyMatrixCell}>
                                <Text style={styles.emptyDashText}>—</Text>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  );
                })}
              </View>
            </ScrollView>
          </View>
        )}
      </ScrollView>

      {/* Select Option Picker Modal (Responsive & RTL) */}
      <Modal visible={!!activePicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setActivePicker(null)}>
          <View style={[styles.pickerModalCard, isDark && styles.darkCard]}>
            <View style={[styles.pickerModalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.pickerModalTitle, isDark && styles.darkText, isRTL ? styles.rtlText : styles.ltrText]}>
                {activePicker === 'stage'
                  ? (isRTL ? 'اختر المرحلة الدراسية' : 'Select Stage')
                  : activePicker === 'grade'
                  ? (isRTL ? 'اختر الصف الدراسي' : 'Select Grade')
                  : activePicker === 'class'
                  ? (isRTL ? 'اختر الفصل' : 'Select Class')
                  : (isRTL ? 'اختر المعلم' : 'Select Teacher')}
              </Text>
              <TouchableOpacity onPress={() => setActivePicker(null)}>
                <Icon name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.pickerOptionsList}>
              {getPickerOptions(activePicker).map((opt) => {
                const label = opt === 'all'
                  ? (activePicker === 'stage'
                      ? (isRTL ? '— كل المراحل —' : '— All Stages —')
                      : activePicker === 'grade'
                      ? (isRTL ? '— كل الصفوف —' : '— All Grades —')
                      : activePicker === 'class'
                      ? (isRTL ? '— كل الفصول —' : '— All Classes —')
                      : (isRTL ? '— كل المعلمون —' : '— All Teachers —'))
                  : opt;

                const isSelected =
                  (activePicker === 'stage' && selectedStage === opt) ||
                  (activePicker === 'grade' && selectedGrade === opt) ||
                  (activePicker === 'class' && selectedClass === opt) ||
                  (activePicker === 'teacher' && selectedTeacher === opt);

                return (
                  <TouchableOpacity
                    key={opt}
                    style={[
                      styles.pickerOptionItem,
                      isSelected && styles.pickerOptionSelected,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                    ]}
                    onPress={() => handleSelectOption(opt)}
                  >
                    <Text
                      style={[
                        styles.pickerOptionText,
                        isSelected && styles.pickerOptionTextSelected,
                        isDark && styles.darkText,
                        isRTL ? styles.rtlText : styles.ltrText,
                      ]}
                    >
                      {label}
                    </Text>
                    {isSelected && <Icon name="check" size={16} color="#1246B7" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Slot Details Modal */}
      <Modal visible={!!selectedItem && !isFormModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={[styles.modalTitle, isRTL ? styles.rtlText : styles.ltrText]}>
              {selectedItem?.subject_name}
            </AppText>

            <View style={[styles.detailsBox, isDark && styles.darkSubCard]}>
              <AppText variant="body" style={[styles.detailItemText, isRTL ? styles.rtlText : styles.ltrText]}>
                {`🏫 ${isRTL ? 'الفصل' : 'Class'}: ${selectedItem?.class_name || '—'}`}
              </AppText>
              <AppText variant="body" style={[styles.detailItemText, isRTL ? styles.rtlText : styles.ltrText]}>
                {`👤 ${isRTL ? 'المعلم' : 'Teacher'}: ${selectedItem?.teacher_name || '—'}`}
              </AppText>
              <AppText variant="body" style={[styles.detailItemText, isRTL ? styles.rtlText : styles.ltrText]}>
                {`📍 ${isRTL ? 'القاعة' : 'Room'}: ${selectedItem?.room_name || (isRTL ? 'الافتراضية' : 'Default')}`}
              </AppText>
              <AppText variant="body" style={[styles.detailItemText, isRTL ? styles.rtlText : styles.ltrText]}>
                {`🕒 ${isRTL ? 'التوقيت' : 'Time'}: ${selectedItem?.start_time || '07:30'} - ${selectedItem?.end_time || '08:15'}`}
              </AppText>
            </View>

            <View style={[styles.modalActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.closeModalBtn}
                onPress={() => setSelectedItem(null)}
              >
                <Text style={styles.closeModalBtnText}>{isRTL ? 'إغلاق' : 'Close'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  darkSafeArea: {
    backgroundColor: '#0F172A',
  },
  headerBanner: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTopRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleGroup: {
    flex: 1,
  },
  webHeaderTitle: {
    fontSize: 20,
    color: '#0F172A',
    marginBottom: 2,
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  webHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1246B7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 5,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '600',
  },
  modeTabsRow: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  darkActiveTab: {
    backgroundColor: '#1E293B',
  },
  modeTabText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '500',
  },
  modeTabTextActive: {
    color: '#1246B7',
    fontWeight: '700',
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 36,
  },
  kpiGrid: {
    gap: 10,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 130,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  kpiCardDesktop: {
    minWidth: 0,
    flexBasis: '18%',
  },
  kpiCardHeaderRow: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  kpiBlueCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  kpiGreenCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  kpiYellowCard: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
  },
  kpiPinkCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  kpiNumber: {
    fontSize: 24,
    lineHeight: 30,
    marginBottom: 2,
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  kpiLabelText: {
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  filterBarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
    gap: 10,
  },
  filterInputsRow: {
    gap: 8,
    flexWrap: 'wrap',
  },
  filterFieldBox: {
    flex: 1,
    minWidth: 120,
  },
  filterLabelText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 3,
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  selectChip: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectChipText: {
    fontSize: 11,
    color: '#334155',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  actionButtonsRow: {
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  printBtn: {
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#F8FAFC',
  },
  printBtnText: {
    fontSize: 11,
    color: '#334155',
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '600',
  },
  pdfBtn: {
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EFF6FF',
  },
  pdfBtnText: {
    fontSize: 11,
    color: '#1246B7',
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  matrixCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  matrixTable: {
    paddingVertical: 1,
  },
  matrixHeaderRow: {
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  matrixPeriodHeaderCell: {
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  matrixDayHeaderCell: {
    paddingVertical: 9,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  matrixHeaderCellText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  matrixRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    minHeight: 58,
  },
  matrixPeriodCell: {
    paddingVertical: 6,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  periodNameText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    fontFamily: ibmPlexArabicFontFamily.regular,
    marginBottom: 1,
  },
  periodTimeText: {
    fontSize: 10,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  matrixCell: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    justifyContent: 'center',
  },
  subjectCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    padding: 5,
    height: '100%',
    justifyContent: 'center',
  },
  subjectHeaderRow: {
    alignItems: 'center',
    gap: 3,
    marginBottom: 1,
  },
  subjectTitleText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  subjectSubtitleText: {
    fontSize: 9.5,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  emptyMatrixCell: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  emptyDashText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  matrixBreakRow: {
    backgroundColor: '#FEFCE8',
    borderBottomWidth: 1,
    borderBottomColor: '#FEF08A',
    minHeight: 40,
    alignItems: 'center',
  },
  breakPeriodText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854D0E',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  breakTimeText: {
    fontSize: 9.5,
    color: '#A16207',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  breakBarSpan: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakBarText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A16207',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    maxHeight: 400,
    ...shadows.lg,
  },
  pickerModalHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 8,
  },
  pickerModalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  pickerOptionsList: {
    maxHeight: 300,
  },
  pickerOptionItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  pickerOptionSelected: {
    backgroundColor: '#EFF6FF',
  },
  pickerOptionText: {
    fontSize: 13,
    color: '#334155',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  pickerOptionTextSelected: {
    color: '#1246B7',
    fontWeight: '700',
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    ...shadows.lg,
  },
  darkCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  darkSubCard: {
    backgroundColor: '#0F172A',
  },
  darkText: {
    color: '#F8FAFC',
  },
  darkSubtext: {
    color: '#94A3B8',
  },
  modalTitle: {
    fontSize: 18,
    color: '#0F172A',
    marginBottom: 14,
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  detailsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    gap: 8,
    marginBottom: 16,
  },
  detailItemText: {
    fontSize: 13,
    color: '#334155',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  modalActionsRow: {
    justifyContent: 'flex-end',
    gap: 10,
  },
  closeModalBtn: {
    backgroundColor: '#1246B7',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  closeModalBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  alignStart: { alignItems: 'flex-start' },
  alignEnd: { alignItems: 'flex-end' },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
  verticalPeriodContainer: {
    gap: 12,
  },
  daySelectorRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  dayChipActive: {
    backgroundColor: '#1246B7',
  },
  dayChipText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '600',
  },
  dayChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  verticalPeriodList: {
    gap: 12,
  },
  periodBoxCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  periodBoxHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  periodBadgePill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  periodBadgePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1246B7',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  periodTimePillText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '500',
  },
  periodSubjectBox: {
    borderRadius: 10,
    padding: 14,
    gap: 8,
  },
  periodSubjectTopRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodSubjectTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  classPillSmall: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classPillSmallText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  periodSubjectDetailsRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  periodTeacherText: {
    fontSize: 12.5,
    color: '#475569',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  periodRoomText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  emptyPeriodBox: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyPeriodBoxText: {
    fontSize: 12.5,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '600',
  },
  verticalBreakCard: {
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  verticalBreakText: {
    fontSize: 13,
    color: '#A16207',
    fontWeight: '700',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
});
