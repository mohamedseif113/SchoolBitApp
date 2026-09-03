import apiClient from './client';
import {
  ScheduleItem,
  WeeklySchedule,
  ScheduleGrid,
  ScheduleFilterParams,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  ConflictCheckPayload,
  ConflictCheckResult,
} from '../types/schedule';

export async function getSchedules(params: ScheduleFilterParams = {}): Promise<ScheduleItem[]> {
  const response = await apiClient.get('/schedule', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getWeeklySchedule(params: ScheduleFilterParams = {}): Promise<WeeklySchedule | ScheduleItem[]> {
  const response = await apiClient.get('/schedule/weekly', { params });
  return response.data?.data || response.data;
}

export async function getScheduleGrid(params: ScheduleFilterParams = {}): Promise<ScheduleGrid | any> {
  const response = await apiClient.get('/schedule/grid', { params });
  return response.data?.data || response.data;
}

export async function getMySchedule(params: ScheduleFilterParams = {}): Promise<ScheduleItem[]> {
  const response = await apiClient.get('/schedule/mine', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getTeacherSchedule(employeeId: string | number): Promise<ScheduleItem[]> {
  const response = await apiClient.get(`/schedule/teacher/${employeeId}`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function createSchedule(payload: CreateSchedulePayload): Promise<ScheduleItem> {
  const response = await apiClient.post<ScheduleItem>('/schedule', payload);
  return response.data?.data || response.data;
}

export async function updateSchedule(id: string | number, payload: Partial<CreateSchedulePayload>): Promise<ScheduleItem> {
  const response = await apiClient.put<ScheduleItem>(`/schedule/${id}`, payload);
  return response.data?.data || response.data;
}

export async function deleteSchedule(id: string | number): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.delete(`/schedule/${id}`);
  return response.data;
}

export async function checkScheduleConflicts(payload: ConflictCheckPayload): Promise<ConflictCheckResult> {
  const response = await apiClient.post<ConflictCheckResult>('/schedule/check-conflicts', payload);
  return response.data?.data || response.data;
}

export const scheduleApi = {
  getSchedules,
  getWeeklySchedule,
  getScheduleGrid,
  getMySchedule,
  getTeacherSchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  checkScheduleConflicts,
};

export default scheduleApi;
