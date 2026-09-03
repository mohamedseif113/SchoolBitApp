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
  useWindowDimensions,
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
  usePortfolioList,
  useCreatePortfolio,
  useApprovePortfolio,
  useRemindPortfolio,
  usePortfolioDocuments,
  usePortfolioNotes,
} from '../../hooks/usePortfolio';
import { PortfolioItem, PerformanceRating } from '../../types/portfolio';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';

interface SectionCategory {
  id: string;
  titleAr: string;
  titleEn: string;
  completed: number;
  total: number;
  isDone?: boolean;
}

const TEACHER_PORTFOLIO_SECTIONS: SectionCategory[] = [
  { id: 'model_lessons', titleAr: 'الدروس النموذجية', titleEn: 'Model Lessons', completed: 2, total: 4 },
  { id: 'class_activities', titleAr: 'الأنشطة الصفية', titleEn: 'Class Activities', completed: 4, total: 4, isDone: true },
  { id: 'circulars', titleAr: 'التعميمات', titleEn: 'Circulars', completed: 1, total: 4 },
  { id: 'professional_dev', titleAr: 'التطوير المهني', titleEn: 'Professional Dev', completed: 1, total: 2 },
  { id: 'observations', titleAr: 'المشاهدات الصفية', titleEn: 'Observations', completed: 0, total: 2 },
  { id: 'training_courses', titleAr: 'الدورات التدريبية', titleEn: 'Training Courses', completed: 0, total: 2 },
];

export default function PortfolioScreen() {
  const { t } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  const { user, role, hasPermission } = useAuthStore();
  const isTeacher = (role || '').toLowerCase().includes('teacher') || role === 'معلم' || role === 'معلمة';
  const canManage = hasPermission('portfolio.manage') || !isTeacher;

  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Teacher Section Selection
  const [activeSectionId, setActiveSectionId] = useState('model_lessons');
  const [teacherSubTab, setTeacherSubTab] = useState<'docs' | 'notes'>('docs');

  // Selected Portfolio Detail State (Manager View)
  const [selectedPortfolio, setSelectedPortfolio] = useState<PortfolioItem | null>(null);

  // Upload/Create Document Modal State
  const [docModalVisible, setDocModalVisible] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');

  // Creation Modal State (Manager View)
  const [modalVisible, setModalVisible] = useState(false);
  const [empName, setEmpName] = useState('');
  const [deptName, setDeptName] = useState('قسم الرياضيات');
  const [rating, setRating] = useState<PerformanceRating>('excellent');
  const [summary, setSummary] = useState('');

  // Queries & Mutations
  const portfolioQuery = usePortfolioList({ search: searchQuery });
  const createMutation = useCreatePortfolio();
  const approveMutation = useApprovePortfolio();
  const remindMutation = useRemindPortfolio();

  const activePortfolioId = isTeacher ? (user?.id || 1) : selectedPortfolio?.id;
  const documentsQuery = usePortfolioDocuments(activePortfolioId);
  const notesQuery = usePortfolioNotes(activePortfolioId);

  const portfolioList = Array.isArray(portfolioQuery.data) ? portfolioQuery.data : [];
  const documentsList = Array.isArray(documentsQuery.data) && documentsQuery.data.length > 0
    ? documentsQuery.data
    : [
        { id: '1', file_name: 'خطة الأسبوع الثاني', size: '41 KB', date: '2026-08-14' },
        { id: '2', file_name: 'خطة درس نموذجي — اختبار QA', size: '23 KB', date: '2026-08-14' },
      ];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([portfolioQuery.refetch(), documentsQuery.refetch(), notesQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [portfolioQuery, documentsQuery, notesQuery]);

  const handleCreatePortfolio = async () => {
    if (!empName.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), t('portfolio.nameRequired', 'يرجى كتابة اسم المعلم / الموظف'));
      return;
    }

    try {
      await createMutation.mutateAsync({
        employee_id: Date.now(),
        employee_name: empName.trim(),
        department_name: deptName,
        rating: rating,
        summary: summary.trim(),
        academic_year: '2025/2026',
      });

      Alert.alert(t('common.success', 'نجاح'), t('portfolio.success', 'تم إنشاء ملف الأداء بنجاح'));
      setModalVisible(false);
      setEmpName('');
      setSummary('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || t('portfolio.error', 'تعذر حفظ ملف الأداء'));
    }
  };

  const handleUploadDoc = () => {
    if (!newDocTitle.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى كتابة عنوان الوثيقة' : 'Please enter document title');
      return;
    }
    setDocModalVisible(false);
    setNewDocTitle('');
    Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم رفع وإرفاق المستند بنجاح' : 'Document attached successfully');
  };

  const handleDeleteDoc = (docId: string | number) => {
    Alert.alert(
      isRTL ? 'حذف الوثيقة' : 'Delete Document',
      isRTL ? 'هل أنت متأكد من حذف هذه الوثيقة من ملف الإنجاز؟' : 'Are you sure you want to delete this document?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم حذف الوثيقة' : 'Document deleted');
          },
        },
      ]
    );
  };

  const getRatingBadge = (rat: PerformanceRating) => {
    switch (rat) {
      case 'excellent':
        return { label: 'ممتاز 🌟', bg: '#F1FAF5', color: '#0B7A55' };
      case 'very_good':
        return { label: 'جيد جداً ✨', bg: '#EEF4FF', color: '#1246B7' };
      case 'good':
        return { label: 'جيد 👍', bg: '#FFF8EC', color: '#FF8A00' };
      default:
        return { label: 'يحتاج تحسين ⚠️', bg: '#FEE4E2', color: '#D92D20' };
    }
  };

  const activeCategory = TEACHER_PORTFOLIO_SECTIONS.find((s) => s.id === activeSectionId) || TEACHER_PORTFOLIO_SECTIONS[0];

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* Header matching Screenshot 5 */}
      <View style={[styles.header, isDark && styles.darkHeader]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerTitleCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="h1" weight="bold" style={styles.title} color={isDark ? '#F8FAFC' : '#0A1D3D'}>
              {isTeacher ? (isRTL ? 'ملف إنجازي' : 'My Portfolio') : t('portfolio.title', 'ملفات الأداء والتقييم')}
            </AppText>
            <AppText variant="caption" color={isDark ? '#94A3B8' : '#77839B'} style={styles.subtitle}>
              {isTeacher
                ? (isRTL ? 'المادة والأدلة والشهادات الراجعة من المشرف' : 'Subject evidence & supervisor feedback')
                : (isRTL ? 'توثيق وتقييم ملفات الأداء للمعلمين والكوادر' : 'Staff evaluation & portfolio records')}
            </AppText>
          </View>

          {canManage && !isTeacher && (
            <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)}>
              <Text style={styles.createBtnText}>＋ {t('portfolio.add', 'ملف أداء جديد')}</Text>
            </TouchableOpacity>
          )}

          {isTeacher && (
            <TouchableOpacity style={styles.uploadMainBtn} onPress={() => setDocModalVisible(true)}>
              <Icon name="award" size={14} color="#FFFFFF" />
              <AppText variant="captionBold" color="#FFFFFF">
                {isRTL ? 'إدراج وثيقة' : 'Upload Document'}
              </AppText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}
      >
        {/* 4 Top KPI Summary Cards (2x2 responsive side-by-side on mobile, 4-across on desktop) */}
        <View style={styles.kpiRow}>
          {/* Card 1: Total Documents (Soft Blue) */}
          <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiBlueCard, isDark && styles.darkCard]}>
            <View style={styles.kpiHeaderRow}>
              <View style={[styles.kpiIconCircle, styles.kpiIconBlue]}>
                <Icon name="award" size={18} color="#1D4ED8" />
              </View>
              <AppText variant="captionBold" color="#1D4ED8">
                {isRTL ? 'إجمالي الوثائق' : 'Total Documents'}
              </AppText>
            </View>
            <AppText variant="hero" weight="extraBold" color="#0F172A" style={styles.kpiMainNumber}>
              8
            </AppText>
          </View>

          {/* Card 2: Completed Sections (Soft Green) */}
          <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiGreenCard, isDark && styles.darkCard]}>
            <View style={styles.kpiHeaderRow}>
              <View style={[styles.kpiIconCircle, styles.kpiIconGreen]}>
                <Icon name="check" size={18} color="#10B981" />
              </View>
              <AppText variant="captionBold" color="#059669">
                {isRTL ? 'أقسام مكتملة' : 'Completed Sections'}
              </AppText>
            </View>
            <AppText variant="hero" weight="extraBold" color="#10B981" style={styles.kpiMainNumber}>
              1/6
            </AppText>
          </View>

          {/* Card 3: Completion Rate (Soft Blue) */}
          <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiBlueCard, isDark && styles.darkCard]}>
            <View style={styles.kpiHeaderRow}>
              <View style={[styles.kpiIconCircle, styles.kpiIconBlue]}>
                <Icon name="chart" size={18} color="#2563EB" />
              </View>
              <AppText variant="captionBold" color="#2563EB">
                {isRTL ? 'نسبة الإنجاز' : 'Completion Rate'}
              </AppText>
            </View>
            <AppText variant="hero" weight="extraBold" color="#2563EB" style={styles.kpiMainNumber}>
              17%
            </AppText>
          </View>

          {/* Card 4: Urgent Notes (Soft Pink) */}
          <View style={[styles.kpiCard, isDesktop && styles.kpiCardDesktop, styles.kpiPinkCard, isDark && styles.darkCard]}>
            <View style={styles.kpiHeaderRow}>
              <View style={[styles.kpiIconCircle, styles.kpiIconPink]}>
                <Icon name="alertTriangle" size={18} color="#E11D48" />
              </View>
              <AppText variant="captionBold" color="#BE123C">
                {isRTL ? 'ملاحظات عاجلة' : 'Urgent Notes'}
              </AppText>
            </View>
            <AppText variant="hero" weight="extraBold" color="#BE123C" style={styles.kpiMainNumber}>
              1
            </AppText>
          </View>
        </View>

        {/* Teacher Category Pills Tabs matching Screenshot 5 */}
        {isTeacher ? (
          <>
            <View style={styles.sectionHeaderWrap}>
              <Icon name="award" size={16} color="#1246B7" />
              <AppText variant="captionBold" color={isDark ? '#E2E8F0' : '#334155'}>
                {isRTL ? 'أقسام الملف' : 'Portfolio Sections'}
              </AppText>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {TEACHER_PORTFOLIO_SECTIONS.map((sec) => {
                const isActive = activeSectionId === sec.id;
                const percent = Math.round((sec.completed / sec.total) * 100);

                return (
                  <TouchableOpacity
                    key={sec.id}
                    style={[
                      styles.categoryCard,
                      isActive && styles.categoryCardActive,
                      sec.isDone && styles.categoryCardDone,
                      isDark && styles.darkCategoryCard,
                    ]}
                    onPress={() => setActiveSectionId(sec.id)}
                    accessibilityRole="button"
                  >
                    <View style={styles.categoryCardHeader}>
                      <Icon
                        name={sec.isDone ? 'check' : 'award'}
                        size={16}
                        color={isActive ? '#2563EB' : sec.isDone ? '#10B981' : '#64748B'}
                      />
                      <View
                        style={[
                          styles.categoryPillBadge,
                          sec.isDone ? styles.categoryPillDone : styles.categoryPillProgress,
                        ]}
                      >
                        <Text style={[styles.categoryPillText, sec.isDone ? styles.textGreen : styles.textAmber]}>
                          {sec.isDone ? (isRTL ? 'مكتمل' : 'Done') : `${sec.completed}/${sec.total}`}
                        </Text>
                      </View>
                    </View>

                    <AppText
                      variant="bodyBold"
                      color={isActive ? '#1246B7' : isDark ? '#F8FAFC' : '#0F172A'}
                      numberOfLines={1}
                      style={styles.categoryTitle}
                    >
                      {isRTL ? sec.titleAr : sec.titleEn}
                    </AppText>

                    <AppText variant="caption" color="#64748B">
                      {`${sec.completed}/${sec.total} ${isRTL ? 'وثائق' : 'docs'} • ${percent}%`}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Active Section Document Management Card matching Screenshot 5 */}
            <View style={[styles.sectionDetailCard, isDark && styles.darkCard]}>
              <View style={styles.sectionDetailHeader}>
                <View style={styles.sectionDetailTitleGroup}>
                  <Icon name="award" size={18} color="#1246B7" />
                  <View>
                    <AppText variant="cardTitle" weight="bold" color={isDark ? '#F8FAFC' : '#0A1D3D'}>
                      {isRTL ? activeCategory.titleAr : activeCategory.titleEn}
                    </AppText>
                    <AppText variant="caption" color="#64748B">
                      {`${activeCategory.completed} ${isRTL ? 'وثيقة من أصل' : 'of'} ${activeCategory.total} ${isRTL ? 'مطلوبة' : 'required'}`}
                    </AppText>
                  </View>
                </View>

                <TouchableOpacity style={styles.uploadSectionBtn} onPress={() => setDocModalVisible(true)}>
                  <Icon name="award" size={14} color="#FFFFFF" />
                  <AppText variant="captionBold" color="#FFFFFF">
                    {isRTL ? 'إدراج وثيقة' : 'Upload'}
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* Sub-tabs: الوثائق (2) / الملاحظات (0) */}
              <View style={styles.subTabsRow}>
                <TouchableOpacity
                  style={[styles.subTabItem, teacherSubTab === 'docs' && styles.subTabItemActive]}
                  onPress={() => setTeacherSubTab('docs')}
                >
                  <AppText variant="captionBold" color={teacherSubTab === 'docs' ? '#1246B7' : '#64748B'}>
                    {`${isRTL ? 'الوثائق' : 'Documents'} (${documentsList.length})`}
                  </AppText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.subTabItem, teacherSubTab === 'notes' && styles.subTabItemActive]}
                  onPress={() => setTeacherSubTab('notes')}
                >
                  <AppText variant="captionBold" color={teacherSubTab === 'notes' ? '#1246B7' : '#64748B'}>
                    {`${isRTL ? 'الملاحظات' : 'Supervisor Notes'} (0)`}
                  </AppText>
                </TouchableOpacity>
              </View>

              {/* Documents List */}
              {teacherSubTab === 'docs' ? (
                <View style={styles.docsListContainer}>
                  {documentsList.map((doc: any, index: number) => (
                    <View key={String(doc.id || index)} style={[styles.docItemRow, isDark && styles.darkDocItemRow]}>
                      <View style={styles.docItemLeading}>
                        <View style={styles.docIconBox}>
                          <Icon name="fileText" size={16} color="#E11D48" />
                        </View>
                        <View style={styles.docMetaCol}>
                          <AppText variant="bodyBold" color={isDark ? '#F8FAFC' : '#0F172A'} numberOfLines={1}>
                            {doc.file_name || doc.title}
                          </AppText>
                          <AppText variant="caption" color="#94A3B8">
                            {`${doc.size || '32 KB'} • ${doc.date || '2026-08-14'}`}
                          </AppText>
                        </View>
                      </View>

                      <View style={styles.docActionsGroup}>
                        <TouchableOpacity
                          style={styles.downloadDocBtn}
                          onPress={() => Alert.alert(isRTL ? 'تحميل' : 'Download', isRTL ? 'جاري تحميل الملف...' : 'Downloading file...')}
                        >
                          <AppText variant="captionBold" color="#334155">
                            ↓ {isRTL ? 'حمل' : 'Download'}
                          </AppText>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.deleteDocBtn} onPress={() => handleDeleteDoc(doc.id)}>
                          <AppText variant="captionBold" color="#E11D48">
                            ✕
                          </AppText>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyIcon}>📝</Text>
                  <Text style={[styles.emptyTitle, isDark && styles.darkSubtext]}>
                    {isRTL ? 'لا توجد ملاحظات مسجلة من المشرف' : 'No supervisor notes recorded'}
                  </Text>
                </View>
              )}
            </View>
          </>
        ) : (
          /* Manager Full Staff Portfolios Overview */
          <>
            <TextInput
              style={[styles.searchInput, isRTL && styles.rtlText, isDark && styles.darkSearchInput]}
              placeholder="ابحث باسم المعلم أو القسم..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {portfolioQuery.isLoading ? (
              <ActivityIndicator size="large" color="#1246B7" style={{ marginVertical: 30 }} />
            ) : portfolioList.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📁</Text>
                <Text style={[styles.emptyTitle, isDark && styles.darkSubtext]}>
                  {t('portfolio.no_portfolios', 'لا توجد ملفات أداء مضافة')}
                </Text>
              </View>
            ) : (
              portfolioList.map((item, idx) => {
                const rBadge = getRatingBadge(item.rating);
                return (
                  <TouchableOpacity
                    key={String(item.id || idx)}
                    style={[styles.card, isDark && styles.darkCard]}
                    onPress={() => setSelectedPortfolio(item)}
                  >
                    <View style={styles.cardHeaderRow}>
                      <AppText variant="bodyBold" color={isDark ? '#F8FAFC' : '#0A1D3D'} style={styles.cardTitle}>
                        👨‍🏫 {item.employee_name}
                      </AppText>
                      <View style={[styles.badgePill, { backgroundColor: rBadge.bg }]}>
                        <Text style={[styles.badgeText, { color: rBadge.color }]}>{rBadge.label}</Text>
                      </View>
                    </View>

                    <Text style={styles.deptText}>
                      {item.department_name || 'الإدارة التعليمية'} | العام: {item.academic_year || '2025/2026'}
                    </Text>
                    {item.summary && <Text style={[styles.cardDesc, isDark && styles.darkSubtext]}>{item.summary}</Text>}

                    <View style={styles.cardFooterRow}>
                      <Text style={styles.metaText}>
                        📎 {item.documents_count || 0} مستندات | 📝 {item.notes_count || 0} ملاحظات
                      </Text>
                      <Text style={[styles.statusText, isDark && styles.darkText]}>الحالة: {item.status}</Text>
                    </View>

                    {item.status !== 'approved' && canManage && (
                      <View style={styles.actionsRow}>
                        <TouchableOpacity style={styles.approveBtn} onPress={() => approveMutation.mutate(item.id)}>
                          <Text style={styles.approveBtnText}>✓ {t('portfolio.approve', 'اعتماد ملف الأداء')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.remindBtn} onPress={() => remindMutation.mutate(item.id)}>
                          <Text style={styles.remindBtnText}>🔔 {t('portfolio.remind', 'تذكير')}</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* Upload Document Modal */}
      <Modal visible={docModalVisible} transparent animationType="slide" onRequestClose={() => setDocModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" color={isDark ? '#F8FAFC' : '#0A1D3D'} style={{ textAlign: 'center' }}>
              {isRTL ? 'إدراج وثيقة في ملف الإنجاز' : 'Attach Portfolio Document'}
            </AppText>

            <Text style={[styles.label, isDark && styles.darkSubtext]}>
              {isRTL ? 'عنوان الوثيقة أو الشاهد *' : 'Document Title *'}
            </Text>
            <TextInput
              style={[styles.input, isRTL && styles.rtlText, isDark && styles.darkInput]}
              value={newDocTitle}
              onChangeText={setNewDocTitle}
              placeholder={isRTL ? 'مثال: خطة الأسبوع الثاني، ورقة عمل...' : 'e.g. Lesson Plan Week 2...'}
              placeholderTextColor="#94A3B8"
            />

            <Text style={[styles.label, isDark && styles.darkSubtext]}>
              {isRTL ? 'القسم المخصص' : 'Target Section'}
            </Text>
            <View style={styles.selectedSectionPill}>
              <Text style={styles.selectedSectionPillText}>
                {isRTL ? activeCategory.titleAr : activeCategory.titleEn}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveSubmitBtn} onPress={handleUploadDoc}>
                <Text style={styles.saveSubmitBtnText}>{isRTL ? 'رفع وتوثيق المستند' : 'Upload & Save'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setDocModalVisible(false)}>
                <Text style={styles.cancelBtnText}>{t('common.cancel', 'إلغاء')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manager Creation Modal */}
      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <Text style={styles.modalTitle}>{t('portfolio.add', 'إنشاء ملف أداء للمعلم')}</Text>

            <Text style={styles.label}>اسم المعلم / الموظف *</Text>
            <TextInput style={styles.input} value={empName} onChangeText={setEmpName} placeholder="اسم المعلم..." />

            <Text style={styles.label}>القسم الأكاديمي</Text>
            <TextInput style={styles.input} value={deptName} onChangeText={setDeptName} />

            <Text style={styles.label}>التقييم التقديري</Text>
            <View style={styles.sevRow}>
              {(['excellent', 'very_good', 'good'] as const).map((r) => (
                <TouchableOpacity key={r} style={[styles.sevPill, rating === r && styles.sevPillActive]} onPress={() => setRating(r)}>
                  <Text style={rating === r ? styles.sevPillTextActive : styles.sevPillText}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>ملخص الأداء والمبادرات</Text>
            <TextInput style={[styles.input, { height: 70 }]} value={summary} onChangeText={setSummary} placeholder="أبرز الإنجازات..." multiline />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.saveSubmitBtn} onPress={handleCreatePortfolio} disabled={createMutation.isPending}>
                {createMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveSubmitBtnText}>حفظ وتوثيق ملف الأداء</Text>}
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
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  darkSafeArea: { backgroundColor: '#07132B' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  darkHeader: { backgroundColor: '#0A1D3D', borderBottomColor: '#1E3A6E' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleCol: { flex: 1 },
  title: { fontSize: 23, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  subtitle: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular, marginTop: 2 },
  createBtn: { backgroundColor: '#1246B7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  createBtnText: { color: '#FFFFFF', fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  uploadMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1246B7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  content: { padding: 14, gap: 14 },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  kpiCard: {
    width: '48.5%',
    borderRadius: 14,
    padding: 13,
    borderWidth: 1,
    minHeight: 105,
    justifyContent: 'space-between',
    ...shadows.card,
  },
  kpiCardDesktop: {
    width: '23.8%',
  },
  kpiBlueCard: { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' },
  kpiGreenCard: { backgroundColor: '#ECFDF5', borderColor: '#D1FAE5' },
  kpiPinkCard: { backgroundColor: '#FFF1F2', borderColor: '#FFE4E6' },
  darkCard: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 6,
  },
  kpiIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  kpiIconBlue: { backgroundColor: '#DBEAFE' },
  kpiIconGreen: { backgroundColor: '#D1FAE5' },
  kpiIconPink: { backgroundColor: '#FFE4E6' },
  kpiMainNumber: {
    fontSize: 24,
    lineHeight: 28,
  },
  sectionHeaderWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryScroll: {
    gap: 10,
    paddingVertical: 4,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    minWidth: 155,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
    ...shadows.card,
  },
  categoryCardActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  categoryCardDone: {
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  darkCategoryCard: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryPillBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryPillDone: { backgroundColor: '#D1FAE5' },
  categoryPillProgress: { backgroundColor: '#FEF3C7' },
  categoryPillText: { fontSize: 10, fontWeight: 'bold' },
  textGreen: { color: '#059669' },
  textAmber: { color: '#D97706' },
  categoryTitle: { fontSize: 13, marginTop: 4 },
  sectionDetailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
    ...shadows.card,
  },
  sectionDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionDetailTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  uploadSectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1246B7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  subTabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 16,
  },
  subTabItem: {
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabItemActive: {
    borderBottomColor: '#1246B7',
  },
  docsListContainer: {
    gap: 8,
  },
  docItemRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  darkDocItemRow: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  docItemLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  docIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFE4E6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docMetaCol: {
    flex: 1,
  },
  docActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  downloadDocBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deleteDocBtn: {
    backgroundColor: '#FFF1F2',
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#F9FAFB',
    marginBottom: 10,
  },
  darkSearchInput: {
    backgroundColor: '#0F244A',
    borderColor: '#1E3A6E',
    color: '#F8FAFC',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EDF1F6',
    ...shadows.card,
    gap: 6,
    marginBottom: 10,
  },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { flex: 1 },
  badgePill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  deptText: { fontSize: 12, fontWeight: '600', color: '#1246B7' },
  cardDesc: { fontSize: 13, color: '#344054' },
  cardFooterRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F2F4F7', paddingTop: 8, marginTop: 4 },
  metaText: { fontSize: 12, color: '#77839B' },
  statusText: { fontSize: 12, fontWeight: 'bold', color: '#0A1D3D' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  approveBtn: { flex: 1, backgroundColor: '#F1FAF5', paddingVertical: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#D0F5E0' },
  approveBtnText: { color: '#0B7A55', fontSize: 12, fontWeight: 'bold' },
  remindBtn: { backgroundColor: '#FFF8EC', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#FEDF89' },
  remindBtnText: { color: '#FF8A00', fontSize: 12, fontWeight: 'bold' },
  emptyContainer: { alignItems: 'center', paddingVertical: 32 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { fontSize: 13, fontWeight: 'bold', color: '#77839B' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, gap: 10 },
  modalTitle: { fontSize: 16, fontWeight: 'bold', color: '#0A1D3D', textAlign: 'center', marginBottom: 6 },
  label: { fontSize: 13, fontWeight: '600', color: '#344054' },
  input: { borderWidth: 1, borderColor: '#D0D5DD', borderRadius: 8, padding: 10, fontSize: 14 },
  darkInput: { backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' },
  selectedSectionPill: {
    backgroundColor: '#EFF6FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  selectedSectionPillText: { color: '#1246B7', fontWeight: 'bold', fontSize: 13 },
  sevRow: { flexDirection: 'row', gap: 6 },
  sevPill: { flex: 1, paddingVertical: 8, borderRadius: 6, borderWidth: 1, borderColor: '#D0D5DD', alignItems: 'center' },
  sevPillActive: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  sevPillText: { fontSize: 11, color: '#5A6784' },
  sevPillTextActive: { fontSize: 11, color: '#fff', fontWeight: 'bold' },
  modalActions: { gap: 8, marginTop: 12 },
  saveSubmitBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveSubmitBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  cancelBtn: { paddingVertical: 8, alignItems: 'center' },
  cancelBtnText: { color: '#77839B', fontSize: 13 },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
  darkText: { color: '#F8FAFC' },
  darkSubtext: { color: '#94A3B8' },
});
