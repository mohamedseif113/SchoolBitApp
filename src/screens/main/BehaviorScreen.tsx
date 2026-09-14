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
  useWindowDimensions,
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
import { useStudents } from '../../hooks/useStudents';
import { BehaviorIncident } from '../../types/behavior';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';
import { WebDashboardLayout } from '../../components/layout/WebDashboardLayout';

type BehaviorTab = 'incidents' | 'repeated' | 'followup' | 'rules';
type StatusFilter = 'all' | 'open' | 'in_progress' | 'critical' | 'closed';



const AVATAR_COLORS = ['#DB2777', '#1E293B', '#E11D48', '#2563EB', '#0D9488', '#7C3AED', '#D97706'];
function getAvatarBg(name: string) { return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]; }

function getSeverityLabel(sev: string, isRTL: boolean = true) {
  if (isRTL) {
    return ({ low: 'منخفض', medium: 'متوسط', high: 'عالي', critical: 'حرج', minor: 'بسيط', moderate: 'متوسط', major: 'كبير', severe: 'حرج' } as any)[sev] || sev;
  }
  return ({ low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical', minor: 'Minor', moderate: 'Moderate', major: 'Major', severe: 'Severe' } as any)[sev] || sev;
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
  const { width, height } = useWindowDimensions();
  const isSmallScreen = width < 520;
  const [activeTab, setActiveTab] = useState<BehaviorTab>('incidents');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [studentNameInput, setStudentNameInput] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState<string | number | null>(null);
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string | number | null>(null);
  const [incidentTypeInput, setIncidentTypeInput] = useState('');
  const [showRuleDropdown, setShowRuleDropdown] = useState(false);
  const [severityInput, setSeverityInput] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [showSeverityDropdown, setShowSeverityDropdown] = useState(false);
  const [notesInput, setNotesInput] = useState('');
  const [classInput, setClassInput] = useState('');
  const [showClassDropdown, setShowClassDropdown] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [dateInput, setDateInput] = useState(new Date().toISOString().slice(0, 10));
  const [statusInput, setStatusInput] = useState('open');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [parentNotified, setParentNotified] = useState(false);

  const formattedDateDisplay = useMemo(() => {
    try {
      const parts = dateInput.split('-');
      if (parts.length === 3) {
        return `${parts[1]}/${parts[2]}/${parts[0]}`;
      }
    } catch {}
    return dateInput;
  }, [dateInput]);

  const incidentsQuery = useBehaviorIncidents({ search });
  const rulesQuery = useBehaviorRules();
  const analyticsQuery = useBehaviorAnalytics();
  const createMutation = useCreateIncident();
  const closeMutation = useCloseIncident();
  const { students: allStudentsList } = useStudents();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await Promise.all([incidentsQuery.refetch(), rulesQuery.refetch(), analyticsQuery.refetch()]); }
    finally { setRefreshing(false); }
  }, [incidentsQuery, rulesQuery, analyticsQuery]);

  const studentSuggestions = useMemo(() => {
    if (!studentNameInput.trim() || !showStudentDropdown) return [];
    const q = studentNameInput.trim().toLowerCase();
    return (allStudentsList || []).filter((s: any) => {
      const name = (s.full_name || s.name || s.student_name || '').toLowerCase();
      const nid = (s.national_id || s.employee_id || s.id || '').toString().toLowerCase();
      return name.includes(q) || nid.includes(q);
    }).slice(0, 6);
  }, [allStudentsList, studentNameInput, showStudentDropdown]);

  // Derive unique class names from student list (from real API data)
  const uniqueClasses = useMemo(() => {
    const seen = new Set<string>();
    const classes: string[] = [];
    (allStudentsList || []).forEach((s: any) => {
      const cls = s.class_name || s.classroom || s.section_name || s.grade_name || '';
      if (cls && !seen.has(cls)) { seen.add(cls); classes.push(cls); }
    });
    return classes.sort();
  }, [allStudentsList]);

  // Rules from API used as incident type options
  const ruleOptions = useMemo(() => {
    const raw = Array.isArray(rulesQuery.data) ? rulesQuery.data : [];
    return raw.filter((r: any) => r.is_active !== false);
  }, [rulesQuery.data]);


  const displayIncidents = useMemo(() => {
    const apiData = Array.isArray(incidentsQuery.data) ? incidentsQuery.data : [];

    const raw = apiData.map((inc: any) => {
      const studentName =
        inc.student_name ||
        inc.student?.name ||
        inc.student_full_name ||
        inc.student?.full_name ||
        `${inc.student?.first_name || ''} ${inc.student?.last_name || ''}`.trim() ||
        inc.employee_name ||
        inc.employee?.name ||
        inc.user_name ||
        inc.user?.name ||
        inc.name ||
        '';

      const className =
        inc.class_name ||
        (typeof inc.classroom === 'string' ? inc.classroom : inc.classroom?.name) ||
        inc.classroom_name ||
        (typeof inc.student?.classroom === 'string' ? inc.student.classroom : inc.student?.classroom?.name || inc.student?.class_name) ||
        inc.grade ||
        '—';

      const title = inc.title || inc.violation_type || inc.type || inc.reason || 'مخالفة سلوكية';
      const description = inc.description || inc.details || inc.notes || inc.summary || title;

      const rawStatus = String(inc.status || '').toLowerCase();
      const isClosed = rawStatus === 'closed' || rawStatus === 'مغلقة' || rawStatus === 'معالجة' || rawStatus === 'تم الحل';
      const isInProgress = rawStatus === 'in_progress' || rawStatus === 'قيد المعالجة' || rawStatus === 'قيد التقييم';
      const status = isClosed ? 'closed' : isInProgress ? 'in_progress' : 'open';

      const rawSev = String(inc.severity || inc.level || inc.degree || '').toLowerCase();
      const isCritical = rawSev === 'critical' || rawSev === 'severe' || rawSev === 'حرجة' || rawSev === 'درجة 4' || rawSev === 'درجة 5';
      const severity = isCritical ? 'critical' : (inc.severity || 'medium');

      return {
        ...inc,
        student_name: studentName,
        class_name: className,
        title,
        description,
        status,
        display_status_label: isClosed ? 'مغلقة' : isInProgress ? 'قيد المتابعة' : 'مفتوحة',
        severity,
        incident_date: inc.incident_date || inc.date || inc.created_at || '',
        action_taken: inc.action_taken || inc.action || 'لم يُحدد بعد',
        source: inc.source || inc.school_name || 'SchoolBit',
      };
    });

    return raw.filter((inc) => {
      const ms = !search || (inc.student_name || '').toLowerCase().includes(search.toLowerCase()) || (inc.title || '').toLowerCase().includes(search.toLowerCase()) || (inc.description || '').toLowerCase().includes(search.toLowerCase());
      const mf = statusFilter === 'all' || (statusFilter === 'open' && inc.status === 'open') || (statusFilter === 'closed' && inc.status === 'closed') || (statusFilter === 'critical' && inc.severity === 'critical') || (statusFilter === 'in_progress' && inc.status === 'in_progress');
      return ms && mf;
    });
  }, [incidentsQuery.data, search, statusFilter]);

  const kpi = useMemo(() => {
    const all = Array.isArray(incidentsQuery.data) ? incidentsQuery.data : [];
    const analytics = analyticsQuery.data as any;

    let openCount = 0;
    let closedCount = 0;
    let inProgressCount = 0;
    let criticalCount = 0;

    all.forEach((i: any) => {
      const st = String(i.status || '').toLowerCase();
      const sev = String(i.severity || i.level || '').toLowerCase();

      if (st === 'closed' || st === 'مغلقة' || st === 'معالجة' || st === 'تم الحل') {
        closedCount++;
      } else if (st === 'in_progress' || st === 'قيد المعالجة' || st === 'قيد المتابعة' || st === 'قيد التقييم') {
        inProgressCount++;
      } else {
        openCount++;
      }

      if (sev === 'critical' || sev === 'severe' || sev === 'حرجة' || sev === 'درجة 4' || sev === 'درجة 5') {
        criticalCount++;
      }
    });

    const apiTotal = analytics?.total_incidents ?? analytics?.total ?? analytics?.incidents_count ?? analytics?.count;
    const totalIncidents = typeof apiTotal === 'number' && apiTotal > 0 ? apiTotal : all.length;

    const apiOpen = analytics?.open_count ?? analytics?.open_incidents;
    const finalOpen = typeof apiOpen === 'number' ? apiOpen : openCount;

    const apiClosed = analytics?.closed_count ?? analytics?.closed_incidents;
    const finalClosed = typeof apiClosed === 'number' ? apiClosed : closedCount;

    const apiCritical = analytics?.critical_count ?? analytics?.critical_incidents ?? analytics?.by_severity?.critical;
    const finalCritical = typeof apiCritical === 'number' ? apiCritical : criticalCount;

    const apiInProgress = analytics?.in_progress_count ?? analytics?.in_progress_incidents;
    const finalInProgress = typeof apiInProgress === 'number' ? apiInProgress : inProgressCount;

    return {
      total: totalIncidents,
      open: finalOpen,
      inProgress: finalInProgress,
      critical: finalCritical,
      closed: finalClosed,
      merits: analytics?.merits ?? analytics?.positive_count ?? 0,
    };
  }, [incidentsQuery.data, analyticsQuery.data]);

  const handleCreate = async () => {
    if (!studentNameInput.trim()) { Alert.alert('تنبيه', 'يرجى إدخال اسم الطالب'); return; }
    if (!descriptionInput.trim() && !incidentTypeInput.trim()) { Alert.alert('تنبيه', 'يرجى إدخال وصف المخالفة'); return; }
    try {
      await createMutation.mutateAsync({
        student_id: selectedStudentId || 1,
        rule_id: selectedRuleId || undefined,
        title: incidentTypeInput || 'مخالفة سلوكية',
        severity: severityInput,
        description: descriptionInput.trim() || incidentTypeInput,
        action_taken: actionInput.trim() || undefined,
        incident_date: dateInput,
        parent_notified: parentNotified,
      });
      setStudentNameInput('');
      setSelectedStudentId(null);
      setSelectedRuleId(null);
      setIncidentTypeInput('');
      setDescriptionInput('');
      setNotesInput('');
      setActionInput('');
      setClassInput('');
      setParentNotified(false);
      setSeverityInput('medium');
      setStatusInput('open');
      setCreateModalVisible(false);
      Alert.alert('نجاح', 'تم تسجيل المخالفة بنجاح');
    } catch { Alert.alert('خطأ', 'تعذر تسجيل المخالفة'); }
  };

  const handleCloseIncident = async (id: any) => {
    try { await closeMutation.mutateAsync({ id }); setSelectedIncident(null); Alert.alert('تم', 'تم إغلاق المخالفة'); }
    catch { Alert.alert('خطأ', 'تعذر إغلاق المخالفة'); }
  };

  const KPI_CARDS = [
    { label: 'إجمالي المخالفات', value: kpi.total, color: '#2563EB', top: '#2563EB', tab: 'incidents', filter: 'all' },
    { label: 'مفتوحة', value: kpi.open, color: '#2563EB', top: '#2563EB', tab: 'incidents', filter: 'open' },
    { label: 'قيد المتابعة', value: kpi.inProgress, color: '#F59E0B', top: '#F59E0B', tab: 'followup', filter: 'in_progress' },
    { label: 'حرجة', value: kpi.critical, color: '#EF4444', top: '#EF4444', tab: 'incidents', filter: 'critical' },
    { label: 'مغلقة', value: kpi.closed, color: '#10B981', top: '#10B981', tab: 'incidents', filter: 'closed' },
    { label: 'مواقف إيجابية', value: kpi.merits, color: '#0D9488', top: '#0D9488', tab: 'incidents', filter: 'all' },
  ];

  const PILLS: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: `الكل (${kpi.total})` },
    { key: 'open', label: `مفتوحة (${kpi.open})` },
    { key: 'in_progress', label: `جارٍ (${kpi.inProgress})` },
    { key: 'critical', label: `حرجة (${kpi.critical})` },
    { key: 'closed', label: `مغلقة (${kpi.closed})` },
  ];

  const TABS: { key: BehaviorTab; label: string; icon?: string }[] = [
    { key: 'incidents', label: 'المخالفات', icon: 'shield' },
    { key: 'repeated', label: 'المتكررة' },
    { key: 'followup', label: `المتابعة (${kpi.inProgress})` },
    { key: 'rules', label: 'لائحة السلوك' },
  ];

  const activeTabIncidents = useMemo(() => {
    if (activeTab === 'followup') {
      return displayIncidents.filter((inc) => inc.status === 'in_progress' || inc.status === 'open' || inc.display_status_label === 'قيد المتابعة');
    }
    if (activeTab === 'repeated') {
      const counts: Record<string, number> = {};
      displayIncidents.forEach((inc) => {
        const sName = inc.student_name || 'unknown';
        counts[sName] = (counts[sName] || 0) + 1;
      });
      return displayIncidents.filter((inc) => (counts[inc.student_name || ''] || 0) > 1);
    }
    return displayIncidents;
  }, [displayIncidents, activeTab]);

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
              <TouchableOpacity
                key={k.label}
                style={[styles.kpiCard, { borderTopColor: k.top }]}
                onPress={() => {
                  if (k.tab) setActiveTab(k.tab as BehaviorTab);
                  if (k.filter) setStatusFilter(k.filter as StatusFilter);
                }}
                activeOpacity={0.75}
              >
                <AppText variant="h1" weight="bold" color={k.color} style={{ textAlign: 'center' }}>{k.value}</AppText>
                <AppText variant="caption" color="#64748B" style={{ textAlign: 'center' }}>{k.label}</AppText>
              </TouchableOpacity>
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

          {/* Incidents List (for incidents, followup, repeated) */}
          {(activeTab === 'incidents' || activeTab === 'followup' || activeTab === 'repeated') && (
            <View style={styles.listWrapper}>
              {activeTabIncidents.length === 0 ? (
                <View style={styles.emptyState}>
                  <Icon name="shield" size={36} color="#CBD5E1" />
                  <AppText variant="body" color="#94A3B8" style={{ marginTop: 10 }}>
                    {activeTab === 'followup' ? 'لا توجد مخالفات قيد المتابعة حالياً' : activeTab === 'repeated' ? 'لا توجد مخالفات متكررة حالياً' : 'لا توجد مخالفات'}
                  </AppText>
                </View>
              ) : (
                activeTabIncidents.map((inc, idx) => {
                  const rawName = inc.student_name || inc.name || '';
                  const name = rawName.trim() ||
                    (inc.student_id ? `طالب #${inc.student_id}` : 'طالب غير محدد');
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
                      {/* Row 1: Avatar + Name block + Badges */}
                      <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>

                        {/* Avatar */}
                        <View style={[styles.avatarBox, { backgroundColor: avatarBg }]}>
                          <AppText style={{ fontSize: 17, fontWeight: '700', color: '#FFF' }}>
                            {firstName.charAt(0)}
                          </AppText>
                        </View>

                        {/* Name + meta */}
                        <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start', marginHorizontal: 10 }}>
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
                              {inc.display_status_label || (isClosed ? 'مغلقة' : 'مفتوحة')}
                            </AppText>
                          </View>
                          <View style={[styles.badge, { backgroundColor: ss.bg, borderColor: ss.border }]}>
                            <AppText variant="caption" color={ss.text}>
                              {getSeverityLabel(inc.severity)}
                            </AppText>
                          </View>
                        </View>
                      </View>

                      {/* Row 2: Incident title + description */}
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

                      {/* Row 3: Footer */}
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

          {/* Rules List (for rules tab) */}
          {activeTab === 'rules' && (
            <View style={styles.listWrapper}>
              {Array.isArray(rulesQuery.data) && rulesQuery.data.length > 0 ? (
                rulesQuery.data.map((rule: any, idx: number) => (
                  <View key={rule.id || idx} style={[styles.incidentCard, idx % 2 === 1 && styles.incidentCardAlt]}>
                    <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                        <AppText variant="bodyBold" color="#0F172A">
                          {rule.name_ar || rule.name || 'قاعدة سلوكية'}
                        </AppText>
                        {rule.description ? (
                          <AppText variant="caption" color="#64748B" style={{ marginTop: 4 }}>
                            {rule.description}
                          </AppText>
                        ) : null}
                      </View>
                      <View style={[styles.badge, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                        <AppText variant="caption" color="#2563EB">
                          {getSeverityLabel(rule.severity)}
                        </AppText>
                      </View>
                    </View>
                    {(rule.default_action || rule.points_deducted) && (
                      <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <AppText variant="caption" color="#475569">
                          {rule.default_action ? `الإجراء المتوقع: ${rule.default_action}` : ''}
                        </AppText>
                        {rule.points_deducted ? (
                          <AppText variant="captionBold" color="#EF4444">
                            -{rule.points_deducted} نقاط
                          </AppText>
                        ) : null}
                      </View>
                    )}
                  </View>
                ))
              ) : (
                <View style={styles.emptyState}>
                  <Icon name="shield" size={36} color="#CBD5E1" />
                  <AppText variant="body" color="#94A3B8" style={{ marginTop: 10 }}>
                    لا توجد قواعد سلوكية مسجلة
                  </AppText>
                </View>
              )}
            </View>
          )}


        </View>
      </ScrollView>

      {/* Student Drawer */}
      <StudentDetailDrawer incident={selectedIncident} onClose={() => setSelectedIncident(null)} isRTL={isRTL} onCloseIncident={handleCloseIncident} onNotifyParent={() => Alert.alert('تم', 'تم إرسال إشعار لولي الأمر')} />

      {/* ── Create Incident Modal / Pop-up Drawer ── */}
      <Modal
        visible={createModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCreateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.modalBackdropTouch}
            onPress={() => setCreateModalVisible(false)}
          />
          <View style={styles.modalSheet}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ flex: 1 }}
            >
              {/* Sticky Header */}
            <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setCreateModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Icon name="close" size={18} color="#64748B" />
              </TouchableOpacity>
              <AppText variant="cardTitle" weight="bold" color="#0F172A">
                {isRTL ? 'تسجيل مخالفة جديدة' : 'New Incident'}
              </AppText>
              <View style={{ width: 36 }} />
            </View>

            {/* Scrollable Form Body */}
            <ScrollView
              style={styles.modalScrollView}
              contentContainerStyle={styles.modalScrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* 1. الطالب * (Student) */}
              <View style={styles.formGroup}>
                <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'الطالب' : 'Student'} <AppText variant="captionBold" color="#EF4444">*</AppText>
                </AppText>

                <View style={[styles.searchInputBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <TextInput
                    style={[styles.formInputClean, { flex: 1, textAlign: isRTL ? 'right' : 'left' }]}
                    placeholder={isRTL ? 'ابحث بالاسم أو رقم الهوية...' : 'Search student by name or ID...'}
                    placeholderTextColor="#94A3B8"
                    value={studentNameInput}
                    onChangeText={(val) => {
                      setStudentNameInput(val);
                      setShowStudentDropdown(true);
                      setSelectedStudentId(null);
                    }}
                    onFocus={() => {
                      setShowStudentDropdown(true);
                      setShowClassDropdown(false);
                      setShowRuleDropdown(false);
                      setShowSeverityDropdown(false);
                      setShowActionDropdown(false);
                      setShowStatusDropdown(false);
                    }}
                  />
                  {studentNameInput.length > 0 ? (
                    <TouchableOpacity
                      onPress={() => {
                        setStudentNameInput('');
                        setSelectedStudentId(null);
                        setShowStudentDropdown(false);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Icon name="close" size={14} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Student Suggestions Dropdown */}
                {showStudentDropdown && (
                  <View style={styles.dropdownMenu}>
                    {studentSuggestions.length > 0 ? (
                      studentSuggestions.map((st: any) => {
                        const stName = st.full_name || st.name || st.student_name || '';
                        const stClass = st.class_name || st.classroom || st.section_name || '';
                        const stId = st.national_id || st.student_number || st.id;
                        return (
                          <TouchableOpacity
                            key={st.id}
                            style={[styles.dropdownMenuItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                            onPress={() => {
                              setStudentNameInput(stName);
                              setSelectedStudentId(st.id);
                              if (stClass) setClassInput(stClass);
                              setShowStudentDropdown(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <View style={styles.suggestionAvatar}>
                              <Icon name="user" size={13} color="#2563EB" />
                            </View>
                            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                              <AppText variant="captionBold" color="#0F172A">
                                {stName}
                              </AppText>
                              <AppText variant="caption" color="#94A3B8">
                                {stId ? `${isRTL ? 'الرقم: ' : 'ID: '}${stId}` : ''} {stClass ? `· ${isRTL ? 'الفصل: ' : 'Class: '}${stClass}` : ''}
                              </AppText>
                            </View>
                          </TouchableOpacity>
                        );
                      })
                    ) : studentNameInput.trim().length > 0 ? (
                      <View style={{ padding: 10, alignItems: 'center' }}>
                        <AppText variant="caption" color="#94A3B8">
                          {isRTL ? 'لا توجد نتائج مطابقة، سيتم استخدام الاسم المدخل' : 'No matches found'}
                        </AppText>
                      </View>
                    ) : (
                      <View style={{ padding: 10, alignItems: 'center' }}>
                        <AppText variant="caption" color="#94A3B8">
                          {isRTL ? 'اكتب للبحث في قائمة الطلاب...' : 'Type to search students...'}
                        </AppText>
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* 2. Responsive Row: الصف (Class) + نوع المخالفة * (Incident Type) */}
              <View style={[styles.formRow, { flexDirection: isSmallScreen ? 'column' : (isRTL ? 'row-reverse' : 'row') }]}>
                {/* الصف (Class) */}
                <View style={{ flex: 1, zIndex: 50 }}>
                  <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'الصف' : 'Class'}
                  </AppText>
                  <TouchableOpacity
                    style={[styles.webSelectBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => {
                      setShowClassDropdown(v => !v);
                      setShowRuleDropdown(false);
                      setShowSeverityDropdown(false);
                      setShowActionDropdown(false);
                      setShowStatusDropdown(false);
                      setShowStudentDropdown(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <AppText
                      variant="caption"
                      color={classInput ? '#0F172A' : '#94A3B8'}
                      style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}
                    >
                      {classInput || (isRTL ? '- اختر الفصل -' : '- Select Class -')}
                    </AppText>
                    <Icon name={showClassDropdown ? 'chevronUp' : 'chevronDown'} size={14} color="#94A3B8" />
                  </TouchableOpacity>

                  {/* Class Dropdown Menu */}
                  {showClassDropdown && (
                    <View style={styles.dropdownMenu}>
                      {(uniqueClasses.length > 0 ? uniqueClasses : ['1/أ', '1/ب', '2/أ', '2/ب', '3/أ', '3/ب', '4/أ', '5/أ', '6/أ']).map(cls => (
                        <TouchableOpacity
                          key={cls}
                          onPress={() => {
                            setClassInput(cls);
                            setShowClassDropdown(false);
                          }}
                          activeOpacity={0.7}
                          style={[
                            styles.dropdownMenuItem,
                            { flexDirection: isRTL ? 'row-reverse' : 'row' },
                            classInput === cls && styles.dropdownMenuItemActive,
                          ]}
                        >
                          <AppText variant="captionBold" color={classInput === cls ? '#2563EB' : '#334155'} style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                            {cls}
                          </AppText>
                          {classInput === cls && <Icon name="check" size={14} color="#2563EB" />}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>

                {/* نوع المخالفة * (Incident Type) */}
                <View style={{ flex: 1, zIndex: 50 }}>
                  <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'نوع المخالفة' : 'Incident Type'} <AppText variant="captionBold" color="#EF4444">*</AppText>
                  </AppText>
                  <TouchableOpacity
                    style={[styles.webSelectBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => {
                      setShowRuleDropdown(v => !v);
                      setShowClassDropdown(false);
                      setShowSeverityDropdown(false);
                      setShowActionDropdown(false);
                      setShowStatusDropdown(false);
                      setShowStudentDropdown(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <AppText
                      variant="caption"
                      color={incidentTypeInput ? '#0F172A' : '#94A3B8'}
                      style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}
                    >
                      {incidentTypeInput || (isRTL ? '- اختر -' : '- Select -')}
                    </AppText>
                    <Icon name={showRuleDropdown ? 'chevronUp' : 'chevronDown'} size={14} color="#94A3B8" />
                  </TouchableOpacity>

                  {/* Incident Type Dropdown Menu */}
                  {showRuleDropdown && (
                    <View style={styles.dropdownMenu}>
                      {ruleOptions.length > 0 ? (
                        ruleOptions.map((r: any) => {
                          const title = isRTL ? (r.name_ar || r.name || r.title) : (r.name || r.name_ar || r.title);
                          const isSelected = selectedRuleId === r.id || incidentTypeInput === title;
                          return (
                            <TouchableOpacity
                              key={r.id}
                              onPress={() => {
                                setIncidentTypeInput(title);
                                setSelectedRuleId(r.id);
                                if (r.severity && ['low', 'medium', 'high', 'critical'].includes(r.severity)) {
                                  setSeverityInput(r.severity);
                                }
                                setShowRuleDropdown(false);
                              }}
                              activeOpacity={0.7}
                              style={[
                                styles.dropdownMenuItem,
                                { flexDirection: isRTL ? 'row-reverse' : 'row' },
                                isSelected && styles.dropdownMenuItemActive,
                              ]}
                            >
                              <AppText variant="captionBold" color={isSelected ? '#2563EB' : '#334155'} style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                                {title}
                              </AppText>
                              {isSelected && <Icon name="check" size={14} color="#2563EB" />}
                            </TouchableOpacity>
                          );
                        })
                      ) : (
                        (isRTL
                          ? ['تأخر متكرر', 'عدم الالتزام بالزي', 'غش في الاختبار', 'استخدام الهاتف', 'تنمر على زميل', 'إثارة الفوضى']
                          : ['Repeated Tardiness', 'Uniform Violation', 'Cheating', 'Phone Usage', 'Bullying', 'Disruption']
                        ).map(t => (
                          <TouchableOpacity
                            key={t}
                            onPress={() => {
                              setIncidentTypeInput(t);
                              setSelectedRuleId(null);
                              setShowRuleDropdown(false);
                            }}
                            activeOpacity={0.7}
                            style={[
                              styles.dropdownMenuItem,
                              { flexDirection: isRTL ? 'row-reverse' : 'row' },
                              incidentTypeInput === t && styles.dropdownMenuItemActive,
                            ]}
                          >
                            <AppText variant="captionBold" color={incidentTypeInput === t ? '#2563EB' : '#334155'} style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                              {t}
                            </AppText>
                            {incidentTypeInput === t && <Icon name="check" size={14} color="#2563EB" />}
                          </TouchableOpacity>
                        ))
                      )}
                    </View>
                  )}
                </View>
              </View>

              {/* 3. الوصف * (Description) */}
              <View style={styles.formGroup}>
                <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'الوصف' : 'Description'} <AppText variant="captionBold" color="#EF4444">*</AppText>
                </AppText>
                <TextInput
                  style={[styles.webTextArea, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={isRTL ? 'اكتب وصفاً للحادثة...' : 'Write incident description...'}
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  value={descriptionInput}
                  onChangeText={setDescriptionInput}
                  textAlignVertical="top"
                />
              </View>

              {/* 4. Responsive Row: درجة الخطورة (Severity) + الإجراء المتخذ (Action Taken) */}
              <View style={[styles.formRow, { flexDirection: isSmallScreen ? 'column' : (isRTL ? 'row-reverse' : 'row') }]}>
                {/* درجة الخطورة (Severity) */}
                <View style={{ flex: 1, zIndex: 40 }}>
                  <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'درجة الخطورة' : 'Severity'}
                  </AppText>
                  <TouchableOpacity
                    style={[styles.webSelectBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => {
                      setShowSeverityDropdown(v => !v);
                      setShowActionDropdown(false);
                      setShowClassDropdown(false);
                      setShowRuleDropdown(false);
                      setShowStatusDropdown(false);
                      setShowStudentDropdown(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <AppText
                      variant="captionBold"
                      color="#0F172A"
                      style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}
                    >
                      {getSeverityLabel(severityInput, isRTL)}
                    </AppText>
                    <Icon name={showSeverityDropdown ? 'chevronUp' : 'chevronDown'} size={14} color="#94A3B8" />
                  </TouchableOpacity>

                  {/* Severity Dropdown Menu */}
                  {showSeverityDropdown && (
                    <View style={styles.dropdownMenu}>
                      {(['low', 'medium', 'high', 'critical'] as const).map(sev => {
                        const isSelected = severityInput === sev;
                        return (
                          <TouchableOpacity
                            key={sev}
                            onPress={() => {
                              setSeverityInput(sev);
                              setShowSeverityDropdown(false);
                            }}
                            activeOpacity={0.7}
                            style={[
                              styles.dropdownMenuItem,
                              { flexDirection: isRTL ? 'row-reverse' : 'row' },
                              isSelected && styles.dropdownMenuItemActive,
                            ]}
                          >
                            <AppText variant="captionBold" color={isSelected ? '#2563EB' : '#334155'} style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                              {getSeverityLabel(sev, isRTL)}
                            </AppText>
                            {isSelected && <Icon name="check" size={14} color="#2563EB" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>

                {/* الإجراء المتخذ (Action Taken) */}
                <View style={{ flex: 1, zIndex: 40 }}>
                  <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'الإجراء المتخذ' : 'Action Taken'}
                  </AppText>
                  <TouchableOpacity
                    style={[styles.webSelectBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => {
                      setShowActionDropdown(v => !v);
                      setShowSeverityDropdown(false);
                      setShowClassDropdown(false);
                      setShowRuleDropdown(false);
                      setShowStatusDropdown(false);
                      setShowStudentDropdown(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <AppText
                      variant="caption"
                      color={actionInput ? '#0F172A' : '#94A3B8'}
                      style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}
                    >
                      {actionInput || (isRTL ? '- اختر -' : '- Select -')}
                    </AppText>
                    <Icon name={showActionDropdown ? 'chevronUp' : 'chevronDown'} size={14} color="#94A3B8" />
                  </TouchableOpacity>

                  {/* Action Taken Dropdown Menu */}
                  {showActionDropdown && (
                    <View style={styles.dropdownMenu}>
                      {(isRTL
                        ? ['إنذار شفاهي', 'تعهد خطي', 'إبلاغ ولي الأمر', 'استدعاء ولي الأمر', 'إحالة للمرشد']
                        : ['Verbal Warning', 'Written Undertaking', 'Parent Notification', 'Parent Meeting', 'Counselor Referral']
                      ).map(act => {
                        const isSelected = actionInput === act;
                        return (
                          <TouchableOpacity
                            key={act}
                            onPress={() => {
                              setActionInput(act);
                              setShowActionDropdown(false);
                            }}
                            activeOpacity={0.7}
                            style={[
                              styles.dropdownMenuItem,
                              { flexDirection: isRTL ? 'row-reverse' : 'row' },
                              isSelected && styles.dropdownMenuItemActive,
                            ]}
                          >
                            <AppText variant="captionBold" color={isSelected ? '#2563EB' : '#334155'} style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                              {act}
                            </AppText>
                            {isSelected && <Icon name="check" size={14} color="#2563EB" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>

              {/* 5. Responsive Row: التاريخ (Date) + الحالة (Status) */}
              <View style={[styles.formRow, { flexDirection: isSmallScreen ? 'column' : (isRTL ? 'row-reverse' : 'row') }]}>
                {/* التاريخ (Date) */}
                <View style={{ flex: 1, zIndex: 30 }}>
                  <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'التاريخ' : 'Date'}
                  </AppText>
                  <View style={[styles.webSelectBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <AppText variant="caption" color="#0F172A" style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                      {formattedDateDisplay}
                    </AppText>
                    <Icon name="calendar" size={14} color="#94A3B8" />
                  </View>
                </View>

                {/* الحالة (Status) */}
                <View style={{ flex: 1, zIndex: 30 }}>
                  <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                    {isRTL ? 'الحالة' : 'Status'}
                  </AppText>
                  <TouchableOpacity
                    style={[styles.webSelectBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => {
                      setShowStatusDropdown(v => !v);
                      setShowActionDropdown(false);
                      setShowSeverityDropdown(false);
                      setShowClassDropdown(false);
                      setShowRuleDropdown(false);
                      setShowStudentDropdown(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <AppText
                      variant="captionBold"
                      color="#0F172A"
                      style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}
                    >
                      {statusInput === 'open' ? (isRTL ? 'مفتوحة' : 'Open') : statusInput === 'in_progress' ? (isRTL ? 'جارٍ' : 'In Progress') : (isRTL ? 'مغلقة' : 'Closed')}
                    </AppText>
                    <Icon name={showStatusDropdown ? 'chevronUp' : 'chevronDown'} size={14} color="#94A3B8" />
                  </TouchableOpacity>

                  {/* Status Dropdown Menu */}
                  {showStatusDropdown && (
                    <View style={styles.dropdownMenu}>
                      {[
                        { key: 'open', label: isRTL ? 'مفتوحة' : 'Open' },
                        { key: 'in_progress', label: isRTL ? 'جارٍ' : 'In Progress' },
                        { key: 'closed', label: isRTL ? 'مغلقة' : 'Closed' },
                      ].map(s => {
                        const isSelected = statusInput === s.key;
                        return (
                          <TouchableOpacity
                            key={s.key}
                            onPress={() => {
                              setStatusInput(s.key);
                              setShowStatusDropdown(false);
                            }}
                            activeOpacity={0.7}
                            style={[
                              styles.dropdownMenuItem,
                              { flexDirection: isRTL ? 'row-reverse' : 'row' },
                              isSelected && styles.dropdownMenuItemActive,
                            ]}
                          >
                            <AppText variant="captionBold" color={isSelected ? '#2563EB' : '#334155'} style={{ flex: 1, textAlign: isRTL ? 'right' : 'left' }}>
                              {s.label}
                            </AppText>
                            {isSelected && <Icon name="check" size={14} color="#2563EB" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              </View>

              {/* 6. ملاحظات (Notes) */}
              <View style={styles.formGroup}>
                <AppText variant="captionBold" color="#334155" style={[styles.formLabel, { textAlign: isRTL ? 'right' : 'left' }]}>
                  {isRTL ? 'ملاحظات' : 'Notes'}
                </AppText>
                <TextInput
                  style={[styles.webInput, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={isRTL ? 'ملاحظات إضافية...' : 'Additional notes...'}
                  placeholderTextColor="#94A3B8"
                  value={notesInput}
                  onChangeText={setNotesInput}
                />
              </View>

              {/* 7. Guardian Notified Card Box */}
              <TouchableOpacity
                style={[styles.webNotificationBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => setParentNotified(v => !v)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkbox, parentNotified && styles.checkboxActive]}>
                  {parentNotified && <Icon name="check" size={12} color="#FFFFFF" />}
                </View>
                <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                  <AppText variant="captionBold" color="#334155" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                    {isRTL ? 'تسجيل أن ولي الأمر أُبلغ مسبقاً' : 'Mark that guardian was notified in advance'}
                  </AppText>
                  <AppText variant="caption" color="#94A3B8" style={{ textAlign: isRTL ? 'right' : 'left', marginTop: 2 }}>
                    {isRTL ? 'لا يرسل رسالة – الإرسال من خلال الرسائل فقط يُحدث في التفاصيل' : 'Does not send SMS – messaging is recorded in details'}
                  </AppText>
                </View>
              </TouchableOpacity>
            </ScrollView>

            {/* Sticky Action Footer */}
            <View style={[styles.modalFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setCreateModalVisible(false)}
                activeOpacity={0.7}
              >
                <AppText variant="bodyBold" color="#64748B" style={{ fontSize: 14 }}>
                  {isRTL ? 'إلغاء' : 'Cancel'}
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtnFull}
                onPress={handleCreate}
                activeOpacity={0.85}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Icon name="clipboard" size={16} color="#FFFFFF" />
                    <AppText variant="bodyBold" color="#FFFFFF" style={{ fontSize: 14 }}>
                      {isRTL ? 'تسجيل المخالفة' : 'Log Incident'}
                    </AppText>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </View>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 20,
    zIndex: 99999,
  },
  modalBackdropTouch: {
    ...StyleSheet.absoluteFill,
  },
  modalSheet: {
    width: '94%',
    maxWidth: 560,
    height: '85%',
    maxHeight: 680,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
    zIndex: 100000,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  submitBtnFull: {
    flex: 1,
    backgroundColor: '#1246B7',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 46,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 46,
  },
  formGroup: {
    gap: 6,
  },
  formRow: {
    gap: 14,
  },
  formLabel: { fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 },
  formInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, fontSize: 13.5, color: '#0F172A' },
  formTextArea: { minHeight: 80, textAlignVertical: 'top' },
  searchInputBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, gap: 8 },
  selectBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 11, minHeight: 44 },
  quickPill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  quickPillActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  sevOption: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  sevDot: { width: 8, height: 8, borderRadius: 4 },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, paddingHorizontal: 4, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 2, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', marginTop: 2, backgroundColor: '#FFFFFF', flexShrink: 0 },
  checkboxActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  modalInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 44, fontSize: 13, color: '#0F172A', textAlignVertical: 'top' },
  severityRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  severityPill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionRow: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSuggestionsBox: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedStudentCard: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  selectedStudentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formInputClean: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 0,
    fontSize: 13.5,
    color: '#0F172A',
  },
  webSelectBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 42,
    fontSize: 13.5,
    color: '#0F172A',
  },
  webTextArea: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 88,
    fontSize: 13.5,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    marginTop: 4,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 9999,
  },
  dropdownMenuItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownMenuItemActive: {
    backgroundColor: '#EFF6FF',
  },
  webNotificationBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  clearStudentBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
});


