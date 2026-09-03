import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getRoleDashboard,
  getDashboardBadges,
  getTodaySchedule,
  getDashboardTasks,
  getNotifications,
} from '../api/dashboard';
import { toggle as toggleTaskApi, create as createTaskApi } from '../services/tasks';
import { useAuthStore } from '../store/auth.store';

export function useDashboard(overrideRole?: string | null) {
  const queryClient = useQueryClient();
  const authRole = useAuthStore((s) => s.role);
  const activeRole = overrideRole ?? authRole;

  const normalizedRoleStr = (activeRole || '').toLowerCase();
  const isStaff = !normalizedRoleStr.includes('student') && !normalizedRoleStr.includes('parent') && !['طالب', 'طالبة', 'ولي أمر', 'ولي_أمر'].includes(normalizedRoleStr);

  // 1. Role-specific primary dashboard query
  const dashboardQuery = useQuery({
    queryKey: ['dashboard', activeRole || 'default'],
    queryFn: () => getRoleDashboard(activeRole),
    enabled: isStaff,
    staleTime: 1000 * 60 * 3, // 3 minutes cache
    refetchOnWindowFocus: false,
  });

  // 2. Dashboard Badges query (messages_unread, atrisk, summons, behavior, tasks)
  const badgesQuery = useQuery({
    queryKey: ['dashboard', 'badges'],
    queryFn: () => getDashboardBadges(),
    enabled: isStaff,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  // 3. Live Tasks query for tasks widget
  const tasksQuery = useQuery({
    queryKey: ['tasks', 'dashboard-list'],
    queryFn: () => getDashboardTasks(),
    enabled: isStaff,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  // 4. Live Schedule query for timetable widget
  const scheduleQuery = useQuery({
    queryKey: ['schedule', 'mine'],
    queryFn: () => getTodaySchedule(),
    enabled: isStaff,
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });

  // 5. Live Notifications query for bell modal
  const notifsQuery = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => getNotifications(),
    enabled: isStaff,
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: false,
  });

  // Task Mutations
  const toggleTaskMutation = useMutation({
    mutationFn: (taskId: string | number) => toggleTaskApi(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: (newTask: { title: string; priority?: string; category?: string }) =>
      createTaskApi(newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const refetchAll = async () => {
    await Promise.allSettled([
      dashboardQuery.refetch(),
      badgesQuery.refetch(),
      tasksQuery.refetch(),
      scheduleQuery.refetch(),
      notifsQuery.refetch(),
    ]);
  };

  return {
    data: dashboardQuery.data,
    isLoading: dashboardQuery.isLoading,
    isError: dashboardQuery.isError,
    error: dashboardQuery.error,
    refetch: refetchAll,

    badges: badgesQuery.data,
    liveTasks: Array.isArray(tasksQuery.data) ? tasksQuery.data : [],
    liveSchedule: Array.isArray(scheduleQuery.data) ? scheduleQuery.data : [],
    liveNotifications: Array.isArray(notifsQuery.data) ? notifsQuery.data : [],

    toggleTask: toggleTaskMutation.mutateAsync,
    isTogglingTask: toggleTaskMutation.isPending,
    createTask: createTaskMutation.mutateAsync,
    isCreatingTask: createTaskMutation.isPending,
  };
}

export default useDashboard;

