import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useSubjects, useCreateSubject, useUpdateSubject, useDeleteSubject } from '../../hooks/useSubjects';
import { Subject } from '../../types/subject';
import { ibmPlexArabicFontFamily } from '../../theme/typography';
import { shadows } from '../../theme/spacing';

const STAGES = [
  {
    id: 'kg',
    name_ar: 'رياض الأطفال',
    name_en: 'Kindergarten',
    grades: [
      { id: 'kg_prep', name_ar: 'تمهيدي', name_en: 'Prep' },
      { id: 'kg1', name_ar: 'KG1', name_en: 'KG1' },
      { id: 'kg2', name_ar: 'KG2', name_en: 'KG2' },
    ],
  },
  {
    id: 'primary',
    name_ar: 'الابتدائية',
    name_en: 'Primary',
    grades: [
      { id: 'g1', name_ar: 'الصف الأول الابتدائي', name_en: '1st Grade' },
      { id: 'g2', name_ar: 'الصف الثاني الابتدائي', name_en: '2nd Grade' },
      { id: 'g3', name_ar: 'الصف الثالث الابتدائي', name_en: '3rd Grade' },
      { id: 'g4', name_ar: 'الصف الرابع الابتدائي', name_en: '4th Grade' },
      { id: 'g5', name_ar: 'الصف الخامس الابتدائي', name_en: '5th Grade' },
      { id: 'g6', name_ar: 'الصف السادس الابتدائي', name_en: '6th Grade' },
    ],
  },
  {
    id: 'middle',
    name_ar: 'المتوسطة',
    name_en: 'Middle School',
    grades: [
      { id: 'm1', name_ar: 'الصف الأول المتوسط', name_en: '1st Prep' },
      { id: 'm2', name_ar: 'الصف الثاني المتوسط', name_en: '2nd Prep' },
      { id: 'm3', name_ar: 'الصف الثالث المتوسط', name_en: '3rd Prep' },
    ],
  },
  {
    id: 'secondary',
    name_ar: 'الثانوية',
    name_en: 'Secondary',
    grades: [
      { id: 's1', name_ar: 'الصف الأول الثانوي', name_en: '1st Secondary' },
      { id: 's2', name_ar: 'الصف الثاني الثانوي', name_en: '2nd Secondary' },
      { id: 's3', name_ar: 'الصف الثالث الثانوي', name_en: '3rd Secondary' },
    ],
  },
];

const SUBJECT_COLORS = [
  '#2563EB', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
  '#F97316', '#6366F1',
];

interface Props {
  isDark?: boolean;
}

export const SubjectsSection: React.FC<Props> = ({ isDark = false }) => {
  const { t } = useTranslation();
  const { isRTL } = useAppDirection();

  const [selectedStageId, setSelectedStageId] = useState<string>('kg');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('kg_prep');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [nameInput, setNameInput] = useState('');
  const [colorInput, setColorInput] = useState(SUBJECT_COLORS[0]);

  // Real API hooks
  const subjectsQuery = useSubjects({ search: search || undefined });
  const createMutation = useCreateSubject();
  const updateMutation = useUpdateSubject();
  const deleteMutation = useDeleteSubject();

  const currentStage = useMemo(() => {
    return STAGES.find((s) => s.id === selectedStageId) || STAGES[0];
  }, [selectedStageId]);

  const currentGrade = useMemo(() => {
    return currentStage.grades.find((g) => g.id === selectedGradeId) || currentStage.grades[0];
  }, [currentStage, selectedGradeId]);

  const rawSubjects = Array.isArray(subjectsQuery.data) ? subjectsQuery.data : [];

  const filteredSubjects = useMemo(() => {
    if (!search.trim()) return rawSubjects;
    const q = search.toLowerCase();
    return rawSubjects.filter(
      (s) =>
        (s.name || '').toLowerCase().includes(q) ||
        (s.name_en || '').toLowerCase().includes(q)
    );
  }, [rawSubjects, search]);

  const handleOpenAdd = () => {
    setEditingSubject(null);
    setNameInput('');
    setColorInput(SUBJECT_COLORS[0]);
    setModalVisible(true);
  };

  const handleOpenEdit = (sub: Subject) => {
    setEditingSubject(sub);
    setNameInput(sub.name || '');
    setColorInput(sub.color || SUBJECT_COLORS[0]);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nameInput.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى إدخال اسم المادة' : 'Please enter subject name');
      return;
    }
    try {
      if (editingSubject) {
        await updateMutation.mutateAsync({
          id: editingSubject.id,
          name: nameInput.trim(),
          color: colorInput,
        });
        Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم تحديث المادة' : 'Subject updated');
      } else {
        await createMutation.mutateAsync({
          name: nameInput.trim(),
          color: colorInput,
        });
        Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تمت إضافة المادة' : 'Subject added');
      }
      setModalVisible(false);
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل الحفظ' : 'Failed to save'));
    }
  };

  const handleDelete = (sub: Subject) => {
    Alert.alert(
      isRTL ? 'حذف المادة' : 'Delete Subject',
      isRTL ? `هل تريد حذف مادة "${sub.name}"؟` : `Delete subject "${sub.name}"?`,
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(sub.id);
            } catch (err: any) {
              Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل الحذف' : 'Delete failed'));
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Stages Filter Tabs (Top Bar) ── */}
      <View style={styles.sectionCard}>
        <Text style={[styles.sectionLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
          {isRTL ? 'المراحل الدراسية' : 'Educational Stages'}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.pillScroll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          {STAGES.map((stg) => {
            const active = stg.id === selectedStageId;
            return (
              <TouchableOpacity
                key={stg.id}
                style={[styles.stagePill, active && styles.stagePillActive]}
                onPress={() => {
                  setSelectedStageId(stg.id);
                  setSelectedGradeId(stg.grades[0].id);
                }}
              >
                <Text style={[styles.stagePillText, active && styles.stagePillTextActive]}>
                  {isRTL ? stg.name_ar : stg.name_en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Grades under selected Stage ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.pillScroll, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 8 }]}
        >
          {currentStage.grades.map((grd) => {
            const active = grd.id === selectedGradeId;
            return (
              <TouchableOpacity
                key={grd.id}
                style={[styles.gradePill, active && styles.gradePillActive]}
                onPress={() => setSelectedGradeId(grd.id)}
              >
                <Text style={[styles.gradePillText, active && styles.gradePillTextActive]}>
                  {isRTL ? grd.name_ar : grd.name_en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Action Header matching Web screenshot ── */}
      <View style={[styles.actionBar, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={styles.currentGradeTitle}>
          {isRTL ? currentGrade.name_ar : currentGrade.name_en}
        </Text>

        <View style={[styles.actionButtonsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity style={styles.primaryAddBtn} onPress={handleOpenAdd}>
            <Text style={styles.primaryAddBtnText}>＋ {isRTL ? 'أضف مادة' : 'Add Subject'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={() => Alert.alert(isRTL ? 'مواد كل المراحل' : 'All Stages', isRTL ? 'عرض جميع المواد في المدرسة' : 'Displaying all subjects')}
          >
            <Text style={styles.outlineActionBtnText}>✨ {isRTL ? 'مواد كل المراحل' : 'All Stages'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.outlineActionBtn}
            onPress={() => Alert.alert(isRTL ? 'مواد مخصصة' : 'Custom Subjects', isRTL ? 'تخصيص مواد للفصول' : 'Custom subjects')}
          >
            <Text style={styles.outlineActionBtnText}>✨ {isRTL ? 'مواد مخصصة' : 'Custom'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Search Input ── */}
      <View style={styles.searchWrapper}>
        <TextInput
          style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={isRTL ? 'بحث في المواد...' : 'Search subjects...'}
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* ── Subject List Rows (Exact Web Match) ── */}
      {subjectsQuery.isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
        </View>
      ) : filteredSubjects.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyIcon}>📚</Text>
          <Text style={styles.emptyTitle}>
            {isRTL ? 'لا توجد مواد مسجلة' : 'No subjects found'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isRTL ? 'انقر على "أضف مادة" لإنشاء مادة دراسية جديدة' : 'Click "Add Subject" to create a new subject'}
          </Text>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {filteredSubjects.map((sub, idx) => {
            const dotColor = sub.color || SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
            return (
              <View
                key={String(sub.id || idx)}
                style={[styles.subjectRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              >
                {/* Right: Colored square badge + Name */}
                <View style={[styles.subjectInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.colorSquare, { backgroundColor: dotColor }]} />
                  <Text style={[styles.subjectNameText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {sub.name}
                  </Text>
                </View>

                {/* Left: Action buttons (Edit & Delete) */}
                <View style={[styles.rowActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => handleOpenEdit(sub)}
                    accessibilityLabel="Edit subject"
                  >
                    <Text style={styles.editBtnIcon}>✏️</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(sub)}
                    disabled={deleteMutation.isPending}
                    accessibilityLabel="Delete subject"
                  >
                    <Text style={styles.deleteBtnIcon}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* ── Modal: Add / Edit Subject ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeaderTitle}>
              {editingSubject ? (isRTL ? 'تعديل المادة' : 'Edit Subject') : (isRTL ? 'إضافة مادة جديدة' : 'Add Subject')}
            </Text>

            <TextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'اسم المادة' : 'Subject name'}
              placeholderTextColor="#94A3B8"
              value={nameInput}
              onChangeText={setNameInput}
            />

            <Text style={[styles.colorPickerLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'اختر لون المادة:' : 'Select Subject Color:'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.colorPaletteRow}>
              {SUBJECT_COLORS.map((col) => (
                <TouchableOpacity
                  key={col}
                  style={[
                    styles.colorOption,
                    { backgroundColor: col },
                    colorInput === col && styles.colorOptionSelected,
                  ]}
                  onPress={() => setColorInput(col)}
                />
              ))}
            </ScrollView>

            <View style={[styles.modalBtnRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>{isRTL ? 'حفظ' : 'Save'}</Text>
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
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.bold,
    color: '#64748B',
    marginBottom: 6,
  },
  pillScroll: {
    gap: 6,
  },
  stagePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stagePillActive: {
    backgroundColor: '#1E40AF',
    borderColor: '#1E40AF',
  },
  stagePillText: {
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.semiBold,
    color: '#475569',
  },
  stagePillTextActive: {
    color: '#FFFFFF',
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  gradePill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  gradePillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  gradePillText: {
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.medium,
    color: '#64748B',
  },
  gradePillTextActive: {
    color: '#2563EB',
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  actionBar: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  currentGradeTitle: {
    fontSize: 16,
    fontFamily: ibmPlexArabicFontFamily.bold,
    color: '#0F172A',
  },
  actionButtonsRow: {
    gap: 6,
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  primaryAddBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },
  primaryAddBtnText: {
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
  searchWrapper: {
    marginVertical: 2,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: ibmPlexArabicFontFamily.regular,
    color: '#0F172A',
  },
  listContainer: {
    gap: 8,
  },
  subjectRow: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.card,
  },
  subjectInfo: {
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  colorSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
  subjectNameText: {
    fontSize: 14,
    fontFamily: ibmPlexArabicFontFamily.bold,
    color: '#0F172A',
    flex: 1,
  },
  rowActions: {
    gap: 6,
    alignItems: 'center',
  },
  editBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtnIcon: {
    fontSize: 14,
  },
  deleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtnIcon: {
    fontSize: 14,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyStateContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 6,
  },
  emptyIcon: {
    fontSize: 36,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: ibmPlexArabicFontFamily.bold,
    color: '#475569',
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.regular,
    color: '#94A3B8',
    textAlign: 'center',
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
  colorPickerLabel: {
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.semiBold,
    color: '#64748B',
    marginTop: 4,
  },
  colorPaletteRow: {
    gap: 8,
    paddingVertical: 4,
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#0F172A',
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
