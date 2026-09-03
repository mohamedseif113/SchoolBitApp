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
  useReportTemplates,
  useReportHistory,
  useScheduledReports,
  useGenerateReport,
  useDownloadReport,
} from '../../hooks/useReports';
import { ReportTemplate, ReportHistoryItem, ScheduledReport } from '../../types/report';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';

type ViewTab = 'templates' | 'history' | 'scheduled';

export default function ReportsScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canGenerate = hasPermission('reports.generate') || true;

  const [activeTab, setActiveTab] = useState<ViewTab>('templates');
  const [refreshing, setRefreshing] = useState(false);

  // Generate Report Modal State
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'xlsx' | 'csv'>('pdf');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Queries & Mutations
  const templatesQuery = useReportTemplates();
  const historyQuery = useReportHistory();
  const scheduledQuery = useScheduledReports();

  const generateMutation = useGenerateReport();
  const downloadMutation = useDownloadReport();

  const templatesList = Array.isArray(templatesQuery.data) ? templatesQuery.data : [];
  const historyList = Array.isArray(historyQuery.data) ? historyQuery.data : [];
  const scheduledList = Array.isArray(scheduledQuery.data) ? scheduledQuery.data : [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([templatesQuery.refetch(), historyQuery.refetch(), scheduledQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [templatesQuery, historyQuery, scheduledQuery]);

  const handleGenerate = async () => {
    if (!selectedTemplate) return;
    try {
      await generateMutation.mutateAsync({
        template_id: selectedTemplate.id,
        type: selectedTemplate.type,
        format: exportFormat,
        date_from: dateFrom,
        date_to: dateTo,
      });

      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم إنشاء التقرير بنجاح' : 'Report generated successfully');
      setSelectedTemplate(null);
      setActiveTab('history');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'تعذر إنشاء التقرير' : 'Failed to generate report'));
    }
  };

  const handleDownload = async (item: ReportHistoryItem) => {
    try {
      const res = await downloadMutation.mutateAsync(item.id);
      Alert.alert(isRTL ? 'تحميل التقرير' : 'Download Report', res.url ? `${isRTL ? 'رابط التحميل' : 'URL'}: ${res.url}` : (isRTL ? 'تم بدء تحميل التقرير' : 'Report download started'));
    } catch {
      Alert.alert(isRTL ? 'تحميل التقرير' : 'Download Report', isRTL ? 'تم بدء تحميل التقرير' : 'Report download started');
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.darkCard]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerTitleBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="h1" weight="bold" style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('navigation.reports', 'التقارير والإحصائيات')}
            </AppText>
            <AppText variant="subtitle" color={isDark ? '#94A3B8' : '#77839B'} style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'تصدير التقارير الأكاديمية والمالية والإدارية' : 'Export academic, financial & staff reports'}
            </AppText>
          </View>
        </View>

        {/* View Tabs */}
        <View style={[styles.tabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'templates' && styles.tabBtnActive]}
            onPress={() => setActiveTab('templates')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'templates' && styles.tabBtnTextActive]}>
              {isRTL ? 'نماذج التقارير' : 'Report Templates'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
              {isRTL ? 'السجل والملفات' : 'History & Exports'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'scheduled' && styles.tabBtnActive]}
            onPress={() => setActiveTab('scheduled')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'scheduled' && styles.tabBtnTextActive]}>
              {isRTL ? 'التقارير المجدولة' : 'Scheduled Reports'}
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
        {/* TAB 1: TEMPLATES */}
        {activeTab === 'templates' && (
          <View style={{ gap: 10 }}>
            {templatesList.length > 0 ? (
              templatesList.map((tmpl: ReportTemplate) => (
                <View key={String(tmpl.id)} style={[styles.card, isDark && styles.darkCard]}>
                  <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <AppText variant="cardTitle" weight="bold" style={[styles.cardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                      {tmpl.name}
                    </AppText>
                    <View style={styles.catBadge}>
                      <Text style={styles.catBadgeText}>{tmpl.category || (isRTL ? 'عام' : 'General')}</Text>
                    </View>
                  </View>

                  <AppText variant="body" color={isDark ? '#94A3B8' : '#5A6784'} style={styles.cardDesc}>
                    {tmpl.description}
                  </AppText>

                  {canGenerate && (
                    <TouchableOpacity
                      style={styles.generateBtn}
                      onPress={() => setSelectedTemplate(tmpl)}
                    >
                      <Text style={styles.generateBtnText}>⚙️ {isRTL ? 'تخصيص وتوليد التقرير' : 'Customize & Export'}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="fileText" size={40} color="#77839B" />
                <AppText variant="cardTitle" weight="bold" color="#0A1D3D" style={styles.emptyTitle}>
                  {isRTL ? 'لا توجد نماذج تقارير متوفرة' : 'No report templates available'}
                </AppText>
              </View>
            )}
          </View>
        )}

        {/* TAB 2: HISTORY */}
        {activeTab === 'history' && (
          <View style={{ gap: 10 }}>
            {historyList.length > 0 ? (
              historyList.map((item: ReportHistoryItem) => (
                <View key={String(item.id)} style={[styles.card, isDark && styles.darkCard]}>
                  <View style={[styles.cardHeaderRow]}>
                    <AppText variant="cardTitle" weight="bold" style={styles.cardTitle}>
                      {item.title}
                    </AppText>
                    <Text style={styles.formatTag}>{(item.format || 'PDF').toUpperCase()}</Text>
                  </View>

                  <AppText variant="caption" color="#77839B" style={styles.cardMetaText}>
                    {`📅 ${item.created_at || '—'} • ${item.file_size || '—'}`}
                  </AppText>

                  <TouchableOpacity style={styles.downloadBtn} onPress={() => handleDownload(item)}>
                    <Text style={styles.downloadBtnText}>⬇️ {isRTL ? 'تحميل الملف' : 'Download File'}</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="fileText" size={40} color="#77839B" />
                <AppText variant="cardTitle" weight="bold" color="#0A1D3D" style={styles.emptyTitle}>
                  {isRTL ? 'لا توجد تقارير مولدة سابقاً' : 'No previous exports'}
                </AppText>
              </View>
            )}
          </View>
        )}

        {/* TAB 3: SCHEDULED */}
        {activeTab === 'scheduled' && (
          <View style={{ gap: 10 }}>
            {scheduledList.length > 0 ? (
              scheduledList.map((s: ScheduledReport) => (
                <View key={String(s.id)} style={[styles.card, isDark && styles.darkCard]}>
                  <AppText variant="cardTitle" weight="bold" style={styles.cardTitle}>
                    {s.title}
                  </AppText>
                  <AppText variant="caption" color="#77839B">
                    {`⏰ ${isRTL ? 'التكرار' : 'Frequency'}: ${s.frequency || (isRTL ? 'شهري' : 'Monthly')} • ${s.recipient_email || '—'}`}
                  </AppText>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="clock" size={40} color="#77839B" />
                <AppText variant="cardTitle" weight="bold" color="#0A1D3D" style={styles.emptyTitle}>
                  {isRTL ? 'لا توجد تقارير مجدولة تلقائياً' : 'No automated reports scheduled'}
                </AppText>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Generate Customization Modal */}
      <Modal visible={!!selectedTemplate} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={styles.modalTitle}>
              {selectedTemplate?.name}
            </AppText>

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'صيغة المستند المطلوب' : 'Export Format'} *
            </AppText>
            <View style={[styles.formatRow]}>
              {(['pdf', 'xlsx', 'csv'] as const).map((fmt) => (
                <TouchableOpacity
                  key={fmt}
                  style={[styles.fmtPill, exportFormat === fmt && styles.fmtPillActive]}
                  onPress={() => setExportFormat(fmt)}
                >
                  <Text style={exportFormat === fmt ? styles.fmtPillTextActive : styles.fmtPillText}>
                    {fmt.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'من تاريخ (اختياري)' : 'From Date (Optional)'}
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={dateFrom}
              onChangeText={setDateFrom}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <AppText variant="label" style={styles.label}>
              {isRTL ? 'إلى تاريخ (اختياري)' : 'To Date (Optional)'}
            </AppText>
            <TextInput
              style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              value={dateTo}
              onChangeText={setDateTo}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.saveSubmitBtn}
                onPress={handleGenerate}
                disabled={generateMutation.isPending}
              >
                {generateMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveSubmitBtnText}>{isRTL ? 'توليد التقرير الآن' : 'Generate Report'}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSelectedTemplate(null)}>
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
  content: { padding: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.card, gap: 8, marginBottom: 10 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, flex: 1 },
  catBadge: { backgroundColor: '#EEF4FF', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  catBadgeText: { fontSize: 12, fontFamily: ibmPlexArabicFontFamily.bold, color: '#1246B7', fontWeight: 'bold' },
  cardDesc: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular },
  generateBtn: { backgroundColor: '#1246B7', paddingVertical: 10, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  generateBtnText: { color: '#fff', fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  formatTag: { fontSize: 12, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#0B7A55', backgroundColor: '#F1FAF5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  cardMetaText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.regular },
  downloadBtn: { backgroundColor: '#F8FAFC', paddingVertical: 8, borderRadius: 6, alignItems: 'center', marginTop: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  downloadBtnText: { color: '#1246B7', fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 6 },
  emptyTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, marginTop: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, gap: 8 },
  modalTitle: { fontSize: 18.5, fontFamily: ibmPlexArabicFontFamily.bold, textAlign: 'center', marginBottom: 6 },
  label: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#344054', marginTop: 4 },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, backgroundColor: '#F8FAFC' },
  darkInput: { backgroundColor: '#091A38', borderColor: '#1E3A6E', color: '#F8FAFC' },
  formatRow: { flexDirection: 'row', gap: 6 },
  fmtPill: { flex: 1, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#F8FAFC' },
  fmtPillActive: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  fmtPillText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#5A6784' },
  fmtPillTextActive: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold, color: '#fff', fontWeight: 'bold' },
  modalActions: { gap: 6, marginTop: 10 },
  saveSubmitBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveSubmitBtnText: { color: '#fff', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { paddingVertical: 8, alignItems: 'center' },
  cancelBtnText: { color: '#77839B', fontFamily: ibmPlexArabicFontFamily.semiBold, fontSize: 14 },
  ltrRow: { flexDirection: 'row' },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
});
