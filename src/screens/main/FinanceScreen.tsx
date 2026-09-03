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
  useBillingSummary,
  useInvoices,
  usePayLinks,
  usePaymentGateways,
  useSubscription,
  usePlans,
  useCreatePayLink,
  useDeletePayLink,
  useSubmitBankTransfer,
} from '../../hooks/useFinance';
import { Invoice, PaymentLink, SubscriptionPlan } from '../../types/finance';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';

type ViewTab = 'invoices' | 'pay_links' | 'gateways' | 'plans' | 'bank_transfer';

export default function FinanceScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManageFinance = hasPermission('finance.manage') || true;

  const [activeTab, setActiveTab] = useState<ViewTab>('invoices');
  const [refreshing, setRefreshing] = useState(false);

  // PayLink Modal State
  const [payLinkModalVisible, setPayLinkModalVisible] = useState(false);
  const [payLinkTitle, setPayLinkTitle] = useState('');
  const [payLinkAmount, setPayLinkAmount] = useState('');

  // Bank Transfer Form State
  const [bankName, setBankName] = useState('');
  const [accName, setAccName] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [refNumber, setRefNumber] = useState('');

  // Queries & Mutations
  const summaryQuery = useBillingSummary();
  const invoicesQuery = useInvoices();
  const payLinksQuery = usePayLinks();
  const gatewaysQuery = usePaymentGateways();
  const subscriptionQuery = useSubscription();
  const plansQuery = usePlans();

  const createPayLinkMutation = useCreatePayLink();
  const deletePayLinkMutation = useDeletePayLink();
  const submitTransferMutation = useSubmitBankTransfer();

  const summary = summaryQuery.data;
  const invoicesList = Array.isArray(invoicesQuery.data) ? invoicesQuery.data : [];
  const payLinksList = Array.isArray(payLinksQuery.data) ? payLinksQuery.data : [];
  const gatewaysList = Array.isArray(gatewaysQuery.data) ? gatewaysQuery.data : [];
  const plansList = Array.isArray(plansQuery.data) ? plansQuery.data : [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        summaryQuery.refetch(),
        invoicesQuery.refetch(),
        payLinksQuery.refetch(),
        gatewaysQuery.refetch(),
        subscriptionQuery.refetch(),
        plansQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [summaryQuery, invoicesQuery, payLinksQuery, gatewaysQuery, subscriptionQuery, plansQuery]);

  const handleCreatePayLink = async () => {
    if (!payLinkTitle || !payLinkAmount) return;
    try {
      await createPayLinkMutation.mutateAsync({
        title: payLinkTitle,
        amount: Number(payLinkAmount),
      });
      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم إنشاء رابط الدفع بنجاح' : 'Payment link created successfully');
      setPayLinkModalVisible(false);
      setPayLinkTitle('');
      setPayLinkAmount('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل إنشاء رابط الدفع' : 'Failed to create payment link'));
    }
  };

  const handleSubmitTransfer = async () => {
    if (!bankName || !transferAmount || !refNumber) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى إدخال اسم البنك والمبلغ ورقم المرجع' : 'Please enter bank name, amount and reference');
      return;
    }

    try {
      await submitTransferMutation.mutateAsync({
        bank_name: bankName,
        account_name: accName,
        amount: Number(transferAmount),
        reference_number: refNumber,
      });
      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم تقديم إشعار التحويل البنكي بنجاح' : 'Bank transfer receipt submitted');
      setBankName('');
      setAccName('');
      setTransferAmount('');
      setRefNumber('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل إرسال الإشعار' : 'Failed to submit transfer receipt'));
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.darkCard]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerTitleBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="h1" weight="bold" style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('navigation.finance', 'المالية والفواتير')}
            </AppText>
            <AppText variant="subtitle" color={isDark ? '#94A3B8' : '#77839B'} style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'متابعة الفواتير والتحصيلات والاشتراك' : 'Invoices, collections & billing summary'}
            </AppText>
          </View>
        </View>

        {/* View Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'invoices' && styles.tabBtnActive]}
            onPress={() => setActiveTab('invoices')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'invoices' && styles.tabBtnTextActive]}>
              {isRTL ? 'الفواتير' : 'Invoices'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'pay_links' && styles.tabBtnActive]}
            onPress={() => setActiveTab('pay_links')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'pay_links' && styles.tabBtnTextActive]}>
              {isRTL ? 'روابط الدفع' : 'Pay Links'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'bank_transfer' && styles.tabBtnActive]}
            onPress={() => setActiveTab('bank_transfer')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'bank_transfer' && styles.tabBtnTextActive]}>
              {isRTL ? 'تحويل بنكي' : 'Bank Transfer'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'plans' && styles.tabBtnActive]}
            onPress={() => setActiveTab('plans')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'plans' && styles.tabBtnTextActive]}>
              {isRTL ? 'الخطط والاشتراك' : 'Plans & Billing'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}
      >
        {/* KPI Financial Summary */}
        <View style={[styles.kpiRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.kpiBox, isDark && styles.darkCard]}>
            <AppText variant="cardTitle" weight="extraBold" color="#0B7A55" style={styles.kpiVal}>
              {summary?.total_paid ? `${summary.total_paid} ر.س` : '0 ر.س'}
            </AppText>
            <AppText variant="caption" color="#0B7A55" style={styles.kpiLabel}>
              {isRTL ? 'المحصل' : 'Collected'}
            </AppText>
          </View>

          <View style={[styles.kpiBox, isDark && styles.darkCard]}>
            <AppText variant="cardTitle" weight="extraBold" color="#D92D20" style={styles.kpiVal}>
              {summary?.total_due ? `${summary.total_due} ر.س` : '0 ر.س'}
            </AppText>
            <AppText variant="caption" color="#D92D20" style={styles.kpiLabel}>
              {isRTL ? 'المتبقي' : 'Due Balance'}
            </AppText>
          </View>

          <View style={[styles.kpiBox, isDark && styles.darkCard]}>
            <AppText variant="cardTitle" weight="extraBold" color="#1246B7" style={styles.kpiVal}>
              {summary?.total_invoices ? `${summary.total_invoices}` : '0'}
            </AppText>
            <AppText variant="caption" color="#77839B" style={styles.kpiLabel}>
              {isRTL ? 'عدد الفواتير' : 'Invoices'}
            </AppText>
          </View>
        </View>

        {/* TAB 1: INVOICES */}
        {activeTab === 'invoices' && (
          <View style={{ gap: 10 }}>
            {invoicesList.length > 0 ? (
              invoicesList.map((inv: Invoice) => (
                <View key={String(inv.id)} style={[styles.card, isDark && styles.darkCard]}>
                  <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <AppText variant="cardTitle" weight="bold" style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {inv.title || `${isRTL ? 'فاتورة رقم' : 'Invoice #'} ${inv.invoice_number || inv.id}`}
                    </AppText>
                    <View
                      style={[
                        styles.statusPill,
                        inv.status === 'paid'
                          ? styles.statusPaid
                          : inv.status === 'pending'
                          ? styles.statusPending
                          : styles.statusOverdue,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusPillText,
                          {
                            color:
                              inv.status === 'paid'
                                ? '#0B7A55'
                                : inv.status === 'pending'
                                ? '#FF8A00'
                                : '#D92D20',
                          },
                        ]}
                      >
                        {inv.status === 'paid'
                          ? isRTL ? 'مدفوعة' : 'Paid'
                          : inv.status === 'pending'
                          ? isRTL ? 'معلقة' : 'Pending'
                          : isRTL ? 'متأخرة' : 'Overdue'}
                      </Text>
                    </View>
                  </View>

                  <AppText variant="caption" color="#77839B" style={[styles.cardMetaText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {`📅 ${isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}: ${inv.due_date || '—'}`}
                  </AppText>

                  <AppText variant="bodyBold" color="#1246B7" style={[styles.amountText, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {`${isRTL ? 'المبلغ' : 'Amount'}: ${inv.amount || 0} ر.س`}
                  </AppText>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="creditCard" size={40} color="#77839B" />
                <AppText variant="cardTitle" weight="bold" style={styles.emptyTitle}>
                  {isRTL ? 'لا توجد فواتير مسجلة' : 'No invoices on record'}
                </AppText>
              </View>
            )}
          </View>
        )}

        {/* TAB 2: PAY LINKS */}
        {activeTab === 'pay_links' && (
          <View style={{ gap: 10 }}>
            {canManageFinance && (
              <TouchableOpacity style={styles.createLinkBtn} onPress={() => setPayLinkModalVisible(true)}>
                <Text style={styles.createLinkBtnText}>＋ {isRTL ? 'إنشاء رابط دفع جديد' : 'New Pay Link'}</Text>
              </TouchableOpacity>
            )}

            {payLinksList.length > 0 ? (
              payLinksList.map((link: PaymentLink) => (
                <View key={String(link.id)} style={[styles.card, isDark && styles.darkCard]}>
                  <View style={[styles.cardHeaderRow]}>
                    <AppText variant="cardTitle" weight="bold" style={styles.cardTitle}>
                      {link.title}
                    </AppText>
                    <AppText variant="bodyBold" color="#1246B7" style={styles.amountText}>
                      {`${link.amount} ر.س`}
                    </AppText>
                  </View>
                  <AppText variant="caption" color="#77839B" style={styles.cardMetaText}>
                    {`🔗 ${link.url || link.code}`}
                  </AppText>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="creditCard" size={40} color="#77839B" />
                <AppText variant="cardTitle" weight="bold" style={styles.emptyTitle}>
                  {isRTL ? 'لا توجد روابط دفع نشطة' : 'No active payment links'}
                </AppText>
              </View>
            )}
          </View>
        )}

        {/* TAB 3: BANK TRANSFER */}
        {activeTab === 'bank_transfer' && (
          <View style={[styles.formCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={styles.sectionHeader}>
              {isRTL ? 'تقديم إشعار تحويل بنكي' : 'Submit Bank Transfer Notice'}
            </AppText>

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'اسم البنك المحول منه' : 'Source Bank Name'} *
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={bankName}
              onChangeText={setBankName}
              placeholder={isRTL ? 'مثال: مصرف الراجحي' : 'e.g. Al Rajhi Bank'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'اسم صاحب الحساب المحول منه' : 'Account Holder Name'}
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={accName}
              onChangeText={setAccName}
              placeholder={isRTL ? 'اسم المحول' : 'Sender Name'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'المبلغ المحول (ر.س)' : 'Transferred Amount (SAR)'} *
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={transferAmount}
              onChangeText={setTransferAmount}
              keyboardType="numeric"
              placeholder="3500"
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'رقم المرجع / العملية' : 'Reference / Transaction ID'} *
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={refNumber}
              onChangeText={setRefNumber}
              placeholder="REF-XXXXXX"
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <TouchableOpacity
              style={styles.submitTransferBtn}
              onPress={handleSubmitTransfer}
              disabled={submitTransferMutation.isPending}
            >
              {submitTransferMutation.isPending ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.submitTransferBtnText}>
                  {isRTL ? 'إرسال إشعار التحويل البنكي' : 'Submit Transfer Notice'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 4: PLANS */}
        {activeTab === 'plans' && (
          <View style={{ gap: 10 }}>
            {plansList.map((plan: SubscriptionPlan) => (
              <View key={String(plan.id)} style={[styles.card, isDark && styles.darkCard]}>
                <AppText variant="cardTitle" weight="bold" style={styles.cardTitle}>
                  {plan.name}
                </AppText>
                <AppText variant="caption" color="#77839B" style={styles.cardMetaText}>
                  {plan.description || (isRTL ? 'خطة اشتراك المدرسة السنوية' : 'Annual school subscription')}
                </AppText>
                <AppText variant="bodyBold" color="#1246B7" style={styles.amountText}>
                  {`${plan.price || 0} ر.س / ${isRTL ? 'سنوياً' : 'Yearly'}`}
                </AppText>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* PayLink Form Modal */}
      <Modal visible={payLinkModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={styles.modalTitle}>
              {isRTL ? 'إنشاء رابط دفع جديد' : 'Create Payment Link'}
            </AppText>

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'عنوان / وصف الرابط' : 'Link Title / Description'} *
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={payLinkTitle}
              onChangeText={setPayLinkTitle}
              placeholder={isRTL ? 'مثال: رسوم الفصل الأول' : 'e.g. 1st Term Fees'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'المبلغ (ر.س)' : 'Amount (SAR)'} *
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={payLinkAmount}
              onChangeText={setPayLinkAmount}
              keyboardType="numeric"
              placeholder="1500"
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveSubmitBtn}
                onPress={handleCreatePayLink}
                disabled={createPayLinkMutation.isPending}
              >
                {createPayLinkMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveSubmitBtnText}>{isRTL ? 'حفظ وإنشاء الرابط' : 'Create Link'}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayLinkModalVisible(false)}>
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
  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: Platform.OS === 'android' ? 14 : 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', gap: 10 },
  darkCard: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleBlock: { flex: 1 },
  title: { fontSize: 23, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  subtitle: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular, marginTop: 2 },
  tabsRow: { flexDirection: 'row', gap: 6 },
  tabBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  tabBtnActive: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  tabBtnText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#5A6784', fontWeight: '600' },
  tabBtnTextActive: { color: '#FFFFFF', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  content: { padding: 14, gap: 12 },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpiBox: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', ...shadows.card },
  kpiVal: { fontSize: 17.5, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  kpiLabel: { fontSize: 11.5, fontFamily: ibmPlexArabicFontFamily.regular, marginTop: 2 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.card, gap: 6 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  statusPaid: { backgroundColor: '#F1FAF5' },
  statusPending: { backgroundColor: '#FFF8EC' },
  statusOverdue: { backgroundColor: '#FEE4E2' },
  statusPillText: { fontSize: 12, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  cardMetaText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.regular },
  amountText: { fontSize: 15, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  createLinkBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  createLinkBtnText: { color: '#fff', fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  sectionHeader: { fontSize: 17, fontFamily: ibmPlexArabicFontFamily.bold, marginBottom: 4 },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  label: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#344054', marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, backgroundColor: '#F8FAFC' },
  darkInput: { backgroundColor: '#091A38', borderColor: '#1E3A6E', color: '#F8FAFC' },
  submitTransferBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  submitTransferBtnText: { color: '#fff', fontSize: 15, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingVertical: 30, gap: 6 },
  emptyTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, gap: 8 },
  modalTitle: { fontSize: 18.5, fontFamily: ibmPlexArabicFontFamily.bold, textAlign: 'center', marginBottom: 6 },
  modalActions: { gap: 6, marginTop: 10 },
  saveSubmitBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveSubmitBtnText: { color: '#fff', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { paddingVertical: 8, alignItems: 'center' },
  cancelBtnText: { color: '#77839B', fontFamily: ibmPlexArabicFontFamily.semiBold, fontSize: 14 },
  ltrRow: { flexDirection: 'row' },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
});
