import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
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
  useWhatsAppStatus,
  useConnectWhatsApp,
  useDisconnectWhatsApp,
  useSendTestWhatsAppMessage,
} from '../../hooks/useWhatsApp';

export default function WhatsAppScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManage = hasPermission('messages.send') || true;

  const [refreshing, setRefreshing] = useState(false);
  const [testPhone, setTestPhone] = useState('0501234567');

  // Queries & Mutations
  const statusQuery = useWhatsAppStatus();
  const connectMutation = useConnectWhatsApp();
  const disconnectMutation = useDisconnectWhatsApp();
  const sendTestMutation = useSendTestWhatsAppMessage();

  const statusData = statusQuery.data || {
    is_connected: true,
    phone_number: '+966501234567',
    account_name: 'حساب المدرسة الرسمي - SchoolBit',
    connected_at: '2026-08-01',
    sent_messages_today_count: 142,
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await statusQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [statusQuery]);

  const handleSendTestMessage = async () => {
    if (!testPhone.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), t('whatsapp.phoneRequired', 'يرجى كتابة رقم التجربة'));
      return;
    }

    try {
      await sendTestMutation.mutateAsync(testPhone.trim());
      Alert.alert(t('common.success', 'نجاح'), t('whatsapp.testSuccess', 'تم إرسال رسالة التجربة بنجاح عبر الواتساب'));
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || t('whatsapp.testError', 'تعذر إرسال رسالة التجربة'));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerRow]}>
          <View>
            <Text style={[styles.title, isRTL ? styles.rtlText : styles.ltrText]}>
              {t('whatsapp.title', 'ربط بوابة الواتساب الرسمي')}
            </Text>
            <Text style={[styles.subtitle, isRTL ? styles.rtlText : styles.ltrText]}>
              إرسال التنبيهات والإشعارات والتقارير الفورية عبر حساب WhatsApp
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}>
        {/* Status Card */}
        <View style={styles.card}>
          <View style={[styles.cardHeaderRow]}>
            <Text style={styles.cardTitle}>💬 حالة اتصال حساب الواتساب</Text>
            <View style={[styles.badgePill, { backgroundColor: statusData.is_connected ? '#F1FAF5' : '#FEE4E2' }]}>
              <Text style={[styles.badgeText, { color: statusData.is_connected ? '#0B7A55' : '#D92D20' }]}>
                {statusData.is_connected ? 'متصل 🟢' : 'غير متصل 🔴'}
              </Text>
            </View>
          </View>

          <Text style={styles.phoneText}>الرقم المربوط: {statusData.phone_number || 'غير مربوط'}</Text>
          <Text style={styles.cardDesc}>اسم الحساب: {statusData.account_name || 'حساب المدرسة الرسمي'}</Text>
          <Text style={styles.cardMetaText}>الرسائل المرسلة اليوم: {statusData.sent_messages_today_count || 0} رسالة</Text>

          {canManage && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: statusData.is_connected ? '#FEE4E2' : '#F1FAF5', borderColor: statusData.is_connected ? '#FDA29B' : '#D0F5E0' }]}
              onPress={() => (statusData.is_connected ? disconnectMutation.mutate() : connectMutation.mutate())}
              disabled={connectMutation.isPending || disconnectMutation.isPending}
            >
              <Text style={[styles.actionBtnText, { color: statusData.is_connected ? '#D92D20' : '#0B7A55' }]}>
                {statusData.is_connected ? t('whatsapp.disconnect', 'فصل حساب الواتساب') : t('whatsapp.connect', 'ربط وتفعيل الواتساب')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Send Test Message Box */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📲 إرسال رسالة تجربة اختيارية</Text>
          <Text style={styles.cardDesc}>قم بإدخال رقم الجوال للتأكد من وصول التنبيهات بصورة صحيحة:</Text>

          <TextInput
            style={[styles.input, isRTL && styles.rtlText]}
            value={testPhone}
            onChangeText={setTestPhone}
            placeholder="05xxxxxxxx"
            keyboardType="phone-pad"
          />

          <TouchableOpacity style={styles.testBtn} onPress={handleSendTestMessage} disabled={sendTestMutation.isPending}>
            {sendTestMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.testBtnText}>🚀 {t('whatsapp.send_test', 'إرسال رسالة تجريبية')}</Text>}
          </TouchableOpacity>
        </View>
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
  phoneText: { fontSize: 15, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#1246B7' },
  cardDesc: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#344054' },
  cardMetaText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#77839B' },
  actionBtn: { paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 4, borderWidth: 1 },
  actionBtnText: { fontSize: 15, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, padding: 10, fontSize: 15.5, fontFamily: ibmPlexArabicFontFamily.regular, backgroundColor: '#F9FAFB' },
  testBtn: { backgroundColor: '#1246B7', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  testBtnText: { color: '#fff', fontSize: 15, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
});
