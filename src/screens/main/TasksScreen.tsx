import React, { useState, useMemo } from 'react';
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
  Dimensions,
  Platform,
  RefreshControl,
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
import { Task, TaskPriority, TaskStatus } from '../../types/task';
import { AppText } from '../../components/common/AppText';
import { Icon } from '../../components/common/Icon';

const { width } = Dimensions.get('window');

type FilterTab = 'all' | 'in_progress' | 'completed';
type ViewMode = 'list' | 'kanban';

export default function TasksScreen() {
  const { t, i18n } = useTranslation();
  const { isRTL } = useAppDirection();
  const { theme } = useUiStore();
  const isDark = theme === 'dark';

  const hasPermission = useAuthStore((s) => s.hasPermission);
  const canCreate = hasPermission('tasks.create') || true;

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Create Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState('إدارية');
  const [newDueDateOption, setNewDueDateOption] = useState<'today' | 'tomorrow' | 'week' | 'custom'>('tomorrow');
  const [newCustomDueDate, setNewCustomDueDate] = useState('');
  const [newAssignee, setNewAssignee] = useState<any>(null);

  // Comments State
  const [newCommentText, setNewCommentText] = useState('');

  const tasksQuery = useTasks();
  const createMutation = useCreateTask();
  const updateMutation = useUpdateTask();
  const deleteMutation = useDeleteTask();
  const toggleMutation = useToggleTask();
  const addCommentMutation = useAddTaskComment();

  const apiTasks: Task[] = Array.isArray(tasksQuery.data) ? tasksQuery.data : [];
  const isLoading = tasksQuery.isLoading;
  const isError = tasksQuery.isError;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await tasksQuery.refetch();
    } finally {
      setRefreshing(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    try {
      await toggleMutation.mutateAsync(task.id);
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل تحديث حالة المهمة' : 'Failed to update task status'));
    }
  };

  const handleMoveTaskStatus = async (taskId: string | number, newStatus: string) => {
    await updateMutation.mutateAsync({ id: taskId, status: newStatus });
  };

  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      t('common.confirm', 'تأكيد الحذف'),
      isRTL ? 'هل أنت متأكد من رغبتك في حذف هذه المهمة؟' : 'Are you sure you want to delete this task?',
      [
        { text: t('common.cancel', 'إلغاء'), style: 'cancel' },
        {
          text: t('common.delete', 'حذف'),
          style: 'destructive',
          onPress: async () => {
            await deleteMutation.mutateAsync(task.id);
            if (selectedTask?.id === task.id) setSelectedTask(null);
          },
        },
      ]
    );
  };

  const handleCreateTask = async () => {
    if (!newTitle.trim()) {
      Alert.alert(t('common.error', 'تنبيه'), isRTL ? 'يرجى كتابة عنوان المهمة' : 'Please enter task title');
      return;
    }

    let calculatedDueDate = '2026-08-28';
    if (newDueDateOption === 'today') calculatedDueDate = '2026-08-27';
    if (newDueDateOption === 'tomorrow') calculatedDueDate = '2026-08-28';
    if (newDueDateOption === 'week') calculatedDueDate = '2026-09-03';
    if (newDueDateOption === 'custom' && newCustomDueDate.trim()) calculatedDueDate = newCustomDueDate.trim();

    try {
      await createMutation.mutateAsync({
        title: newTitle.trim(),
        description: newDescription.trim(),
        status: 'pending',
        priority: newPriority,
        due_date: calculatedDueDate,
      });

      setModalVisible(false);
      setNewTitle('');
      setNewDescription('');
      setNewPriority('medium');
      setNewDueDateOption('tomorrow');
      setNewCustomDueDate('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل إنشاء المهمة' : 'Failed to create task'));
    }
  };

  const handleAddComment = async () => {
    if (!selectedTask || !newCommentText.trim()) return;
    try {
      await addCommentMutation.mutateAsync({ id: selectedTask.id, content: newCommentText.trim() });
      setNewCommentText('');
    } catch (err: any) {
      Alert.alert(t('common.error', 'خطأ'), err?.message || (isRTL ? 'فشل إضافة التعليق' : 'Failed to add comment'));
    }
  };

  const filteredTasks = useMemo(() => {
    return apiTasks.filter((task: Task) => {
      if (activeTab === 'in_progress' && task.status === 'completed') return false;
      if (activeTab === 'completed' && task.status !== 'completed') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = task.title?.toLowerCase().includes(query);
        const descMatch = task.description?.toLowerCase().includes(query);
        const assigneeName = typeof task.assigned_to === 'object' ? task.assigned_to?.name : String(task.assigned_to || '');
        const assigneeMatch = assigneeName.toLowerCase().includes(query);
        return titleMatch || descMatch || assigneeMatch;
      }
      return true;
    });
  }, [apiTasks, activeTab, searchQuery]);

  const priorityMeta = (priority?: TaskPriority) => {
    switch (priority) {
      case 'urgent':
        return { label: isRTL ? 'عاجلة جداً' : 'Urgent', color: '#D92D20', bg: '#FEE4E2' };
      case 'high':
        return { label: isRTL ? 'عالية' : 'High', color: '#D92D20', bg: '#FEE4E2' };
      case 'low':
        return { label: isRTL ? 'منخفضة' : 'Low', color: '#0B7A55', bg: '#F1FAF5' };
      default:
        return { label: isRTL ? 'متوسطة' : 'Medium', color: '#FF8A00', bg: '#FFF8EC' };
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, isDark && styles.darkSafeArea]}>
      {/* Header */}
      <View style={[styles.header, isDark && styles.darkCard]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerTitleBlock, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <AppText variant="h1" weight="bold" style={[styles.title, { textAlign: isRTL ? 'right' : 'left' }]}>
              {t('navigation.tasks', 'المهام الإدارية والأكاديمية')}
            </AppText>
            <AppText variant="subtitle" color={isDark ? '#94A3B8' : '#77839B'} style={[styles.subtitle, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? 'متابعة وإسناد المهام للكوادر التعليمية' : 'Track and assign staff tasks'}
            </AppText>
          </View>

          {canCreate && (
            <TouchableOpacity style={styles.createButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.createButtonText}>＋ {isRTL ? 'مهمة جديدة' : 'New Task'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* View Mode & Filter Tabs */}
        <View style={[styles.controlsRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.tabsGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={[styles.tabChip, activeTab === 'all' && styles.tabChipActive]}
              onPress={() => setActiveTab('all')}
            >
              <Text style={[styles.tabChipText, activeTab === 'all' && styles.tabChipTextActive]}>
                {`${isRTL ? 'الكل' : 'All'} (${apiTasks.length})`}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabChip, activeTab === 'in_progress' && styles.tabChipActive]}
              onPress={() => setActiveTab('in_progress')}
            >
              <Text style={[styles.tabChipText, activeTab === 'in_progress' && styles.tabChipTextActive]}>
                {isRTL ? 'قيد التنفيذ' : 'In Progress'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabChip, activeTab === 'completed' && styles.tabChipActive]}
              onPress={() => setActiveTab('completed')}
            >
              <Text style={[styles.tabChipText, activeTab === 'completed' && styles.tabChipTextActive]}>
                {isRTL ? 'المكتملة' : 'Completed'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.viewSwitchGroup, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity
              style={[styles.viewSwitchBtn, viewMode === 'list' && styles.viewSwitchBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <Text style={viewMode === 'list' ? styles.viewSwitchTextActive : styles.viewSwitchText}>
                {isRTL ? '📋 قائمة' : '📋 List'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewSwitchBtn, viewMode === 'kanban' && styles.viewSwitchBtnActive]}
              onPress={() => setViewMode('kanban')}
            >
              <Text style={viewMode === 'kanban' ? styles.viewSwitchTextActive : styles.viewSwitchText}>
                {isRTL ? '📊 كانبان' : '📊 Kanban'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBarContainer}>
          <TextInput
            style={[styles.searchInput, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
            placeholder={isRTL ? 'ابحث بعنوان المهمة أو اسم المسؤول...' : 'Search task title or assignee...'}
            placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Main Task List / Kanban View */}
      {isLoading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#1246B7" />
          <AppText variant="body" color="#77839B" style={styles.loadingText}>
            {isRTL ? 'جارٍ تحميل المهام...' : 'Loading tasks...'}
          </AppText>
        </View>
      ) : isError ? (
        <View style={styles.centerContainer}>
          <Icon name="alertTriangle" size={32} color="#D92D20" />
          <AppText variant="bodyBold" color="#D92D20" style={styles.errorText}>
            {isRTL ? 'تعذر تحميل المهام' : 'Failed to load tasks'}
          </AppText>
          <TouchableOpacity style={styles.retryBtn} onPress={() => onRefresh()}>
            <Text style={styles.retryBtnText}>{t('common.retry', 'إعادة المحاولة')}</Text>
          </TouchableOpacity>
        </View>
      ) : viewMode === 'list' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#1246B7']} />}
        >
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task: Task) => {
              const meta = priorityMeta(task.priority);
              const isDone = task.status === 'completed';
              return (
                <TouchableOpacity
                  key={String(task.id)}
                  style={[styles.taskCard, isDark && styles.darkCard, isDone && styles.taskCardDone]}
                  onPress={() => setSelectedTask(task)}
                >
                  <View style={[styles.cardHeaderRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <TouchableOpacity
                      style={[styles.checkbox, isDone && styles.checkboxDone]}
                      onPress={() => handleToggleTask(task)}
                    >
                      {isDone && <Text style={styles.checkmark}>✓</Text>}
                    </TouchableOpacity>
                    <AppText
                      variant="cardTitle"
                      weight="bold"
                      style={[styles.taskTitle, isDone ? styles.taskTitleDone : undefined, { textAlign: isRTL ? 'right' : 'left' }]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </AppText>
                    <View style={[styles.priorityPill, { backgroundColor: meta.bg }]}>
                      <Text style={[styles.priorityPillText, { color: meta.color }]}>{meta.label}</Text>
                    </View>
                  </View>

                  {task.description ? (
                    <AppText
                      variant="body"
                      color={isDark ? '#94A3B8' : '#5A6784'}
                      numberOfLines={2}
                      style={[styles.taskDesc, { textAlign: isRTL ? 'right' : 'left' }]}
                    >
                      {task.description}
                    </AppText>
                  ) : null}

                  <View style={[styles.cardFooterRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <AppText variant="caption" color="#77839B" style={styles.footerInfoText}>
                      📅 {task.due_date || (isRTL ? 'بدون تاريخ' : 'No date')}
                    </AppText>
                    <AppText variant="caption" color="#77839B" style={styles.footerInfoText}>
                      👤 {typeof task.assigned_to === 'object' ? task.assigned_to?.name : task.assigned_to || (isRTL ? 'غير مسند' : 'Unassigned')}
                    </AppText>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="clipboard" size={40} color="#77839B" />
              <AppText variant="cardTitle" weight="bold" color="#0A1D3D" style={styles.emptyTitle}>
                {isRTL ? 'لا توجد مهام مطابقة' : 'No matching tasks'}
              </AppText>
              <AppText variant="caption" color="#77839B" style={styles.emptyDesc}>
                {isRTL ? 'يمكنك إضافة مهمة جديدة بالضغط على زر "مهمة جديدة"' : 'Create a new task by tapping "New Task"'}
              </AppText>
            </View>
          )}
        </ScrollView>
      ) : (
        /* Kanban View */
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.kanbanContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {(['pending', 'in_progress', 'completed'] as TaskStatus[]).map((colStatus) => {
            const colTasks = apiTasks.filter((t: Task) => t.status === colStatus);
            const colTitle =
              colStatus === 'pending'
                ? isRTL ? 'قيد الانتظار' : 'Pending'
                : colStatus === 'in_progress'
                ? isRTL ? 'قيد التنفيذ' : 'In Progress'
                : isRTL ? 'مكتملة' : 'Completed';

            return (
              <View key={colStatus} style={[styles.kanbanColumn, isDark && styles.darkCard]}>
                <View style={[styles.kanbanColumnHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <AppText variant="cardTitle" weight="bold" style={styles.columnTitle}>
                    {colTitle}
                  </AppText>
                  <AppText variant="captionBold" color="#1246B7">
                    {String(colTasks.length)}
                  </AppText>
                </View>

                <ScrollView style={styles.columnScroll} showsVerticalScrollIndicator={false}>
                  {colTasks.map((t: Task) => (
                    <TouchableOpacity
                      key={String(t.id)}
                      style={[styles.kanbanCard, isDark && styles.darkSubCard, t.status === 'completed' && styles.kanbanCardDone]}
                      onPress={() => setSelectedTask(t)}
                    >
                      <AppText variant="bodyBold" numberOfLines={2} style={[styles.kanbanCardTitle, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t.title}
                      </AppText>
                      <AppText variant="caption" color="#77839B" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                        👤 {typeof t.assigned_to === 'object' ? t.assigned_to?.name : t.assigned_to || (isRTL ? 'غير مسند' : 'Unassigned')}
                      </AppText>
                      <TouchableOpacity
                        style={[styles.moveBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                        onPress={() => {
                          const nextStatus =
                            t.status === 'pending'
                              ? 'in_progress'
                              : t.status === 'in_progress'
                              ? 'completed'
                              : 'pending';
                          handleMoveTaskStatus(t.id, nextStatus);
                        }}
                      >
                        <Text style={styles.moveBtnText}>
                          {isRTL ? 'نقل المرحلة ➔' : 'Move Stage ➔'}
                        </Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Task Details Modal */}
      <Modal visible={!!selectedTask} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, isDark && styles.darkCard]}>
            <View style={[styles.modalHeaderRow]}>
              <AppText variant="h2" weight="bold" style={styles.modalTaskTitle}>
                {selectedTask?.title}
              </AppText>
              <TouchableOpacity
                style={styles.deleteIconBtn}
                onPress={() => selectedTask && handleDeleteTask(selectedTask)}
              >
                <Text style={styles.deleteIconText}>🗑️</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalDetailsScroll} showsVerticalScrollIndicator={false}>
              {selectedTask?.description ? (
                <AppText variant="body" color="#344054" style={styles.modalDesc}>
                  {selectedTask.description}
                </AppText>
              ) : null}

              <View style={[styles.detailsMetaGrid, isDark && styles.darkSubCard]}>
                <AppText variant="caption" color="#77839B">
                  {`${isRTL ? 'تاريخ الاستحقاق' : 'Due Date'}: `}
                  <Text style={styles.metaValue}>{selectedTask?.due_date || '—'}</Text>
                </AppText>
                <AppText variant="caption" color="#77839B">
                  {`${isRTL ? 'المسؤول' : 'Assignee'}: `}
                  <Text style={styles.metaValue}>
                    {typeof selectedTask?.assigned_to === 'object'
                      ? selectedTask?.assigned_to?.name
                      : selectedTask?.assigned_to || (isRTL ? 'غير مسند' : 'Unassigned')}
                  </Text>
                </AppText>
                <AppText variant="caption" color="#77839B">
                  {`${isRTL ? 'الأولوية' : 'Priority'}: `}
                  <Text style={styles.metaValue}>{selectedTask?.priority || 'medium'}</Text>
                </AppText>
              </View>

              <AppText variant="cardTitle" weight="bold" style={styles.commentsSectionTitle}>
                {isRTL ? 'التعليقات والملاحظات' : 'Comments & Notes'}
              </AppText>

              {selectedTask?.comments && selectedTask.comments.length > 0 ? (
                selectedTask.comments.map((c: any, i: number) => (
                  <View key={i} style={[styles.commentItem, isDark && styles.darkSubCard]}>
                    <Text style={styles.commentUser}>{c.user_name || (isRTL ? 'مستخدم' : 'User')}</Text>
                    <Text style={styles.commentContent}>{c.content}</Text>
                  </View>
                ))
              ) : (
                <AppText variant="caption" color="#77839B" style={styles.noCommentsText}>
                  {isRTL ? 'لا توجد تعليقات بعد' : 'No comments yet'}
                </AppText>
              )}

              <View style={styles.addCommentBox}>
                <TextInput
                  style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
                  placeholder={isRTL ? 'أضف تعليقاً على المهمة...' : 'Add a comment...'}
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  value={newCommentText}
                  onChangeText={setNewCommentText}
                />
                <TouchableOpacity style={styles.sendCommentBtn} onPress={handleAddComment}>
                  <Text style={styles.sendCommentBtnText}>{isRTL ? 'إرسال التعليق' : 'Send Comment'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelectedTask(null)}>
              <Text style={styles.closeModalBtnText}>{t('common.close', 'إغلاق')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Create Task Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDark && styles.darkCard]}>
            <AppText variant="h2" weight="bold" style={styles.modalTitle}>
              {isRTL ? 'إسناد مهمة جديدة' : 'Assign New Task'}
            </AppText>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <AppText variant="label" style={styles.label}>
                {isRTL ? 'عنوان المهمة' : 'Task Title'} *
              </AppText>
              <TextInput
                style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText]}
                placeholder={isRTL ? 'مثال: إعداد خطة النشاط المدرسي' : 'e.g. Activity plan preparation'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={newTitle}
                onChangeText={setNewTitle}
              />

              <AppText variant="label" style={[styles.label, { marginTop: 10 }]}>
                {isRTL ? 'الوصف والتفاصيل' : 'Description'}
              </AppText>
              <TextInput
                style={[styles.input, isDark && styles.darkInput, isRTL ? styles.rtlText : styles.ltrText, { height: 70 }]}
                placeholder={isRTL ? 'تفاصيل المهمة والمطلوب تنفيذه...' : 'Task details...'}
                placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                value={newDescription}
                onChangeText={setNewDescription}
                multiline
              />

              <AppText variant="label" style={[styles.label, { marginTop: 10 }]}>
                {isRTL ? 'الأولوية' : 'Priority'}
              </AppText>
              <View style={[styles.priorityOptionsRow]}>
                {(['low', 'medium', 'high', 'urgent'] as TaskPriority[]).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.pPill, newPriority === p && styles.pPillActive]}
                    onPress={() => setNewPriority(p)}
                  >
                    <Text style={newPriority === p ? styles.pPillTextActive : styles.pPillText}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <View style={styles.modalFooterActions}>
              <TouchableOpacity
                style={styles.saveSubmitBtn}
                onPress={handleCreateTask}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveSubmitBtnText}>{isRTL ? 'حفظ المهمة' : 'Save Task'}</Text>
                )}
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
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 10,
  },
  darkCard: { backgroundColor: '#0F244A', borderColor: '#1E3A6E' },
  darkSubCard: { backgroundColor: '#091A38', borderColor: '#1E3A6E' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitleBlock: { flex: 1 },
  title: { fontSize: 23, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  subtitle: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular, marginTop: 2 },
  createButton: { backgroundColor: '#1246B7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  createButtonText: { color: '#FFFFFF', fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tabsGroup: { flexDirection: 'row', gap: 6 },
  tabChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  tabChipActive: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  tabChipText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#5A6784', fontWeight: '600' },
  tabChipTextActive: { color: '#FFFFFF', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  viewSwitchGroup: { flexDirection: 'row', gap: 4, backgroundColor: '#F8FAFC', padding: 2, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  viewSwitchBtn: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  viewSwitchBtnActive: { backgroundColor: '#FFFFFF' },
  viewSwitchText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#5A6784' },
  viewSwitchTextActive: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold, color: '#1246B7', fontWeight: 'bold' },
  searchBarContainer: { marginTop: 4 },
  searchInput: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, backgroundColor: '#F8FAFC' },
  darkInput: { backgroundColor: '#091A38', borderColor: '#1E3A6E', color: '#F8FAFC' },
  scrollContent: { padding: 14, gap: 10 },
  taskCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', ...shadows.card },
  taskCardDone: { opacity: 0.65 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#D0D5DD', justifyContent: 'center', alignItems: 'center' },
  checkboxDone: { backgroundColor: '#0B7A55', borderColor: '#0B7A55' },
  checkmark: { color: '#fff', fontSize: 13, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  taskTitle: { flex: 1, fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold },
  taskTitleDone: { textDecorationLine: 'line-through', color: '#77839B' },
  priorityPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  priorityPillText: { fontSize: 12, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  taskDesc: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular, marginBottom: 8 },
  cardFooterRow: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderTopColor: '#F2F4F7', paddingTop: 8 },
  footerInfoText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.regular },
  kanbanContainer: { padding: 14, gap: 14 },
  kanbanColumn: { width: width * 0.75, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  kanbanColumnHeader: { marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#F2F4F7', justifyContent: 'space-between', alignItems: 'center' },
  columnTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold },
  columnScroll: { gap: 8 },
  kanbanCard: { backgroundColor: '#F8FAFC', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  kanbanCardDone: { backgroundColor: '#F1FAF5' },
  kanbanCardTitle: { fontSize: 15, fontFamily: ibmPlexArabicFontFamily.medium, marginBottom: 6 },
  moveBtn: { marginTop: 6, alignSelf: 'flex-start' },
  moveBtnText: { color: '#1246B7', fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, gap: 8 },
  loadingText: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular },
  errorText: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.regular, textAlign: 'center' },
  retryBtn: { backgroundColor: '#1246B7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 6 },
  retryBtnText: { color: '#FFFFFF', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', fontSize: 14 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, gap: 6 },
  emptyTitle: { fontSize: 17, fontFamily: ibmPlexArabicFontFamily.bold, marginTop: 6 },
  emptyDesc: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.regular, textAlign: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalSheet: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, maxHeight: '85%', gap: 10 },
  modalCard: { backgroundColor: '#FFFFFF', margin: 20, borderRadius: 16, padding: 20, gap: 10 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTaskTitle: { fontSize: 18.5, fontFamily: ibmPlexArabicFontFamily.bold, flex: 1 },
  deleteIconBtn: { padding: 4 },
  deleteIconText: { fontSize: 18 },
  modalDetailsScroll: { gap: 10, paddingBottom: 16 },
  modalDesc: { fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, lineHeight: 22 },
  detailsMetaGrid: { backgroundColor: '#F8FAFC', padding: 10, borderRadius: 8, gap: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  metaValue: { fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#0A1D3D', fontSize: 14.5 },
  commentsSectionTitle: { fontSize: 16, fontFamily: ibmPlexArabicFontFamily.bold, marginTop: 8 },
  commentItem: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 6, marginBottom: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  commentUser: { fontSize: 13, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', color: '#1246B7' },
  commentContent: { fontSize: 13.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#344054', marginTop: 2 },
  noCommentsText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.regular, fontStyle: 'italic' },
  addCommentBox: { marginTop: 8, gap: 6 },
  sendCommentBtn: { backgroundColor: '#1246B7', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  sendCommentBtnText: { color: '#fff', fontSize: 14, fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold' },
  closeModalBtn: { paddingVertical: 10, alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 8, marginTop: 6 },
  closeModalBtnText: { color: '#5A6784', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', fontSize: 14 },
  modalTitle: { fontSize: 18.5, fontFamily: ibmPlexArabicFontFamily.bold, textAlign: 'center' },
  label: { fontSize: 14, fontFamily: ibmPlexArabicFontFamily.semiBold, color: '#344054' },
  input: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 8, padding: 10, fontSize: 14.5, fontFamily: ibmPlexArabicFontFamily.regular, backgroundColor: '#F8FAFC' },
  priorityOptionsRow: { flexDirection: 'row', gap: 6 },
  pPill: { flex: 1, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', backgroundColor: '#F8FAFC' },
  pPillActive: { backgroundColor: '#1246B7', borderColor: '#1246B7' },
  pPillText: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.regular, color: '#5A6784' },
  pPillTextActive: { fontSize: 12.5, fontFamily: ibmPlexArabicFontFamily.bold, color: '#fff', fontWeight: 'bold' },
  modalFooterActions: { gap: 6, marginTop: 12 },
  saveSubmitBtn: { backgroundColor: '#1246B7', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  saveSubmitBtnText: { color: '#fff', fontFamily: ibmPlexArabicFontFamily.bold, fontWeight: 'bold', fontSize: 16 },
  cancelBtn: { paddingVertical: 8, alignItems: 'center' },
  cancelBtnText: { color: '#77839B', fontFamily: ibmPlexArabicFontFamily.semiBold, fontSize: 14 },
  ltrRow: { flexDirection: 'row' },
  rtlText: { textAlign: 'right' },
  ltrText: { textAlign: 'left' },
});
