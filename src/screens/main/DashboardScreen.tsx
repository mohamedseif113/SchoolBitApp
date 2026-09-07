import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useAppDirection } from '../../hooks/useAppDirection';
import { useAuthStore } from '../../store/auth.store';
import { useUiStore } from '../../store/uiStore';
import { useDashboard } from '../../hooks/useDashboard';
import { colors, withOpacity } from '../../theme/colors';
import { Icon } from '../../components/common/Icon';
import { AppText } from '../../components/common/AppText';
import { WebDashboardLayout } from '../../components/layout/WebDashboardLayout';
import { DashboardSkeleton } from '../../components/skeletons/PageSkeletons';
import TeacherDashboard from '../../components/dashboard/TeacherDashboard';
import CounselorDashboard from '../../components/dashboard/CounselorDashboard';
import ManagerDashboard from '../../components/dashboard/ManagerDashboard';
import StudentDashboard from '../../components/dashboard/StudentDashboard';
import ParentDashboard from '../../components/dashboard/ParentDashboard';

export default function DashboardScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const { user, school, role } = useAuthStore();
  const { theme } = useUiStore();
  const { isRTL } = useAppDirection();
  const isDark = theme === 'dark';

  // Role detection
  const normalizedRole = useMemo(() => {
    const r = (role || '').toLowerCase();
    if (r.includes('student') || r === 'طالب' || r === 'طالبة') return 'student';
    if (r.includes('parent') || r.includes('guardian') || r === 'ولي أمر' || r === 'ولي_أمر') return 'parent';
    if (r.includes('teacher') || r === 'معلم' || r === 'معلمة') return 'teacher';
    if (r.includes('counselor') || r.includes('guidance') || r === 'مرشد' || r === 'موجه') return 'counselor';
    if (r.includes('vice') || r === 'وكيل' || r === 'وكيلة') return 'vice_principal';
    return 'manager';
  }, [role]);

  // Dynamic role title for the top header subtitle
  const roleSubtitle = useMemo(() => {
    if (user?.role_title) return user.role_title;
    if (user?.role_name) return user.role_name;
    switch (normalizedRole) {
      case 'teacher':
        return isRTL ? 'معلم' : 'Teacher';
      case 'counselor':
        return isRTL ? 'المرشد الطلابي' : 'Student Counselor';
      case 'student':
        return isRTL ? 'طالب' : 'Student';
      case 'parent':
        return isRTL ? 'ولي أمر' : 'Parent / Guardian';
      case 'vice_principal':
        return isRTL ? 'وكيل المدرسة' : 'Vice Principal';
      case 'manager':
      default:
        return isRTL ? 'مدير المدرسة' : 'School Principal';
    }
  }, [user?.role_title, user?.role_name, normalizedRole, isRTL]);

  const {
    data: dashboardData,
    badges,
    liveTasks,
    liveSchedule,
    liveNotifications,
    isLoading,
    isError,
    refetch,
    toggleTask,
    createTask,
  } = useDashboard(normalizedRole);

  const [refreshing, setRefreshing] = useState(false);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [newTaskModalVisible, setNewTaskModalVisible] = useState(false);
  const [messageModalVisible, setMessageModalVisible] = useState(false);
  const [actionAlertMsg, setActionAlertMsg] = useState<string | null>(null);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<'urgent' | 'high' | 'medium' | 'normal'>('medium');
  const [newTaskCategory, setNewTaskCategory] = useState<'academic' | 'admin' | 'guidance' | 'hr'>('admin');

  // Message form state
  const [msgSubject, setMsgSubject] = useState('');
  const [msgContent, setMsgContent] = useState('');

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleToggleTask = async (taskId: string | number) => {
    try {
      await toggleTask(taskId);
    } catch {
      setActionAlertMsg(t('dashboard.tasksList.toggleError', 'تعذر تحديث حالة المهمة'));
      setTimeout(() => setActionAlertMsg(null), 3000);
    }
  };

  const handleAddNewTask = async () => {
    if (!newTaskTitle.trim()) return;
    try {
      await createTask({
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        category: newTaskCategory,
      });
      setNewTaskTitle('');
      setNewTaskModalVisible(false);
      setActionAlertMsg(t('dashboard.tasksList.createdSuccess', 'تم إنشاء المهمة بنجاح'));
      setTimeout(() => setActionAlertMsg(null), 2500);
    } catch {
      setActionAlertMsg(t('dashboard.tasksList.createError', 'تعذر إنشاء المهمة'));
      setTimeout(() => setActionAlertMsg(null), 3000);
    }
  };

  const handleSendMessage = () => {
    if (!msgSubject.trim() || !msgContent.trim()) return;
    setMessageModalVisible(false);
    setMsgSubject('');
    setMsgContent('');
    setActionAlertMsg(t('dashboard.quickActions.messageSent', 'تم إرسال التعميم بنجاح'));
    setTimeout(() => setActionAlertMsg(null), 2500);
  };

  // Loading State
  if (isLoading && !dashboardData && normalizedRole !== 'student' && normalizedRole !== 'parent') {
    return (
      <WebDashboardLayout title={t('dashboard.title', 'لوحة التحكم')}>
        <DashboardSkeleton />
      </WebDashboardLayout>
    );
  }

  // Error State
  if (isError && !dashboardData && normalizedRole !== 'student' && normalizedRole !== 'parent') {
    return (
      <SafeAreaView style={[styles.container, isDark && styles.darkContainer, styles.center]}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0A1D3D' : '#FFFFFF'} />
        <View style={styles.errorCircle}>
          <Icon name="alertTriangle" size={28} color="#F04438" />
        </View>
        <AppText variant="cardTitle" weight="bold" color={isDark ? '#F8FAFC' : '#0A1D3D'} style={styles.errorTitle}>
          {t('errors.fetch_failed', 'تعذر تحميل بيانات لوحة التحكم')}
        </AppText>
        <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'} style={styles.errorSubtitle}>
          {t('errors.network_error', 'يرجى التحقق من الاتصال بالإنترنت والمحاولة مجدداً')}
        </AppText>
        <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
          <AppText variant="button" color="#FFFFFF">{t('common.retry', 'إعادة المحاولة')}</AppText>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, isDark && styles.darkContainer]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={isDark ? '#0A1D3D' : '#FFFFFF'} />

      <WebDashboardLayout
        title={t('navigation.dashboard', isRTL ? 'لوحة التحكم' : 'Dashboard')}
        subtitle={roleSubtitle}
        unreadCount={badges?.messages_unread ?? 29}
        onOpenNotifications={() => setNotificationsVisible(true)}
      >
        {/* Floating Action Alert */}
        {actionAlertMsg && (
          <View style={[styles.toastAlert, isRTL && styles.toastAlertRTL]}>
            <Icon name="check" size={16} color="#FFFFFF" />
            <AppText variant="captionBold" color="#FFFFFF" style={styles.toastAlertText}>
              {actionAlertMsg}
            </AppText>
          </View>
        )}

        {/* Role-Specific Dashboard Renderer */}
        {normalizedRole === 'student' ? (
          <StudentDashboard onRefresh={onRefresh} />
        ) : normalizedRole === 'parent' ? (
          <ParentDashboard onRefresh={onRefresh} />
        ) : normalizedRole === 'teacher' ? (
          <TeacherDashboard
            dashboardData={dashboardData}
            liveTasks={liveTasks}
            liveSchedule={liveSchedule}
            onRefresh={onRefresh}
            onToggleTask={handleToggleTask}
          />
        ) : normalizedRole === 'counselor' ? (
          <CounselorDashboard
            dashboardData={dashboardData}
            liveTasks={liveTasks}
            onRefresh={onRefresh}
          />
        ) : (
          <ManagerDashboard
            dashboardData={dashboardData}
            liveTasks={liveTasks}
            liveSchedule={liveSchedule}
            onRefresh={onRefresh}
            onToggleTask={handleToggleTask}
            onOpenNewTask={() => setNewTaskModalVisible(true)}
            onOpenMessage={() => setMessageModalVisible(true)}
          />
        )}
      </WebDashboardLayout>

      {/* Notifications Modal */}
      <Modal
        visible={notificationsVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheetContainer, isDark && styles.darkModalSheet]}>
            <View style={[styles.modalHeaderRow]}>
              <View style={[styles.modalHeaderTitleGroup]}>
                <Icon name="bell" size={20} color={colors.blue} />
                <AppText variant="cardTitle" weight="bold" style={styles.modalTitleText}>
                  {t('dashboard.notifications.title', isRTL ? 'الإشعارات والتنبيهات' : 'Notifications & Alerts')}
                </AppText>
              </View>
              <TouchableOpacity onPress={() => setNotificationsVisible(false)}>
                <Icon name="close" size={18} color={isDark ? '#CBD5E1' : '#667085'} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView}>
              {liveNotifications.length > 0 ? (
                liveNotifications.map((notif, index) => (
                  <View
                    key={String(notif.id || index)}
                    style={[
                      styles.notificationItemRow,
                      notif.unread && styles.notificationItemUnread,
                    ]}
                  >
                    <View style={[styles.notificationIconCircle, { backgroundColor: withOpacity(colors.blue, 0.12) }]}>
                      <Icon name="bell" size={18} color={colors.blue} />
                    </View>
                    <View style={[styles.notificationContentGroup, isRTL && styles.alignEnd]}>
                      <AppText variant="bodyBold" style={styles.notificationItemTitle}>
                        {notif.title}
                      </AppText>
                      <AppText variant="caption" color={isDark ? '#94A3B8' : '#64748B'}>
                        {notif.description || notif.desc || '—'}
                      </AppText>
                      <AppText variant="caption" color="#94A3B8">
                        {notif.created_at || notif.time || '—'}
                      </AppText>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContainer}>
                  <AppText variant="caption" color="#94A3B8" style={styles.emptyText}>
                    {t('dashboard.notifications.empty', isRTL ? 'لا توجد إشعارات جديدة' : 'No new notifications')}
                  </AppText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
  },
  errorCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE4E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 16,
    marginBottom: 6,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
  },
  retryBtn: {
    backgroundColor: '#1246B7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  toastAlert: {
    position: 'absolute',
    top: 14,
    left: 20,
    zIndex: 999,
    backgroundColor: '#0B7A55',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    elevation: 6,
  },
  toastAlertRTL: {
    left: undefined,
    right: 20,
  },
  toastAlertText: {
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  darkModalSheet: {
    backgroundColor: '#0F244A',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalHeaderTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitleText: {
    fontSize: 16,
  },
  modalScrollView: {
    maxHeight: 400,
  },
  notificationItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notificationItemUnread: {
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  notificationIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationContentGroup: {
    flex: 1,
    gap: 2,
  },
  notificationItemTitle: {
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
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
});

