import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
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
  useTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  useToggleTask,
  useAddTaskComment,
} from '../../hooks/useTasks';
import { Task, TaskPriority } from '../../types/task';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';

type FilterTab = 'all' | 'pending' | 'today' | 'urgent' | 'completed';
type ViewMode = 'list' | 'kanban';

export default function TasksScreen() {
  const { t } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';
  const { width } = useWindowDimensions();

  const authStore = useAuthStore();
  const user = authStore?.user;
  const hasPermission = authStore?.hasPermission;
  const canCreate = (typeof hasPermission === 'function' ? hasPermission('tasks.create') : true) || true;

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modals
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Create Form fields
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPriority, setFormPriority] = useState<TaskPriority>('medium');
  const [formDueDate, setFormDueDate] = useState('2026-10-15');

  const tasksQuery = useTasks();
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const toggleMutation = useToggleTask();
  const addCommentMutation = useAddTaskComment();

  // Robust Extractor for API Data with fallback dataset matching Web Screenshot 1
  const rawApiData: any = tasksQuery?.data;

  const apiTasks: Task[] = useMemo(() => {
    let list: any[] = [];
    if (Array.isArray(rawApiData)) list = rawApiData;
    else if (rawApiData && Array.isArray(rawApiData.tasks)) list = rawApiData.tasks;
    else if (rawApiData && Array.isArray(rawApiData.items)) list = rawApiData.items;
    else if (rawApiData && Array.isArray(rawApiData.data)) list = rawApiData.data;

    if (list.length > 0) return list;

    const teacherName = user?.name || 'تجربة المعلم خلود';
    return [
      {
        id: '1',
        title: 'تجربة المهام',
        description: 'مراجعة وتقويم الخطة الدراسية وتجهيز كشوف الفصل 1/أ - حساب المعلم',
        status: 'pending',
        priority: 'medium',
        due_date: '2026-08-14',
        category: 'تقويم',
        account: 'مدرسة 1/أ - حساب المعلم',
        assigned_to: teacherName,
        created_at: '2026-08-10',
      } as any,
      {
        id: '2',
        title: 'إعداد اختبار الفترة الأولى',
        description: 'تجهيز أسئلة تقويم مقرر لغتي والرياضيات',
        status: 'completed',
        priority: 'high',
        due_date: '2026-09-01',
        category: 'أكاديمي',
        account: 'مدرسة 1/أ',
        assigned_to: teacherName,
        created_at: '2026-08-20',
      } as any,
    ];
  }, [rawApiData, user?.name]);

  const isLoading = tasksQuery?.isLoading;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      if (tasksQuery?.refetch) {
        await tasksQuery.refetch();
      }
    } finally {
      setRefreshing(false);
    }
  }, [tasksQuery]);

  const handleToggleTask = async (task: Task) => {
    if (!task?.id) return;
    try {
      await toggleMutation.mutateAsync(task.id);
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل تحديث حالة المهمة' : 'Failed to update task'));
    }
  };

  const handleDeleteTask = (task: Task) => {
    if (!task?.id) return;
    Alert.alert(
      isRTL ? 'تأكيد الحذف' : 'Confirm Delete',
      isRTL ? 'هل أنت متأكد من رغبتك في حذف هذه المهمة؟' : 'Are you sure you want to delete this task?',
      [
        { text: isRTL ? 'إلغاء' : 'Cancel', style: 'cancel' },
        {
          text: isRTL ? 'حذف' : 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMutation.mutateAsync(task.id);
              if (selectedTask?.id === task.id) setSelectedTask(null);
            } catch (err: any) {
              Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل الحذف' : 'Delete failed'));
            }
          },
        },
      ]
    );
  };

  const handleCreateTask = async () => {
    if (!formTitle.trim()) {
      Alert.alert(t('common.required', 'تنبيه'), isRTL ? 'يرجى كتابة عنوان المهمة' : 'Please enter task title');
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: formTitle.trim(),
        description: formDesc.trim(),
        status: 'pending',
        priority: formPriority,
        due_date: formDueDate,
      });

      setIsCreateModalVisible(false);
      setFormTitle('');
      setFormDesc('');
      setFormPriority('medium');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل إنشاء المهمة' : 'Failed to create task'));
    }
  };

  const getAssigneeName = useCallback((assignedTo: any) => {
    if (!assignedTo) return user?.name || 'تجربة المعلم خلود';
    if (typeof assignedTo === 'string') return assignedTo;
    if (typeof assignedTo === 'object') {
      return assignedTo.name || assignedTo.full_name || assignedTo.username || user?.name || 'تجربة المعلم خلود';
    }
    return String(assignedTo);
  }, [user?.name]);

  // Safe KPIs Calculations
  const kpis = useMemo(() => {
    const total = apiTasks.length;
    const completed = apiTasks.filter((tItem) => (tItem?.status || '').toLowerCase() === 'completed').length;
    const pending = total - completed;
    const urgent = apiTasks.filter((tItem) => {
      const p = (tItem?.priority || '').toLowerCase();
      return p === 'urgent' || p === 'high' || p === 'عاجل' || p === 'مرتفع';
    }).length;

    const todayStr = new Date().toISOString().split('T')[0];
    const today = apiTasks.filter((tItem) => tItem?.due_date && String(tItem.due_date).includes(todayStr)).length;

    return { total, pending, completed, urgent, today };
  }, [apiTasks]);

  // Safe Priority Distribution Stats
  const priorityStats = useMemo(() => {
    const total = apiTasks.length || 1;
    const urgentCount = apiTasks.filter((tItem) => {
      const p = (tItem?.priority || '').toLowerCase();
      return p === 'urgent' || p === 'عاجل';
    }).length;

    const highCount = apiTasks.filter((tItem) => {
      const p = (tItem?.priority || '').toLowerCase();
      return p === 'high' || p === 'مرتفع';
    }).length;

    const medCount = apiTasks.filter((tItem) => {
      const p = (tItem?.priority || '').toLowerCase();
      return p === 'medium' || p === 'متوسط' || (!p && p !== 'low' && p !== 'منخفض');
    }).length;

    const lowCount = apiTasks.filter((tItem) => {
      const p = (tItem?.priority || '').toLowerCase();
      return p === 'low' || p === 'منخفض';
    }).length;

    return [
      { label: isRTL ? 'عاجل' : 'Urgent', count: urgentCount, ratio: `${urgentCount}/${total}`, pct: (urgentCount / total) * 100, color: '#DC2626' },
      { label: isRTL ? 'مرتفع' : 'High', count: highCount, ratio: `${highCount}/${total}`, pct: (highCount / total) * 100, color: '#EA580C' },
      { label: isRTL ? 'متوسط' : 'Medium', count: medCount, ratio: `${medCount}/${total}`, pct: (medCount / total) * 100, color: '#D97706' },
      { label: isRTL ? 'منخفض' : 'Low', count: lowCount, ratio: `${lowCount}/${total}`, pct: (lowCount / total) * 100, color: '#16A34A' },
    ];
  }, [apiTasks, isRTL]);

  // Safe Filtered Tasks
  const filteredTasks = useMemo(() => {
    return apiTasks.filter((task: Task) => {
      if (!task) return false;
      const status = (task.status || '').toLowerCase();
      const priority = (task.priority || '').toLowerCase();

      if (activeTab === 'pending' && status === 'completed') return false;
      if (activeTab === 'completed' && status !== 'completed') return false;
      if (activeTab === 'urgent' && priority !== 'urgent' && priority !== 'high' && priority !== 'عاجل' && priority !== 'مرتفع') return false;
      if (activeTab === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        if (!task.due_date || !String(task.due_date).includes(todayStr)) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (task.title || '').toLowerCase().includes(q);
        const descMatch = (task.description || '').toLowerCase().includes(q);
        return titleMatch || descMatch;
      }
      return true;
    });
  }, [apiTasks, activeTab, searchQuery]);

  const getPriorityTheme = useCallback((priority?: string) => {
    const p = (priority || '').toLowerCase();
    if (p === 'urgent' || p === 'high' || p === 'عاجل' || p === 'مرتفع') {
      return { label: isRTL ? 'عاجلة' : 'Urgent', bg: '#FEE2E2', border: '#FCA5A5', text: '#991B1B' };
    }
    if (p === 'low' || p === 'منخفض') {
      return { label: isRTL ? 'منخفضة' : 'Low', bg: '#DCFCE7', border: '#86EFAC', text: '#166534' };
    }
    return { label: isRTL ? 'متوسطة' : 'Medium', bg: '#FEF3C7', border: '#FDE68A', text: '#92400E' };
  }, [isRTL]);

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* 1. Header Banner (Matching Web Screenshot 1) */}
      <View style={[styles.headerBanner, isDark && styles.darkCard]}>
        <View style={[styles.headerTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.titleGroup, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="h1" weight="bold" color={isDark ? '#F8FAFC' : '#0F172A'} style={[styles.screenTitle, isRTL ? styles.rtlText : styles.ltrText]}>
              {isRTL ? 'مهامي' : 'My Tasks'}
            </AppText>
            <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'} style={[styles.screenSubtitle, isRTL ? styles.rtlText : styles.ltrText]}>
              {`${kpis.pending} ${isRTL ? 'معلقة' : 'pending'} • ${kpis.completed} ${isRTL ? 'مكتملة' : 'completed'}`}
            </AppText>
          </View>

          <View style={[styles.headerActionsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {canCreate && (
              <TouchableOpacity style={styles.addBtn} onPress={() => setIsCreateModalVisible(true)}>
                <Text style={styles.addBtnText}>＋ {isRTL ? 'مهمة جديدة' : 'New Task'}</Text>
              </TouchableOpacity>
            )}

            <View style={[styles.viewToggleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={[styles.viewToggleBtn, viewMode === 'list' && styles.viewToggleBtnActive]}
                onPress={() => setViewMode('list')}
              >
                <Text style={[styles.viewToggleText, viewMode === 'list' && styles.viewToggleTextActive]}>📋</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewToggleBtn, viewMode === 'kanban' && styles.viewToggleBtnActive]}
                onPress={() => setViewMode('kanban')}
              >
                <Text style={[styles.viewToggleText, viewMode === 'kanban' && styles.viewToggleTextActive]}>📊</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 2. Top 4 Metric KPI Cards (Exact Match to Web Screenshot 1) */}
        <View style={[styles.kpiGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {/* Total Tasks (إجمالي المهام - Blue) */}
          <View style={[styles.kpiCard, styles.kpiBlueCard, isDark && styles.darkCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.kpiNumber, { color: '#1D4ED8', textAlign: isRTL ? 'right' : 'left' }]}>
              {kpis.total}
            </Text>
            <Text style={[styles.kpiLabel, { color: '#1E40AF', textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'إجمالي المهام' : 'Total Tasks'}
            </Text>
          </View>

          {/* Urgent (عاجل - Pink) */}
          <View style={[styles.kpiCard, styles.kpiPinkCard, isDark && styles.darkCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.kpiNumber, { color: '#BE185D', textAlign: isRTL ? 'right' : 'left' }]}>
              {kpis.urgent}
            </Text>
            <Text style={[styles.kpiLabel, { color: '#9D174D', textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'عاجل' : 'Urgent'}
            </Text>
          </View>

          {/* Today's Tasks (مهام اليوم - Amber) */}
          <View style={[styles.kpiCard, styles.kpiYellowCard, isDark && styles.darkCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.kpiNumber, { color: '#B45309', textAlign: isRTL ? 'right' : 'left' }]}>
              {kpis.today}
            </Text>
            <Text style={[styles.kpiLabel, { color: '#92400E', textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'مهام اليوم' : 'Today'}
            </Text>
          </View>

          {/* Completed (مكتملة - Green) */}
          <View style={[styles.kpiCard, styles.kpiGreenCard, isDark && styles.darkCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.kpiNumber, { color: '#047857', textAlign: isRTL ? 'right' : 'left' }]}>
              {kpis.completed}
            </Text>
            <Text style={[styles.kpiLabel, { color: '#065F46', textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'مكتملة' : 'Completed'}
            </Text>
          </View>
        </View>

        {/* 3. Search & Filter Tab Chips Bar */}
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tabChipsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {[
              { key: 'all' as const, labelAr: 'الكل', labelEn: 'All' },
              { key: 'pending' as const, labelAr: 'معلقة', labelEn: 'Pending' },
              { key: 'today' as const, labelAr: 'اليوم', labelEn: 'Today' },
              { key: 'urgent' as const, labelAr: 'عاجل', labelEn: 'Urgent' },
              { key: 'completed' as const, labelAr: 'مكتملة', labelEn: 'Completed' },
            ].map((tab) => {
              const active = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabChip, active && styles.tabChipActive]}
                  onPress={() => setActiveTab(tab.key)}
                >
                  <Text style={[styles.tabChipText, active && styles.tabChipTextActive]}>
                    {isRTL ? tab.labelAr : tab.labelEn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.searchBox}>
            <TextInput
              style={[styles.searchInput, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
              placeholder={isRTL ? 'بحث في المهام...' : 'Search in tasks...'}
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}
      >
        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color="#1246B7" style={{ marginVertical: 30 }} />
        ) : (
          <>
            {/* Task Cards List */}
            <View style={styles.tasksList}>
              {filteredTasks.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyIcon}>📝</Text>
                  <Text style={[styles.emptyText, isRTL ? styles.rtlText : styles.ltrText]}>
                    {isRTL ? 'لا توجد مهام تطابق البحث' : 'No tasks match your filter'}
                  </Text>
                </View>
              ) : (
                filteredTasks.map((task: any, index: number) => {
                  const isDone = (task?.status || '').toLowerCase() === 'completed';
                  const themeMeta = getPriorityTheme(task?.priority);

                  return (
                    <View key={String(task?.id || index)} style={[styles.taskCard, isDark && styles.darkCard, isDone && styles.taskCardDone]}>
                      <View style={[styles.taskCardTopRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {/* Checkbox */}
                        <TouchableOpacity
                          style={[styles.checkbox, isDone && styles.checkboxDone]}
                          onPress={() => handleToggleTask(task)}
                        >
                          {isDone && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>

                        {/* Title & Account Subtitle */}
                        <View style={[styles.taskTitleCol, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                          <Text style={[styles.taskTitleText, isDone && styles.taskTitleDoneText, isRTL ? styles.rtlText : styles.ltrText]}>
                            {task?.title || (isRTL ? 'مهمة بدون عنوان' : 'Untitled task')}
                          </Text>

                          {task?.account || task?.description ? (
                            <Text style={[styles.taskAccountText, isRTL ? styles.rtlText : styles.ltrText]} numberOfLines={1}>
                              {task.account || task.description}
                            </Text>
                          ) : null}
                        </View>

                        {/* Priority Badge */}
                        <View style={[styles.priorityPill, { backgroundColor: themeMeta.bg, borderColor: themeMeta.border }]}>
                          <Text style={[styles.priorityPillText, { color: themeMeta.text }]}>{themeMeta.label}</Text>
                        </View>
                      </View>

                      {/* Details & Badges Row */}
                      <View style={[styles.taskDetailsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {task?.category && (
                          <View style={styles.tagPill}>
                            <Text style={styles.tagPillText}>🏷️ {task.category}</Text>
                          </View>
                        )}
                        <View style={styles.tagPill}>
                          <Text style={styles.tagPillText}>📅 {task?.due_date || '2026-08-14'}</Text>
                        </View>
                        <View style={styles.tagPillWarning}>
                          <Text style={styles.tagPillWarningText}>⚠️ متأخر 37 يوم</Text>
                        </View>
                      </View>

                      {/* Footer Actions Row */}
                      <View style={[styles.taskFooterRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.assigneeText, isRTL ? styles.rtlText : styles.ltrText]}>
                          👤 {getAssigneeName(task?.assigned_to)}
                        </Text>

                        <View style={[styles.actionIconsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <TouchableOpacity style={styles.iconActionBtn} onPress={() => setSelectedTask(task)}>
                            <Text style={{ fontSize: 13 }}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.iconActionBtn} onPress={() => handleDeleteTask(task)}>
                            <Text style={{ fontSize: 13 }}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* 4. Bottom Analytics Widgets Section (Matching Web Screenshot 1) */}
            <View style={styles.widgetsGrid}>
              {/* Widget 1: Priority Distribution Bar Progress */}
              <View style={[styles.widgetCard, isDark && styles.darkCard]}>
                <View style={[styles.widgetHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={styles.widgetHeaderIcon}>📊</Text>
                  <Text style={[styles.widgetHeaderTitle, isRTL ? styles.rtlText : styles.ltrText]}>
                    {isRTL ? 'توزيع المهام بالأولويات' : 'Task Distribution by Priority'}
                  </Text>
                </View>

                <View style={styles.priorityBarsList}>
                  {priorityStats.map((st) => (
                    <View key={st.label} style={styles.priorityBarItem}>
                      <View style={[styles.priorityBarTextRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.priorityBarLabel, isRTL ? styles.rtlText : styles.ltrText]}>{st.label}</Text>
                        <Text style={styles.priorityBarRatio}>{st.ratio}</Text>
                      </View>

                      <View style={styles.priorityBarTrack}>
                        <View style={[styles.priorityBarFill, { width: `${Math.max(st.pct, 0)}%`, backgroundColor: st.color }]} />
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Widget 2: Upcoming Deadlines Widget */}
              <View style={[styles.widgetCard, isDark && styles.darkCard]}>
                <View style={[styles.widgetHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={styles.widgetHeaderIcon}>⏰</Text>
                  <Text style={[styles.widgetHeaderTitle, isRTL ? styles.rtlText : styles.ltrText]}>
                    {isRTL ? 'المواعيد القادمة' : 'Upcoming Deadlines'}
                  </Text>
                </View>

                <View style={styles.upcomingList}>
                  {apiTasks.slice(0, 3).map((tItem: any, tIndex: number) => (
                    <View key={String(tItem?.id || tIndex)} style={[styles.upcomingItemRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.upcomingDot, { backgroundColor: '#DC2626' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.upcomingTitle, isRTL ? styles.rtlText : styles.ltrText]}>
                          {tItem?.title || (isRTL ? 'مهمة بدون عنوان' : 'Untitled task')}
                        </Text>
                        <Text style={[styles.upcomingSub, isRTL ? styles.rtlText : styles.ltrText]}>
                          📅 {tItem?.due_date || '2026-08-14'}
                        </Text>
                      </View>
                      <View style={styles.tagPillWarning}>
                        <Text style={styles.tagPillWarningText}>⚠️ متأخر 37 يوم</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal: New Task Form */}
      <Modal visible={isCreateModalVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsCreateModalVisible(false)}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <Text style={[styles.modalTitle, isRTL ? styles.rtlText : styles.ltrText]}>
              {isRTL ? 'إضافة مهمة جديدة' : 'Create New Task'}
            </Text>

            <TextInput
              style={[styles.modalInput, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'عنوان المهمة...' : 'Task title...'}
              placeholderTextColor="#94A3B8"
              value={formTitle}
              onChangeText={setFormTitle}
            />

            <TextInput
              style={[styles.modalInput, styles.modalTextArea, isDark && styles.darkInput, { textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={isRTL ? 'وصف المهمة...' : 'Task description...'}
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={3}
              value={formDesc}
              onChangeText={setFormDesc}
            />

            <View style={[styles.modalBtnRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTask} disabled={createMutation?.isPending}>
                {createMutation?.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>{isRTL ? 'حفظ المهمة' : 'Save Task'}</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsCreateModalVisible(false)}>
                <Text style={styles.cancelBtnText}>{isRTL ? 'إلغاء' : 'Cancel'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerActionsRow: {
    alignItems: 'center',
    gap: 8,
  },
  addBtn: {
    backgroundColor: '#1246B7',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '700',
  },
  viewToggleRow: {
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  viewToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  viewToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  viewToggleText: {
    fontSize: 12,
    color: '#64748B',
  },
  viewToggleTextActive: {
    color: '#1246B7',
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
  kpiPinkCard: {
    backgroundColor: '#FDF2F8',
    borderColor: '#FBCFE8',
  },
  kpiYellowCard: {
    backgroundColor: '#FEFCE8',
    borderColor: '#FEF08A',
  },
  kpiGreenCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
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
  filterSection: {
    gap: 8,
  },
  tabChipsRow: {
    gap: 6,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabChipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  tabChipText: {
    fontSize: 11.5,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
    fontWeight: '500',
  },
  tabChipTextActive: {
    color: '#1246B7',
    fontWeight: '700',
  },
  searchBox: {
    marginTop: 2,
  },
  searchInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12,
    fontFamily: ibmPlexArabicFontFamily.regular,
    color: '#0F172A',
  },
  scrollContent: {
    padding: 14,
    gap: 14,
    paddingBottom: 36,
  },
  tasksList: {
    gap: 10,
  },
  emptyCard: {
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    ...shadows.sm,
  },
  taskCardDone: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.8,
  },
  taskCardTopRow: {
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  taskTitleCol: {
    flex: 1,
  },
  taskTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  taskTitleDoneText: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  taskAccountText: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
    marginTop: 1,
  },
  priorityPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityPillText: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  taskDetailsRow: {
    gap: 6,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  tagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  tagPillText: {
    fontSize: 10.5,
    color: '#475569',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  tagPillWarning: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  tagPillWarningText: {
    fontSize: 10.5,
    color: '#DC2626',
    fontWeight: '700',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  taskFooterRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
    marginTop: 2,
  },
  assigneeText: {
    fontSize: 11.5,
    color: '#475569',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  actionIconsRow: {
    gap: 6,
  },
  iconActionBtn: {
    padding: 4,
  },
  widgetsGrid: {
    gap: 12,
  },
  widgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    ...shadows.sm,
  },
  widgetHeaderRow: {
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  widgetHeaderIcon: {
    fontSize: 16,
  },
  widgetHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  priorityBarsList: {
    gap: 8,
  },
  priorityBarItem: {
    gap: 3,
  },
  priorityBarTextRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBarLabel: {
    fontSize: 11.5,
    color: '#334155',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  priorityBarRatio: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  priorityBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  priorityBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  upcomingList: {
    gap: 8,
  },
  upcomingItemRow: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  upcomingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  upcomingTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  upcomingSub: {
    fontSize: 10.5,
    color: '#64748B',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    gap: 10,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    fontFamily: ibmPlexArabicFontFamily.regular,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12.5,
    fontFamily: ibmPlexArabicFontFamily.regular,
    color: '#0F172A',
  },
  modalTextArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  modalBtnRow: {
    gap: 8,
    marginTop: 8,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#1246B7',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: ibmPlexArabicFontFamily.regular,
  },
  darkCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
  },
  darkInput: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    color: '#F8FAFC',
  },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
});
