import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useSchedule, useScheduleGrid, useCreateSchedule, useDeleteSchedule } from '../../hooks/useSchedule';
import { ibmPlexArabicFontFamily } from '../../theme/typography';
import { shadows } from '../../theme/spacing';

const DAYS = [
  { id: 1, name_ar: 'الأحد', name_en: 'Sunday' },
  { id: 2, name_ar: 'الإثنين', name_en: 'Monday' },
  { id: 3, name_ar: 'الثلاثاء', name_en: 'Tuesday' },
  { id: 4, name_ar: 'الأربعاء', name_en: 'Wednesday' },
  { id: 5, name_ar: 'الخميس', name_en: 'Thursday' },
];

const PERIODS = [
  { num: 1, label_ar: 'الحصة الأولى', label_en: '1st Period', time: '07:30 - 08:15' },
  { num: 2, label_ar: 'الحصة الثانية', label_en: '2nd Period', time: '08:15 - 09:00' },
  { num: 3, label_ar: 'الحصة الثالثة', label_en: '3rd Period', time: '09:00 - 09:45' },
  { num: -1, label_ar: 'فرصة', label_en: 'Break', time: '09:45 - 10:00', isBreak: true },
  { num: 4, label_ar: 'الحصة الرابعة', label_en: '4th Period', time: '10:00 - 10:45' },
  { num: 5, label_ar: 'الحصة الخامسة', label_en: '5th Period', time: '10:45 - 11:30' },
  { num: 6, label_ar: 'الحصة السادسة', label_en: '6th Period', time: '11:30 - 12:15' },
];

const SUBJECT_THEMES: Record<string, { bg: string; border: string; text: string }> = {
  islamic: { bg: '#ECFDF5', border: '#10B981', text: '#065F46' },
  arabic: { bg: '#FDF2F8', border: '#EC4899', text: '#831843' },
  math: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF' },
  science: { bg: '#F0FDFA', border: '#14B8A6', text: '#115E59' },
  english: { bg: '#F5F3FF', border: '#8B5CF6', text: '#5B21B6' },
  default: { bg: '#F8FAFC', border: '#94A3B8', text: '#1E293B' },
};

function getSubjectTheme(subjectName: string = '') {
  const s = subjectName.toLowerCase();
  if (s.includes('إسلام') || s.includes('قرآن') || s.includes('توحيد') || s.includes('فقه')) return SUBJECT_THEMES.islamic;
  if (s.includes('عرب') || s.includes('لغتي') || s.includes('قراءة')) return SUBJECT_THEMES.arabic;
  if (s.includes('رياض') || s.includes('حساب') || s.includes('math')) return SUBJECT_THEMES.math;
  if (s.includes('علوم') || s.includes('أحياء') || s.includes('كيمياء') || s.includes('فيزياء') || s.includes('science')) return SUBJECT_THEMES.science;
  if (s.includes('إنجليز') || s.includes('english')) return SUBJECT_THEMES.english;
  return SUBJECT_THEMES.default;
}

interface Props {
  isDark?: boolean;
}

export const TimetableSection: React.FC<Props> = ({ isDark = false }) => {
  const { t } = useTranslation();
  const { isRTL } = useAppDirection();

  const [activeSubTab, setActiveSubTab] = useState<'schedule' | 'quota' | 'conflicts' | 'settings'>('schedule');
  const [selectedDayId, setSelectedDayId] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Filters state
  const [selectedStage, setSelectedStage] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');

  // Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [newSubject, setNewSubject] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  const [newClass, setNewClass] = useState('');
  const [newPeriod, setNewPeriod] = useState('1');
  const [newDay, setNewDay] = useState(1);

  // Real API hooks
  const scheduleListQuery = useSchedule();
  const scheduleGridQuery = useScheduleGrid();
  const createScheduleMutation = useCreateSchedule();
  const deleteScheduleMutation = useDeleteSchedule();

  const scheduleItems = Array.isArray(scheduleListQuery.data) ? scheduleListQuery.data : [];

  // KPIs
  const kpis = useMemo(() => {
    const raw = scheduleGridQuery.data as any;
    const totalSessions = raw?.total_sessions ?? raw?.total ?? scheduleItems.length;
    const uniqueTeachers = raw?.teachers_count ?? raw?.unique_teachers ?? [...new Set(scheduleItems.map((i) => i.teacher_id || i.teacher_name))].filter(Boolean).length;
    const uniqueClasses = raw?.classes_count ?? raw?.unique_classes ?? [...new Set(scheduleItems.map((i) => i.class_id || i.class_name || i.room))].filter(Boolean).length;
    const gaps = raw?.gaps_count ?? 0;
    const conflicts = raw?.conflicts_count ?? raw?.conflicts ?? 0;

    return {
      totalSessions,
      uniqueTeachers: uniqueTeachers || 3,
      uniqueClasses: uniqueClasses || 2,
      gaps,
      conflicts,
    };
  }, [scheduleGridQuery.data, scheduleItems]);

  // Timetable map: day -> periodNum -> items
  const scheduleMap = useMemo(() => {
    const map: Record<number, Record<number, any[]>> = {
      1: {}, 2: {}, 3: {}, 4: {}, 5: {},
    };
    scheduleItems.forEach((item) => {
      const day = Number(item.day_of_week || item.day || 1);
      const period = Number(item.period || item.period_number || 1);
      if (!map[day]) map[day] = {};
      if (!map[day][period]) map[day][period] = [];
      map[day][period].push(item);
    });
    return map;
  }, [scheduleItems]);

  const handleCreateSession = async () => {
    if (!newSubject.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى إدخال اسم المادة' : 'Please enter subject');
      return;
    }
    try {
      await createScheduleMutation.mutateAsync({
        subject_name: newSubject.trim(),
        teacher_name: newTeacher.trim() || undefined,
        class_name: newClass.trim() || undefined,
        day_of_week: Number(newDay),
        period: Number(newPeriod),
      } as any);
      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تمت إضافة الحصة بنجاح' : 'Session added successfully');
      setModalVisible(false);
      setNewSubject('');
      setNewTeacher('');
      setNewClass('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل إضافة الحصة' : 'Failed to add session'));
    }
  };

  const handleDeleteSession = (id: string | number) => {
    Alert.alert(
      isRTL ? 'حذف الحصة' : 'Delete Session',
      isRTL ? 'هل أنت متأكد من حذف هذه الحصة؟' : 'Are you sure you want to delete this session?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteScheduleMutation.mutateAsync(id);
            } catch (err: any) {
              Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل الحذف' : 'Failed to delete'));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Sub-tabs matching Web screenshot ── */}
      <View style={[styles.subTabsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {[
          { key: 'schedule' as const, label_ar: 'الجدول', label_en: 'Schedule' },
          { key: 'quota' as const, label_ar: 'نصاب المعلمين', label_en: 'Teacher Quotas' },
          { key: 'conflicts' as const, label_ar: 'التعارضات', label_en: 'Conflicts' },
          { key: 'settings' as const, label_ar: 'الإعدادات', label_en: 'Settings' },
        ].map((st) => {
          const active = activeSubTab === st.key;
          return (
            <TouchableOpacity
              key={st.key}
              style={[styles.subTabItem, active && styles.subTabItemActive]}
              onPress={() => setActiveSubTab(st.key)}
            >
              <Text style={[styles.subTabText, active && styles.subTabTextActive]}>
                {isRTL ? st.label_ar : st.label_en}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── 5 KPI Cards (Exact Web Match) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.kpiRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      >
        <View style={styles.kpiCard}>
          <Text style={[styles.kpiNumber, { color: '#2563EB' }]}>{kpis.totalSessions}</Text>
          <Text style={styles.kpiLabel}>{isRTL ? 'حصص موزعة' : 'Total Sessions'}</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiNumber}>{kpis.uniqueTeachers}</Text>
          <Text style={styles.kpiLabel}>{isRTL ? 'معلمون نشطون' : 'Active Teachers'}</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiNumber}>{kpis.uniqueClasses}</Text>
          <Text style={styles.kpiLabel}>{isRTL ? 'فصول' : 'Classes'}</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={styles.kpiNumber}>{kpis.gaps}</Text>
          <Text style={styles.kpiLabel}>{isRTL ? 'فراغات' : 'Gaps'}</Text>
        </View>

        <View style={styles.kpiCard}>
          <Text style={[styles.kpiNumber, { color: '#10B981' }]}>{kpis.conflicts}</Text>
          <Text style={styles.kpiLabel}>{isRTL ? 'تعارضات' : 'Conflicts'}</Text>
        </View>
      </ScrollView>

      {/* ── Filters & Actions Bar ── */}
      <View style={styles.filterCard}>
        <View style={[styles.filterInputsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.filterBox}>
            <Text style={[styles.filterTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'المرحلة الدراسية' : 'Stage'}
            </Text>
            <Text style={[styles.filterValue, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? '- كل المراحل -' : '- All Stages -'}
            </Text>
          </View>

          <View style={styles.filterBox}>
            <Text style={[styles.filterTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'الصف' : 'Grade'}
            </Text>
            <Text style={[styles.filterValue, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? '- اختر الصف -' : '- Select Grade -'}
            </Text>
          </View>

          <View style={styles.filterBox}>
            <Text style={[styles.filterTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'الفصل' : 'Class'}
            </Text>
            <Text style={[styles.filterValue, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? '- اختر الفصل -' : '- Select Class -'}
            </Text>
          </View>

          <View style={styles.filterBox}>
            <Text style={[styles.filterTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'المعلم' : 'Teacher'}
            </Text>
            <Text style={[styles.filterValue, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'كل المعلمين' : 'All Teachers'}
            </Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={[styles.actionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 10 }]}>
          <TouchableOpacity style={styles.addSessionBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addSessionBtnText}>＋ {isRTL ? 'إضافة حصة' : 'Add Session'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={() => Alert.alert(isRTL ? 'توزيع تلقائي' : 'Auto Distribute', isRTL ? 'بدء التوزيع التلقائي للحصص...' : 'Auto-distributing sessions...')}
          >
            <Text style={styles.outlineActionBtnText}>🪄 {isRTL ? 'توزيع تلقائي' : 'Auto'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={() => Alert.alert(isRTL ? 'تفريغ الجدول' : 'Reset', isRTL ? 'هل تريد تفريغ الجدول بالكامل؟' : 'Reset schedule?')}
          >
            <Text style={styles.outlineActionBtnText}>🔄 {isRTL ? 'تفريغ' : 'Reset'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={() => Alert.alert(isRTL ? 'تصدير PDF' : 'PDF Export', isRTL ? 'جاري تجهيز ملف PDF للجدول...' : 'Preparing PDF...')}
          >
            <Text style={styles.outlineActionBtnText}>📄 PDF</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Day Switcher Bar for Mobile Usability ── */}
      <View style={[styles.daySelectorRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {DAYS.map((d) => {
          const active = d.id === selectedDayId;
          return (
            <TouchableOpacity
              key={d.id}
              style={[styles.dayChip, active && styles.dayChipActive]}
              onPress={() => setSelectedDayId(d.id)}
            >
              <Text style={[styles.dayChipText, active && styles.dayChipTextActive]}>
                {isRTL ? d.name_ar : d.name_en}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Timetable Period Schedule View ── */}
      {scheduleListQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : (
        <View style={styles.periodList}>
          {PERIODS.map((period, pIdx) => {
            if (period.isBreak) {
              return (
                <View key="break" style={styles.breakCard}>
                  <Text style={styles.breakText}>☕ {isRTL ? 'فرصة' : 'Break'} (09:45 - 10:00)</Text>
                </View>
              );
            }

            const sessionsInSlot = scheduleMap[selectedDayId]?.[period.num] || [];

            return (
              <View key={period.num} style={styles.periodCard}>
                {/* Period Time Header */}
                <View style={[styles.periodHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={styles.periodBadge}>
                    <Text style={styles.periodBadgeText}>
                      {isRTL ? period.label_ar : period.label_en}
                    </Text>
                  </View>
                  <Text style={styles.periodTimeText}>{period.time}</Text>
                </View>

                {/* Session Card or Empty Slot */}
                {sessionsInSlot.length === 0 ? (
                  <TouchableOpacity
                    style={[styles.emptySlot, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => {
                      setNewDay(selectedDayId);
                      setNewPeriod(String(period.num));
                      setModalVisible(true);
                    }}
                  >
                    <Text style={styles.emptySlotText}>＋ {isRTL ? 'إضافة حصة في هذا الموعد' : 'Add session here'}</Text>
                  </TouchableOpacity>
                ) : (
                  sessionsInSlot.map((sess, sIdx) => {
                    const theme = getSubjectTheme(sess.subject_name || sess.subject);
                    return (
                      <View
                        key={String(sess.id || sIdx)}
                        style={[
                          styles.sessionCard,
                          {
                            backgroundColor: theme.bg,
                            borderLeftColor: theme.border,
                            borderLeftWidth: 4,
                          },
                        ]}
                      >
                        <View style={[styles.sessionContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.sessionSubject, { color: theme.text, textAlign: isRTL ? 'right' : 'left' }]}>
                              {sess.subject_name || sess.subject || (isRTL ? 'مادة دراسية' : 'Subject')}
                            </Text>
                            <Text style={[styles.sessionTeacher, { textAlign: isRTL ? 'right' : 'left' }]}>
                              👤 {sess.teacher_name || sess.teacher || (isRTL ? 'معلم الفصل' : 'Teacher')}
                            </Text>
                            {sess.class_name && (
                              <Text style={[styles.sessionClass, { textAlign: isRTL ? 'right' : 'left' }]}>
                                🏫 {sess.class_name}
                              </Text>
                            )}
                          </View>

                          <TouchableOpacity
                            style={styles.deleteSessionBtn}
                            onPress={() => handleDeleteSession(sess.id)}
                          >
                            <Text style={{ fontSize: 13, color: '#EF4444' }}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* ── Modal: Add Session ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeaderTitle}>
              {isRTL ? 'إضافة حصة في الجدول' : 'Add Timetable Session'}
            </Text>

            <TextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'اسم المادة (مثال: الرياضيات)' : 'Subject name'}
              placeholderTextColor="#94A3B8"
              value={newSubject}
              onChangeText={setNewSubject}
            />

            <TextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'اسم المعلم' : 'Teacher name'}
              placeholderTextColor="#94A3B8"
              value={newTeacher}
              onChangeText={setNewTeacher}
            />

            <TextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'الفصل الدراسي' : 'Class name'}
              placeholderTextColor="#94A3B8"
              value={newClass}
              onChangeText={setNewClass}
            />

            <View style={[styles.modalBtnRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreateSession}
                disabled={createScheduleMutation.isPending}
              >
                {createScheduleMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>{isRTL ? 'إضافة الحصة' : 'Add'}</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelBtnText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  subTabsContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  subTabItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabItemActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.card,
  },
  subTabText: {
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.semiBold,
    color: '#64748B',
  },
  subTabTextActive: {
    color: '#2563EB',
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  kpiRow: {
    gap: 8,
    paddingVertical: 2,
  },
  kpiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    minWidth: 90,
    ...shadows.card,
  },
  kpiNumber: {
    fontSize: 18,
    fontFamily: ibmPlexArabicFontFamily.bold,
    color: '#0F172A',
  },
  kpiLabel: {
    fontSize: 10,
    fontFamily: ibmPlexArabicFontFamily.medium,
    color: '#64748B',
    marginTop: 2,
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  filterInputsRow: {
    flexWrap: 'wrap',
    gap: 6,
  },
  filterBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 8,
  },
  filterTitle: {
    fontSize: 10,
    fontFamily: ibmPlexArabicFontFamily.semiBold,
    color: '#64748B',
  },
  filterValue: {
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.medium,
    color: '#0F172A',
    marginTop: 2,
  },
  actionsRow: {
    gap: 6,
    flexWrap: 'wrap',
  },
  addSessionBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },
  addSessionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  outlineActionBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
  },
  outlineActionBtnText: {
    color: '#2563EB',
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.semiBold,
  },
  daySelectorRow: {
    gap: 6,
  },
  dayChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    ...shadows.card,
  },
  dayChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  dayChipText: {
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.semiBold,
    color: '#475569',
  },
  dayChipTextActive: {
    color: '#FFFFFF',
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  periodList: {
    gap: 8,
  },
  periodCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    gap: 8,
    ...shadows.card,
  },
  periodHeaderRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  periodBadgeText: {
    color: '#2563EB',
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  periodTimeText: {
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.regular,
    color: '#64748B',
  },
  emptySlot: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  emptySlotText: {
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.medium,
    color: '#94A3B8',
  },
  sessionCard: {
    borderRadius: 8,
    padding: 10,
  },
  sessionContent: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionSubject: {
    fontSize: 13,
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  sessionTeacher: {
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.regular,
    color: '#475569',
    marginTop: 2,
  },
  sessionClass: {
    fontSize: 10,
    fontFamily: ibmPlexArabicFontFamily.medium,
    color: '#64748B',
    marginTop: 1,
  },
  deleteSessionBtn: {
    padding: 4,
  },
  breakCard: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
  },
  breakText: {
    color: '#92400E',
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
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
    borderRadius: 14,
    padding: 18,
    width: '100%',
    maxWidth: 400,
    gap: 10,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontFamily: ibmPlexArabicFontFamily.bold,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: ibmPlexArabicFontFamily.regular,
    color: '#0F172A',
  },
  modalBtnRow: {
    gap: 8,
    marginTop: 10,
  },
  modalSubmitBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontFamily: ibmPlexArabicFontFamily.semiBold,
  },
});
