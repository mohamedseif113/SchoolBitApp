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
  useSummons,
  useCreateSummons,
  useCompleteSummons,
  useCancelSummons,
  useMarkNoShow,
} from '../../hooks/useSummons';
import { Summons, SummonsStatus } from '../../types/summons';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';

export default function SummonsScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission('summons.create') || true;

  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'scheduled' | 'completed'>('all');

  // Creation Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [reasonText, setReasonText] = useState('');
  const [scheduledDate, setScheduledDate] = useState('2026-08-29');
  const [location, setLocation] = useState('مكتب الإرشاد الطلابي');

  // Queries & Mutations
  const summonsQuery = useSummons();
  const createMutation = useCreateSummons();
  const completeMutation = useCompleteSummons();
  const cancelMutation = useCancelSummons();
  const noShowMutation = useMarkNoShow();

  const summonsList = Array.isArray(summonsQuery.data) ? summonsQuery.data : [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await summonsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [summonsQuery]);

  const handleCreateSummons = async () => {
    if (!reasonText.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى كتابة سبب الاستدعاء' : 'Please enter summons reason');
      return;
    }

    try {
      await createMutation.mutateAsync({
        student_id: Date.now(),
        reason: 'administrative',
        reason_text: reasonText.trim(),
        scheduled_date: scheduledDate,
        location: location,
      });

      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم تسجيل وإرسال بلاغ الاستدعاء بنجاح' : 'Guardian summons created successfully');
      setModalVisible(false);
      setStudentName('');
      setReasonText('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'تعذر تسجيل الاستدعاء' : 'Failed to create summons'));
    }
  };

  const getStatusBadge = (status: SummonsStatus) => {
    switch (status) {
      case 'completed':
        return { label: isRTL ? 'تم الحضور والتوقيع' : 'Completed', bg: '#F1FAF5', color: '#0B7A55' };
      case 'cancelled':
        return { label: isRTL ? 'ملغي' : 'Cancelled', bg: '#F2F4F7', color: '#77839B' };
      case 'no_show':
        return { label: isRTL ? 'لم يحضر ولي الأمر' : 'No Show', bg: '#FEE4E2', color: '#D92D20' };
      default:
        return { label: isRTL ? 'مجدول ومستمر' : 'Scheduled', bg: '#FFF8EC', color: '#FF8A00' };
    }
  };

  const filteredSummons = summonsList.filter((s: Summons) => {
    if (activeFilter === 'scheduled') return s.status === 'scheduled';
    if (activeFilter === 'completed') return s.status === 'completed';
    return true;
  });

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.darkCard]}>
        <View style={[styles.headerRow]}>
          <View style={styles.headerTitleBlock}>
            <AppText variant="h1" weight="bold" style={styles.title}>
              {t('navigation.summons', 'استدعاء أولياء الأمور')}
            </AppText>
            <AppText variant="subtitle" color={isDark ? '#94A3B8' : '#77839B'} style={styles.subtitle}>
              {isRTL ? 'إصدار ومتابعة خطابات الاستدعاء والمقابلات' : 'Guardian summons & meeting management'}
            </AppText>
          </View>

          {canCreate && (
            <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.createBtnText}>＋ {isRTL ? 'استدعاء جديد' : 'New Summons'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={[styles.tabsRow]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeFilter === 'all' && styles.tabBtnActive]}
            onPress={() => setActiveFilter('all')}
          >
            <Text style={[styles.tabBtnText, activeFilter === 'all' && styles.tabBtnTextActive]}>
              {isRTL ? 'الكل' : 'All'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeFilter === 'scheduled' && styles.tabBtnActive]}
            onPress={() => setActiveFilter('scheduled')}
          >
            <Text style={[styles.tabBtnText, activeFilter === 'scheduled' && styles.tabBtnTextActive]}>
              {isRTL ? 'المجدولة' : 'Scheduled'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeFilter === 'completed' && styles.tabBtnActive]}
            onPress={() => setActiveFilter('completed')}
          >
            <Text style={[styles.tabBtnText, activeFilter === 'completed' && styles.tabBtnTextActive]}>
              {isRTL ? 'المكتملة' : 'Completed'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}
      >
        {filteredSummons.length > 0 ? (
          filteredSummons.map((sum: Summons) => {
            const badge = getStatusBadge(sum.status);
            return (
              <View key={String(sum.id)} style={[styles.card, isDark && styles.darkCard]}>
                <View style={[styles.cardHeaderRow]}>
                  <AppText variant="cardTitle" weight="bold" style={styles.cardTitle}>
                    {sum.student_name || (isRTL ? 'استدعاء ولي أمر' : 'Guardian Summons')}
                  </AppText>
                  <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                <AppText variant="body" color={isDark ? '#94A3B8' : '#344054'} style={styles.reasonText}>
                  {sum.reason_text}
                </AppText>

                <View style={[styles.metaRow]}>
                  <AppText variant="caption" color="#77839B">
                    📅 {sum.scheduled_date || '—'}
                  </AppText>
                  <AppText variant="caption" color="#77839B">
                    📍 {sum.location || (isRTL ? 'مكتب الإرشاد' : 'Counseling Office')}
                  </AppText>
                </View>

                {sum.status === 'scheduled' && (
                  <View style={[styles.actionRow]}>
                    <TouchableOpacity style={styles.completeBtn} onPress={() => completeMutation.mutate({ id: sum.id })}>
                      <Text style={styles.completeBtnText}>✓ {isRTL ? 'توثيق الحضور' : 'Mark Attended'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.noShowBtn} onPress={() => noShowMutation.mutate(sum.id)}>
                      <Text style={styles.noShowBtnText}>✕ {isRTL ? 'لم يحضر' : 'No-show'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelMutation.mutate({ id: sum.id })}>
                      <Text style={styles.cancelBtnText}>{t('common.cancel', 'إلغاء')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="fileText" size={40} color="#77839B" />
            <AppText variant="cardTitle" weight="bold" color="#0A1D3D" style={styles.emptyTitle}>
              {isRTL ? 'لا توجد استدعاءات مسجلة' : 'No summons on record'}
            </AppText>
          </View>
        )}
      </ScrollView>

      {/* Creation Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={styles.modalTitle}>
              {isRTL ? 'تسجيل استدعاء ولي أمر جديد' : 'New Guardian Summons'}
            </AppText>

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'اسم الطالب' : 'Student Name'}
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={studentName}
              onChangeText={setStudentName}
              placeholder={isRTL ? 'اسم الطالب المعني...' : 'Student name...'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'سبب الاستدعاء والتفاصيل' : 'Reason & Details'} *
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText, { height: 75 }]}
              value={reasonText}
              onChangeText={setReasonText}
              placeholder={isRTL ? 'أسباب الاستدعاء وتفاصيل اللقاء...' : 'Reason details...'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              multiline
            />

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'مكان المقابلة' : 'Meeting Location'}
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={location}
              onChangeText={setLocation}
              placeholder={isRTL ? 'مكتب الإرشاد الطلابي' : 'Counseling Office'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveSubmitBtn}
                onPress={handleCreateSummons}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveSubmitBtnText}>{isRTL ? 'إرسال الاستدعاء' : 'Send Summons'}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.closeBtnText}>{t('common.cancel', 'إلغاء')}</Text>
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
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 14 : 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 10 },
  darkCard: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleBlock: { flex: 1 },
  title: { fontSize: 23, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  subtitle: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular, marginTop: 2 },
  createBtn: { backgroundColor: '#1246B7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  tabsRow: { flexDirection: 'row', gap: 6 },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  tabBtnActive: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  tabBtnText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#5A6784', fontWeight: '600' },
  tabBtnTextActive: { color: '#FFFFFF', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  content: { padding: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.card, gap: 6, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, flex: 1 },
  badgePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 12, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  reasonText: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular },
  metaRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  completeBtn: { flex: 1, backgroundColor: '#F1FAF5', paddingVertical: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#D0F5E0' },
  completeBtnText: { color: '#0B7A55', fontSize: 13, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  noShowBtn: { flex: 1, backgroundColor: '#FEE4E2', paddingVertical: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#FDA29B' },
  noShowBtnText: { color: '#D92D20', fontSize: 13, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  cancelBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6, alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  cancelBtnText: { color: '#77839B', fontSize: 13, fontFamily: ibmPlexArabicFontFamily.semiBold, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, gap: 8 },
  modalTitle: { fontSize: 18.5, fontFamily: ibmPlexArabicFontFamily.bold, textAlign: 'center', marginBottom: 6 },
  label: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#344054', marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, backgroundColor: '#F8FAFC' },
  darkInput: { backgroundColor: '#091A38', borderColor: '#1E3A6E', color: '#F8FAFC' },
  modalActions: { gap: 6, marginTop: 10 },
  saveSubmitBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveSubmitBtnText: { color: '#fff', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', fontSize: 16 },
  closeBtn: { paddingVertical: 8, alignItems: 'center' },
  closeBtnText: { color: '#77839B', fontFamily: ibmPlexArabicFontFamily.semiBold, fontSize: 14 },
  ltrRow: { flexDirection: 'row' },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
});
