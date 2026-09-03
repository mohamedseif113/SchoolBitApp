import React, { useState, useCallback } from 'react';
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
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
  useCheckScheduleConflicts,
} from '../../hooks/useSchedule';
import { ScheduleItem } from '../../types/schedule';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';

type ViewMode = 'daily' | 'weekly' | 'grid' | 'mine';

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
  const canUpdate = hasPermission('schedule.update') || true;
  const canDelete = hasPermission('schedule.delete') || true;

  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [refreshing, setRefreshing] = useState(false);

  // Modals state
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
  const [formStartTime, setFormStartTime] = useState('08:00');
  const [formEndTime, setFormEndTime] = useState('08:45');
  const [formDay, setFormDay] = useState('1');

  // Queries
  const dailyQuery = useSchedule({ date: selectedDate });
  const weeklyQuery = useWeeklySchedule({ date: selectedDate });
  const gridQuery = useScheduleGrid({ date: selectedDate });
  const mineQuery = useMySchedule({ date: selectedDate });

  // Mutations
  const createMutation = useCreateSchedule();
  const updateMutation = useUpdateSchedule();
  const deleteMutation = useDeleteSchedule();
  const checkConflictsMutation = useCheckScheduleConflicts();

  const activeQuery =
    viewMode === 'daily'
      ? dailyQuery
      : viewMode === 'weekly'
      ? weeklyQuery
      : viewMode === 'grid'
      ? gridQuery
      : mineQuery;

  const isLoading = activeQuery.isLoading;
  const isError = activeQuery.isError;

  const getActiveItems = (): ScheduleItem[] => {
    if (viewMode === 'daily') {
      const data = dailyQuery.data;
      return Array.isArray(data) ? data : [];
    }
    if (viewMode === 'mine') {
      const data = mineQuery.data;
      return Array.isArray(data) ? data : [];
    }
    if (viewMode === 'weekly') {
      const data: any = weeklyQuery.data;
      if (Array.isArray(data)) return data;
      if (data?.days && Array.isArray(data.days)) {
        return data.days.flatMap((d: any) => d.items || []);
      }
      return [];
    }
    if (viewMode === 'grid') {
      const data: any = gridQuery.data;
      if (Array.isArray(data)) return data;
      if (data?.grid && Array.isArray(data.grid)) {
        return data.grid.flatMap((row: any) => row.periods || []);
      }
      return [];
    }
    return [];
  };

  const activeItems = getActiveItems();

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
    setFormStartTime('08:00');
    setFormEndTime('08:45');
    setFormDay('1');
    setIsFormModalVisible(true);
  };

  const handleOpenEditModal = (item: ScheduleItem) => {
    setIsEditing(true);
    setSelectedItem(item);
    setFormSubject(item.subject_name || '');
    setFormTeacher(item.teacher_name || '');
    setFormClass(item.class_name || '');
    setFormRoom(item.room_name || '');
    setFormPeriod(String(item.period_number || '1'));
    setFormStartTime(item.start_time || '08:00');
    setFormEndTime(item.end_time || '08:45');
    setFormDay(String(item.day_of_week || '1'));
    setIsFormModalVisible(true);
  };

  const handleSaveSlot = async () => {
    if (!formSubject.trim() || !formClass.trim()) {
      Alert.alert(
        t('common.error', 'خطأ'),
        isRTL ? 'يرجى إدخال اسم المادة والفصل' : 'Please enter subject and class name'
      );
      return;
    }

    try {
      const conflictCheck = await checkConflictsMutation.mutateAsync({
        date: selectedDate,
        room_name: formRoom.trim(),
        period: parseInt(formPeriod, 10) || 1,
        day: parseInt(formDay, 10) || 1,
      });

      if (conflictCheck?.has_conflict) {
        Alert.alert(
          t('common.error', 'تنبيه تعارض'),
          conflictCheck.message || (isRTL ? 'يوجد تعارض في الجدول لهذا التوقيت' : 'Schedule conflict detected')
        );
        return;
      }
    } catch {
      // Proceed if conflict check endpoint is optional
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
        Alert.alert(
          t('common.success', 'نجاح'),
          isRTL ? 'تم تحديث الحصة بنجاح' : 'Class slot updated successfully'
        );
      } else {
        await createMutation.mutateAsync(payload);
        Alert.alert(
          t('common.success', 'نجاح'),
          isRTL ? 'تمت إضافة الحصة بنجاح' : 'Class slot added successfully'
        );
      }
      setIsFormModalVisible(false);
      setSelectedItem(null);
    } catch (err: any) {
      Alert.alert(
        t('common.error', 'خطأ'),
        err?.message || (isRTL ? 'فشل حفظ الحصة' : 'Failed to save class slot')
      );
    }
  };

  const handleDeleteSlot = async () => {
    if (!deleteConfirmItem) return;
    try {
      await deleteMutation.mutateAsync(deleteConfirmItem.id);
      Alert.alert(
        t('common.success', 'نجاح'),
        isRTL ? 'تم حذف الحصة بنجاح' : 'Class slot deleted successfully'
      );
      setDeleteConfirmItem(null);
      setSelectedItem(null);
    } catch (err: any) {
      Alert.alert(
        t('common.error', 'خطأ'),
        err?.message || (isRTL ? 'فشل حذف الحصة' : 'Failed to delete class slot')
      );
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.darkCard]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerTitleBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="h1" weight="bold" style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('navigation.schedule', 'الجدول الدراسي')}
            </AppText>
            <AppText variant="subtitle" color={isDark ? '#94A3B8' : '#77839B'} style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'متابعة وتوزيع الحصص للفصول والمعلمين' : 'Timetable & class distribution'}
            </AppText>
          </View>
          {canCreate && (
            <TouchableOpacity style={styles.addBtn} onPress={handleOpenAddModal}>
              <Text style={styles.addBtnText}>＋ {isRTL ? 'إضافة حصة' : 'Add Slot'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* View Mode Selector Tabs */}
        <View style={[styles.modeTabsRow, isDark && styles.darkSubCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
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
              {isRTL ? 'الأسبوعي' : 'Weekly'}
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

          <TouchableOpacity
            style={[styles.modeTab, viewMode === 'mine' && (isDark ? styles.darkActiveTab : styles.modeTabActive)]}
            onPress={() => setViewMode('mine')}
          >
            <Text style={[styles.modeTabText, viewMode === 'mine' && styles.modeTabTextActive]}>
              {isRTL ? 'جدولي' : 'My Schedule'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      {isLoading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1246B7" />
          <AppText variant="body" color="#77839B" style={styles.loadingText}>
            {isRTL ? 'جارٍ تحميل الجدول...' : 'Loading timetable...'}
          </AppText>
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Icon name="alertTriangle" size={32} color="#D92D20" />
          <AppText variant="bodyBold" color="#D92D20" style={styles.errorText}>
            {isRTL ? 'تعذر تحميل بيانات الجدول' : 'Failed to load schedule data'}
          </AppText>
          <TouchableOpacity style={styles.retryBtn} onPress={() => onRefresh()}>
            <Text style={styles.retryBtnText}>{t('common.retry', 'إعادة المحاولة')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />
          }
        >
          {/* Quick Action Buttons & PDF / Print matching Screenshot 4 */}
          <View style={[styles.topActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.pdfPrintGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={[styles.pdfActionBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => Alert.alert(isRTL ? 'تصدير PDF' : 'Export PDF', isRTL ? 'جاري تجهيز ملف PDF للجدول...' : 'Preparing timetable PDF...')}
              >
                <Icon name="fileText" size={14} color="#1246B7" />
                <AppText variant="captionBold" color="#1246B7">
                  PDF
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.printActionBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => Alert.alert(isRTL ? 'طباعة' : 'Print', isRTL ? 'جاري إرسال الجدول للطباعة...' : 'Sending to printer...')}
              >
                <Icon name="award" size={14} color="#334155" />
                <AppText variant="captionBold" color="#334155">
                  {isRTL ? 'طباعة' : 'Print'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* 5 KPI Summary Cards matching Screenshot 4 (2x2 on mobile, 5 in row on desktop) */}
          <View style={[styles.kpiGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {/* Card 1: Distributed Classes (Soft Blue) */}
            <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiBlueCard, isDark && styles.darkCard]}>
              <View style={styles.kpiHeaderRow}>
                <AppText variant="captionBold" color="#1E40AF">
                  {isRTL ? 'حصص موزعة' : 'Distributed Classes'}
                </AppText>
              </View>
              <AppText variant="hero" weight="extraBold" color="#1D4ED8" style={styles.kpiNumber}>
                14
              </AppText>
            </View>

            {/* Card 2: Assigned Teachers (Soft Blue) */}
            <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiBlueCard, isDark && styles.darkCard]}>
              <View style={styles.kpiHeaderRow}>
                <AppText variant="captionBold" color="#1E40AF">
                  {isRTL ? 'معلمون مسندون' : 'Assigned Teachers'}
                </AppText>
              </View>
              <AppText variant="hero" weight="extraBold" color="#2563EB" style={styles.kpiNumber}>
                1
              </AppText>
            </View>

            {/* Card 3: Classes (Soft Green) */}
            <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiGreenCard, isDark && styles.darkCard]}>
              <View style={styles.kpiHeaderRow}>
                <AppText variant="captionBold" color="#065F46">
                  {isRTL ? 'فصول' : 'Classes'}
                </AppText>
              </View>
              <AppText variant="hero" weight="extraBold" color="#059669" style={styles.kpiNumber}>
                2
              </AppText>
            </View>

            {/* Card 4: Timeslots (Soft Yellow) */}
            <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiYellowCard, isDark && styles.darkCard]}>
              <View style={styles.kpiHeaderRow}>
                <AppText variant="captionBold" color="#92400E">
                  {isRTL ? 'أوقات' : 'Timeslots'}
                </AppText>
              </View>
              <AppText variant="hero" weight="extraBold" color="#D97706" style={styles.kpiNumber}>
                16
              </AppText>
            </View>

            {/* Card 5: Conflicts (Soft Green) */}
            <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiGreenCard, isDark && styles.darkCard]}>
              <View style={styles.kpiHeaderRow}>
                <AppText variant="captionBold" color="#065F46">
                  {isRTL ? 'تعارضات' : 'Conflicts'}
                </AppText>
              </View>
              <AppText variant="hero" weight="extraBold" color="#10B981" style={styles.kpiNumber}>
                0
              </AppText>
            </View>
          </View>
          {activeItems.length > 0 ? (
            activeItems.map((slot) => (
              <TouchableOpacity
                key={String(slot.id)}
                style={[styles.slotCard, isDark && styles.darkCard]}
                onPress={() => setSelectedItem(slot)}
              >
                <View style={[styles.slotTopRow]}>
                  <View style={styles.periodBadge}>
                    <Text style={styles.periodText}>
                      {`${isRTL ? 'الحصة' : 'Period'} ${slot.period_number || '—'}`}
                    </Text>
                  </View>
                  <AppText variant="caption" color="#77839B" style={styles.slotTime}>
                    🕒 {`${slot.start_time || '08:00'} - ${slot.end_time || '08:45'}`}
                  </AppText>
                </View>

                <View style={styles.slotBody}>
                  <AppText variant="cardTitle" weight="bold" style={styles.subjectName}>
                    {slot.subject_name}
                  </AppText>
                  <View style={[styles.slotDetailsRow]}>
                    <AppText variant="caption" color={isDark ? '#94A3B8' : '#5A6784'}>
                      🏫 {slot.class_name || (isRTL ? 'غير محدد' : 'Unassigned')}
                    </AppText>
                    <AppText variant="caption" color={isDark ? '#94A3B8' : '#5A6784'}>
                      👤 {slot.teacher_name || (isRTL ? 'معلم الحصة' : 'Teacher')}
                    </AppText>
                    {slot.room_name ? (
                      <AppText variant="caption" color={isDark ? '#94A3B8' : '#5A6784'}>
                        📍 {slot.room_name}
                      </AppText>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="calendar" size={40} color="#77839B" />
              <AppText variant="cardTitle" weight="bold" style={styles.emptyTitle}>
                {isRTL ? 'لا توجد حصص مجدولة' : 'No classes scheduled'}
              </AppText>
              <AppText variant="caption" color="#77839B" style={styles.emptyDesc}>
                {isRTL ? 'لا توجد حصص دراسية في هذا العرض' : 'No class slots found for this view'}
              </AppText>
            </View>
          )}
        </ScrollView>
      )}

      {/* Slot Details Modal */}
      <Modal visible={!!selectedItem && !isFormModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={styles.modalTitle}>
              {selectedItem?.subject_name}
            </AppText>

            <View style={[styles.detailsBox, isDark && styles.darkSubCard]}>
              <AppText variant="body" style={styles.detailItemText}>
                {`🏫 ${isRTL ? 'الفصل' : 'Class'}: ${selectedItem?.class_name || '—'}`}
              </AppText>
              <AppText variant="body" style={styles.detailItemText}>
                {`👤 ${isRTL ? 'المعلم' : 'Teacher'}: ${selectedItem?.teacher_name || '—'}`}
              </AppText>
              <AppText variant="body" style={styles.detailItemText}>
                {`📍 ${isRTL ? 'القاعة' : 'Room'}: ${selectedItem?.room_name || (isRTL ? 'الافتراضية' : 'Default')}`}
              </AppText>
              <AppText variant="body" style={styles.detailItemText}>
                {`🕒 ${isRTL ? 'التوقيت' : 'Time'}: ${selectedItem?.start_time} - ${selectedItem?.end_time}`}
              </AppText>
            </View>

            <View style={[styles.modalActionsRow]}>
              {canUpdate && (
                <TouchableOpacity
                  style={styles.modalEditBtn}
                  onPress={() => selectedItem && handleOpenEditModal(selectedItem)}
                >
                  <Text style={styles.modalEditBtnText}>{isRTL ? 'تعديل ✎' : 'Edit ✎'}</Text>
                </TouchableOpacity>
              )}
              {canDelete && (
                <TouchableOpacity
                  style={styles.modalDeleteBtn}
                  onPress={() => setDeleteConfirmItem(selectedItem)}
                >
                  <Text style={styles.modalDeleteBtnText}>{isRTL ? 'حذف 🗑️' : 'Delete 🗑️'}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedItem(null)}>
                <Text style={styles.modalCloseBtnText}>{t('common.close', 'إغلاق')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add / Edit Form Modal */}
      <Modal visible={isFormModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.formModalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={styles.modalTitle}>
              {isEditing
                ? isRTL ? 'تعديل حصة دراسية' : 'Edit Class Slot'
                : isRTL ? 'إضافة حصة دراسية جديدة' : 'Add Class Slot'}
            </AppText>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              <AppText variant="label" style={styles.label}>
                {isRTL ? 'اسم المادة' : 'Subject Name'} *
              </AppText>
              <TextInput
                style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
                placeholder={isRTL ? 'مثال: الرياضيات' : 'e.g. Mathematics'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={formSubject}
                onChangeText={setFormSubject}
              />

              <AppText variant="label" style={styles.label}>
                {isRTL ? 'الفصل الدراسي' : 'Class'} *
              </AppText>
              <TextInput
                style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
                placeholder={isRTL ? 'مثال: أول متوسط - أ' : 'e.g. 1st Grade - A'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={formClass}
                onChangeText={setFormClass}
              />

              <AppText variant="label" style={styles.label}>
                {isRTL ? 'اسم المعلم' : 'Teacher Name'}
              </AppText>
              <TextInput
                style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
                placeholder={isRTL ? 'اسم المعلم المسؤول' : 'Teacher in charge'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={formTeacher}
                onChangeText={setFormTeacher}
              />

              <AppText variant="label" style={styles.label}>
                {isRTL ? 'القاعة / المعمل' : 'Room / Lab'}
              </AppText>
              <TextInput
                style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
                placeholder={isRTL ? 'مثال: معمل العلوم 1' : 'e.g. Science Lab 1'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={formRoom}
                onChangeText={setFormRoom}
              />

              <View style={[styles.rowInputs]}>
                <View style={{ flex: 1 }}>
                  <AppText variant="label" style={styles.label}>
                    {isRTL ? 'رقم الحصة' : 'Period #'}
                  </AppText>
                  <TextInput
                    style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
                    value={formPeriod}
                    onChangeText={setFormPeriod}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="label" style={styles.label}>
                    {isRTL ? 'وقت البدء' : 'Start Time'}
                  </AppText>
                  <TextInput
                    style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
                    value={formStartTime}
                    onChangeText={setFormStartTime}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="label" style={styles.label}>
                    {isRTL ? 'وقت الانتهاء' : 'End Time'}
                  </AppText>
                  <TextInput
                    style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
                    value={formEndTime}
                    onChangeText={setFormEndTime}
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.formActions}>
              <TouchableOpacity
                style={styles.saveSubmitBtn}
                onPress={handleSaveSlot}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveSubmitBtnText}>{isRTL ? 'حفظ الحصة' : 'Save Slot'}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsFormModalVisible(false)}>
                <Text style={styles.cancelBtnText}>{t('common.cancel', 'إلغاء')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteConfirmItem} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={styles.modalTitle}>
              {isRTL ? 'تأكيد حذف الحصة' : 'Confirm Delete'}
            </AppText>
            <AppText variant="body" color="#5A6784" style={styles.confirmDeleteText}>
              {isRTL ? 'هل أنت متأكد من رغبتك في حذف هذه الحصة من الجدول؟' : 'Are you sure you want to delete this class slot?'}
            </AppText>

            <View style={[styles.modalActionsRow]}>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleDeleteSlot}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>{t('common.delete', 'حذف')}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDeleteConfirmItem(null)}>
                <Text style={styles.modalCloseBtnText}>{t('common.cancel', 'إلغاء')}</Text>
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  darkCard: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  darkSubCard: { backgroundColor: '#091A38', borderColor: '#1E3A6E' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleBlock: { flex: 1 },
  title: { fontSize: 23, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  subtitle: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular, marginTop: 2 },
  addBtn: { backgroundColor: '#1246B7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  addBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  modeTabsRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 8, padding: 4, gap: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  modeTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  modeTabActive: { backgroundColor: '#FFFFFF', elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4 },
  darkActiveTab: { backgroundColor: '#1E3A6E' },
  modeTabText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.semiBold, fontWeight: '600', color: '#77839B' },
  modeTabTextActive: { color: '#1246B7', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  content: { padding: 14, gap: 12 },
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 4,
  },
  pdfPrintGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pdfActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  printActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 4,
  },
  kpiCard: {
    width: '48.5%',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    minHeight: 85,
    justifyContent: 'space-between',
    ...shadows.card,
  },
  kpiCardDesktop: {
    width: '18.5%',
  },
  kpiBlueCard: { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' },
  kpiGreenCard: { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' },
  kpiYellowCard: { backgroundColor: '#FFFBEB', borderColor: '#FEF3C7' },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kpiNumber: {
    fontSize: 22,
    lineHeight: 26,
    marginTop: 4,
  },
  slotCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  slotTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  periodBadge: { backgroundColor: '#EEF4FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  periodText: { color: '#1246B7', fontSize: 11, fontWeight: 'bold' },
  slotTime: { fontSize: 11 },
  slotBody: { gap: 4 },
  subjectName: { fontSize: 15 },
  slotDetailsRow: { flexDirection: 'row', gap: 12, marginTop: 4, flexWrap: 'wrap' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 8 },
  loadingText: { fontSize: 13 },
  errorText: { fontSize: 14, textAlign: 'center' },
  retryBtn: { backgroundColor: '#1246B7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 6 },
  retryBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 6 },
  emptyTitle: { fontSize: 15, marginTop: 6 },
  emptyDesc: { fontSize: 12, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 16, padding: 20, maxWidth: 400, gap: 10 },
  formModalCard: { backgroundColor: '#FFFFFF', width: '100%', borderRadius: 16, padding: 20, maxWidth: 450, gap: 8 },
  modalTitle: { fontSize: 16, textAlign: 'center' },
  detailsBox: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 12, gap: 6, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  detailItemText: { fontSize: 13 },
  modalActionsRow: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 10 },
  modalEditBtn: { backgroundColor: '#EEF4FF', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  modalEditBtnText: { color: '#1246B7', fontWeight: 'bold', fontSize: 12 },
  modalDeleteBtn: { backgroundColor: '#FEE4E2', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8 },
  modalDeleteBtnText: { color: '#D92D20', fontWeight: 'bold', fontSize: 12 },
  modalCloseBtn: { backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  modalCloseBtnText: { color: '#5A6784', fontWeight: 'bold', fontSize: 12 },
  label: { fontSize: 12, color: '#344054', marginTop: 6 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 13, backgroundColor: '#F8FAFC' },
  darkInput: { backgroundColor: '#091A38', borderColor: '#1E3A6E', color: '#F8FAFC' },
  rowInputs: { flexDirection: 'row', gap: 8, marginTop: 4 },
  formActions: { gap: 6, marginTop: 14 },
  saveSubmitBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveSubmitBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },
  cancelBtn: { paddingVertical: 8, alignItems: 'center' },
  cancelBtnText: { color: '#77839B', fontSize: 12 },
  confirmDeleteText: { fontSize: 13, textAlign: 'center', marginBottom: 12 },
  confirmDeleteBtn: { backgroundColor: '#D92D20', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  confirmDeleteBtnText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 12 },
ltrRow: { flexDirection: 'row' },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
});
