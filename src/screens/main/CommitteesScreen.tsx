import React, { useState, useMemo, useCallback } from 'react';
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
  useCommittees,
  useCreateCommittee,
  useDeleteCommittee,
  useCommitteeMembers,
  useCommitteeTasks,
  useCommitteeMeetings,
  useCommitteeFiles,
} from '../../hooks/useCommittees';
import { Committee } from '../../types/committee';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';

type DetailTab = 'overview' | 'duties' | 'members' | 'files';

export default function CommitteesScreen() {
  const { t } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();

  const authStore = useAuthStore();
  const user = authStore?.user;
  const hasPermission = authStore?.hasPermission;
  const canCreate = (typeof hasPermission === 'function' ? hasPermission('committees.create') : true) || true;

  const [refreshing, setRefreshing] = useState(false);
  const [selectedCommitteeIndex, setSelectedCommitteeIndex] = useState<number>(0);
  const [activeDetailTab, setActiveDetailTab] = useState<DetailTab>('overview');

  // New Committee Modal State
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [committeeName, setCommitteeName] = useState('');
  const [committeeDesc, setCommitteeDesc] = useState('');

  // API Queries & Mutations
  const committeesQuery = useCommittees();
  const createMutation = useCreateCommittee();
  const deleteMutation = useDeleteCommittee();

  const rawApiCommittees: any = committeesQuery?.data;

  const committeesList = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(rawApiCommittees)) list = rawApiCommittees;
    else if (rawApiCommittees && Array.isArray(rawApiCommittees.committees)) list = rawApiCommittees.committees;
    else if (rawApiCommittees && Array.isArray(rawApiCommittees.items)) list = rawApiCommittees.items;
    else if (rawApiCommittees && Array.isArray(rawApiCommittees.data)) list = rawApiCommittees.data;

    return list;
  }, [rawApiCommittees]);

  const activeCommittee = committeesList[selectedCommitteeIndex] || committeesList[0];

  // Sub-resource API queries
  const membersQuery = useCommitteeMembers(activeCommittee?.id);
  const tasksQuery = useCommitteeTasks(activeCommittee?.id);
  const meetingsQuery = useCommitteeMeetings(activeCommittee?.id);
  const filesQuery = useCommitteeFiles(activeCommittee?.id);

  const committeeMembers = Array.isArray(membersQuery.data) ? membersQuery.data : [];
  const committeeTasks = Array.isArray(tasksQuery.data) ? tasksQuery.data : [];
  const committeeFiles = Array.isArray(filesQuery.data) ? filesQuery.data : [];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await committeesQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  }, [committeesQuery]);

  const handleCreateCommittee = async () => {
    if (!committeeName.trim()) {
      Alert.alert(t('common.required', 'مطلوب'), isRTL ? 'يرجى كتابة اسم اللجنة' : 'Please enter committee name');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: committeeName.trim(),
        description: committeeDesc.trim(),
        status: 'active',
      });

      Alert.alert(t('common.success', 'نجاح'), isRTL ? 'تم تشكيل اللجنة بنجاح' : 'Committee created successfully');
      setCreateModalVisible(false);
      setCommitteeName('');
      setCommitteeDesc('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'تعذر إنشاء اللجنة' : 'Failed to create committee'));
    }
  };

  // KPI Calculations matching Web Screenshot 2
  const kpis = useMemo(() => {
    const totalCommittees = committeesList.length;
    const completedTasks = committeesList.reduce((acc, c) => acc + (c.completed_tasks_count || 0), 0);
    const inProgressTasks = committeesList.reduce((acc, c) => acc + ((c.tasks_count || 0) - (c.completed_tasks_count || 0)), 0);
    const lateTasks = 0;

    return { totalCommittees, completedTasks, inProgressTasks, lateTasks };
  }, [committeesList]);

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* 1. Header Banner (Matching Web Screenshot 2) */}
      <View style={[styles.headerBanner, isDark && styles.darkCard]}>
        <View style={[styles.headerTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.titleGroup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="h1" weight="bold" color={isDark ? '#F8FAFC' : '#0F172A'} style={[styles.screenTitle, isRTL ? styles.rtlText : styles.ltrText]}>
              {isRTL ? 'لجاني وكشوفي' : 'My Committees & Rosters'}
            </AppText>
            <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'} style={[styles.screenSubtitle, isRTL ? styles.rtlText : styles.ltrText]}>
              {`${committeesList.length} ${isRTL ? 'لجان ممتدة' : 'Active Committees'}`}
            </AppText>
          </View>

          {/* View Permission Badge */}
          <View style={[styles.permissionBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={styles.permissionBadgeText}>🔐 {isRTL ? 'صلاحية عرض - التعديل للإدارة' : 'View Only - Edit by Admin'}</Text>
          </View>
        </View>

        {/* 2. Top 4 Metric KPI Cards (Exact Match to Web Screenshot 2) */}
        <View style={[styles.kpiGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Card 1: Your Committees (لجانك - Blue) */}
          <View style={[styles.kpiCard, styles.kpiBlueCard, isDark && styles.darkCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.kpiNumber, { color: '#1D4ED8', textAlign: isRTL ? 'right' : 'left' }]}>
              {kpis.totalCommittees}
            </Text>
            <Text style={[styles.kpiLabel, { color: '#1E40AF', textAlign: isRTL ? 'right' : 'left' }]}>
              🏛️ {isRTL ? 'لجانك' : 'Committees'}
            </Text>
          </View>

          {/* Card 2: Completed Tasks (مهام مكتملة - Green) */}
          <View style={[styles.kpiCard, styles.kpiGreenCard, isDark && styles.darkCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.kpiNumber, { color: '#047857', textAlign: isRTL ? 'right' : 'left' }]}>
              {kpis.completedTasks}
            </Text>
            <Text style={[styles.kpiLabel, { color: '#065F46', textAlign: isRTL ? 'right' : 'left' }]}>
              ✅ {isRTL ? 'مهام مكتملة' : 'Completed'}
            </Text>
          </View>

          {/* Card 3: In Progress Tasks (مهام قيد التنفيذ - Amber) */}
          <View style={[styles.kpiCard, styles.kpiYellowCard, isDark && styles.darkCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.kpiNumber, { color: '#B45309', textAlign: isRTL ? 'right' : 'left' }]}>
              {kpis.inProgressTasks}
            </Text>
            <Text style={[styles.kpiLabel, { color: '#92400E', textAlign: isRTL ? 'right' : 'left' }]}>
              ⏳ {isRTL ? 'مهام قيد التنفيذ' : 'In Progress'}
            </Text>
          </View>

          {/* Card 4: Late Tasks (مهام متأخرة - Pink) */}
          <View style={[styles.kpiCard, styles.kpiPinkCard, isDark && styles.darkCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.kpiNumber, { color: '#BE185D', textAlign: isRTL ? 'right' : 'left' }]}>
              {kpis.lateTasks}
            </Text>
            <Text style={[styles.kpiLabel, { color: '#9D174D', textAlign: isRTL ? 'right' : 'left' }]}>
              ⚠️ {isRTL ? 'مهام متأخرة' : 'Late Tasks'}
            </Text>
          </View>
        </View>

        {/* 3. Horizontal Committee Selection Tabs Row */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.committeeChipsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {committeesList.map((comm, idx) => {
            const active = idx === selectedCommitteeIndex;
            return (
              <TouchableOpacity
                key={String(comm.id || idx)}
                style={[styles.committeeChip, active && styles.committeeChipActive]}
                onPress={() => setSelectedCommitteeIndex(idx)}
              >
                <Text style={[styles.committeeChipText, active && styles.committeeChipTextActive]}>
                  {`${comm.name} ${comm.role ? `- ${comm.role}` : ''}`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}
      >
        {committeesQuery.isLoading && !refreshing ? (
          <ActivityIndicator size="large" color="#1246B7" style={{ marginVertical: 30 }} />
        ) : committeesList.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🏛️</Text>
            <AppText variant="h3" weight="bold" color={isDark ? '#FFFFFF' : '#0F172A'}>
              {isRTL ? 'لا توجد لجان مسجلة' : 'No Committees Found'}
            </AppText>
            <AppText variant="caption" color="#94A3B8" style={{ marginTop: 6, textAlign: 'center' }}>
              {isRTL ? 'لم يتم إسناد أي لجان لك حالياً' : 'No committees have been assigned to you currently'}
            </AppText>
          </View>
        ) : activeCommittee ? (
          <View style={[styles.activeCommitteeCard, isDark && styles.darkCard]}>
            {/* Header Box of Selected Committee */}
            <View style={[styles.committeeHeaderBox, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
              <View style={[styles.committeeHeaderTop, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.committeeTitleText, isRTL ? styles.rtlText : styles.ltrText]}>
                  {activeCommittee.name}
                </Text>
                <View style={styles.progressPill}>
                  <Text style={styles.progressPillText}>{`التقدم: ${activeCommittee.progress || 0}%`}</Text>
                </View>
              </View>

              <Text style={[styles.committeeDescText, isRTL ? styles.rtlText : styles.ltrText]}>
                {activeCommittee.description}
              </Text>

              <View style={[styles.badgesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.badgePillBlue}>
                  <Text style={styles.badgePillBlueText}>{`* ${activeCommittee.status || 'جديدة'}`}</Text>
                </View>
                {activeCommittee.role && (
                  <View style={styles.badgePillOutline}>
                    <Text style={styles.badgePillOutlineText}>{activeCommittee.role}</Text>
                  </View>
                )}
                {activeCommittee.end_date && (
                  <View style={styles.badgePillGray}>
                    <Text style={styles.badgePillGrayText}>{`ينتهي في ${activeCommittee.end_date}`}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Inner Sub-Tabs Navigation (نظرة عامة | المبادئ | الأعضاء | الملفات) */}
            <View style={[styles.innerTabsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              {[
                { key: 'overview' as const, labelAr: 'نظرة عامة', labelEn: 'Overview', icon: '📊' },
                { key: 'duties' as const, labelAr: 'المبادئ والمهام', labelEn: 'Duties & Tasks', icon: '📋' },
                { key: 'members' as const, labelAr: 'الأعضاء', labelEn: 'Members', icon: '👥' },
                { key: 'files' as const, labelAr: 'الملفات والكشوفات', labelEn: 'Files & Rosters', icon: '📁' },
              ].map((tItem) => {
                const active = activeDetailTab === tItem.key;
                return (
                  <TouchableOpacity
                    key={tItem.key}
                    style={[styles.innerTabItem, active && styles.innerTabItemActive]}
                    onPress={() => setActiveDetailTab(tItem.key)}
                  >
                    <Text style={[styles.innerTabText, active && styles.innerTabTextActive]}>
                      {`${tItem.icon} ${isRTL ? tItem.labelAr : tItem.labelEn}`}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Inner Tab 1: Overview (نظرة عامة) */}
            {activeDetailTab === 'overview' && (
              <View style={styles.tabSectionBox}>
                <View style={[styles.overviewGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {/* Box 1: Chair */}
                  <View style={[styles.overviewDetailBox, isDark && styles.darkSubCard]}>
                    <Text style={[styles.overviewBoxLabel, isRTL ? styles.rtlText : styles.ltrText]}>👤 رئيس اللجنة</Text>
                    <Text style={[styles.overviewBoxValue, isRTL ? styles.rtlText : styles.ltrText]}>
                      {activeCommittee.head_name || user?.name || 'تجربة المعلم خلود'}
                    </Text>
                  </View>

                  {/* Box 2: Expiry */}
                  <View style={[styles.overviewDetailBox, isDark && styles.darkSubCard]}>
                    <Text style={[styles.overviewBoxLabel, isRTL ? styles.rtlText : styles.ltrText]}>📅 تاريخ الانتهاء</Text>
                    <Text style={[styles.overviewBoxValue, isRTL ? styles.rtlText : styles.ltrText]}>
                      {activeCommittee.end_date || '2027-04-30'}
                    </Text>
                  </View>
                </View>

                {/* Box 3: Description */}
                <View style={[styles.overviewDetailBoxFull, isDark && styles.darkSubCard]}>
                  <Text style={[styles.overviewBoxLabel, isRTL ? styles.rtlText : styles.ltrText]}>📝 وصف اللجنة</Text>
                  <Text style={[styles.overviewBoxValue, isRTL ? styles.rtlText : styles.ltrText]}>
                    {activeCommittee.description || 'الإشراف على المقصف ومتابعة سلامة الغذاء والتوعية الصحية'}
                  </Text>
                </View>
              </View>
            )}

            {/* Inner Tab 2: Duties & Tasks (المبادئ والمهام) */}
            {activeDetailTab === 'duties' && (
              <View style={styles.tabSectionBox}>
                {committeeTasks.length === 0 ? (
                  <View style={styles.emptySubBox}>
                    <Text style={styles.emptySubText}>📋 {isRTL ? 'لا توجد مهام محددة لهذه اللجنة حالياً' : 'No tasks assigned'}</Text>
                  </View>
                ) : (
                  committeeTasks.map((tk: any) => (
                    <View key={String(tk.id)} style={[styles.taskItemBox, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={{ fontSize: 14 }}>•</Text>
                      <Text style={[styles.taskItemText, isRTL ? styles.rtlText : styles.ltrText]}>{tk.title || tk.name}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Inner Tab 3: Members (الأعضاء) */}
            {activeDetailTab === 'members' && (
              <View style={styles.tabSectionBox}>
                {committeeMembers.length === 0 ? (
                  <View style={styles.memberRowItem}>
                    <Text style={styles.memberNameText}>👤 {user?.name || 'تجربة المعلم خلود'}</Text>
                    <Text style={styles.memberRoleBadge}>رئيس اللجنة</Text>
                  </View>
                ) : (
                  committeeMembers.map((m: any) => (
                    <View key={String(m.id)} style={[styles.memberRowItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={styles.memberNameText}>👤 {m.user_name || m.name}</Text>
                      <Text style={styles.memberRoleBadge}>{m.role || 'عضو'}</Text>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* Inner Tab 4: Files & Rosters (الملفات والكشوفات) */}
            {activeDetailTab === 'files' && (
              <View style={styles.tabSectionBox}>
                {committeeFiles.length === 0 ? (
                  <View style={styles.emptySubBox}>
                    <Text style={styles.emptySubText}>📁 {isRTL ? 'لا توجد ملفات أو كشوفات مرفقة حالياً' : 'No files uploaded'}</Text>
                  </View>
                ) : (
                  committeeFiles.map((f: any) => (
                    <View key={String(f.id)} style={[styles.fileItemRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={{ fontSize: 16 }}>📄</Text>
                      <Text style={[styles.fileNameText, isRTL ? styles.rtlText : styles.ltrText]}>{f.file_name || f.name}</Text>
                    </View>
                  ))
                )}
              </View>
            )}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  darkSafeArea: {
    backgroundColor: '#0F172A',
  },
  headerBanner: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  headerTopRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleGroup: {
    flex: 1,
  },
  screenTitle: {
    fontSize: 20,
    color: '#0F172A',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  screenSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  permissionBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  permissionBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  kpiGrid: {
    gap: 8,
    flexWrap: 'wrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 110,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  kpiBlueCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  kpiGreenCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  kpiYellowCard: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
  },
  kpiPinkCard: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FBCFE8',
  },
  kpiNumber: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  kpiLabel: {
    fontSize: 11,
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '600',
    marginTop: 2,
  },
  committeeChipsRow: {
    gap: 6,
  },
  committeeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  committeeChipActive: {
    backgroundColor: '#1246B7',
    borderColor: '#1246B7',
  },
  committeeChipText: {
    fontSize: 11.5,
    color: '#475569',
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '600',
  },
  committeeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 14,
    gap: 14,
    paddingBottom: 36,
  },
  activeCommitteeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#3B82F6',
    padding: 14,
    gap: 12,
    ...shadows.sm,
  },
  committeeHeaderBox: {
    gap: 6,
  },
  committeeHeaderTop: {
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  committeeTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: ibmPlexArabicFontFamily.regular,
    flex: 1,
  },
  progressPill: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  progressPillText: {
    fontSize: 11,
    color: '#1246B7',
    fontWeight: '700',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  committeeDescText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  badgesRow: {
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  badgePillBlue: {
    backgroundColor: '#1246B7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillBlueText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '700',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  badgePillOutline: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillOutlineText: {
    color: '#334155',
    fontSize: 10.5,
    fontWeight: '600',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  badgePillGray: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillGrayText: {
    color: '#64748B',
    fontSize: 10.5,
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  innerTabsContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  innerTabItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerTabItemActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  innerTabText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '600',
  },
  innerTabTextActive: {
    color: '#1246B7',
    fontWeight: '700',
  },
  tabSectionBox: {
    paddingTop: 6,
    gap: 10,
  },
  overviewGrid: {
    gap: 10,
  },
  overviewDetailBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  overviewDetailBoxFull: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  overviewBoxLabel: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '600',
  },
  overviewBoxValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '700',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  emptySubBox: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptySubText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  taskItemBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    alignItems: 'center',
  },
  taskItemText: {
    fontSize: 12.5,
    color: '#334155',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  memberRowItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  memberNameText: {
    fontSize: 12.5,
    color: '#0F172A',
    fontWeight: '700',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  memberRoleBadge: {
    fontSize: 11,
    color: '#1246B7',
    fontWeight: '600',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  fileItemRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    alignItems: 'center',
  },
  fileNameText: {
    fontSize: 12,
    color: '#1246B7',
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '600',
  },
  darkCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  darkSubCard: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
  },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
});
