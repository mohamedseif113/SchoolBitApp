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
import {
  useCommittees,
  useCreateCommittee,
  useDeleteCommittee,
  useCommitteeMembers,
  useCommitteeTasks,
  useCommitteeMeetings,
  useCreateCommitteeTask,
  useCreateCommitteeMeeting,
} from '../../hooks/useCommittees';
import { Committee } from '../../types/committee';

export default function CommitteesScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();

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

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerRow]}>
          <View>
            <Text style={[styles.title, isRTL ? styles.rtlText : styles.ltrText]}>
              {t('committees.title', 'إدارة اللجان المدرسية')}
            </Text>
            <Text style={[styles.subtitle, isRTL ? styles.rtlText : styles.ltrText]}>
              تشكيل اللجان ومتابعة اجتماعاتها وأعضائها ومهامها
            </Text>
          </View>

          {canCreate && (
            <TouchableOpacity style={styles.createBtn} onPress={() => setCreateModalVisible(true)}>
              <Text style={styles.createBtnText}>＋ {t('committees.add', 'تشكيل لجنة')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}>
        {committeesQuery.isLoading ? (
          <ActivityIndicator size="large" color="#1246B7" />
        ) : committeesList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏛️</Text>
            <Text style={styles.emptyTitle}>{t('committees.no_committees', 'لا توجد لجان مسجلة حالياً')}</Text>
          </View>
        ) : (
          committeesList.map((comm, idx) => (
            <TouchableOpacity key={String(comm.id || idx)} style={styles.card} onPress={() => setSelectedCommittee(comm)}>
              <View style={[styles.cardHeaderRow]}>
                <Text style={styles.cardTitle}>🏛️ {comm.name}</Text>
                <View style={styles.statusTag}><Text style={styles.statusTagText}>{comm.status}</Text></View>
              </View>

              <Text style={styles.cardDesc}>{comm.description || 'لا يوجد وصف تفصيلي للجنة.'}</Text>
              <Text style={styles.chairmanText}>رئيس اللجنة: {comm.chairman_name || 'لم يحدد'}</Text>

              <View style={[styles.cardFooterGrid]}>
                <Text style={styles.gridMetaText}>👥 {comm.members_count || 0} أعضاء</Text>
                <Text style={styles.gridMetaText}>📅 {comm.meetings_count || 0} اجتماعات</Text>
                <Text style={styles.gridMetaText}>📌 {comm.tasks_count || 0} مهام</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Committee Detail Modal */}
      <Modal visible={!!selectedCommittee} transparent animationType="slide" onRequestClose={() => setSelectedCommittee(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={[styles.modalHeaderRow]}>
              <Text style={styles.modalTitleText} numberOfLines={1}>{selectedCommittee?.name}</Text>
            </View>

            {/* Detail Sub Tabs */}
            <View style={[styles.detailTabsRow]}>
              <TouchableOpacity style={[styles.dTab, detailTab === 'overview' && styles.dTabActive]} onPress={() => setDetailTab('overview')}>
                <Text style={detailTab === 'overview' ? styles.dTabTextActive : styles.dTabText}>نظرة عامة</Text>
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
                  <Text style={styles.detailDesc}>{selectedCommittee?.description}</Text>
                  <Text style={styles.metaLabel}>رئيس اللجنة: <Text style={styles.metaVal}>{selectedCommittee?.chairman_name || 'غير محدد'}</Text></Text>
                </View>
              )}

              {detailTab === 'members' && (
                <View style={{ gap: 8 }}>
                  {membersQuery.isLoading ? (
                    <ActivityIndicator size="small" color="#1246B7" />
                  ) : Array.isArray(membersQuery.data) && membersQuery.data.length > 0 ? (
                    membersQuery.data.map((m, idx) => (
                      <View key={String(m.id || idx)} style={styles.itemRow}>
                        <Text style={styles.itemTitle}>👤 {m.user_name || `عضو #${m.user_id}`}</Text>
                        <Text style={styles.itemRole}>{m.role}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>{t('committees.no_members', 'لا يوجد أعضاء مضافون')}</Text>
                  )}
                </View>
              )}

              {detailTab === 'tasks' && (
                <View style={{ gap: 8 }}>
                  {tasksQuery.isLoading ? (
                    <ActivityIndicator size="small" color="#1246B7" />
                  ) : Array.isArray(tasksQuery.data) && tasksQuery.data.length > 0 ? (
                    tasksQuery.data.map((tk, idx) => (
                      <View key={String(tk.id || idx)} style={styles.itemRow}>
                        <Text style={styles.itemTitle}>📌 {tk.title}</Text>
                        <Text style={styles.itemRole}>{tk.status}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>{t('committees.no_tasks', 'لا توجد مهام لجنة')}</Text>
                  )}
                </View>
              )}

              {detailTab === 'meetings' && (
                <View style={{ gap: 8 }}>
                  {meetingsQuery.isLoading ? (
                    <ActivityIndicator size="small" color="#1246B7" />
                  ) : Array.isArray(meetingsQuery.data) && meetingsQuery.data.length > 0 ? (
                    meetingsQuery.data.map((mt, idx) => (
                      <View key={String(mt.id || idx)} style={styles.itemRow}>
                        <Text style={styles.itemTitle}>📅 {mt.title}</Text>
                        <Text style={styles.itemRole}>{mt.meeting_date}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>{t('committees.no_meetings', 'لا توجد اجتماعات مسجلة')}</Text>
                  )}
                </View>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setSelectedCommittee(null)}>
              <Text style={styles.closeSheetBtnText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Creation Modal */}
      <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('committees.add', 'تشكيل لجنة مدرسية جديدة')}</Text>

            <Text style={styles.label}>اسم اللجنة *</Text>
            <TextInput style={styles.input} value={committeeName} onChangeText={setCommitteeName} placeholder="اسم اللجنة..." />

            <Text style={styles.label}>الهدف والوصف التفصيلي</Text>
            <TextInput style={[styles.input, { height: 80 }]} value={committeeDesc} onChangeText={setCommitteeDesc} placeholder="الوصف والمهام..." multiline />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveSubmitBtn} onPress={handleCreateCommittee} disabled={createMutation.isPending}>
                {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveSubmitBtnText}>حفظ وتشكيل اللجنة</Text>}
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
  safeArea: { flex: 1, backgroundColor: '#F2F4F7' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 14 : 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E1E7F0' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  title: { fontSize: 23, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: '700', color: '#0A1D3D' },
  subtitle: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#77839B', marginTop: 2 },
  createBtn: { backgroundColor: '#1246B7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  content: { padding: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EDF1F6', ...shadows.card, gap: 6, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#0A1D3D', flex: 1 },
  statusTag: { backgroundColor: '#EEF4FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusTagText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold, color: '#1246B7', fontWeight: 'bold' },
  cardDesc: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#344054' },
  chairmanText: { fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.semiBold, fontWeight: '600', color: '#1246B7' },
  cardFooterGrid: { flexDirection: 'row', gap: 14, borderTopWidth: 1, borderTopColor: '#F2F4F7', paddingTop: 8, marginTop: 4 },
  gridMetaText: { fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#77839B' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#77839B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  modalTitleText: { fontSize: 19.5, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#0A1D3D', flex: 1 },
  detailTabsRow: { flexDirection: 'row', gap: 6, marginVertical: 12 },
  dTab: { flex: 1, paddingVertical: 6, borderRadius: 6, backgroundColor: '#F2F4F7', alignItems: 'center' },
  dTabActive: { backgroundColor: '#1246B7' },
  dTabText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#5A6784', fontWeight: '600' },
  dTabTextActive: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold, color: '#fff', fontWeight: 'bold' },
  sheetScrollContent: { paddingVertical: 10, minHeight: 120 },
  detailDesc: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#344054', lineHeight: 20 },
  metaLabel: { fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#77839B' },
  metaVal: { fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#0A1D3D' },
  itemRow: { backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemTitle: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.semiBold, fontWeight: '600', color: '#0A1D3D' },
  itemRole: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold, color: '#1246B7', fontWeight: 'bold' },
  noDataText: { fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#77839B', fontStyle: 'italic', textAlign: 'center' },
  closeSheetBtn: { backgroundColor: '#F2F4F7', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  closeSheetBtnText: { color: '#5A6784', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', fontSize: 14.5 },
  modalCard: { backgroundColor: '#fff', margin: 20, borderRadius: 16, padding: 20, gap: 10 },
  modalTitle: { fontSize: 18.5, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#0A1D3D', textAlign: 'center', marginBottom: 6 },
  label: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.semiBold, fontWeight: '600', color: '#344054' },
  input: { borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, padding: 10, fontSize: 15.5, fontFamily: ibmPlexArabicFontFamily.regular },
  modalActions: { gap: 8, marginTop: 12 },
  saveSubmitBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveSubmitBtnText: { color: '#fff', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { backgroundColor: '#F2F4F7', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { color: '#77839B', fontFamily: ibmPlexArabicFontFamily.semiBold, fontWeight: '600', fontSize: 14.5 },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
});
