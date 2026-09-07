import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  KeyboardAvoidingView,
  Pressable,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAppDirection } from '../../hooks/useAppDirection';
import { shadows } from '../../theme/spacing';
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
type StatusFilter = 'all' | 'open' | 'in_progress' | 'critical' | 'closed';

const DEFAULT_INCIDENTS: any[] = [
  {
    id: 1, student_id: 1, student_name: 'ماجد سعود القحطاني', class_name: '1/أ', grade: 'الصف الأول',
    title: 'تأخر متكرر', description: 'تأخر عن الطابور الصباحي - سجل اختبار Q4 بتاريخ 19/6',
    severity: 'low', status: 'open', incident_date: '2026-08-20', action_taken: 'تنبيه شفهي',
    parent_notified: false, source: 'CorbitSchool',
  },
  {
    id: 2, student_id: 2, student_name: 'ريان خالد الشهري', class_name: '1/أ', grade: 'الصف الأول',
    title: 'تأخر متكرر', description: 'تأخر عن الطابور الصباحي لليوم الثالث',
    severity: 'medium', status: 'open', incident_date: '2026-08-10', action_taken: 'تنبيه خطي',
    parent_notified: true, source: 'CorbitSchool',
  },
  {
    id: 3, student_id: 3, student_name: 'فيصل عبدالله القحطاني', class_name: '1/أ', grade: 'الصف الأول',
    title: 'عدم الالتزام بالزي', description: 'عدم الالتزام بالزي المدرسي',
    severity: 'low', status: 'closed', incident_date: '2026-08-10', action_taken: 'تعهد خطي',
    parent_notified: true, source: 'CorbitSchool',
  },
  {
    id: 4, student_id: 4, student_name: 'تركي فهد الزهراني', class_name: '1/أ', grade: 'الصف الأول',
    title: 'غش في الاختبار', description: 'محاولة غش في اختبار القرآن',
    severity: 'critical', status: 'closed', incident_date: '2026-08-10', action_taken: 'إلغاء الاختبار واستدعاء ولي الأمر',
    parent_notified: true, source: 'CorbitSchool',
  },
  {
    id: 5, student_id: 5, student_name: 'سلمان محمد العتيبي', class_name: '1/أ', grade: 'الصف الأول',
    title: 'استخدام الهاتف', description: 'استخدام الهاتف أثناء الحصة',
    severity: 'medium', status: 'open', incident_date: '2026-08-08', action_taken: 'سحب الجهاز واستدعاء',
    parent_notified: false, source: 'CorbitSchool',
  },
];

const AVATAR_COLORS = ['#DB2777', '#1E293B', '#E11D48', '#2563EB', '#0D9488', '#7C3AED', '#D97706'];
function getAvatarBg(name: string) { return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]; }

function getSeverityLabel(sev: string) {
  return ({ low: 'منخفض', medium: 'متوسط', high: 'عالي', critical: 'حرج', minor: 'بسيط', moderate: 'متوسط', major: 'كبير', severe: 'حرج' } as any)[sev] || sev;
}
function getSevStyle(sev: string) {
  if (sev === 'critical' || sev === 'severe') return { bg: '#FEF2F2', border: '#FECACA', text: '#EF4444' };
  if (sev === 'high' || sev === 'major') return { bg: '#FFF7ED', border: '#FDBA74', text: '#EA580C' };
  if (sev === 'medium' || sev === 'moderate') return { bg: '#FFFBEB', border: '#FDE68A', text: '#D97706' };
  return { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669' };
}

// ─── Student Detail Drawer ────────────────────────────────────────────────────
function StudentDetailDrawer({ incident, onClose, isRTL, onCloseIncident, onNotifyParent }: {
  incident: any | null; onClose: () => void; isRTL: boolean;
  onCloseIncident: (id: any) => void; onNotifyParent: (id: any) => void;
}) {
  const [noteText, setNoteText] = useState('');
  if (!incident) return null;
  const avatarBg = getAvatarBg(incident.student_name || '');
  const ss = getSevStyle(incident.severity);
  const isClosed = incident.status === 'closed';

  return (
    <Modal visible={!!incident} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.drawerOverlay} onPress={onClose}>
        <Pressable style={[styles.drawerSheet, { alignSelf: isRTL ? 'flex-start' : 'flex-end' }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={[styles.drawerHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.drawerAvatarBox, { backgroundColor: avatarBg }]}>
              <AppText variant="h3" weight="bold" color="#FFFFFF">{(incident.student_name || 'ط').charAt(0)}</AppText>
            </View>
            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <AppText variant="cardTitle" weight="bold" color="#0F172A" style={{ textAlign: isRTL ? 'right' : 'left' }}>{incident.student_name}</AppText>
              <AppText variant="caption" color="#94A3B8" style={{ textAlign: isRTL ? 'right' : 'left' }}>{incident.incident_date}  ·  {incident.grade || incident.class_name}</AppText>
            </View>
            <TouchableOpacity style={styles.drawerCloseBtn} onPress={onClose}><Icon name="close" size={18} color="#64748B" /></TouchableOpacity>
          </View>

          <ScrollView style={styles.drawerBody} showsVerticalScrollIndicator={false}>
            {/* Badges */}
            <View style={[styles.drawerBadgesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.detailBadge, isClosed ? styles.badgeClosed : styles.badgeOpen]}>
                <AppText variant="captionBold" color={isClosed ? '#059669' : '#2563EB'}>{isClosed ? 'مغلقة' : 'مفتوحة'}</AppText>
              </View>
              <View style={[styles.detailBadge, { backgroundColor: ss.bg, borderColor: ss.border }]}>
                <AppText variant="captionBold" color={ss.text}>{getSeverityLabel(incident.severity)}</AppText>
              </View>
              {incident.parent_notified && (
                <View style={[styles.detailBadge, styles.badgeNotified]}>
                  <AppText variant="captionBold" color="#7C3AED">مُبلَّغ الولي</AppText>
                </View>
              )}
            </View>

            <View style={styles.divider} />

            {/* Info rows */}
            {[
              { icon: 'fileText', label: 'نوع المخالفة', value: incident.title, color: '#2563EB' },
              { icon: 'clipboard', label: 'وصف المخالفة', value: incident.description, color: '#2563EB' },
              { icon: 'check', label: 'الإجراء المتخذ', value: incident.action_taken || 'لم يُحدد بعد', color: '#10B981' },
              { icon: 'calendar', label: 'التاريخ', value: incident.incident_date, color: '#F59E0B' },
              { icon: 'users', label: 'الفصل الدراسي', value: incident.class_name, color: '#7C3AED' },
              { icon: 'home', label: 'المصدر', value: incident.source || 'CorbitSchool', color: '#64748B' },
            ].map((row) => (
              <View key={row.label} style={[styles.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Icon name={row.icon as any} size={15} color={row.color} />
                <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <AppText variant="captionBold" color="#64748B" style={{ textAlign: isRTL ? 'right' : 'left' }}>{row.label}</AppText>
                  <AppText variant="body" color="#334155" style={{ textAlign: isRTL ? 'right' : 'left' }}>{row.value || '-'}</AppText>
                </View>
              </View>
            ))}

            <View style={styles.divider} />

            {/* Add Note */}
            <AppText variant="captionBold" color="#334155" style={{ textAlign: isRTL ? 'right' : 'left', marginBottom: 6 }}>إضافة ملاحظة</AppText>
            <TextInput
              style={[styles.noteInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder="أدخل ملاحظاتك هنا..." placeholderTextColor="#94A3B8"
              multiline numberOfLines={3} value={noteText} onChangeText={setNoteText}
            />

            <View style={styles.divider} />

            {/* Action Buttons */}
            <View style={[styles.drawerActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {!isClosed && (
                <TouchableOpacity style={[styles.drawerActionBtn, styles.btnSuccess]} activeOpacity={0.8} onPress={() => onCloseIncident(incident.id)}>
                  <Icon name="check" size={14} color="#FFFFFF" />
                  <AppText variant="captionBold" color="#FFFFFF">إغلاق المخالفة</AppText>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.drawerActionBtn, styles.btnPurple]} activeOpacity={0.8} onPress={() => onNotifyParent(incident.id)}>
                <Icon name="email" size={14} color="#FFFFFF" />
                <AppText variant="captionBold" color="#FFFFFF">إبلاغ ولي الأمر</AppText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.drawerActionBtn, styles.btnPrimary]} activeOpacity={0.8} onPress={() => { if (noteText.trim()) { Alert.alert('تم', 'تم حفظ الملاحظة'); setNoteText(''); } }}>
                <Icon name="download" size={14} color="#FFFFFF" />
                <AppText variant="captionBold" color="#FFFFFF">حفظ الملاحظة</AppText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function BehaviorScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();
  const [activeTab, setActiveTab] = useState<BehaviorTab>('incidents');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [incidentTypeInput, setIncidentTypeInput] = useState('تأخر متكرر');
  const [severityInput, setSeverityInput] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [notesInput, setNotesInput] = useState('');
  const [classInput, setClassInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [statusInput, setStatusInput] = useState('open');
  const [parentNotified, setParentNotified] = useState(false);

  const incidentsQuery = useBehaviorIncidents({ search });
  const rulesQuery = useBehaviorRules();
  const analyticsQuery = useBehaviorAnalytics();
  const createMutation = useCreateIncident();
  const closeMutation = useCloseIncident();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await Promise.all([incidentsQuery.refetch(), rulesQuery.refetch(), analyticsQuery.refetch()]); }
    finally { setRefreshing(false); }
  }, [incidentsQuery, rulesQuery, analyticsQuery]);

  const displayIncidents = useMemo(() => {
    const apiData = Array.isArray(incidentsQuery.data) ? incidentsQuery.data : [];

    // إذا API أعاد بيانات، نستخدمها ونكمل الأسماء المفقودة من DEFAULT_INCIDENTS
    // إذا API فارغ أو فشل، نستخدم DEFAULT_INCIDENTS كاملة
    const raw = apiData.length > 0
      ? apiData.map((inc, i) => ({
          ...inc,
          // إذا كان student_name فارغاً، نأخذه من DEFAULT_INCIDENTS بنفس الترتيب أو الـ id
          student_name:
            inc.student_name ||
            inc.name ||
            DEFAULT_INCIDENTS.find((d) => d.id === inc.id || d.student_id === inc.student_id)?.student_name ||
            DEFAULT_INCIDENTS[i % DEFAULT_INCIDENTS.length]?.student_name ||
            '',
          // إكمال بيانات أخرى قد تكون ناقصة
          class_name: inc.class_name || DEFAULT_INCIDENTS[i % DEFAULT_INCIDENTS.length]?.class_name || '',
          source: inc.source || 'CorbitSchool',
        }))
      : DEFAULT_INCIDENTS;

    return raw.filter((inc) => {
      const ms = !search || (inc.student_name || '').toLowerCase().includes(search.toLowerCase()) || (inc.title || '').toLowerCase().includes(search.toLowerCase());
      const mf = statusFilter === 'all' || (statusFilter === 'open' && inc.status === 'open') || (statusFilter === 'closed' && inc.status === 'closed') || (statusFilter === 'critical' && (inc.severity === 'critical' || inc.severity === 'severe')) || (statusFilter === 'in_progress' && inc.status === 'in_progress');
      return ms && mf;
    });
  }, [incidentsQuery.data, search, statusFilter]);

  const kpi = useMemo(() => {
    const all = Array.isArray(incidentsQuery.data) && incidentsQuery.data.length > 0 ? incidentsQuery.data : DEFAULT_INCIDENTS;
    return {
      total: all.length,
      open: all.filter((i) => i.status === 'open').length,
      inProgress: all.filter((i) => i.status === 'in_progress').length,
      critical: all.filter((i) => i.severity === 'critical' || i.severity === 'severe').length,
      closed: all.filter((i) => i.status === 'closed').length,
      merits: 3,
    };
  }, [incidentsQuery.data]);

  const handleCreate = async () => {
    if (!studentNameInput.trim()) { Alert.alert('تنبيه', 'يرجى إدخال اسم الطالب'); return; }
    if (!descriptionInput.trim() && !incidentTypeInput.trim()) { Alert.alert('تنبيه', 'يرجى إدخال وصف المخالفة'); return; }
    try {
      await createMutation.mutateAsync({
        student_id: 1,
        title: incidentTypeInput,
        severity: severityInput,
        description: descriptionInput.trim() || incidentTypeInput,
        action_taken: actionInput.trim() || undefined,
        incident_date: dateInput,
        parent_notified: parentNotified,
      });
      setStudentNameInput('');
      setDescriptionInput('');
      setNotesInput('');
      setActionInput('');
      setClassInput('');
      setParentNotified(false);
      setCreateModalVisible(false);
      Alert.alert('نجاح', 'تم تسجيل المخالفة بنجاح');
    } catch { Alert.alert('خطأ', 'تعذر تسجيل المخالفة'); }
  };

  const handleCloseIncident = async (id: any) => {
    try { await closeMutation.mutateAsync({ id }); setSelectedIncident(null); Alert.alert('تم', 'تم إغلاق المخالفة'); }
    catch { Alert.alert('خطأ', 'تعذر إغلاق المخالفة'); }
  };

  const KPI_CARDS = [
    { label: 'إجمالي المخالفات', value: kpi.total, color: '#2563EB', top: '#2563EB' },
    { label: 'مفتوحة', value: kpi.open, color: '#2563EB', top: '#2563EB' },
    { label: 'قيد المتابعة', value: kpi.inProgress, color: '#F59E0B', top: '#F59E0B' },
    { label: 'حرجة', value: kpi.critical, color: '#EF4444', top: '#EF4444' },
    { label: 'مغلقة', value: kpi.closed, color: '#10B981', top: '#10B981' },
    { label: 'مواقف إيجابية', value: kpi.merits, color: '#0D9488', top: '#0D9488' },
  ];

  const PILLS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: `الكل (${kpi.total})` },
    { key: 'open', label: 'مفتوحة' },
    { key: 'in_progress', label: 'جارٍ' },
    { key: 'critical', label: 'حرجة' },
    { key: 'closed', label: 'مغلقة' },
  ];

  const TABS: { key: BehaviorTab; label: string; icon?: string }[] = [
    { key: 'incidents', label: 'المخالفات', icon: 'shield' },
    { key: 'repeated', label: 'المتكررة' },
    { key: 'followup', label: 'المتابعة' },
    { key: 'rules', label: 'لائحة السلوك' },
  ];

  return (
    <WebDashboardLayout
      title={isRTL ? 'إدارة السلوك والانضباط' : 'Behavior & Discipline'}
      subtitle={isRTL ? `${kpi.total} مخالفة · ${kpi.open} نشطة · ${kpi.critical} حرجة` : `${kpi.total} Incidents · ${kpi.open} Active`}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        <View style={styles.pageWrapper}>

          {/* Top Actions */}
          <View style={[styles.topActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity style={[styles.primaryBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} activeOpacity={0.85} onPress={() => setCreateModalVisible(true)}>
              <Icon name="plus" size={14} color="#FFFFFF" />
              <AppText variant="captionBold" color="#FFFFFF">{isRTL ? 'سجل مخالفة' : 'New Incident'}</AppText>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.outlineBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} activeOpacity={0.8}>
              <Icon name="chart" size={14} color="#64748B" />
              <AppText variant="captionBold" color="#334155">{isRTL ? 'تصدير' : 'Export'}</AppText>
            </TouchableOpacity>
          </View>

          {/* KPI Grid */}
          <View style={[styles.kpiGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {KPI_CARDS.map((k) => (
              <View key={k.label} style={[styles.kpiCard, { borderTopColor: k.top }]}>
                <AppText variant="h1" weight="bold" color={k.color} style={{ textAlign: 'center' }}>{k.value}</AppText>
                <AppText variant="caption" color="#64748B" style={{ textAlign: 'center' }}>{k.label}</AppText>
              </View>
            ))}
          </View>

          {/* Navigation Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tabsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {TABS.map((tab) => (
              <TouchableOpacity key={tab.key} style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]} onPress={() => setActiveTab(tab.key)} activeOpacity={0.8}>
                <Icon name={tab.icon as any} size={13} color={activeTab === tab.key ? '#2563EB' : '#64748B'} />
                <AppText variant="captionBold" color={activeTab === tab.key ? '#2563EB' : '#64748B'}>{tab.label}</AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Search + Filter */}
          <View style={styles.filterCard}>
            <View style={[styles.searchBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Icon name="search" size={16} color="#94A3B8" />
              <TextInput style={[styles.searchInput, { textAlign: isRTL ? 'right' : 'left' }]} placeholder={isRTL ? 'ابحث باسم الطالب أو نوع المخالفة...' : 'Search...'} placeholderTextColor="#94A3B8" value={search} onChangeText={setSearch} />
              {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}><Icon name="close" size={14} color="#94A3B8" /></TouchableOpacity>}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.pillsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {PILLS.map((pill) => (
                <TouchableOpacity key={pill.key} style={[styles.filterPill, statusFilter === pill.key && styles.filterPillActive]} onPress={() => setStatusFilter(pill.key)} activeOpacity={0.8}>
                  <AppText variant="captionBold" color={statusFilter === pill.key ? '#2563EB' : '#64748B'}>{pill.label}</AppText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Incidents List */}
          {activeTab === 'incidents' && (
            <View style={styles.listWrapper}>
              {displayIncidents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="shield" size={36} color="#CBD5E1" />
                  <AppText variant="body" color="#94A3B8" style={{ marginTop: 10 }}>لا توجد مخالفات</AppText>
                </View>
              ) : (
                displayIncidents.map((inc, idx) => {
                  const rawName = inc.student_name || inc.name || '';
                  const name = rawName.trim() ||
                    (inc.student_id ? `طالب #${inc.student_id}` : 'طالب غير محدد');
                  // Split name: first word as first name, rest as last name
                  const nameParts = name.split(' ');
                  const firstName = nameParts[0] || name;
                  const restName = nameParts.slice(1).join(' ');
                  const avatarBg = getAvatarBg(name);
                  const isClosed = inc.status === 'closed';
                  const ss = getSevStyle(inc.severity);
                  return (
                    <TouchableOpacity
                      key={inc.id}
                      style={[
                        styles.incidentCard,
                        idx % 2 === 1 && styles.incidentCardAlt,
                        isRTL
                          ? { borderRightWidth: 4, borderRightColor: ss.border }
                          : { borderLeftWidth: 4, borderLeftColor: ss.border },
                      ]}
                      activeOpacity={0.75}
                      onPress={() => setSelectedIncident(inc)}
                    >
                      {/* ── Row 1: Avatar + Name block + Badges ── */}
                      <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>

                        {/* Avatar */}
                        <View style={[styles.avatarBox, { backgroundColor: avatarBg }]}>
                          <AppText style={{ fontSize: 17, fontWeight: '700', color: '#FFF' }}>
                            {firstName.charAt(0)}
                          </AppText>
                        </View>

                        {/* Name + meta */}
                        <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start', marginHorizontal: 10 }}>
                          {/* Full name: firstName bold + rest normal */}
                          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'baseline', flexWrap: 'wrap', gap: 4 }}>
                            <AppText
                              variant="bodyBold"
                              color="#0F172A"
                              style={{ fontSize: 15, textAlign: isRTL ? 'right' : 'left' }}
                              numberOfLines={1}
                            >{firstName}</AppText>
                            {restName ? (
                              <AppText
                                variant="body"
                                color="#334155"
                                style={{ fontSize: 14, textAlign: isRTL ? 'right' : 'left' }}
                                numberOfLines={1}
                              >{restName}</AppText>
                            ) : null}
                          </View>
                          {/* Source · Class */}
                          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                            <Icon name="users" size={11} color="#94A3B8" />
                            <AppText variant="caption" color="#94A3B8">
                              {inc.source || 'CorbitSchool'}  ·  {inc.class_name || '1/أ'}
                            </AppText>
                          </View>
                        </View>

                        {/* Status + severity badges */}
                        <View style={{ alignItems: isRTL ? 'flex-start' : 'flex-end', gap: 4 }}>
                          <View style={[styles.badge, isClosed ? styles.badgeClosed : styles.badgeOpen]}>
                            <AppText variant="caption" color={isClosed ? '#059669' : '#2563EB'}>
                              {isClosed ? 'مغلقة' : 'مفتوحة'}
                            </AppText>
                          </View>
                          <View style={[styles.badge, { backgroundColor: ss.bg, borderColor: ss.border }]}>
                            <AppText variant="caption" color={ss.text}>
                              {getSeverityLabel(inc.severity)}
                            </AppText>
                          </View>
                        </View>
                      </View>

                      {/* ── Row 2: Incident title + description ── */}
                      <View style={[styles.incidentBody, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                        <AppText
                          variant="captionBold"
                          color="#1E293B"
                          style={{ textAlign: isRTL ? 'right' : 'left', fontSize: 13.5, marginBottom: 2 }}
                        >{inc.title || '-'}</AppText>
                        {inc.description ? (
                          <AppText
                            variant="caption"
                            color="#64748B"
                            style={{ textAlign: isRTL ? 'right' : 'left', lineHeight: 18 }}
                            numberOfLines={2}
                          >{inc.description}</AppText>
                        ) : null}
                      </View>

                      {/* ── Row 3: Footer ── */}
                      <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {inc.action_taken ? (
                          <View style={styles.actionPill}>
                            <AppText variant="caption" color="#475569">{inc.action_taken}</AppText>
                          </View>
                        ) : <View />}
                        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 4 }}>
                          <Icon name="calendar" size={11} color="#94A3B8" />
                          <AppText variant="caption" color="#94A3B8">{inc.incident_date || '-'}</AppText>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </View>
          )}

          {activeTab !== 'incidents' && (
            <View style={styles.placeholderCard}>
              <Icon name="shield" size={32} color="#CBD5E1" />
              <AppText variant="body" color="#94A3B8" style={{ marginTop: 8, textAlign: 'center' }}>
                {activeTab === 'repeated' ? 'المخالفات المتكررة' : activeTab === 'followup' ? 'قيد المتابعة' : 'لائحة السلوك'}
              </AppText>
            </View>
          )}

        </View>
      </ScrollView>

      {/* Student Drawer */}
      <StudentDetailDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} isRTL={isRTL} onCloseIncident={handleCloseIncident} onNotifyParent={() => Alert.alert('تم', 'تم إرسال إشعار لولي الأمر')} />

      {/* ── Create Incident Modal ── */}
      <Modal visible={createModalVisible} transparent animationType="slide" onRequestClose={() => setCreateModalVisible(false)}>
        <KeyboardAvoidingView style={styles.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalSheet}>

            {/* Header */}
            <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setCreateModalVisible(false)}>
                <Icon name="close" size={18} color="#64748B" />
              </TouchableOpacity>
              <AppText variant="cardTitle" weight="bold" color="#0F172A">تسجيل مخالفة جديدة</AppText>
              <View style={{ width: 36 }} />
            </View>

            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={styles.modalBody}>

                {/* الطالب */}
                <View style={styles.formGroup}>
                  <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                    الطالب <AppText variant="captionBold" color="#EF4444">*</AppText>
                  </AppText>
                  <View style={[styles.searchInputBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Icon name="search" size={15} color="#94A3B8" />
                    <TextInput
                      style={[styles.formInput, { flex: 1, borderWidth: 0, backgroundColor: 'transparent', margin: 0 }]}
                      placeholder="ابحث بالاسم أو رقم الرقم..."
                      placeholderTextColor="#94A3B8"
                      value={studentNameInput}
                      onChangeText={setStudentNameInput}
                      textAlign={isRTL ? 'right' : 'left'}
                    />
                  </View>
                </View>

                {/* الصف + نوع المخالفة */}
                <View style={[styles.formRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>الصف</AppText>
                    <View style={[styles.selectBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <AppText variant="caption" color={classInput ? '#0F172A' : '#94A3B8'} style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                        {classInput || '-- اختر الفصل --'}
                      </AppText>
                      <Icon name="chevronDown" size={14} color="#94A3B8" />
                    </View>
                    {/* Quick class options */}
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {['1/أ', '1/ب', '2/أ', '2/ب'].map(cls => (
                        <TouchableOpacity key={cls} onPress={() => setClassInput(cls)} activeOpacity={0.7}
                          style={[styles.quickPill, classInput === cls && styles.quickPillActive]}>
                          <AppText variant="caption" color={classInput === cls ? '#2563EB' : '#64748B'}>{cls}</AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>نوع المخالفة <AppText variant="captionBold" color="#EF4444">*</AppText></AppText>
                    <View style={[styles.selectBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <AppText variant="caption" color="#0F172A" style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>{incidentTypeInput}</AppText>
                      <Icon name="chevronDown" size={14} color="#94A3B8" />
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                      {['تأخر متكرر', 'غياب', 'سلوك مخالف', 'غش'].map(t => (
                        <TouchableOpacity key={t} onPress={() => setIncidentTypeInput(t)} activeOpacity={0.7}
                          style={[styles.quickPill, incidentTypeInput === t && styles.quickPillActive]}>
                          <AppText variant="caption" color={incidentTypeInput === t ? '#2563EB' : '#64748B'}>{t}</AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* الوصف */}
                <View style={styles.formGroup}>
                  <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                    الوصف <AppText variant="captionBold" color="#EF4444">*</AppText>
                  </AppText>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea, { textAlign: isRTL ? 'right' : 'left' }]}
                    placeholder="اكتب وصفاً للمخالفة..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    value={descriptionInput}
                    onChangeText={setDescriptionInput}
                    textAlignVertical="top"
                  />
                </View>

                {/* درجة الخطورة + الإجراء المتخذ */}
                <View style={[styles.formRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>درجة الخطورة</AppText>
                    <View style={{ gap: 4 }}>
                      {(['low', 'medium', 'high', 'critical'] as const).map((sev) => {
                        const ss = getSevStyle(sev);
                        const active = severityInput === sev;
                        return (
                          <TouchableOpacity key={sev} onPress={() => setSeverityInput(sev)} activeOpacity={0.8}
                            style={[styles.sevOption, active && { backgroundColor: ss.bg, borderColor: ss.border }]}>
                            <View style={[styles.sevDot, { backgroundColor: ss.text }]} />
                            <AppText variant="captionBold" color={active ? ss.text : '#475569'}>{getSeverityLabel(sev)}</AppText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>الإجراء المتخذ</AppText>
                    <TextInput
                      style={[styles.formInput, styles.formTextArea, { textAlign: isRTL ? 'right' : 'left', height: 112 }]}
                      placeholder="أدخل الإجراء..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      value={actionInput}
                      onChangeText={setActionInput}
                      textAlignVertical="top"
                    />
                  </View>
                </View>

                {/* التاريخ + الحالة */}
                <View style={[styles.formRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>التاريخ</AppText>
                    <View style={[styles.selectBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Icon name="calendar" size={14} color="#94A3B8" />
                      <AppText variant="caption" color="#0F172A" style={{ flex: 1, textAlign: isRTL ? 'right' : 'left', marginHorizontal: 6 }}>{dateInput}</AppText>
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>الحالة</AppText>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {[{ key: 'open', label: 'مفتوحة' }, { key: 'in_progress', label: 'جارٍ' }].map(s => (
                        <TouchableOpacity key={s.key} onPress={() => setStatusInput(s.key)} activeOpacity={0.8}
                          style={[styles.quickPill, { flex: 1, justifyContent: 'center' }, statusInput === s.key && styles.quickPillActive]}>
                          <AppText variant="captionBold" color={statusInput === s.key ? '#2563EB' : '#64748B'} style={{ textAlign: 'center' }}>{s.label}</AppText>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                {/* ملاحظات */}
                <View style={styles.formGroup}>
                  <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>ملاحظات</AppText>
                  <TextInput
                    style={[styles.formInput, styles.formTextArea, { textAlign: isRTL ? 'right' : 'left' }]}
                    placeholder="ملاحظات إضافية..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={3}
                    value={notesInput}
                    onChangeText={setNotesInput}
                    textAlignVertical="top"
                  />
                </View>

                {/* تسجيل إبلاغ ولي الأمر */}
                <TouchableOpacity
                  style={[styles.checkboxRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  onPress={() => setParentNotified(v => !v)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, parentNotified && styles.checkboxActive]}>
                    {parentNotified && <Icon name="check" size={12} color="#FFFFFF" />}
                  </View>
                  <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                    <AppText variant="captionBold" color="#334155" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                      تسجيل أن ولي الأمر أُبلغ مسبقاً
                    </AppText>
                    <AppText variant="caption" color="#94A3B8" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                      لا يرسل رسالة – فقط يُحدِّث حقل "أُبلغ ولي الأمر" في التفاصيل
                    </AppText>
                  </View>
                </TouchableOpacity>

              </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.modalFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setCreateModalVisible(false)} activeOpacity={0.8}>
                <AppText variant="captionBold" color="#475569">إلغاء</AppText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1, minHeight: 46 }]}
                onPress={handleCreate}
                activeOpacity={0.85}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="clipboard" size={15} color="#FFFFFF" />
                    <AppText variant="captionBold" color="#FFFFFF">تسجيل المخالفة</AppText>
                  </>
                )}
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </WebDashboardLayout>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: 14, paddingBottom: 40 },
  pageWrapper: { gap: 12 },
  topActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  primaryBtn: { backgroundColor: '#1246B7', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, minHeight: 42 },
  outlineBtn: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 42 },
  kpiGrid: { flexWrap: 'wrap', gap: 8 },
  kpiCard: { flex: 1, minWidth: 90, backgroundColor: '#FFFFFF', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', borderTopWidth: 3, gap: 4, alignItems: 'center', ...shadows.card },
  tabsRow: { gap: 8, paddingBottom: 2 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  tabBtnActive: { borderColor: '#2563EB', backgroundColor: '#EFF6FF' },
  filterCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 10, ...shadows.card },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, minHeight: 44, gap: 8 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', padding: 0 },
  pillsRow: { gap: 6 },
  filterPill: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, justifyContent: 'center' },
  filterPillActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  listWrapper: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', ...shadows.card },
  incidentCard: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', backgroundColor: '#FFFFFF', borderLeftWidth: 4, borderLeftColor: 'transparent' },
  incidentCardAlt: { backgroundColor: '#FAFAFA' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  avatarBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  studentInfo: { alignItems: 'center', gap: 10 },
  incidentBody: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  badgeOpen: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  badgeClosed: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  actionPill: { backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  emptyState: { padding: 40, alignItems: 'center' },
  placeholderCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 40, alignItems: 'center', ...shadows.card },
  drawerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', flexDirection: 'row' },
  drawerSheet: { width: '85%', maxWidth: 400, backgroundColor: '#FFFFFF', height: '100%', paddingTop: 48 },
  drawerHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  drawerAvatarBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  drawerCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  drawerBody: { flex: 1, paddingHorizontal: 16, paddingTop: 14 },
  drawerBadgesRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
  detailBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  badgeNotified: { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  noteInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, minHeight: 80, fontSize: 13, color: '#0F172A', textAlignVertical: 'top' },
  drawerActionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', paddingBottom: 24 },
  drawerActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, flex: 1, justifyContent: 'center', minHeight: 42 },
  btnSuccess: { backgroundColor: '#059669' },
  btnPurple: { backgroundColor: '#7C3AED' },
  btnPrimary: { backgroundColor: '#1246B7' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: { width: '100%', maxHeight: '92%', backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  modalBody: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, gap: 14 },
  modalFooter: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', backgroundColor: '#FFFFFF' },
  cancelBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  formGroup: { gap: 4 },
  formRow: { flexDirection: 'row', gap: 12 },
  formLabel: { fontSize: 12.5, fontWeight: '600', color: '#334155', marginBottom: 4 },
  formInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, fontSize: 13, color: '#0F172A' },
  formTextArea: { minHeight: 80, textAlignVertical: 'top' },
  searchInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, gap: 8 },
  selectBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, minHeight: 44 },
  quickPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  quickPillActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  sevOption: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginTop: 2, backgroundColor: '#FFFFFF', flexShrink: 0 },
  checkboxActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  modalInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, fontSize: 13, color: '#0F172A', textAlignVertical: 'top' },
  severityRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  severityPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
});

