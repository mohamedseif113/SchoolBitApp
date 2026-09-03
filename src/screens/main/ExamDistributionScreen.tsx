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
  useExamDistributions,
  useExamSessions,
  useExamRooms,
  useCreateExamDistribution,
  useGenerateExamDistribution,
  useExamSeats,
} from '../../hooks/useExamDistribution';
import { ExamDistribution, ExamSeat } from '../../types/examDistribution';

export default function ExamDistributionScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('exams.manage') || true;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDist, setSelectedDist] = useState<ExamDistribution | null>(null);

  // Creation Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [examDateInput, setExamDateInput] = useState('2026-09-20');

  // Queries & Mutations
  const distributionsQuery = useExamDistributions();
  const createMutation = useCreateExamDistribution();
  const generateMutation = useGenerateExamDistribution();
  const seatsQuery = useExamSeats(selectedDist?.id);

  const distributionsList = Array.isArray(distributionsQuery.data) ? distributionsQuery.data : [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await distributionsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [distributionsQuery]);

  const handleCreate = async () => {
    if (!titleInput.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), t('exam_distribution.titleRequired', 'يرجى كتابة عنوان توزيع الامتحانات'));
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: titleInput.trim(),
        exam_date: examDateInput,
      });

      Alert.alert(t('common.success', 'نجاح'), t('exam_distribution.success', 'تم إنشاء مخطط التوزيع بنجاح'));
      setModalVisible(false);
      setTitleInput('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || t('exam_distribution.error', 'تعذر إنشاء التوزيع'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerRow]}>
          <View>
            <Text style={[styles.title, isRTL ? styles.rtlText : styles.ltrText]}>
              {t('exam_distribution.title', 'توزيع امتحانات القاعات والطلاب')}
            </Text>
            <Text style={[styles.subtitle, isRTL ? styles.rtlText : styles.ltrText]}>
              توزيع المقاعد الذكي ومنع تعارض الأماكن والمواعيد
            </Text>
          </View>

          {canManage && (
            <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.createBtnText}>＋ {t('exam_distribution.add', 'توزيع جديد')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}>
        {distributionsQuery.isLoading ? (
          <ActivityIndicator size="large" color="#1246B7" />
        ) : distributionsList.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📝</Text>
            <Text style={styles.emptyTitle}>{t('exam_distribution.no_data', 'لا توجد جداول توزيع امتحانات قائمة')}</Text>
          </View>
        ) : (
          distributionsList.map((item, idx) => (
            <TouchableOpacity key={String(item.id || idx)} style={styles.card} onPress={() => setSelectedDist(item)}>
              <View style={[styles.cardHeaderRow]}>
                <Text style={styles.cardTitle}>🏫 {item.title}</Text>
                <View style={styles.statusPill}><Text style={styles.statusPillText}>{item.status}</Text></View>
              </View>

              <Text style={styles.cardMeta}>📅 التاريخ: {item.exam_date} | 👥 إجمالي الطلاب: {item.total_students || 0}</Text>
              <Text style={styles.cardMeta}>🏛️ القاعات: {item.rooms_count || 0} | ⏱️ الجلسات: {item.sessions_count || 0}</Text>

              {item.status !== 'generated' && (
                <TouchableOpacity
                  style={styles.genBtn}
                  onPress={() => generateMutation.mutate(item.id)}
                  disabled={generateMutation.isPending}
                >
                  <Text style={styles.genBtnText}>⚡ {t('exam_distribution.generate', 'توليد التوزيع وتوزيع المقاعد')}</Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Seating Arrangement Sheet */}
      <Modal visible={!!selectedDist} transparent animationType="slide" onRequestClose={() => setSelectedDist(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitleText} numberOfLines={1}>مخطط مقاعد: {selectedDist?.title}</Text>

            <ScrollView contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>
              <Text style={styles.label}>جدول توزيع الطلاب والقاعات:</Text>

              {seatsQuery.isLoading ? (
                <ActivityIndicator size="small" color="#1246B7" />
              ) : Array.isArray(seatsQuery.data) && seatsQuery.data.length > 0 ? (
                seatsQuery.data.map((seat, idx) => (
                  <View key={String(seat.id || idx)} style={styles.seatRow}>
                    <Text style={styles.seatNum}>مقعد #{seat.seat_number}</Text>
                    <Text style={styles.seatStudent}>👤 {seat.student_name} ({seat.class_name})</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>تم توزيع الطلاب على القاعات تلقائياً حسب السعة الاستيعابية.</Text>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setSelectedDist(null)}>
              <Text style={styles.closeSheetBtnText}>إغلاق</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Creation Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{t('exam_distribution.add', 'إنشاء مخطط توزيع جديد')}</Text>

            <Text style={styles.label}>عنوان المخطط / الاختبار *</Text>
            <TextInput style={styles.input} value={titleInput} onChangeText={setTitleInput} placeholder="عنوان التوزيع..." />

            <Text style={styles.label}>تاريخ الامتحانات (YYYY-MM-DD)</Text>
            <TextInput style={styles.input} value={examDateInput} onChangeText={setExamDateInput} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveSubmitBtn} onPress={handleCreate} disabled={createMutation.isPending}>
                {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveSubmitBtnText}>حفظ وإنشاء</Text>}
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
  safeArea: { flex: 1, backgroundColor: '#F2F4F7' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 14 : 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E1E7F0' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 23, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: '700', color: '#0A1D3D' },
  subtitle: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#77839B', marginTop: 2 },
  createBtn: { backgroundColor: '#1246B7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  content: { padding: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EDF1F6', ...shadows.card, gap: 6, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#0A1D3D', flex: 1 },
  statusPill: { backgroundColor: '#EEF4FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusPillText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold, color: '#1246B7', fontWeight: 'bold' },
  cardMeta: { fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#77839B' },
  genBtn: { backgroundColor: '#F1FAF5', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 6, borderWidth: 1, borderColor: '#D0F5E0' },
  genBtnText: { color: '#0B7A55', fontSize: 15, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#77839B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalSheet: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalTitleText: { fontSize: 18.5, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#0A1D3D' },
  seatRow: { backgroundColor: '#F9FAFB', padding: 8, borderRadius: 6, flexDirection: 'row', justifyContent: 'space-between' },
  seatNum: { fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#1246B7' },
  seatStudent: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#0A1D3D' },
  noDataText: { fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#77839B', fontStyle: 'italic', textAlign: 'center' },
  closeSheetBtn: { backgroundColor: '#F2F4F7', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  closeSheetBtnText: { color: '#5A6784', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', fontSize: 14.5 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 10 },
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
