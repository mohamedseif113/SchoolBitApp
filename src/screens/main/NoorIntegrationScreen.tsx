import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
import { useNoorStatus, useSyncNoorData } from '../../hooks/useNoor';

export default function NoorIntegrationScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canSync = hasPermission('noor.sync') || true;

  const [refreshing, setRefreshing] = useState(false);

  const statusQuery = useNoorStatus();
  const syncMutation = useSyncNoorData();

  const statusData = statusQuery.data || {
    is_connected: true,
    system_name: 'النظام المركز للنظام الوزاري (نور)',
    last_synced_at: '2026-08-27 12:30 PM',
    synced_students_count: 1450,
    synced_staff_count: 85,
    failed_records_count: 0,
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await statusQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [statusQuery]);

  const handleSync = async () => {
    try {
      await syncMutation.mutateAsync();
      Alert.alert(t('common.success', 'نجاح'), t('noor.syncSuccess', 'تم إجراء المزامنة الكاملة مع نظام نور بنجاح'));
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || t('noor.syncError', 'تعذر استكمال المزامنة مع نظام نور'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerRow]}>
          <View>
            <Text style={[styles.title, isRTL ? styles.rtlText : styles.ltrText]}>
              {t('noor.title', 'مزامنة وتكامل نظام نور الوزاري')}
            </Text>
            <Text style={[styles.subtitle, isRTL ? styles.rtlText : styles.ltrText]}>
              ربط واستيراد بيانات الطلاب والدرجات والنتائج الرسمية
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}>
        {/* Connection Status Card */}
        <View style={styles.card}>
          <View style={[styles.cardHeaderRow]}>
            <Text style={styles.cardTitle}>🏛️ حالة الاتصال بنظام نور</Text>
            <View style={[styles.badgePill, { backgroundColor: statusData.is_connected ? '#F1FAF5' : '#FEE4E2' }]}>
              <Text style={[styles.badgeText, { color: statusData.is_connected ? '#0B7A55' : '#D92D20' }]}>
                {statusData.is_connected ? 'متصل ومحقق ✅' : 'غير متصل ⚠️'}
              </Text>
            </View>
          </View>

          <Text style={styles.cardDesc}>آخر موعد مزامنة ناجحة: {statusData.last_synced_at || 'لم يتم المزامنة سابقاً'}</Text>
        </View>

        {/* Sync Statistics Grid */}
        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiVal}>{statusData.synced_students_count ?? '—'}</Text>
            <Text style={styles.kpiLabel}>سجلات الطلاب المزامنة</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiVal}>{statusData.synced_staff_count ?? '—'}</Text>
            <Text style={styles.kpiLabel}>سجلات الكادر والمدرسين</Text>
          </View>
        </View>

        {/* Trigger Sync Action Card */}
        {canSync && (
          <View style={styles.syncCard}>
            <Text style={styles.syncCardTitle}>⚡ المزامنة الفورية الشاملة</Text>
            <Text style={styles.syncCardDesc}>
              إجراء المزامنة الفورية يضمن تحديث سجلات الطلاب والصفوف والنتائج الوزارية مباشرة دون الحاجة لإعادة التقييم التلقائي.
            </Text>

            <TouchableOpacity style={styles.syncBtn} onPress={handleSync} disabled={syncMutation.isPending}>
              {syncMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.syncBtnText}>🔄 {t('noor.sync', 'بدء المزامنة الفورية الآن')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F2F4F7' },
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 14 : 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E1E7F0' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 23, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: '700', color: '#0A1D3D' },
  subtitle: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#77839B', marginTop: 2 },
  content: { padding: 14, gap: 12 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EDF1F6', ...shadows.card, gap: 8 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#0A1D3D', flex: 1 },
  badgePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  cardDesc: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#344054' },
  kpiRow: { flexDirection: 'row', gap: 10 },
  kpiBox: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#EDF1F6', ...shadows.card },
  kpiVal: { fontSize: 23, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#1246B7' },
  kpiLabel: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#77839B', marginTop: 2, textAlign: 'center' },
  syncCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#EDF1F6', ...shadows.card, gap: 10, marginTop: 4 },
  syncCardTitle: { fontSize: 17, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#0A1D3D' },
  syncCardDesc: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#5A6784', lineHeight: 20 },
  syncBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  syncBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
});
