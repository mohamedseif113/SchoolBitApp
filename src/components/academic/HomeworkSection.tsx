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
import { useHomeworkList, useCreateHomework, useDeleteHomework } from '../../hooks/useHomework';
import { HomeworkItem } from '../../types/homework';
import { ibmPlexArabicFontFamily } from '../../theme/typography';
import { shadows } from '../../theme/spacing';

type SubTab = 'homework' | 'analytics' | 'policy';
type FilterStatus = 'all' | 'published' | 'draft' | 'closed';

interface Props {
  isDark?: boolean;
}

export const HomeworkSection: React.FC<Props> = ({ isDark = false }) => {
  const { t } = useTranslation();
  const { isRTL } = useAppDirection();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>('homework');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [search, setSearch] = useState<string>('');

  // Modal State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [className, setClassName] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');

  // Real API hooks
  const homeworkQuery = useHomeworkList(filterStatus !== 'all' ? { status: filterStatus } : {});
  const createMutation = useCreateHomework();
  const deleteMutation = useDeleteHomework();

  const rawHomework = Array.isArray(homeworkQuery.data) ? homeworkQuery.data : [];

  const filteredHomework = useMemo(() => {
    if (!search.trim()) return rawHomework;
    const q = search.toLowerCase();
    return rawHomework.filter(
      (h) =>
        (h.title || '').toLowerCase().includes(q) ||
        (h.subject || '').toLowerCase().includes(q) ||
        (h.class_name || '').toLowerCase().includes(q)
    );
  }, [rawHomework, search]);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى إدخال عنوان الواجب' : 'Please enter homework title');
      return;
    }
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        subject: subject.trim() || undefined,
        class_name: className.trim() || undefined,
        due_date: dueDate || undefined,
        description: description.trim() || undefined,
      } as any);
      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم إنشاء الواجب بنجاح' : 'Homework created successfully');
      setModalVisible(false);
      setTitle('');
      setSubject('');
      setClassName('');
      setDescription('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل إنشاء الواجب' : 'Failed to create homework'));
    }
  };

  const handleDelete = (hw: HomeworkItem) => {
    Alert.alert(
      isRTL ? 'حذف الواجب' : 'Delete Homework',
      isRTL ? `هل تريد حذف "${hw.title}"؟` : `Delete homework "${hw.title}"?`,
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(hw.id);
            } catch (err: any) {
              Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل الحذف' : 'Failed to delete'));
            }
          },
        },
      ]
    );
  };

  const getStatusBadge = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'published':
      case 'منشور':
        return { bg: '#DCFCE7', color: '#16A34A', label: isRTL ? 'منشور' : 'Published' };
      case 'draft':
      case 'مسودة':
        return { bg: '#FEF3C7', color: '#D97706', label: isRTL ? 'مسودة' : 'Draft' };
      case 'closed':
      case 'مغلق':
        return { bg: '#FEE2E2', color: '#DC2626', label: isRTL ? 'مغلق' : 'Closed' };
      default:
        return { bg: '#F1F5F9', color: '#475569', label: status || (isRTL ? 'منشور' : 'Published') };
    }
  };

  return (
    <View style={styles.container}>
      {/* ── Sub-tabs matching Web screenshot ── */}
      <View style={[styles.subTabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {[
          { key: 'homework' as SubTab, label_ar: 'الواجبات', label_en: 'Homework' },
          { key: 'analytics' as SubTab, label_ar: 'التحليلات', label_en: 'Analytics' },
          { key: 'policy' as SubTab, label_ar: 'السياسة', label_en: 'Policy' },
        ].map((st) => {
          const active = activeSubTab === st.key;
          return (
            <TouchableOpacity
              key={st.key}
              style={[styles.subTabPill, active && styles.subTabPillActive]}
              onPress={() => setActiveSubTab(st.key)}
            >
              <Text style={[styles.subTabPillText, active && styles.subTabPillTextActive]}>
                {isRTL ? st.label_ar : st.label_en}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {activeSubTab === 'homework' && (
        <>
          {/* ── Section Card Header & Action (Web match) ── */}
          <View style={[styles.sectionHeaderCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={styles.sectionTitle}>
                🎒 {isRTL ? 'الواجبات الدراسية' : 'Homework Management'}
              </Text>
              <Text style={styles.sectionSubtitle}>
                {isRTL ? 'إدارة واجبات الفصول التي تدرّسها' : 'Manage homework for your assigned classes'}
              </Text>
            </View>

            <TouchableOpacity style={styles.createHomeworkBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.createHomeworkBtnText}>＋ {isRTL ? 'واجب جديد' : 'New Homework'}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Search & Filter Pills ── */}
          <View style={styles.controlsCard}>
            <TextInput
              style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'بحث باسم الواجب...' : 'Search by homework title...'}
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
            />

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.filtersRow, { flexDirection: isRTL ? 'row-reverse' : 'row', marginTop: 8 }]}
            >
              {[
                { key: 'all' as FilterStatus, label_ar: 'الكل', label_en: 'All' },
                { key: 'published' as FilterStatus, label_ar: 'منشور', label_en: 'Published' },
                { key: 'draft' as FilterStatus, label_ar: 'مسودة', label_en: 'Draft' },
                { key: 'closed' as FilterStatus, label_ar: 'مغلق', label_en: 'Closed' },
              ].map((f) => {
                const active = filterStatus === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => setFilterStatus(f.key)}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {isRTL ? f.label_ar : f.label_en}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* ── Homework List or Empty State ── */}
          {homeworkQuery.isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563EB" />
            </View>
          ) : filteredHomework.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>
                {isRTL ? 'لا توجد واجبات' : 'No homework available'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isRTL ? 'ابدأ بإنشاء واجب لفصولك' : 'Start by creating a new homework for your classes'}
              </Text>
            </View>
          ) : (
            <View style={styles.homeworkList}>
              {filteredHomework.map((hw, idx) => {
                const badge = getStatusBadge(hw.status || '');
                return (
                  <View key={String(hw.id || idx)} style={styles.homeworkCard}>
                    <View style={[styles.homeworkTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                        <Text style={styles.homeworkTitleText} numberOfLines={2}>
                          {hw.title}
                        </Text>
                        {hw.subject && (
                          <Text style={styles.homeworkSubjectText}>
                            📚 {hw.subject}
                          </Text>
                        )}
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.statusBadgeText, { color: badge.color }]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>

                    {/* Details Row: Class, Due Date, Actions */}
                    <View style={[styles.homeworkBottomRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.detailsGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {hw.class_name && (
                          <View style={styles.classChip}>
                            <Text style={styles.classChipText}>🏫 {hw.class_name}</Text>
                          </View>
                        )}
                        <Text style={styles.dueDateText}>
                          🗓️ {isRTL ? 'آخر موعد:' : 'Due:'} {hw.due_date || '—'}
                        </Text>
                      </View>

                      <TouchableOpacity style={styles.deleteHwBtn} onPress={() => handleDelete(hw)}>
                        <Text style={{ fontSize: 14 }}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </>
      )}

      {activeSubTab === 'analytics' && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyTitle}>
            {isRTL ? 'تحليلات الواجبات' : 'Homework Analytics'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isRTL ? 'إحصائيات التسليم ونسب الإنجاز ستظهر هنا' : 'Submission statistics and completion rates'}
          </Text>
        </View>
      )}

      {activeSubTab === 'policy' && (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.emptyIcon}>📜</Text>
          <Text style={styles.emptyTitle}>
            {isRTL ? 'سياسة الواجبات الدراسية' : 'Homework Policy'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isRTL ? 'ضوابط وسياسات الواجبات والتسليم المتأخر' : 'Guidelines and late submission policies'}
          </Text>
        </View>
      )}

      {/* ── Modal: Create Homework ── */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalHeaderTitle}>
              {isRTL ? 'إنشاء واجب دراسي جديد' : 'Create New Homework'}
            </Text>

            <TextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'عنوان الواجب *' : 'Homework Title *'}
              placeholderTextColor="#94A3B8"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'المادة الدراسية' : 'Subject'}
              placeholderTextColor="#94A3B8"
              value={subject}
              onChangeText={setSubject}
            />

            <TextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'الفصل الدراسي' : 'Target Class'}
              placeholderTextColor="#94A3B8"
              value={className}
              onChangeText={setClassName}
            />

            <TextInput
              style={[styles.modalInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'تاريخ التسليم (YYYY-MM-DD)' : 'Due Date (YYYY-MM-DD)'}
              placeholderTextColor="#94A3B8"
              value={dueDate}
              onChangeText={setDueDate}
            />

            <TextInput
              style={[styles.modalInput, { height: 70, textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'تفاصيل ووصف الواجب' : 'Homework instructions/description'}
              placeholderTextColor="#94A3B8"
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <View style={[styles.modalBtnRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>{isRTL ? 'إنشاء' : 'Create'}</Text>
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
  subTabsRow: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  subTabPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subTabPillActive: {
    backgroundColor: '#2563EB',
  },
  subTabPillText: {
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.semiBold,
    color: '#64748B',
  },
  subTabPillTextActive: {
    color: '#FFFFFF',
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  sectionHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
    ...shadows.card,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: ibmPlexArabicFontFamily.bold,
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.regular,
    color: '#64748B',
    marginTop: 2,
  },
  createHomeworkBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  createHomeworkBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  searchInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: ibmPlexArabicFontFamily.regular,
    color: '#0F172A',
  },
  filtersRow: {
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.medium,
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#2563EB',
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  homeworkList: {
    gap: 8,
  },
  homeworkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    ...shadows.card,
  },
  homeworkTopRow: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  homeworkTitleText: {
    fontSize: 14,
    fontFamily: ibmPlexArabicFontFamily.bold,
    color: '#0F172A',
  },
  homeworkSubjectText: {
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.medium,
    color: '#2563EB',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: ibmPlexArabicFontFamily.bold,
  },
  homeworkBottomRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailsGroup: {
    alignItems: 'center',
    gap: 8,
  },
  classChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  classChipText: {
    fontSize: 10,
    fontFamily: ibmPlexArabicFontFamily.medium,
    color: '#475569',
  },
  dueDateText: {
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.regular,
    color: '#64748B',
  },
  deleteHwBtn: {
    padding: 4,
  },
  emptyStateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 40,
    alignItems: 'center',
    gap: 6,
    ...shadows.card,
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
