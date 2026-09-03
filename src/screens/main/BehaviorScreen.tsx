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
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { colors } from '../../theme/colors';
import { shadows } from '../../theme/spacing';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import {
  useBehaviorIncidents,
  useBehaviorRules,
  useBehaviorAnalytics,
  useCreateIncident,
  useCloseIncident,
} from '../../hooks/useBehavior';
import { BehaviorIncident } from '../../types/behavior';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';
import { WebDashboardLayout } from '../../components/layout/WebDashboardLayout';

type BehaviorTab = 'incidents' | 'repeated' | 'followup' | 'rules';

export default function BehaviorScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<BehaviorTab>('incidents');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'in_progress' | 'critical' | 'closed'>('all');
  const [refreshing, setRefreshing] = useState(false);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [incidentTypeInput, setIncidentTypeInput] = useState('تأخر متكرر');
  const [severityInput, setSeverityInput] = useState<'low' | 'medium' | 'high' | 'critical'>('low');
  const [notesInput, setNotesInput] = useState('');

  const incidentsQuery = useBehaviorIncidents({ search });
  const rulesQuery = useBehaviorRules();
  const analyticsQuery = useBehaviorAnalytics();
  const createMutation = useCreateIncident();
  const closeMutation = useCloseIncident();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([incidentsQuery.refetch(), rulesQuery.refetch(), analyticsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  }, [incidentsQuery, rulesQuery, analyticsQuery]);

  // Demo Incidents list matching Screenshot 4
  const defaultIncidents: BehaviorIncident[] = useMemo(
    () => [
      {
        id: 1,
        student_id: 1,
        student_name: 'ماجد سعود القحطاني',
        class_name: '1/أ',
        title: 'تأخر متكرر',
        description: 'تأخر عن الطابور الصباحي - تسجيل اختبار Q4 بتاريخ 10/6',
        severity: 'low',
        status: 'open',
        incident_date: '2026-08-29',
        action_taken: 'تنبيه شفهي',
      },
      {
        id: 2,
        student_id: 2,
        student_name: 'ريان خالد الشهري',
        class_name: '1/أ',
        title: 'تأخر متكرر',
        description: 'تأخر عن الطابور الصباحي لليوم الثالث',
        severity: 'medium',
        status: 'open',
        incident_date: '2026-08-10',
        action_taken: 'تنبيه خطي',
      },
      {
        id: 3,
        student_id: 3,
        student_name: 'فيصل عبدالله القحطاني',
        class_name: '1/أ',
        title: 'عدم الالتزام بالزي',
        description: 'عدم الالتزام بالزي المدرسي',
        severity: 'low',
        status: 'closed',
        incident_date: '2026-08-10',
        action_taken: 'تعهد خطي',
      },
      {
        id: 4,
        student_id: 4,
        student_name: 'تركي فهد الزهراني',
        class_name: '1/أ',
        title: 'غش في الاختبار',
        description: 'محاولة غش في اختبار القرآن',
        severity: 'critical',
        status: 'closed',
        incident_date: '2026-08-10',
        action_taken: 'إلغاء الاختبار واستدعاء ولي الأمر',
      },
      {
        id: 5,
        student_id: 5,
        student_name: 'سلمان محمد العتيبي',
        class_name: '1/أ',
        title: 'استخدام الهاتف',
        description: 'استخدام الهاتف أثناء الحصة',
        severity: 'medium',
        status: 'open',
        incident_date: '2026-08-08',
        action_taken: 'سحب الجهاز واستدعاء',
      },
    ],
    []
  );

  const displayIncidents = useMemo(() => {
    const raw = Array.isArray(incidentsQuery.data) && incidentsQuery.data.length > 0 ? incidentsQuery.data : defaultIncidents;
    return raw.filter((inc) => {
      const matchSearch =
        !search ||
        inc.student_name?.toLowerCase().includes(search.toLowerCase()) ||
        inc.title?.toLowerCase().includes(search.toLowerCase());
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'open' && inc.status === 'open') ||
        (statusFilter === 'closed' && inc.status === 'closed') ||
        (statusFilter === 'critical' && inc.severity === 'critical');
      return matchSearch && matchStatus;
    });
  }, [incidentsQuery.data, defaultIncidents, search, statusFilter]);

  const handleCreateIncident = async () => {
    if (!studentNameInput.trim()) {
      Alert.alert('تنبيه', 'يرجى إدخال اسم الطالب');
      return;
    }
    try {
      await createMutation.mutateAsync({
        student_id: 1,
        title: incidentTypeInput,
        severity: severityInput,
        description: notesInput.trim() || incidentTypeInput,
      });
      setStudentNameInput('');
      setNotesInput('');
      setModalVisible(false);
      Alert.alert('نجاح', 'تم تسجيل المخالفة بنجاح');
    } catch {
      Alert.alert('خطأ', 'تعذر تسجيل المخالفة');
    }
  };

  const getAvatarBg = (name: string) => {
    const charCode = name.charCodeAt(0) || 0;
    const colorsList = ['#DB2777', '#1E293B', '#E11D48', '#2563EB', '#0D9488'];
    return colorsList[charCode % colorsList.length];
  };

  return (
    <WebDashboardLayout
      title={isRTL ? 'إدارة السلوك والانضباط' : 'Behavior & Discipline'}
      subtitle={isRTL ? '7 مخالفة · 5 نشطة · 1 حرجة | المخالفات الأسبوعية' : '7 Incidents · 5 Active · 1 Critical'}
    >
      <ScrollView
        style={[styles.container, isDark && styles.darkContainer]}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.pageWrapper}>
          {/* Top Actions Row */}
          <View style={[styles.topActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.actionButtonsGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() => setModalVisible(true)}
                accessibilityRole="button"
              >
                <AppText variant="button" color="#FFFFFF" style={styles.btnText}>
                  {isRTL ? '+ سجل مخالفة' : '+ New Incident'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.outlineBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} accessibilityRole="button">
                <Icon name="chart" size={14} color="#64748B" />
                <AppText variant="captionBold" color="#334155">
                  {isRTL ? 'تصدير' : 'Export'}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>

          {/* 6 KPI Summary Cards (2x3 or 3x2 on mobile) */}
          <View style={[styles.kpiCardsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.kpiCard, styles.kpiCardBlue]}>
              <AppText variant="h1" weight="bold" color="#2563EB" style={styles.textCenter}>
                7
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.textCenter}>
                {isRTL ? 'إجمالي المخالفات' : 'Total Incidents'}
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardBlue]}>
              <AppText variant="h1" weight="bold" color="#2563EB" style={styles.textCenter}>
                5
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.textCenter}>
                {isRTL ? 'مفتوحة' : 'Open'}
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardAmber]}>
              <AppText variant="h1" weight="bold" color="#F59E0B" style={styles.textCenter}>
                0
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.textCenter}>
                {isRTL ? 'قيد المتابعة' : 'In Progress'}
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardRed]}>
              <AppText variant="h1" weight="bold" color="#EF4444" style={styles.textCenter}>
                1
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.textCenter}>
                {isRTL ? 'حرجة' : 'Critical'}
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardGreen]}>
              <AppText variant="h1" weight="bold" color="#10B981" style={styles.textCenter}>
                2
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.textCenter}>
                {isRTL ? 'مغلقة' : 'Closed'}
              </AppText>
            </View>

            <View style={[styles.kpiCard, styles.kpiCardTeal]}>
              <AppText variant="h1" weight="bold" color="#0D9488" style={styles.textCenter}>
                3
              </AppText>
              <AppText variant="caption" color="#64748B" style={styles.textCenter}>
                {isRTL ? 'مواقف إيجابية' : 'Merits'}
              </AppText>
            </View>
          </View>

          {/* Horizontal Navigation Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.tabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          >
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'incidents' && styles.tabBtnActive]}
              onPress={() => setActiveTab('incidents')}
            >
              <Icon name="shield" size={14} color={activeTab === 'incidents' ? '#2563EB' : '#64748B'} />
              <AppText variant="captionBold" color={activeTab === 'incidents' ? '#2563EB' : '#64748B'}>
                المخالفات
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'repeated' && styles.tabBtnActive]}
              onPress={() => setActiveTab('repeated')}
            >
              <AppText variant="captionBold" color={activeTab === 'repeated' ? '#2563EB' : '#64748B'}>
                المخالفات المتكررة
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'followup' && styles.tabBtnActive]}
              onPress={() => setActiveTab('followup')}
            >
              <AppText variant="captionBold" color={activeTab === 'followup' ? '#2563EB' : '#64748B'}>
                المتابعة
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'rules' && styles.tabBtnActive]}
              onPress={() => setActiveTab('rules')}
            >
              <AppText variant="captionBold" color={activeTab === 'rules' ? '#2563EB' : '#64748B'}>
                لائحة السلوك
              </AppText>
            </TouchableOpacity>
          </ScrollView>

          {/* Filter & Search Bar */}
          <View style={styles.filterBarCard}>
            <View style={[styles.searchBox]}>
              <Icon name="users" size={16} color="#94A3B8" />
              <TextInput
                style={[styles.searchInput, isRTL ? styles.textRight : styles.textLeft]}
                placeholder="ابحث باسم الطالب أو نوع المخالفة..."
                placeholderTextColor="#94A3B8"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {/* Horizontal Filter Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.statusPillsGroup]}
            >
              <TouchableOpacity
                style={[styles.filterPill, statusFilter === 'all' && styles.filterPillActive]}
                onPress={() => setStatusFilter('all')}
              >
                <AppText variant="captionBold" color={statusFilter === 'all' ? '#2563EB' : '#64748B'}>
                  الكل (7)
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, statusFilter === 'open' && styles.filterPillActive]}
                onPress={() => setStatusFilter('open')}
              >
                <AppText variant="captionBold" color={statusFilter === 'open' ? '#2563EB' : '#64748B'}>
                  مفتوحة
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, statusFilter === 'in_progress' && styles.filterPillActive]}
                onPress={() => setStatusFilter('in_progress')}
              >
                <AppText variant="captionBold" color={statusFilter === 'in_progress' ? '#2563EB' : '#64748B'}>
                  جارٍ
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, statusFilter === 'critical' && styles.filterPillActive]}
                onPress={() => setStatusFilter('critical')}
              >
                <AppText variant="captionBold" color={statusFilter === 'critical' ? '#2563EB' : '#64748B'}>
                  حرجة
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.filterPill, statusFilter === 'closed' && styles.filterPillActive]}
                onPress={() => setStatusFilter('closed')}
              >
                <AppText variant="captionBold" color={statusFilter === 'closed' ? '#2563EB' : '#64748B'}>
                  مغلقة
                </AppText>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Incidents List Cards */}
          <View style={styles.incidentsList}>
            {displayIncidents.map((inc) => {
              const studentName = inc.student_name || 'طالب';
              const avatarBg = getAvatarBg(studentName);
              const isClosed = inc.status === 'closed';
              const isCritical = inc.severity === 'critical';
              const isMedium = inc.severity === 'medium';

              return (
                <View key={inc.id} style={styles.incidentCard}>
                  {/* Card Top: Student Name & Badges */}
                  <View style={[styles.incidentCardTop]}>
                    <View style={[styles.studentInfoLeading]}>
                      <View style={[styles.studentAvatarBox, { backgroundColor: avatarBg }]}>
                        <AppText variant="captionBold" color="#FFFFFF">
                          {studentName.charAt(0)}
                        </AppText>
                      </View>
                      <View style={[styles.incidentInfoText, styles.alignStart]}>
                        <AppText variant="bodyBold" color="#0F172A">
                          {studentName}
                        </AppText>
                        <AppText variant="caption" color="#94A3B8">
                          CorbitSchool · {inc.class_name || '1/أ'}
                        </AppText>
                      </View>
                    </View>

                    <View style={[styles.badgesRow]}>
                      <View
                        style={[
                          styles.statusBadgePill,
                          isClosed ? styles.badgeClosed : styles.badgeOpen,
                        ]}
                      >
                        <AppText variant="caption" color={isClosed ? '#059669' : '#2563EB'}>
                          {isClosed ? 'مغلقة' : 'مفتوحة'}
                        </AppText>
                      </View>

                      <View
                        style={[
                          styles.statusBadgePill,
                          isCritical
                            ? styles.badgeCritical
                            : isMedium
                            ? styles.badgeMedium
                            : styles.badgeLow,
                        ]}
                      >
                        <AppText
                          variant="caption"
                          color={isCritical ? '#EF4444' : isMedium ? '#D97706' : '#059669'}
                        >
                          {isCritical ? 'حرج' : isMedium ? 'متوسط' : 'منخفض'}
                        </AppText>
                      </View>
                    </View>
                  </View>

                  {/* Violation Details */}
                  <View style={[styles.violationBody, styles.alignStart]}>
                    <AppText variant="captionBold" color="#1E293B">
                      {inc.title}
                    </AppText>
                    {inc.description && (
                      <AppText variant="caption" color="#64748B" style={{ marginTop: 2 }}>
                        {inc.description}
                      </AppText>
                    )}
                  </View>

                  {/* Card Footer: Action & Date */}
                  <View style={[styles.incidentCardFooter]}>
                    {inc.action_taken ? (
                      <View style={styles.actionTakenPill}>
                        <AppText variant="captionBold" color="#475569">
                          {inc.action_taken}
                        </AppText>
                      </View>
                    ) : (
                      <View />
                    )}

                    <AppText variant="caption" color="#94A3B8">
                      {inc.incident_date || '2026-08-29'}
                    </AppText>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Record Violation Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalSheet}>
            <View style={[styles.modalHeader]}>
              <AppText variant="cardTitle" weight="bold">
                تسجيل مخالفة سلوكية
              </AppText>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Icon name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <AppText variant="captionBold" color="#334155">
                اسم الطالب *
              </AppText>
              <TextInput
                style={[styles.modalInput, isRTL ? styles.textRight : styles.textLeft]}
                placeholder="اسم الطالب"
                value={studentNameInput}
                onChangeText={setStudentNameInput}
              />

              <AppText variant="captionBold" color="#334155" style={{ marginTop: 10 }}>
                نوع المخالفة
              </AppText>
              <TextInput
                style={[styles.modalInput, isRTL ? styles.textRight : styles.textLeft]}
                placeholder="مثال: تأخر متكرر / استخدام هاتف"
                value={incidentTypeInput}
                onChangeText={setIncidentTypeInput}
              />

              <AppText variant="captionBold" color="#334155" style={{ marginTop: 10 }}>
                تفاصيل المخالفة
              </AppText>
              <TextInput
                style={[styles.modalInput, { height: 70 }, isRTL ? styles.textRight : styles.textLeft]}
                placeholder="تفاصيل المخالفة والإجراء المتخذ..."
                multiline
                value={notesInput}
                onChangeText={setNotesInput}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, { marginTop: 18, minHeight: 46 }]}
                onPress={handleCreateIncident}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <AppText variant="button" color="#FFFFFF">
                    حفظ وتسجيل المخالفة
                  </AppText>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </WebDashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  darkContainer: {
    backgroundColor: '#07132B',
  },
  scrollContent: {
    padding: 14,
  },
  pageWrapper: {
    gap: 12,
  },
  topActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: '#1246B7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minHeight: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  btnText: {
    fontSize: 13,
  },
  kpiCardsGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
    ...shadows.card,
  },
  kpiCardBlue: {
    borderTopWidth: 3,
    borderTopColor: '#2563EB',
  },
  kpiCardAmber: {
    borderTopWidth: 3,
    borderTopColor: '#F59E0B',
  },
  kpiCardRed: {
    borderTopWidth: 3,
    borderTopColor: '#EF4444',
  },
  kpiCardGreen: {
    borderTopWidth: 3,
    borderTopColor: '#10B981',
  },
  kpiCardTeal: {
    borderTopWidth: 3,
    borderTopColor: '#0D9488',
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 40,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabBtnActive: {
    borderColor: '#2563EB',
    backgroundColor: '#EFF6FF',
  },
  filterBarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    ...shadows.card,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  statusPillsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterPill: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    minHeight: 36,
    borderRadius: 8,
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  incidentsList: {
    gap: 10,
  },
  incidentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    ...shadows.card,
  },
  incidentCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  studentInfoLeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  studentAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  incidentInfoText: {
    flex: 1,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeOpen: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  badgeClosed: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgeLow: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  badgeMedium: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
  },
  badgeCritical: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  violationBody: {
    paddingVertical: 4,
  },
  incidentCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionTakenPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalSheet: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    gap: 8,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 44,
    fontSize: 13,
  },
  alignStart: {
    alignItems: 'flex-start',
  },
  alignEnd: {
    alignItems: 'flex-end',
  },
  textRight: {
    textAlign: 'right',
  },
  textLeft: {
    textAlign: 'left',
  },
  textCenter: {
    textAlign: 'center',
  },
});
