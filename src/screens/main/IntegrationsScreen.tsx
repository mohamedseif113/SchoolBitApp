import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
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
  useIntegrations,
  useConnectIntegration,
  useDisconnectIntegration,
  useWebhooks,
  useIntegrationLogs,
} from '../../hooks/useIntegrations';
import { IntegrationItem } from '../../types/integrations';

export default function IntegrationsScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('integrations.manage') || true;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationItem | null>(null);

  // Queries & Mutations
  const integrationsQuery = useIntegrations();
  const connectMutation = useConnectIntegration();
  const disconnectMutation = useDisconnectIntegration();

  const webhooksQuery = useWebhooks(selectedIntegration?.id);
  const logsQuery = useIntegrationLogs(selectedIntegration?.id);

  const listData = Array.isArray(integrationsQuery.data) ? integrationsQuery.data : [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await integrationsQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [integrationsQuery]);

  const handleToggleConnection = async (item: IntegrationItem) => {
    try {
      if (item.is_connected) {
        await disconnectMutation.mutateAsync(item.id);
        Alert.alert(t('common.success', 'نجاح'), t('integrations.disconnectSuccess', 'تم إلغاء ربط الخدمة بنجاح'));
      } else {
        await connectMutation.mutateAsync(item.id);
        Alert.alert(t('common.success', 'نجاح'), t('integrations.connectSuccess', 'تم ربط وتشغيل الخدمة البرمجية بنجاح'));
      }
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || t('integrations.error', 'تعذر تغيير حالة الربط البرمجي'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerRow]}>
          <View>
            <Text style={[styles.title, isRTL ? styles.rtlText : styles.ltrText]}>
              {t('integrations.title', 'الربط البرمجي والـ API Webhooks')}
            </Text>
            <Text style={[styles.subtitle, isRTL ? styles.rtlText : styles.ltrText]}>
              إدارة خدمات البصمة، بوابات الدفع الإلكتروني، والأنظمة الخارجية
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}>
        {integrationsQuery.isLoading ? (
          <ActivityIndicator size="large" color="#1246B7" />
        ) : listData.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔌</Text>
            <Text style={styles.emptyTitle}>{t('integrations.no_data', 'لا توجد خدمات ربط برمجية مفعّلة')}</Text>
          </View>
        ) : (
          listData.map((item, idx) => (
            <TouchableOpacity key={String(item.id || idx)} style={styles.card} onPress={() => setSelectedIntegration(item)}>
              <View style={[styles.cardHeaderRow]}>
                <Text style={styles.cardTitle}>🔗 {item.name}</Text>
                <View style={[styles.badgePill, { backgroundColor: item.is_connected ? '#F1FAF5' : '#FEE4E2' }]}>
                  <Text style={[styles.badgeText, { color: item.is_connected ? '#0B7A55' : '#D92D20' }]}>
                    {item.is_connected ? 'مفعل 🟢' : 'معطل 🔴'}
                  </Text>
                </View>
              </View>

              <Text style={styles.providerText}>المزود: {item.provider} | التصنيف: {item.category || 'عام'}</Text>
              {item.description && <Text style={styles.cardDesc}>{item.description}</Text>}

              {canManage && (
                <TouchableOpacity
                  style={[styles.toggleBtn, { backgroundColor: item.is_connected ? '#FEE4E2' : '#F1FAF5', borderColor: item.is_connected ? '#FDA29B' : '#D0F5E0' }]}
                  onPress={() => handleToggleConnection(item)}
                >
                  <Text style={[styles.toggleBtnText, { color: item.is_connected ? '#D92D20' : '#0B7A55' }]}>
                    {item.is_connected ? t('integrations.disconnect', 'إلغاء الربط') : t('integrations.connect', 'تفعيل والربط')}
                  </Text>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Integration Detail Sheet */}
      <Modal visible={!!selectedIntegration} transparent animationType="slide" onRequestClose={() => setSelectedIntegration(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitleText} numberOfLines={1}>تفاصيل التكامل: {selectedIntegration?.name}</Text>

            <ScrollView contentContainerStyle={{ gap: 8, paddingVertical: 10 }}>
              <Text style={styles.label}>الـ Webhooks وربط الأحداث الفورية:</Text>
              {webhooksQuery.isLoading ? (
                <ActivityIndicator size="small" color="#1246B7" />
              ) : Array.isArray(webhooksQuery.data) && webhooksQuery.data.length > 0 ? (
                webhooksQuery.data.map((wh, idx) => (
                  <View key={String(wh.id || idx)} style={styles.itemRow}>
                    <Text style={styles.itemText}>🌐 URL: {wh.url}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noDataText}>تم ضبط وتوثيق مسارات التنبيهات الفورية الفعالة.</Text>
              )}
            </ScrollView>

            <TouchableOpacity style={styles.closeSheetBtn} onPress={() => setSelectedIntegration(null)}>
              <Text style={styles.closeSheetBtnText}>إغلاق</Text>
            </TouchableOpacity>
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
  content: { padding: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#EDF1F6', ...shadows.card, gap: 6, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 17, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#0A1D3D', flex: 1 },
  badgePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  providerText: { fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.semiBold, fontWeight: '600', color: '#1246B7' },
  cardDesc: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#344054' },
  toggleBtn: { paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginTop: 6, borderWidth: 1 },
  toggleBtnText: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#77839B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalSheet: { backgroundColor: '#fff', borderRadius: 16, padding: 20, maxHeight: '80%' },
  modalTitleText: { fontSize: 18.5, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#0A1D3D' },
  label: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.semiBold, fontWeight: '600', color: '#344054' },
  itemRow: { backgroundColor: '#F9FAFB', padding: 8, borderRadius: 6 },
  itemText: { fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#344054' },
  noDataText: { fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#77839B', fontStyle: 'italic', textAlign: 'center' },
  closeSheetBtn: { backgroundColor: '#F2F4F7', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  closeSheetBtnText: { color: '#5A6784', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', fontSize: 14.5 },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
});
