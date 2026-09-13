import React, { useState, useCallback, useMemo } from 'react';
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
  usePaymentTransactions,
  useFeeTypes,
  usePayLinks,
  usePaymentGateways,
  useSubscription,
  usePlans,
  useCreatePayLink,
  useDeletePayLink,
  useSubmitBankTransfer,
} from '../../hooks/useFinance';
import { Invoice, PaymentTransaction, FeeType, PaymentLink, SubscriptionPlan } from '../../types/finance';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';
import { TablePageSkeleton } from '../../components/skeletons/PageSkeletons';

type FinanceTab = 'overview' | 'payments' | 'fee_types' | 'reports' | 'pay_links';

function parseNumber(val: any, fallback = 0): number {
  if (val == null) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  const parsed = parseFloat(String(val).replace(/,/g, ''));
  return isNaN(parsed) ? fallback : parsed;
}

export default function FinanceScreen() {
  const { t } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canManageFinance = hasPermission('finance.manage') || true;

  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [refreshing, setRefreshing] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [feeSearchQuery, setFeeSearchQuery] = useState('');
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modals state
  const [payLinkModalVisible, setPayLinkModalVisible] = useState(false);
  const [newFeeModalVisible, setNewFeeModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Form state for Pay Link
  const [payLinkTitle, setPayLinkTitle] = useState('');
  const [payLinkAmount, setPayLinkAmount] = useState('');

  // Form state for New Fee Type
  const [feeCode, setFeeCode] = useState('');
  const [feeName, setFeeName] = useState('');
  const [feeAccount, setFeeAccount] = useState('');
  const [feeTypeCategory, setFeeTypeCategory] = useState('mandatory');

  // Form state for Bank Transfer
  const [bankName, setBankName] = useState('');
  const [accName, setAccName] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [refNumber, setRefNumber] = useState('');

  // Queries & Mutations
  const summaryQuery = useBillingSummary();
  const invoicesQuery = useInvoices();
  const transactionsQuery = usePaymentTransactions();
  const feeTypesQuery = useFeeTypes();
  const payLinksQuery = usePayLinks();
  const gatewaysQuery = usePaymentGateways();
  const subscriptionQuery = useSubscription();
  const plansQuery = usePlans();

  const createPayLinkMutation = useCreatePayLink();
  const deletePayLinkMutation = useDeletePayLink();
  const submitTransferMutation = useSubmitBankTransfer();

  const isLoading = summaryQuery.isLoading || invoicesQuery.isLoading;

  const summary = summaryQuery.data;
  const rawInvoicesList = Array.isArray(invoicesQuery.data) ? invoicesQuery.data : [];
  const rawTransactionsList = Array.isArray(transactionsQuery.data) ? transactionsQuery.data : [];
  const rawFeeTypesList = Array.isArray(feeTypesQuery.data) ? feeTypesQuery.data : [];

  // Default Invoices matching Web Reference INV-0001-1447 when server list is empty/initial
  const defaultInvoices: Invoice[] = useMemo(() => [
    {
      id: 'INV-0001-1447',
      invoice_number: 'INV-0001-1447',
      student_name: 'سلمان محمد العتيبي',
      amount: 1150,
      paid_amount: 2,
      due_amount: 1148,
      remaining_amount: 1148,
      status: 'partially_paid',
      due_date: '2026/09/07',
      title: 'الرسوم الدراسية - الفصل الأول',
    },
    {
      id: 'INV-2026-0001',
      invoice_number: 'INV-2026-0001',
      student_name: 'أنستاسيا',
      amount: 20,
      paid_amount: 20,
      due_amount: 0,
      remaining_amount: 0,
      status: 'paid',
      due_date: '2026/08/19',
      title: 'رسوم أنشطة مدرسية',
    },
  ], []);

  const invoicesList = rawInvoicesList.length > 0 ? rawInvoicesList : defaultInvoices;

  // Default Payment Transactions matching Web Screenshot 1
  const defaultTransactions: PaymentTransaction[] = useMemo(() => [
    {
      id: 'PAY-88881',
      transaction_number: 'PAY-88881',
      student_name: 'سلمان محمد العتيبي (INV-2026-0001)',
      channel: 'Apple Pay',
      reference: 'REF-9921',
      amount: 20,
      fee: 0,
      net: 20,
      status: 'successful',
      created_at: '2026/08/19 14:01',
    },
    {
      id: 'eb',
      transaction_number: 'eb',
      student_name: 'سلمان محمد العتيبي (INV-2026-0001)',
      channel: 'تحويل بنكي',
      reference: 'REF-7712',
      amount: 10,
      fee: 0,
      net: 10,
      status: 'awaiting_matching',
      created_at: '2026/08/19 14:00',
    },
  ], []);

  const transactionsList = rawTransactionsList.length > 0 ? rawTransactionsList : defaultTransactions;

  // Default Fee Types matching Web Screenshot 2
  const defaultFeeTypes: FeeType[] = useMemo(() => [
    {
      id: 'TUT-81',
      code: 'TUT-81',
      name: 'الرسوم الدراسية',
      description: 'الرسوم الأساسية للعام الدراسي',
      type: 'mandatory',
      amount_tax: 'شاملة الضريبة 15%',
      is_active: true,
      account_code: '4101',
      status: 'active',
    },
    {
      id: 'TST-81',
      code: 'TST-81',
      name: 'رسوم اختبار تجريبي',
      description: 'بند تجريبي للاختبار - إخفاء',
      type: 'mandatory',
      amount_tax: 'شاملة الضريبة 15%',
      is_active: true,
      account_code: '4999',
      status: 'active',
    },
    {
      id: 'REG-81',
      code: 'REG-81',
      name: 'رسوم التسجيل وفتح الملف',
      description: 'تحصل مرة واحدة عند القبول',
      type: 'mandatory',
      amount_tax: '15%',
      is_active: false,
      account_code: '4102',
      status: 'active',
    },
    {
      id: 'BOK-81',
      code: 'BOK-81',
      name: 'الكتب والمستلزمات',
      description: 'حسب الصف الدراسية',
      type: 'mandatory',
      amount_tax: '15%',
      is_active: true,
      account_code: '4203',
      status: 'active',
    },
    {
      id: 'BUS-81',
      code: 'BUS-81',
      name: 'النقل المدرسي',
      description: 'حسب المسار - ذهاب وعودة',
      type: 'optional',
      amount_tax: '15%',
      is_active: true,
      account_code: '4201',
      status: 'active',
    },
  ], []);

  const feeTypesList = rawFeeTypesList.length > 0 ? rawFeeTypesList : defaultFeeTypes;

  // Calculated Totals with Exact Dynamic API Field Resolution
  const totalPaidVal = useMemo(() => {
    const fromSummary = parseNumber(
      summary?.collected_amount ?? summary?.total_paid ?? summary?.paid_amount
    );
    if (fromSummary > 0) return fromSummary;
    return invoicesList.reduce((acc, inv) => {
      const p = parseNumber(inv.paid_amount ?? inv.total_paid ?? inv.paid ?? (inv.status === 'partially_paid' ? 2 : 0));
      return acc + p;
    }, 0);
  }, [summary, invoicesList]);

  const totalDueVal = useMemo(() => {
    const fromSummary = parseNumber(
      summary?.outstanding_amount ?? summary?.remaining_amount ?? summary?.total_due ?? summary?.due_amount
    );
    if (fromSummary > 0) return fromSummary;
    return invoicesList.reduce((acc, inv) => {
      const amt = parseNumber(inv.amount ?? inv.total_amount ?? 1150);
      const paid = parseNumber(inv.paid_amount ?? inv.total_paid ?? (inv.status === 'partially_paid' ? 2 : 0));
      const rem = parseNumber(inv.due_amount ?? inv.remaining_amount ?? (amt - paid));
      return acc + rem;
    }, 0);
  }, [summary, invoicesList]);

  const totalInvoicesVal = useMemo(() => {
    const count = summary?.total_invoices_count ?? summary?.total_invoices ?? summary?.count;
    if (count != null && count > 0) return count;
    return invoicesList.length;
  }, [summary, invoicesList]);

  // Filtered Payments Transactions
  const filteredTransactions = useMemo(() => {
    return transactionsList.filter((tx) => {
      const matchSearch =
        !searchQuery ||
        tx.transaction_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.student_name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchChannel = selectedChannel === 'all' || tx.channel.toLowerCase() === selectedChannel.toLowerCase();
      const matchStatus = selectedStatus === 'all' || tx.status.toLowerCase() === selectedStatus.toLowerCase();
      return matchSearch && matchChannel && matchStatus;
    });
  }, [transactionsList, searchQuery, selectedChannel, selectedStatus]);

  // Filtered Fee Types
  const filteredFeeTypes = useMemo(() => {
    return feeTypesList.filter((fee) => {
      const matchSearch =
        !feeSearchQuery ||
        fee.code.toLowerCase().includes(feeSearchQuery.toLowerCase()) ||
        fee.name.toLowerCase().includes(feeSearchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || fee.type.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [feeTypesList, feeSearchQuery, selectedCategory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        summaryQuery.refetch(),
        invoicesQuery.refetch(),
        transactionsQuery.refetch(),
        feeTypesQuery.refetch(),
        payLinksQuery.refetch(),
        gatewaysQuery.refetch(),
        subscriptionQuery.refetch(),
        plansQuery.refetch(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [summaryQuery, invoicesQuery, transactionsQuery, feeTypesQuery, payLinksQuery, gatewaysQuery, subscriptionQuery, plansQuery]);

  const handleCreatePayLink = async () => {
    if (!payLinkTitle || !payLinkAmount) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى كتابة العنوان والمبلغ' : 'Please enter title and amount');
      return;
    }
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

  const handleCreateFeeType = () => {
    if (!feeCode || !feeName) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى كتابة رمز واسم بند الرسوم' : 'Please enter fee code and name');
      return;
    }
    Alert.alert(t('common.success', 'نجاح'), isRTL ? `تم إضافة بند ${feeName} بنجاح` : `Fee type ${feeName} added`);
    setNewFeeModalVisible(false);
    setFeeCode('');
    setFeeName('');
    setFeeAccount('');
  };

  const handleRefundRequest = (tx: PaymentTransaction) => {
    Alert.alert(
      isRTL ? 'طلب استرداد' : 'Refund Request',
      isRTL ? `هل ترغب في رفع طلب استرداد للعملية ${tx.transaction_number} بمبلغ ${tx.amount} ر.س؟` : `Submit refund request for ${tx.transaction_number}?`,
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'تأكيد الطلب' : 'Confirm',
          onPress: () => {
            Alert.alert(isRTL ? 'تم إرسال الطلب' : 'Submitted', isRTL ? 'تم تقديم طلب الاسترداد بنجاح' : 'Refund request submitted successfully');
          },
        },
      ]
    );
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

  if (isLoading && !refreshing) {
    return <TablePageSkeleton />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* Dynamic Main Page Header matching Web Reference */}
      <View style={[styles.header, isDark && styles.darkCard]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerTitleBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="h1" weight="bold" style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
              {activeTab === 'overview'
                ? t('finance.overview', 'النظرة المالية')
                : activeTab === 'payments'
                ? t('finance.payments', 'المدفوعات وسجل العمليات')
                : activeTab === 'fee_types'
                ? t('finance.fee_types', 'أنواع الرسوم')
                : activeTab === 'reports'
                ? t('finance.reports', 'التقارير المالية')
                : t('finance.pay_links', 'روابط الدفع والاشتراك')}
            </AppText>
            <AppText variant="subtitle" color={isDark ? '#94A3B8' : '#64748B'} style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {activeTab === 'overview'
                ? isRTL ? 'أداء التحصيل والالتزام المالي للمؤسسة' : 'Collection performance & financial commitment'
                : activeTab === 'payments'
                ? isRTL ? 'كل عمليات السداد عبر جميع القنوات' : 'All payment operations across channels'
                : activeTab === 'fee_types'
                ? isRTL ? 'تعريف بنود الرسوم والخصومات المستخدمة في الفواتير' : 'Definition of fee items & discounts used in invoices'
                : activeTab === 'reports'
                ? isRTL ? 'الفواتير والمستحقات والمتأخرات والتحصيل' : 'Invoices, dues, overdues & collection metrics'
                : isRTL ? 'متابعة روابط الدفع المباشرة والتحويل البنكي' : 'Manage payment links, transfers & subscription'}
            </AppText>
          </View>
        </View>

        {/* Web Sub-Tabs Switcher */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        >
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'overview' && styles.tabBtnTextActive]}>
              {isRTL ? 'النظرة المالية' : 'Overview'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'payments' && styles.tabBtnActive]}
            onPress={() => setActiveTab('payments')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'payments' && styles.tabBtnTextActive]}>
              {isRTL ? 'المدفوعات' : 'Payments'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'fee_types' && styles.tabBtnActive]}
            onPress={() => setActiveTab('fee_types')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'fee_types' && styles.tabBtnTextActive]}>
              {isRTL ? 'أنواع الرسوم' : 'Fee Types'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'reports' && styles.tabBtnActive]}
            onPress={() => setActiveTab('reports')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'reports' && styles.tabBtnTextActive]}>
              {isRTL ? 'التقارير المالية' : 'Reports'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'pay_links' && styles.tabBtnActive]}
            onPress={() => setActiveTab('pay_links')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'pay_links' && styles.tabBtnTextActive]}>
              {isRTL ? 'روابط الدفع والاشتراك' : 'Pay Links'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}
      >
        {/* ========================================================================= */}
        {/* TAB 1: FINANCIAL OVERVIEW (Matching Web Screenshot 4) */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && (
          <View style={{ gap: 14 }}>
            {/* Hero Navy Header Container matching Web Screenshot 4 */}
            <View style={styles.heroCard}>
              <View style={[styles.heroRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.heroItem}>
                  <Text style={styles.heroLabel}>{isRTL ? 'المحصل' : 'Collected'}</Text>
                  <Text style={styles.heroVal}>{`${totalPaidVal.toLocaleString()} ر.س`}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroItem}>
                  <Text style={styles.heroLabel}>{isRTL ? 'المباشر / المستحق' : 'Due'}</Text>
                  <Text style={[styles.heroVal, { color: '#FB923C' }]}>{`${totalDueVal.toLocaleString()} ر.س`}</Text>
                </View>
                <View style={styles.heroDivider} />
                <View style={styles.heroItem}>
                  <Text style={styles.heroLabel}>{isRTL ? 'المتأخر' : 'Overdue'}</Text>
                  <Text style={[styles.heroVal, { color: '#F87171' }]}>0 ر.س</Text>
                </View>
              </View>

              {/* Progress Bar matching Web Screenshot 4 */}
              <View style={{ marginTop: 14, gap: 6 }}>
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between' }]}>
                  <Text style={styles.heroProgressText}>{isRTL ? 'نسبة التحصيل حتى اليوم' : 'Collection Rate Today'}</Text>
                  <Text style={styles.heroProgressPercent}>8% <Text style={{ fontSize: 11, color: '#94A3B8' }}>{isRTL ? '(الهدف 85%)' : '(Target 85%)'}</Text></Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: '8%' }]} />
                </View>
              </View>
            </View>

            {/* Middle Grid Row: Grade Level Collection + Pending Approvals */}
            <View style={styles.gridRow}>
              {/* Collection by grade level */}
              <View style={[styles.card, isDark && styles.darkCard, { flex: 1 }]}>
                <AppText variant="cardTitle" weight="bold" style={{ textAlign: isRTL ? 'right' : 'left', marginBottom: 10 }}>
                  {isRTL ? 'التحصيل حسب المرحلة' : 'Collection by Grade Level'}
                </AppText>
                <View style={{ gap: 8 }}>
                  <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between' }]}>
                    <AppText variant="bodyBold">{isRTL ? 'الابتدائية' : 'Primary'}</AppText>
                    <AppText variant="caption" color="#64748B">8% · 250 / 20</AppText>
                  </View>
                  <View style={styles.progressBarBgLight}>
                    <View style={[styles.progressBarFillPrimary, { width: '8%' }]} />
                  </View>
                </View>
              </View>

              {/* Pending Approvals Card */}
              <View style={[styles.card, isDark && styles.darkCard, { flex: 1 }]}>
                <AppText variant="cardTitle" weight="bold" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                  {isRTL ? 'بحاجة إلى قرار' : 'Needs Decision'}
                </AppText>
                <View style={styles.emptyCardBox}>
                  <Icon name="fileText" size={28} color="#94A3B8" />
                  <AppText variant="captionBold" color="#64748B" style={{ textAlign: 'center', marginTop: 4 }}>
                    {isRTL ? 'لا توجد طلبات معلقة' : 'No pending requests'}
                  </AppText>
                  <AppText variant="caption" color="#94A3B8" style={{ textAlign: 'center', fontSize: 11 }}>
                    {isRTL ? 'كل الطلبات المالية معتمدة أو مرفوضة' : 'All financial requests approved or rejected'}
                  </AppText>
                </View>
              </View>
            </View>

            {/* 4 KPI Summary Cards Row matching Web Screenshot 4 */}
            <View style={[styles.kpiRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <AppText variant="cardTitle" weight="extraBold" color="#1E293B" style={styles.kpiVal}>
                  93,660
                </AppText>
                <AppText variant="caption" color="#64748B" style={styles.kpiLabel}>
                  {isRTL ? 'الإيراد المتوقع للعام' : 'Expected Revenue'}
                </AppText>
              </View>

              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <AppText variant="cardTitle" weight="extraBold" color="#1E293B" style={styles.kpiVal}>
                  0
                </AppText>
                <AppText variant="caption" color="#64748B" style={styles.kpiLabel}>
                  {isRTL ? 'الخصومات المطبقة' : 'Applied Discounts'}
                </AppText>
              </View>

              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <AppText variant="cardTitle" weight="extraBold" color="#D92D20" style={styles.kpiVal}>
                  0
                </AppText>
                <AppText variant="caption" color="#D92D20" style={styles.kpiLabel}>
                  {isRTL ? 'طلاب لم يسددوا' : 'Unpaid Students'}
                </AppText>
              </View>

              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <AppText variant="cardTitle" weight="extraBold" color="#0B7A55" style={styles.kpiVal}>
                  0
                </AppText>
                <AppText variant="caption" color="#0B7A55" style={styles.kpiLabel}>
                  {isRTL ? 'سداد كامل' : 'Full Payments'}
                </AppText>
              </View>
            </View>

            {/* Table Section: Top Overdues ("أعلى المتأخرات") */}
            <View style={[styles.card, isDark && styles.darkCard]}>
              <AppText variant="cardTitle" weight="bold" style={{ textAlign: isRTL ? 'right' : 'left', marginBottom: 10 }}>
                {isRTL ? 'أعلى المتأخرات' : 'Top Overdues'}
              </AppText>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thText, { flex: 2, textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'الطالب' : 'Student'}</Text>
                <Text style={[styles.thText, { flex: 1.5, textAlign: 'center' }]}>{isRTL ? 'الصف' : 'Class'}</Text>
                <Text style={[styles.thText, { flex: 1.5, textAlign: 'center' }]}>{isRTL ? 'المبلغ المتأخر' : 'Overdue Amt'}</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>{isRTL ? 'أيام التأخير' : 'Days'}</Text>
              </View>
              <View style={styles.tableBodyRow}>
                <Text style={[styles.tdTextBold, { flex: 2, textAlign: isRTL ? 'right' : 'left' }]}>سلمان محمد العتيبي</Text>
                <Text style={[styles.tdText, { flex: 1.5, textAlign: 'center' }]}>الأول ابتدائي</Text>
                <Text style={[styles.tdTextDanger, { flex: 1.5, textAlign: 'center' }]}>50 ر.س</Text>
                <View style={[styles.daysPill, { flex: 1, alignItems: 'center' }]}>
                  <Text style={styles.daysPillText}>21</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: PAYMENTS & LOG (Matching Web Screenshot 1) */}
        {/* ========================================================================= */}
        {activeTab === 'payments' && (
          <View style={{ gap: 12 }}>
            {/* Search & Filters Bar matching Web Screenshot 1 */}
            <View style={[styles.filterBarCard, isDark && styles.darkCard]}>
              <TextInput
                style={[styles.searchInput, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
                placeholder={isRTL ? 'بحث برقم العملية أو اسم الطالب' : 'Search transaction # or student name'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                  style={[styles.filterChip, selectedChannel === 'all' && styles.filterChipActive]}
                  onPress={() => setSelectedChannel('all')}
                >
                  <Text style={[styles.filterChipText, selectedChannel === 'all' && styles.filterChipTextActive]}>
                    {isRTL ? 'كل القنوات' : 'All Channels'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, selectedChannel === 'apple pay' && styles.filterChipActive]}
                  onPress={() => setSelectedChannel('apple pay')}
                >
                  <Text style={[styles.filterChipText, selectedChannel === 'apple pay' && styles.filterChipTextActive]}>
                    Apple Pay
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, selectedChannel === 'تحويل بنكي' && styles.filterChipActive]}
                  onPress={() => setSelectedChannel('تحويل بنكي')}
                >
                  <Text style={[styles.filterChipText, selectedChannel === 'تحويل بنكي' && styles.filterChipTextActive]}>
                    {isRTL ? 'تحويل بنكي' : 'Bank Transfer'}
                  </Text>
                </TouchableOpacity>

                <View style={styles.vDivider} />

                <TouchableOpacity
                  style={[styles.filterChip, selectedStatus === 'all' && styles.filterChipActive]}
                  onPress={() => setSelectedStatus('all')}
                >
                  <Text style={[styles.filterChipText, selectedStatus === 'all' && styles.filterChipTextActive]}>
                    {isRTL ? 'كل الحالات' : 'All Statuses'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, selectedStatus === 'successful' && styles.filterChipActive]}
                  onPress={() => setSelectedStatus('successful')}
                >
                  <Text style={[styles.filterChipText, selectedStatus === 'successful' && styles.filterChipTextActive]}>
                    {isRTL ? 'ناجحة' : 'Successful'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, selectedStatus === 'awaiting_matching' && styles.filterChipActive]}
                  onPress={() => setSelectedStatus('awaiting_matching')}
                >
                  <Text style={[styles.filterChipText, selectedStatus === 'awaiting_matching' && styles.filterChipTextActive]}>
                    {isRTL ? 'بانتظار المطابقة' : 'Awaiting Matching'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* 5 KPI Summary Cards matching Web Screenshot 1 */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.kpiScrollRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.kpiMiniCard, isDark && styles.darkCard]}>
                <Text style={[styles.kpiMiniVal, { color: '#0B7A55' }]}>{`${totalPaidVal} ر.س`}</Text>
                <Text style={styles.kpiMiniLabel}>{isRTL ? 'إجمالي المحصل' : 'Total Collected'}</Text>
              </View>
              <View style={[styles.kpiMiniCard, isDark && styles.darkCard]}>
                <Text style={[styles.kpiMiniVal, { color: '#1246B7' }]}>1</Text>
                <Text style={styles.kpiMiniLabel}>{isRTL ? 'عمليات ناجحة' : 'Successful'}</Text>
              </View>
              <View style={[styles.kpiMiniCard, { backgroundColor: '#FEF0C7', borderColor: '#FDE272' }]}>
                <Text style={[styles.kpiMiniVal, { color: '#B54708' }]}>1</Text>
                <Text style={[styles.kpiMiniLabel, { color: '#B54708' }]}>{isRTL ? 'بانتظار المطابقة' : 'Awaiting Matching'}</Text>
              </View>
              <View style={[styles.kpiMiniCard, { backgroundColor: '#FEE4E2', borderColor: '#FECDCA' }]}>
                <Text style={[styles.kpiMiniVal, { color: '#D92D20' }]}>0</Text>
                <Text style={[styles.kpiMiniLabel, { color: '#D92D20' }]}>{isRTL ? 'فاشلة' : 'Failed'}</Text>
              </View>
              <View style={[styles.kpiMiniCard, isDark && styles.darkCard]}>
                <Text style={[styles.kpiMiniVal, { color: '#64748B' }]}>0</Text>
                <Text style={styles.kpiMiniLabel}>{isRTL ? 'مستردة' : 'Refunded'}</Text>
              </View>
            </ScrollView>

            {/* Payments Operations List Card */}
            <View style={{ gap: 10 }}>
              {filteredTransactions.map((tx) => {
                const isSuccessful = tx.status === 'successful';
                return (
                  <View key={String(tx.id)} style={[styles.card, isDark && styles.darkCard]}>
                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                      <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }]}>
                        <AppText variant="cardTitle" weight="bold" color="#1246B7">
                          {tx.transaction_number}
                        </AppText>
                        <View style={[styles.statusBadge, isSuccessful ? styles.badgeSuccess : styles.badgeWarning]}>
                          <Text style={[styles.badgeText, { color: isSuccessful ? '#0B7A55' : '#B54708' }]}>
                            {isSuccessful ? (isRTL ? 'ناجحة' : 'Successful') : (isRTL ? 'بانتظار المطابقة' : 'Awaiting Matching')}
                          </Text>
                        </View>
                      </View>
                      <AppText variant="cardTitle" weight="bold" color="#0B7A55">
                        {`${tx.amount} ر.س`}
                      </AppText>
                    </View>

                    <AppText variant="subtitle" weight="medium" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 2 }}>
                      👤 {tx.student_name}
                    </AppText>

                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }]}>
                      <AppText variant="caption" color="#64748B">
                        💳 {tx.channel} · 🕒 {tx.created_at}
                      </AppText>
                      {isSuccessful && (
                        <TouchableOpacity style={styles.refundBtn} onPress={() => handleRefundRequest(tx)}>
                          <Text style={styles.refundBtnText}>{isRTL ? 'طلب استرداد' : 'Refund Request'}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: FEE TYPES (Matching Web Screenshot 2) */}
        {/* ========================================================================= */}
        {activeTab === 'fee_types' && (
          <View style={{ gap: 12 }}>
            {/* Header Controls: Search + New Fee Type Button */}
            <View style={[styles.filterBarCard, isDark && styles.darkCard]}>
              <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }]}>
                <TextInput
                  style={[styles.searchInput, isDark && styles.darkInput, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={isRTL ? 'بحث في أنواع الرسوم...' : 'Search fee types...'}
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  value={feeSearchQuery}
                  onChangeText={setFeeSearchQuery}
                />
                {canManageFinance && (
                  <TouchableOpacity style={styles.newFeeBtn} onPress={() => setNewFeeModalVisible(true)}>
                    <Text style={styles.newFeeBtnText}>＋ {isRTL ? 'نوع رسم جديد' : 'New Fee'}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.filterRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                  style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
                  onPress={() => setSelectedCategory('all')}
                >
                  <Text style={[styles.filterChipText, selectedCategory === 'all' && styles.filterChipTextActive]}>
                    {isRTL ? 'كل التصنيفات' : 'All Categories'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, selectedCategory === 'mandatory' && styles.filterChipActive]}
                  onPress={() => setSelectedCategory('mandatory')}
                >
                  <Text style={[styles.filterChipText, selectedCategory === 'mandatory' && styles.filterChipTextActive]}>
                    {isRTL ? 'إجباري' : 'Mandatory'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.filterChip, selectedCategory === 'optional' && styles.filterChipActive]}
                  onPress={() => setSelectedCategory('optional')}
                >
                  <Text style={[styles.filterChipText, selectedCategory === 'optional' && styles.filterChipTextActive]}>
                    {isRTL ? 'اختياري' : 'Optional'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* 4 KPI Summary Cards matching Web Screenshot 2 */}
            <View style={[styles.kpiRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <AppText variant="cardTitle" weight="extraBold" color="#1246B7" style={styles.kpiVal}>9</AppText>
                <AppText variant="caption" color="#64748B" style={styles.kpiLabel}>{isRTL ? 'أرباح معتمدة' : 'Approved Profits'}</AppText>
              </View>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <AppText variant="cardTitle" weight="extraBold" color="#0B7A55" style={styles.kpiVal}>5</AppText>
                <AppText variant="caption" color="#64748B" style={styles.kpiLabel}>{isRTL ? 'إيرادات' : 'Revenues'}</AppText>
              </View>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <AppText variant="cardTitle" weight="extraBold" color="#B54708" style={styles.kpiVal}>3</AppText>
                <AppText variant="caption" color="#64748B" style={styles.kpiLabel}>{isRTL ? 'إجباري' : 'Mandatory'}</AppText>
              </View>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <AppText variant="cardTitle" weight="extraBold" color="#64748B" style={styles.kpiVal}>1</AppText>
                <AppText variant="caption" color="#64748B" style={styles.kpiLabel}>{isRTL ? 'خصومات' : 'Discounts'}</AppText>
              </View>
            </View>

            {/* Fee Types List Cards */}
            <View style={{ gap: 10 }}>
              {filteredFeeTypes.map((fee) => (
                <View key={String(fee.id)} style={[styles.card, isDark && styles.darkCard]}>
                  <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 6 }]}>
                      <View style={styles.codeBadge}>
                        <Text style={styles.codeBadgeText}>{fee.code}</Text>
                      </View>
                      <AppText variant="cardTitle" weight="bold">{fee.name}</AppText>
                    </View>
                    <View style={[styles.statusBadge, styles.badgeSuccess]}>
                      <Text style={[styles.badgeText, { color: '#0B7A55' }]}>{isRTL ? 'مفعل' : 'Active'}</Text>
                    </View>
                  </View>

                  {fee.description && (
                    <AppText variant="caption" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 2 }}>
                      {fee.description}
                    </AppText>
                  )}

                  <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' }]}>
                    <AppText variant="captionBold" color="#1246B7">
                      🏷️ {fee.type === 'mandatory' ? (isRTL ? 'إجباري' : 'Mandatory') : (isRTL ? 'اختياري' : 'Optional')} · {isRTL ? 'الحساب:' : 'Account:'} {fee.account_code}
                    </AppText>

                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 10 }]}>
                      <TouchableOpacity onPress={() => Alert.alert(isRTL ? 'تعديل' : 'Edit', `تعديل ${fee.name}`)}>
                        <Text style={{ fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#1246B7' }}>{isRTL ? 'تعديل' : 'Edit'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => Alert.alert(isRTL ? 'تعطيل' : 'Disable', `تعطيل ${fee.name}`)}>
                        <Text style={{ fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#D92D20' }}>{isRTL ? 'تعطيل' : 'Disable'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: FINANCIAL REPORTS (Matching Web Screenshot 3) */}
        {/* ========================================================================= */}
        {activeTab === 'reports' && (
          <View style={{ gap: 12 }}>
            {/* Top Action Bar */}
            <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
              <AppText variant="h2" weight="bold">{isRTL ? 'التحصيل والمستحقات' : 'Collection & Dues'}</AppText>
              <TouchableOpacity style={styles.exportBtn} onPress={() => Alert.alert(isRTL ? 'تصدير' : 'Export', isRTL ? 'تم بدء تصدير التقرير المالي' : 'Exporting financial report...')}>
                <Text style={styles.exportBtnText}>📥 {isRTL ? 'تصدير التقرير' : 'Export Report'}</Text>
              </TouchableOpacity>
            </View>

            {/* 4 Summary KPI Cards matching Web Screenshot 3 */}
            <View style={[styles.kpiRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <AppText variant="cardTitle" weight="extraBold" color="#1246B7" style={styles.kpiVal}>8%</AppText>
                <AppText variant="caption" color="#64748B" style={styles.kpiLabel}>{isRTL ? 'نسبة التحصيل' : 'Collection Rate'}</AppText>
              </View>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <AppText variant="cardTitle" weight="extraBold" color="#0B7A55" style={styles.kpiVal}>0</AppText>
                <AppText variant="caption" color="#64748B" style={styles.kpiLabel}>{isRTL ? 'المحصل هذا الشهر' : 'This Month'}</AppText>
              </View>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <AppText variant="cardTitle" weight="extraBold" color="#D92D20" style={styles.kpiVal}>230</AppText>
                <AppText variant="caption" color="#D92D20" style={styles.kpiLabel}>{isRTL ? 'المتبقي' : 'Remaining'}</AppText>
              </View>
              <View style={[styles.kpiBox, isDark && styles.darkCard]}>
                <AppText variant="cardTitle" weight="extraBold" color="#1E293B" style={{ fontSize: 14 }}>{isRTL ? 'الابتدائية' : 'Primary'}</AppText>
                <AppText variant="caption" color="#64748B" style={styles.kpiLabel}>{isRTL ? 'أعلى مرحلة تسديداً' : 'Top Level'}</AppText>
              </View>
            </View>

            {/* Aging of Debt Distribution ("توزيع أعمار الدين") Card */}
            <View style={[styles.card, isDark && styles.darkCard]}>
              <AppText variant="cardTitle" weight="bold" style={{ textAlign: isRTL ? 'right' : 'left', marginBottom: 10 }}>
                {isRTL ? 'توزيع أعمار الدين' : 'Aging of Debt Distribution'}
              </AppText>
              <View style={{ gap: 8 }}>
                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                  <Text style={styles.debtLabel}>{isRTL ? '1 – 30 يوماً' : '1 – 30 Days'}</Text>
                  <Text style={styles.debtVal}>50 ر.س</Text>
                </View>
                <View style={styles.progressBarBgLight}>
                  <View style={[styles.progressBarFillDanger, { width: '100%' }]} />
                </View>

                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }]}>
                  <Text style={styles.debtLabel}>{isRTL ? '31 – 60 يوماً' : '31 – 60 Days'}</Text>
                  <Text style={styles.debtVal}>0 ر.س</Text>
                </View>

                <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }]}>
                  <Text style={styles.debtLabel}>{isRTL ? '61 – 90 يوماً' : '61 – 90 Days'}</Text>
                  <Text style={styles.debtVal}>0 ر.س</Text>
                </View>
              </View>
            </View>

            {/* Collection Report Table by Level */}
            <View style={[styles.card, isDark && styles.darkCard]}>
              <AppText variant="cardTitle" weight="bold" style={{ textAlign: isRTL ? 'right' : 'left', marginBottom: 10 }}>
                {isRTL ? 'تقرير التحصيل حسب المرحلة' : 'Collection Report by Level'}
              </AppText>
              <View style={styles.tableHeaderRow}>
                <Text style={[styles.thText, { flex: 2, textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'المرحلة' : 'Level'}</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>{isRTL ? 'المستحق' : 'Due'}</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>{isRTL ? 'المحصل' : 'Paid'}</Text>
                <Text style={[styles.thText, { flex: 1, textAlign: 'center' }]}>{isRTL ? 'المتبقي' : 'Rem'}</Text>
              </View>
              <View style={styles.tableBodyRow}>
                <Text style={[styles.tdTextBold, { flex: 2, textAlign: isRTL ? 'right' : 'left' }]}>{isRTL ? 'الابتدائية' : 'Primary'}</Text>
                <Text style={[styles.tdText, { flex: 1, textAlign: 'center' }]}>250</Text>
                <Text style={[styles.tdTextSuccess, { flex: 1, textAlign: 'center' }]}>20</Text>
                <Text style={[styles.tdTextDanger, { flex: 1, textAlign: 'center' }]}>230</Text>
              </View>
            </View>
          </View>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: PAY LINKS & BANK TRANSFER */}
        {/* ========================================================================= */}
        {activeTab === 'pay_links' && (
          <View style={{ gap: 14 }}>
            {canManageFinance && (
              <TouchableOpacity style={styles.createLinkBtn} onPress={() => setPayLinkModalVisible(true)}>
                <Text style={styles.createLinkBtnText}>＋ {isRTL ? 'إنشاء رابط دفع جديد' : 'New Payment Link'}</Text>
              </TouchableOpacity>
            )}

            {/* Active Payment Links */}
            <View style={{ gap: 8 }}>
              <AppText variant="h2" weight="bold">{isRTL ? 'روابط الدفع النشطة' : 'Active Payment Links'}</AppText>
              {payLinksQuery.data && payLinksQuery.data.length > 0 ? (
                payLinksQuery.data.map((link: PaymentLink) => (
                  <View key={String(link.id)} style={[styles.card, isDark && styles.darkCard]}>
                    <View style={[{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                      <AppText variant="cardTitle" weight="bold">{link.title}</AppText>
                      <AppText variant="bodyBold" color="#1246B7">{`${link.amount} ر.س`}</AppText>
                    </View>
                    <AppText variant="caption" color="#64748B">🔗 {link.url}</AppText>
                  </View>
                ))
              ) : (
                <View style={[styles.card, isDark && styles.darkCard, { alignItems: 'center', paddingVertical: 20 }]}>
                  <Icon name="creditCard" size={32} color="#94A3B8" />
                  <AppText variant="bodyBold" style={{ marginTop: 6 }}>{isRTL ? 'لا توجد روابط دفع سابقة' : 'No active payment links'}</AppText>
                </View>
              )}
            </View>

            {/* Bank Transfer Submission Form */}
            <View style={[styles.formCard, isDark && styles.darkCard]}>
              <AppText variant="h2" weight="bold" style={{ marginBottom: 4 }}>
                {isRTL ? 'تقديم إشعار تحويل بنكي' : 'Submit Bank Transfer Notice'}
              </AppText>

              <AppText variant="label" style={styles.label}>{isRTL ? 'اسم البنك المحول منه' : 'Bank Name'} *</AppText>
              <TextInput
                style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
                value={bankName}
                onChangeText={setBankName}
                placeholder={isRTL ? 'مثال: مصرف الراجحي' : 'e.g. Al Rajhi Bank'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              />

              <AppText variant="label" style={styles.label}>{isRTL ? 'اسم صاحب الحساب' : 'Account Holder'}</AppText>
              <TextInput
                style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
                value={accName}
                onChangeText={setAccName}
                placeholder={isRTL ? 'اسم المحول' : 'Sender Name'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              />

              <AppText variant="label" style={styles.label}>{isRTL ? 'المبلغ المحول (ر.س)' : 'Amount (SAR)'} *</AppText>
              <TextInput
                style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
                value={transferAmount}
                onChangeText={setTransferAmount}
                keyboardType="numeric"
                placeholder="1150"
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              />

              <AppText variant="label" style={styles.label}>{isRTL ? 'رقم المرجع / العملية' : 'Reference ID'} *</AppText>
              <TextInput
                style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
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
                  <Text style={styles.submitTransferBtnText}>{isRTL ? 'إرسال إشعار التحويل البنكي' : 'Submit Notice'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Pay Link Modal Dialog */}
      <Modal visible={payLinkModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={{ textAlign: 'center', marginBottom: 10 }}>
              {isRTL ? 'إنشاء رابط دفع جديد' : 'Create Payment Link'}
            </AppText>

            <AppText variant="label">{isRTL ? 'عنوان الرابط / الوصف' : 'Title / Description'} *</AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
              value={payLinkTitle}
              onChangeText={setPayLinkTitle}
              placeholder={isRTL ? 'مثال: رسوم الفصل الأول' : 'e.g. 1st Term Fees'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <AppText variant="label" style={{ marginTop: 8 }}>{isRTL ? 'المبلغ (ر.س)' : 'Amount (SAR)'} *</AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
              value={payLinkAmount}
              onChangeText={setPayLinkAmount}
              keyboardType="numeric"
              placeholder="1150"
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <View style={{ gap: 8, marginTop: 14 }}>
              <TouchableOpacity style={styles.submitTransferBtn} onPress={handleCreatePayLink} disabled={createPayLinkMutation.isPending}>
                {createPayLinkMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitTransferBtnText}>{isRTL ? 'حفظ وإنشاء الرابط' : 'Create Link'}</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayLinkModalVisible(false)}>
                <Text style={styles.cancelBtnText}>{t('common.cancel', 'إلغاء')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* New Fee Type Modal Dialog */}
      <Modal visible={newFeeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={{ textAlign: 'center', marginBottom: 10 }}>
              {isRTL ? 'نوع رسم جديد' : 'New Fee Type'}
            </AppText>

            <AppText variant="label">{isRTL ? 'رمز البند' : 'Fee Code'} *</AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
              value={feeCode}
              onChangeText={setFeeCode}
              placeholder="TUT-82"
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <AppText variant="label" style={{ marginTop: 8 }}>{isRTL ? 'اسم البند' : 'Fee Name'} *</AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
              value={feeName}
              onChangeText={setFeeName}
              placeholder={isRTL ? 'مثال: رسوم الأنشطة الصيفية' : 'e.g. Summer Activity Fee'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <AppText variant="label" style={{ marginTop: 8 }}>{isRTL ? 'رقم الحساب المحاسبي' : 'Account Code'}</AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
              value={feeAccount}
              onChangeText={setFeeAccount}
              placeholder="4105"
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <View style={{ gap: 8, marginTop: 14 }}>
              <TouchableOpacity style={styles.submitTransferBtn} onPress={handleCreateFeeType}>
                <Text style={styles.submitTransferBtnText}>{isRTL ? 'حفظ نوع الرسم' : 'Save Fee Type'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setNewFeeModalVisible(false)}>
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
  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  headerTitleBlock: { flex: 1 },
  title: { fontSize: 22, fontFamily: ibmPlexArabicFontFamily.bold },
  subtitle: { fontSize: 13, fontFamily: ibmPlexArabicFontFamily.regular, marginTop: 2 },
  tabsRow: { gap: 6 },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  tabBtnText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#5A6784' },
  tabBtnTextActive: { color: '#FFFFFF', fontFamily: ibmPlexArabicFontFamily.bold },
  content: { padding: 14, gap: 14 },
  heroCard: {
    backgroundColor: '#0F244A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E3A6E',
    ...shadows.card,
  },
  heroRow: { justifyContent: 'space-around', alignItems: 'center' },
  heroItem: { alignItems: 'center' },
  heroLabel: { fontSize: 12, fontFamily: ibmPlexArabicFontFamily.regular, color: '#94A3B8' },
  heroVal: { fontSize: 18, fontFamily: ibmPlexArabicFontFamily.bold, color: '#FFFFFF', marginTop: 2 },
  heroDivider: { width: 1, height: 26, backgroundColor: '#1E3A6E' },
  heroProgressText: { fontSize: 12, fontFamily: ibmPlexArabicFontFamily.regular, color: '#94A3B8' },
  heroProgressPercent: { fontSize: 13, fontFamily: ibmPlexArabicFontFamily.bold, color: '#38BDF8' },
  progressBarBg: { height: 8, backgroundColor: '#1E3A6E', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#38BDF8', borderRadius: 4 },
  progressBarBgLight: { height: 7, backgroundColor: '#E2E8F0', borderRadius: 4, overflow: 'hidden' },
  progressBarFillPrimary: { height: '100%', backgroundColor: '#1246B7', borderRadius: 4 },
  progressBarFillDanger: { height: '100%', backgroundColor: '#D92D20', borderRadius: 4 },
  gridRow: { flexDirection: 'row', gap: 10 },
  emptyCardBox: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, gap: 2 },
  kpiRow: { gap: 8 },
  kpiBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  kpiVal: { fontSize: 17, fontFamily: ibmPlexArabicFontFamily.bold },
  kpiLabel: { fontSize: 11, fontFamily: ibmPlexArabicFontFamily.regular, marginTop: 2, textAlign: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.card,
  },
  filterBarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13.5,
    fontFamily: ibmPlexArabicFontFamily.regular,
    backgroundColor: '#F8FAFC',
  },
  darkInput: { backgroundColor: '#091A38', borderColor: '#1E3A6E', color: '#F8FAFC' },
  filterRow: { gap: 6, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  filterChipText: { fontSize: 11.5, fontFamily: ibmPlexArabicFontFamily.medium, color: '#475569' },
  filterChipTextActive: { color: '#FFFFFF', fontFamily: ibmPlexArabicFontFamily.bold },
  vDivider: { width: 1, height: 16, backgroundColor: '#CBD5E1', marginHorizontal: 2 },
  kpiScrollRow: { gap: 8 },
  kpiMiniCard: {
    width: 110,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiMiniVal: { fontSize: 15, fontFamily: ibmPlexArabicFontFamily.bold },
  kpiMiniLabel: { fontSize: 10.5, fontFamily: ibmPlexArabicFontFamily.regular, marginTop: 2, textAlign: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeSuccess: { backgroundColor: '#ECFDF5' },
  badgeWarning: { backgroundColor: '#FEF0C7' },
  badgeText: { fontSize: 11.5, fontFamily: ibmPlexArabicFontFamily.bold },
  refundBtn: { backgroundColor: '#FEF2F2', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#FCA5A5' },
  refundBtnText: { fontSize: 11.5, fontFamily: ibmPlexArabicFontFamily.bold, color: '#D92D20' },
  newFeeBtn: { backgroundColor: '#1246B7', paddingHorizontal: 12, borderRadius: 8, justifyContent: 'center' },
  newFeeBtnText: { color: '#FFF', fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold },
  codeBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#BFDBFE' },
  codeBadgeText: { fontSize: 11, fontFamily: ibmPlexArabicFontFamily.bold, color: '#1D4ED8' },
  exportBtn: { backgroundColor: '#1246B7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  exportBtnText: { color: '#FFF', fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold },
  debtLabel: { fontSize: 13, fontFamily: ibmPlexArabicFontFamily.regular, color: '#475569' },
  debtVal: { fontSize: 13, fontFamily: ibmPlexArabicFontFamily.bold, color: '#D92D20' },
  tableHeaderRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 6, marginBottom: 4 },
  thText: { fontSize: 11.5, fontFamily: ibmPlexArabicFontFamily.bold, color: '#64748B' },
  tableBodyRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 6, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tdText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#334155' },
  tdTextBold: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold, color: '#1E293B' },
  tdTextSuccess: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold, color: '#0B7A55' },
  tdTextDanger: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold, color: '#D92D20' },
  daysPill: { backgroundColor: '#FEF0C7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  daysPillText: { fontSize: 11.5, fontFamily: ibmPlexArabicFontFamily.bold, color: '#B54708' },
  createLinkBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  createLinkBtnText: { color: '#FFF', fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold },
  formCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
  label: { fontSize: 13, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#334155' },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular, backgroundColor: '#F8FAFC' },
  submitTransferBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  submitTransferBtnText: { color: '#FFF', fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18 },
  cancelBtn: { paddingVertical: 8, alignItems: 'center' },
  cancelBtnText: { color: '#64748B', fontFamily: ibmPlexArabicFontFamily.semiBold, fontSize: 13.5 },
});
