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
  useCommittees,
  useCreateCommittee,
  useDeleteCommittee,
  useCommitteeMembers,
  useCommitteeTasks,
  useCommitteeMeetings,
} from '../../hooks/useCommittees';
import { Committee } from '../../types/committee';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';

export default function CommitteesScreen() {
  const { t } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission('committees.create') || true;

  const [refreshing, setRefreshing] = useState(false);

  // Committee Detail Sheet State
  const [selectedCommittee, setSelectedCommittee] = useState<Committee | null>(null);
  const [detailTab, setDetailTab] = useState<'overview' | 'members' | 'tasks' | 'meetings'>('overview');

  // New Committee Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [committeeName, setCommitteeName] = useState('');
  const [committeeDesc, setCommitteeDesc] = useState('');

  // Queries & Mutations
  const committeesQuery = useCommittees();
  const createMutation = useCreateCommittee();
  const deleteMutation = useDeleteCommittee();

  // Sub-resource queries for selected committee
  const membersQuery = useCommitteeMembers(selectedCommittee?.id);
  const tasksQuery = useCommitteeTasks(selectedCommittee?.id);
  const meetingsQuery = useCommitteeMeetings(selectedCommittee?.id);

  const committeesList = Array.isArray(committeesQuery.data) ? committeesQuery.data : [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await committeesQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [committeesQuery]);

  const handleCreateCommittee = async () => {
    if (!committeeName.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), t('committees.nameRequired', 'يرجى كتابة اسم اللجنة'));
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: committeeName.trim(),
        description: committeeDesc.trim(),
        status: 'active',
      });

      Alert.alert(t('common.success', 'نجاح'), t('committees.success', 'تم تشكيل اللجنة بنجاح'));
      setCreateModalVisible(false);
      setCommitteeName('');
      setCommitteeDesc('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || t('committees.error', 'تعذر إنشاء اللجنة'));
    }
  };

  const getCommitteeStatusLabel = (st?: string) => {
    const s = (st || '').toLowerCase();
    if (s === 'active') return isRTL ? 'نشطة' : 'Active';
    if (s === 'new') return isRTL ? 'جديدة' : 'New';
    if (s === 'archived' || s === 'inactive') return isRTL ? 'مؤرشفة' : 'Archived';
    return st || (isRTL ? 'جديدة' : 'New');
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.darkCard]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerTitleBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="h1" weight="bold" style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('committees.title', 'إدارة اللجان المدرسية')}
            </AppText>
            <AppText variant="subtitle" color={isDark ? '#94A3B8' : '#77839B'} style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'تشكيل اللجان ومتابعة اجتماعاتها وأعضائها ومهامها' : 'Manage school committees, meetings & tasks'}
            </AppText>
          </View>

          {canCreate && (
            <TouchableOpacity style={styles.createBtn} onPress={() => setCreateModalVisible(true)}>
              <Text style={styles.createBtnText}>＋ {t('committees.add', 'تشكيل لجنة جديدة')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}
      >
        {committeesQuery.isLoading ? (
          <ActivityIndicator size="large" color="#1246B7" style={{ marginTop: 30 }} />
        ) : committeesList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏛️</Text>
            <AppText variant="cardTitle" weight="bold" color="#77839B" style={styles.emptyTitle}>
              {t('committees.no_committees', 'لا توجد لجان مسجلة حالياً')}
            </AppText>
          </View>
        ) : (
          committeesList.map((comm, idx) => (
            <TouchableOpacity
              key={String(comm.id || idx)}
              style={[styles.card, isDark && styles.darkCard]}
              onPress={() => setSelectedCommittee(comm)}
            >
              <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="cardTitle" weight="bold" style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                  🏛️ {comm.name}
                </AppText>
                <View style={styles.statusTag}>
                  <Text style={styles.statusTagText}>{getCommitteeStatusLabel(comm.status)}</Text>
                </View>
              </View>

              <AppText variant="body" color={isDark ? '#CBD5E1' : '#344054'} style={[styles.cardDesc, { textAlign: isRTL ? 'right' : 'left' }]}>
                {comm.description || (isRTL ? 'لا يوجد وصف تفصيلي للجنة.' : 'No detailed description.')}
              </AppText>
              
              <AppText variant="captionBold" color="#1246B7" style={[styles.chairmanText, { textAlign: isRTL ? 'right' : 'left' }]}>
                {isRTL ? 'رئيس اللجنة:' : 'Chairman:'} {comm.chairman_name || (isRTL ? 'لم يحدد' : 'Not set')}
              </AppText>

              {/* Stats Footer Grid - RTL Order & Placement */}
              <View style={[styles.cardFooterGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <AppText variant="caption" color="#77839B" style={styles.gridMetaText}>
                  📌 {comm.tasks_count || 0} {isRTL ? 'مهام' : 'tasks'}
                </AppText>
                <AppText variant="caption" color="#77839B" style={styles.gridMetaText}>
                  📅 {comm.meetings_count || 0} {isRTL ? 'اجتماعات' : 'meetings'}
                </AppText>
                <AppText variant="caption" color="#77839B" style={styles.gridMetaText}>
                  👥 {comm.members_count || 0} {isRTL ? 'أعضاء' : 'members'}
                </AppText>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Committee Detail Sheet Modal */}
      <Modal visible={!!selectedCommittee} transparent animationType="slide" onRequestClose={() => setSelectedCommittee(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, isDark && styles.darkCard]}>
            <View style={[styles.modalHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <AppText variant="h2" weight="bold" style={[styles.modalTitleText, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                {selectedCommittee?.name}
              </AppText>
            </View>

            {/* Detail Sub Tabs */}
            <View style={[styles.detailTabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity style={[styles.dTab, detailTab === 'overview' && styles.dTabActive]} onPress={() => setDetailTab('overview')}>
                <Text style={detailTab === 'overview' ? styles.dTabTextActive : styles.dTabText}>{isRTL ? 'نظرة عامة' : 'Overview'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dTab, detailTab === 'members' && styles.dTabActive]} onPress={() => setDetailTab('members')}>
                <Text style={detailTab === 'members' ? styles.dTabTextActive : styles.dTabText}>{t('committees.members', 'الأعضاء')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dTab, detailTab === 'tasks' && styles.dTabActive]} onPress={() => setDetailTab('tasks')}>
                <Text style={detailTab === 'tasks' ? styles.dTabTextActive : styles.dTabText}>{t('committees.tasks', 'المهام')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dTab, detailTab === 'meetings' && styles.dTabActive]} onPress={() => setDetailTab('meetings')}>
                <Text style={detailTab === 'meetings' ? styles.dTabTextActive : styles.dTabText}>{t('committees.meetings', 'الاجتماعات')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.sheetScrollContent}>
              {detailTab === 'overview' && (
                <View style={{ gap: 10 }}>
                  <AppText variant="body" color={isDark ? '#CBD5E1' : '#344054'} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {selectedCommittee?.description}
                  </AppText>
                  <AppText variant="caption" color="#77839B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'رئيس اللجنة:' : 'Chairman:'} <AppText variant="bodyBold" color={isDark ? '#FFF' : '#0A1D3D'}>{selectedCommittee?.chairman_name || (isRTL ? 'غير محدد' : 'Not set')}</AppText>
                  </AppText>
                </View>
              )}

              {detailTab === 'members' && (
                <View style={{ gap: 8 }}>
                  {membersQuery.isLoading ? (
                    <ActivityIndicator size="small" color="#1246B7" />
                  ) : Array.isArray(membersQuery.data) && membersQuery.data.length > 0 ? (
                    membersQuery.data.map((m, idx) => (
                      <View key={String(m.id || idx)} style={[styles.itemRow, isDark && styles.darkSubCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <AppText variant="bodyBold">👤 {m.user_name || `${isRTL ? 'عضو' : 'Member'} #${m.user_id}`}</AppText>
                        <AppText variant="captionBold" color="#1246B7">{m.role}</AppText>
                      </View>
                    ))
                  ) : (
                    <AppText variant="caption" color="#77839B" style={{ textAlign: 'center' }}>{t('committees.no_members', 'لا يوجد أعضاء مضافون')}</AppText>
                  )}
                </View>
              )}

              {detailTab === 'tasks' && (
                <View style={{ gap: 8 }}>
                  {tasksQuery.isLoading ? (
                    <ActivityIndicator size="small" color="#1246B7" />
                  ) : Array.isArray(tasksQuery.data) && tasksQuery.data.length > 0 ? (
                    tasksQuery.data.map((tk, idx) => (
                      <View key={String(tk.id || idx)} style={[styles.itemRow, isDark && styles.darkSubCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <AppText variant="bodyBold">📌 {tk.title}</AppText>
                        <AppText variant="captionBold" color="#1246B7">{tk.status}</AppText>
                      </View>
                    ))
                  ) : (
                    <AppText variant="caption" color="#77839B" style={{ textAlign: 'center' }}>{t('committees.no_tasks', 'لا توجد مهام لجنة')}</AppText>
                  )}
                </View>
              )}

              {detailTab === 'meetings' && (
                <View style={{ gap: 8 }}>
                  {meetingsQuery.isLoading ? (
                    <ActivityIndicator size="small" color="#1246B7" />
                  ) : Array.isArray(meetingsQuery.data) && meetingsQuery.data.length > 0 ? (
                    meetingsQuery.data.map((mt, idx) => (
                      <View key={String(mt.id || idx)} style={[styles.itemRow, isDark && styles.darkSubCard, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <AppText variant="bodyBold">📅 {mt.title}</AppText>
                        <AppText variant="captionBold" color="#1246B7">{mt.meeting_date}</AppText>
                      </View>
                    ))
                  ) : (
                    <AppText variant="caption" color="#77839B" style={{ textAlign: 'center' }}>{t('committees.no_meetings', 'لا توجد اجتماعات مسجلة')}</AppText>
                  )}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setSelectedCommittee(null)}>
              <Text style={styles.closeSheetBtnText}>{isRTL ? 'إغلاق' : 'Close'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Creation Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={{ textAlign: 'center', marginBottom: 6 }}>
              {t('committees.add', 'تشكيل لجنة مدرسية جديدة')}
            </AppText>

            <AppText variant="label" style={{ textAlign: isRTL ? 'right' : 'left' }}>{isRTL ? 'اسم اللجنة' : 'Committee Name'} *</AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
              value={committeeName}
              onChangeText={setCommitteeName}
              placeholder={isRTL ? 'اسم اللجنة...' : 'Committee name...'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <AppText variant="label" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 6 }}>{isRTL ? 'الهدف والوصف التفصيلي' : 'Description'}</AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left', height: 80 }]}
              value={committeeDesc}
              onChangeText={setCommitteeDesc}
              placeholder={isRTL ? 'الوصف والمهام...' : 'Description & scope...'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              multiline
            />

            <View style={{ gap: 8, marginTop: 12 }}>
              <TouchableOpacity style={styles.saveSubmitBtn} onPress={handleCreateCommittee} disabled={createMutation.isPending}>
                {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveSubmitBtnText}>{isRTL ? 'حفظ وتشكيل اللجنة' : 'Create Committee'}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateModalVisible(false)}>
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
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 14 : 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  darkCard: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  darkSubCard: { backgroundColor: '#091A38', borderColor: '#1E3A6E' },
  darkInput: { backgroundColor: '#091A38', borderColor: '#1E3A6E', color: '#F8FAFC' },
  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  headerTitleBlock: { flex: 1 },
  title: { fontSize: 22, fontFamily: ibmPlexArabicFontFamily.bold },
  subtitle: { fontSize: 13, fontFamily: ibmPlexArabicFontFamily.regular, marginTop: 2 },
  createBtn: { backgroundColor: '#1246B7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { color: '#FFFFFF', fontSize: 13, fontFamily: ibmPlexArabicFontFamily.bold },
  content: { padding: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.card, gap: 6, marginBottom: 10 },
  cardHeaderRow: { justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, flex: 1 },
  statusTag: { backgroundColor: '#EEF4FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusTagText: { fontSize: 12, fontFamily: ibmPlexArabicFontFamily.bold, color: '#1246B7' },
  cardDesc: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular },
  chairmanText: { fontSize: 13, fontFamily: ibmPlexArabicFontFamily.semiBold },
  cardFooterGrid: { gap: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8, marginTop: 4 },
  gridMetaText: { fontSize: 13, fontFamily: ibmPlexArabicFontFamily.regular },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyIcon: { fontSize: 44, marginBottom: 4 },
  emptyTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeaderRow: { justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitleText: { fontSize: 19, fontFamily: ibmPlexArabicFontFamily.bold, flex: 1 },
  detailTabsRow: { gap: 6, marginVertical: 12 },
  dTab: { flex: 1, paddingVertical: 7, borderRadius: 6, backgroundColor: '#F1F5F9', alignItems: 'center' },
  dTabActive: { backgroundColor: '#1246B7' },
  dTabText: { fontSize: 12, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#5A6784' },
  dTabTextActive: { fontSize: 12, fontFamily: ibmPlexArabicFontFamily.bold, color: '#fff' },
  sheetScrollContent: { paddingVertical: 10, minHeight: 120 },
  itemRow: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, justifyContent: 'space-between', alignItems: 'center' },
  closeSheetBtn: { backgroundColor: '#F1F5F9', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  closeSheetBtnText: { color: '#5A6784', fontFamily: ibmPlexArabicFontFamily.bold, fontSize: 14 },
  modalCard: { backgroundColor: '#fff', margin: 20, borderRadius: 16, padding: 20, gap: 8 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular, backgroundColor: '#F8FAFC' },
  saveSubmitBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveSubmitBtnText: { color: '#fff', fontFamily: ibmPlexArabicFontFamily.bold, fontSize: 15 },
  cancelBtn: { backgroundColor: '#F1F5F9', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#77839B', fontFamily: ibmPlexArabicFontFamily.semiBold, fontSize: 14 },
});
