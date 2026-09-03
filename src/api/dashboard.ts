import apiClient from './client';
import {
  ManagerDashboardData,
  TeacherDashboardData,
  CounselorDashboardData,
  DashboardBadgesData,
  DashboardOverview,
} from '../types/dashboard';

// Official API: main manager / principal / admin dashboard endpoint is /dashboard
export async function getDashboard(): Promise<ManagerDashboardData> {
  const res = await apiClient.get('/dashboard');
  return res.data?.data ?? res.data;
}

// Official API: teacher role uses /dashboard/teacher
export async function getTeacherDashboard(): Promise<TeacherDashboardData> {
  const res = await apiClient.get('/dashboard/teacher');
  return res.data?.data ?? res.data;
}

// Official API: counselor role uses /dashboard/counselor
export async function getCounselorDashboard(): Promise<CounselorDashboardData> {
  const res = await apiClient.get('/dashboard/counselor');
  return res.data?.data ?? res.data;
}

// Official API: badge counts for nav indicators
export async function getDashboardBadges(): Promise<DashboardBadgesData> {
  const res = await apiClient.get('/dashboard/badges');
  return res.data?.data ?? res.data;
}

// Unified role-based fetcher
export async function getRoleDashboard(role?: string | null): Promise<any> {
  const normalized = (role || '').toLowerCase();
  if (normalized.includes('teacher') || normalized === 'معلم' || normalized === 'معلمة') {
    return getTeacherDashboard();
  }
  if (normalized.includes('counselor') || normalized.includes('guidance') || normalized === 'مرشد' || normalized === 'موجه') {
    return getCounselorDashboard();
  }
  return getDashboard();
}

// Alias for backwards compatibility
export const getDashboardOverview = getDashboard;

// Sub-resource endpoints
export async function getTodaySchedule(): Promise<any[]> {
  const res = await apiClient.get('/schedule/mine');
  const data = res.data?.data ?? res.data;
  return Array.isArray(data) ? data : [];
}

export async function getDashboardTasks(): Promise<any[]> {
  const res = await apiClient.get('/tasks');
  const data = res.data?.data ?? res.data;
  return Array.isArray(data) ? data : [];
}

export async function getNotifications(): Promise<any[]> {
  const res = await apiClient.get('/notifications');
  const data = res.data?.data ?? res.data;
  return Array.isArray(data) ? data : [];
}

export const dashboardApi = {
  getDashboard,
  getDashboardOverview,
  getTeacherDashboard,
  getCounselorDashboard,
  getDashboardBadges,
  getRoleDashboard,
  getTodaySchedule,
  getDashboardTasks,
  getNotifications,
};

export default dashboardApi;


