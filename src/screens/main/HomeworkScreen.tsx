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
  useHomeworkList,
  useCreateHomework,
  useDeleteHomework,
  useHomeworkSubmissions,
} from '../../hooks/useHomework';
import { HomeworkItem, HomeworkStatus } from '../../types/homework';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';

type HomeworkTopTab = 'homework' | 'analytics';
type HomeworkFilter = 'all' | 'published' | 'draft' | 'closed';

export default function HomeworkScreen() {
  const { t } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission('homework.create') || true;

  const [topTab, setTopTab] = useState<HomeworkTopTab>('homework');
  const [activeFilter, setActiveFilter] = useState<HomeworkFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Homework Details & Submissions State
  const [selectedHomework, setSelectedHomework] = useState<HomeworkItem | null>(null);

  // Creation Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [subjectInput, setSubjectInput] = useState('الرياضيات');
  const [classInput, setClassInput] = useState('الصف الأول المتوسط');
  const [descInput, setDescInput] = useState('');
  const [dueDateInput, setDueDateInput] = useState('2026-08-31');

  // Queries & Mutations
  const homeworkQuery = useHomeworkList();
  const createMutation = useCreateHomework();
  const deleteMutation = useDeleteHomework();

  const submissionsQuery = useHomeworkSubmissions(selectedHomework?.id);

  const homeworkList = Array.isArray(homeworkQuery.data) ? homeworkQuery.data : [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await homeworkQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [homeworkQuery]);

  const handleCreateHomework = async () => {
    if (!titleInput.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى كتابة عنوان الواجب' : 'Please enter homework title');
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: titleInput.trim(),
        description: descInput.trim(),
        subject_name: subjectInput,
        class_name: classInput,
        due_date: dueDateInput,
        status: 'published',
      });

      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم إضافة ونشر الواجب بنجاح' : 'Homework published successfully');
      setModalVisible(false);
      setTitleInput('');
      setDescInput('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'تعذر إضافة الواجب' : 'Failed to create homework'));
    }
  };

  const getStatusBadge = (status: HomeworkStatus) => {
    switch (status) {
      case 'published':
        return { label: isRTL ? 'منشور' : 'Published', bg: '#ECFDF5', color: '#059669' };
      case 'overdue':
      case 'closed':
        return { label: isRTL ? 'مغلق' : 'Closed', bg: '#FEE2E2', color: '#DC2626' };
      default:
        return { label: isRTL ? 'مسودة' : 'Draft', bg: '#F1F5F9', color: '#64748B' };
    }
  };

  const filteredHomework = homeworkList.filter((h: HomeworkItem) => {
    if (searchQuery.trim()) {
      const matchSearch = (h.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (h.subject_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
    }
    if (activeFilter === 'published') return h.status === 'published';
    if (activeFilter === 'draft') return h.status === 'draft';
    if (activeFilter === 'closed') return h.status === 'overdue' || h.status === 'closed';
    return true;
  });

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* Header matching Screenshot 3 */}
      <View style={[styles.header, isDark && styles.darkCard]}>
        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleBlock}>
            <AppText variant="h1" weight="bold" style={styles.title} color={isDark ? '#F8FAFC' : '#0A1D3D'}>
              {isRTL ? 'الواجبات الدراسية' : 'Homework & Assignments'}
            </AppText>
            <AppText variant="subtitle" color={isDark ? '#94A3B8' : '#77839B'} style={styles.subtitle}>
              {isRTL ? 'إدارة واجبات الفصول التي تدرسها' : 'Manage assignments for your classes'}
            </AppText>
          </View>

          {/* Top Tabs: الواجبات / التحليلات */}
          <View style={styles.topTabsGroup}>
            <TouchableOpacity
              style={[styles.topTabBtn, topTab === 'homework' && styles.topTabBtnActive]}
              onPress={() => setTopTab('homework')}
            >
              <AppText variant="captionBold" color={topTab === 'homework' ? '#FFFFFF' : '#64748B'}>
                {isRTL ? 'الواجبات' : 'Homework'}
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topTabBtn, topTab === 'analytics' && styles.topTabBtnActive]}
              onPress={() => setTopTab('analytics')}
            >
              <AppText variant="captionBold" color={topTab === 'analytics' ? '#FFFFFF' : '#64748B'}>
                {isRTL ? 'التحليلات' : 'Analytics'}
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Button & Search / Filter Bar */}
        <View style={styles.controlsRow}>
          {canCreate && (
            <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
              <AppText variant="captionBold" color="#FFFFFF">
                ＋ {isRTL ? 'واجب جديد' : 'New Homework'}
              </AppText>
            </TouchableOpacity>
          )}

          {/* Filter Pills: الكل / منشور / مسودة / مغلق */}
          <View style={styles.filterPillsRow}>
            {(
              [
                { id: 'all', labelAr: 'الكل', labelEn: 'All' },
                { id: 'published', labelAr: 'منشور', labelEn: 'Published' },
                { id: 'draft', labelAr: 'مسودة', labelEn: 'Draft' },
                { id: 'closed', labelAr: 'مغلق', labelEn: 'Closed' },
              ] as const
            ).map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterPill, activeFilter === f.id && styles.filterPillActive]}
                onPress={() => setActiveFilter(f.id)}
              >
                <AppText
                  variant="captionBold"
                  color={activeFilter === f.id ? '#1246B7' : '#64748B'}
                >
                  {isRTL ? f.labelAr : f.labelEn}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Search Bar */}
        <View style={[styles.searchBox, isDark && styles.darkSearchBox]}>
          <Icon name="search" size={14} color="#94A3B8" />
          <TextInput
            style={[styles.searchInput, isRTL && styles.rtlText, isDark && styles.darkSearchInput]}
            placeholder={isRTL ? 'بحث باسم الواجب...' : 'Search by homework title...'}
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}
      >
        {filteredHomework.length > 0 ? (
          filteredHomework.map((hw: HomeworkItem) => {
            const badge = getStatusBadge(hw.status);
            return (
              <TouchableOpacity
                key={String(hw.id)}
                style={[styles.card, isDark && styles.darkCard]}
                onPress={() => setSelectedHomework(hw)}
              >
                <View style={styles.cardHeaderRow}>
                  <AppText variant="cardTitle" weight="bold" color={isDark ? '#F8FAFC' : '#0A1D3D'} style={styles.cardTitle}>
                    {hw.title}
                  </AppText>
                  <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                <AppText variant="caption" color="#1246B7" style={styles.subText}>
                  {`${hw.subject_name || (isRTL ? 'عام' : 'General')} • ${hw.class_name || (isRTL ? 'الصف' : 'Class')}`}
                </AppText>

                {hw.description ? (
                  <AppText variant="body" color={isDark ? '#94A3B8' : '#344054'} style={styles.cardDesc}>
                    {hw.description}
                  </AppText>
                ) : null}

                <View style={styles.statsRow}>
                  <AppText variant="caption" color="#77839B">
                    📅 {`${isRTL ? 'آخر موعد' : 'Due'}: ${hw.due_date || '—'}`}
                  </AppText>
                  <AppText variant="caption" color="#059669">
                    📥 {`${isRTL ? 'التسليمات' : 'Submissions'}: ${hw.submissions_count || 0}`}
                  </AppText>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          /* Empty State matching Screenshot 3 */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconBox}>
              <Icon name="award" size={36} color="#94A3B8" />
            </View>
            <AppText variant="cardTitle" weight="bold" color={isDark ? '#F8FAFC' : '#0A1D3D'} style={styles.emptyTitle}>
              {isRTL ? 'لا توجد واجبات' : 'No homework assignments'}
            </AppText>
            <AppText variant="caption" color="#77839B" style={styles.emptyDesc}>
              {isRTL ? 'ابدأ بإنشاء واجب لفصولك' : 'Start by creating assignments for your classes'}
            </AppText>
            {canCreate && (
              <TouchableOpacity style={styles.emptyCreateBtn} onPress={() => setModalVisible(true)}>
                <AppText variant="captionBold" color="#1246B7">
                  ＋ {isRTL ? 'إنشاء واجب جديد' : 'Create New Assignment'}
                </AppText>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Creation Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" color={isDark ? '#F8FAFC' : '#0A1D3D'} style={{ textAlign: 'center' }}>
              {isRTL ? 'إنشاء واجب مدرسي جديد' : 'New Homework Assignment'}
            </AppText>

            <Text style={[styles.label, isDark && styles.darkSubtext]}>
              {isRTL ? 'عنوان الواجب *' : 'Homework Title *'}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.rtlText, isDark && styles.darkInput]}
              value={titleInput}
              onChangeText={setTitleInput}
              placeholder={isRTL ? 'مثال: حل تمارين الوحدة الأولى...' : 'e.g. Chapter 1 exercises...'}
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.label, isDark && styles.darkSubtext]}>
              {isRTL ? 'المادة الدراسية' : 'Subject'}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.rtlText, isDark && styles.darkInput]}
              value={subjectInput}
              onChangeText={setSubjectInput}
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.label, isDark && styles.darkSubtext]}>
              {isRTL ? 'الفصل المستهدف' : 'Target Class'}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.rtlText, isDark && styles.darkInput]}
              value={classInput}
              onChangeText={setClassInput}
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.label, isDark && styles.darkSubtext]}>
              {isRTL ? 'تاريخ التسليم' : 'Due Date'}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.rtlText, isDark && styles.darkInput]}
              value={dueDateInput}
              onChangeText={setDueDateInput}
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.label, isDark && styles.darkSubtext]}>
              {isRTL ? 'تعليمات الواجب' : 'Instructions'}
            </Text>
            <TextInput
              style={[styles.input, { height: 65 }, isRTL && styles.rtlText, isDark && styles.darkInput]}
              value={descInput}
              onChangeText={setDescInput}
              multiline
              placeholder={isRTL ? 'اكتب تعليمات ومصادر الواجب هنا...' : 'Write assignment details here...'}
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveSubmitBtn} onPress={handleCreateHomework} disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveSubmitBtnText}>{isRTL ? 'نشر وإرسال الواجب' : 'Publish Assignment'}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
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
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  darkCard: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  headerTitleBlock: { flex: 1, minWidth: 150 },
  title: { fontSize: 23, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  subtitle: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular, marginTop: 2 },
  topTabsGroup: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  topTabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  topTabBtnActive: {
    backgroundColor: '#1246B7',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  createBtn: {
    backgroundColor: '#1246B7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  darkSearchBox: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  darkSearchInput: {
    color: '#F8FAFC',
  },
  content: { padding: 14, gap: 10 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
    gap: 6,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { flex: 1 },
  badgePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  subText: { fontSize: 12, fontWeight: '600' },
  cardDesc: { fontSize: 13 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 6,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 16 },
  emptyDesc: { fontSize: 13, textAlign: 'center' },
  emptyCreateBtn: {
    marginTop: 10,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 8, maxWidth: 450, alignSelf: 'center', width: '100%' },
  label: { fontSize: 12, fontWeight: '600', color: '#344054', marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, padding: 8, fontSize: 13, backgroundColor: '#F8FAFC' },
  darkInput: { backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' },
  modalActions: { gap: 6, marginTop: 12 },
  saveSubmitBtn: { backgroundColor: '#1246B7', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  saveSubmitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  cancelBtn: { paddingVertical: 6, alignItems: 'center' },
  cancelBtnText: { color: '#77839B', fontSize: 12 },
  rtlText: { textAlign: 'right' },
  darkSubtext: { color: '#94A3B8' },
});
