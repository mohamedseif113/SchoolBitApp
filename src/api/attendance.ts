import apiClient from './client';
import {
  AttendanceSummaryData,
  ClassAttendanceItem,
  SaveAttendancePayload,
  AttendanceResponse,
} from '../types/attendance';

function extractArrayData<T>(raw: any): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

// Official API: student attendance statistics at /attendance/students/statistics
export async function getAttendanceSummary(date?: string): Promise<AttendanceSummaryData> {
  const response = await apiClient.get('/attendance/students/statistics', { params: { date } });
  return response.data?.data || response.data;
}

// Official API: daily student list at /attendance/students/daily
export async function getDailyAttendance(date?: string, classId?: string | number): Promise<ClassAttendanceItem[]> {
  try {
    const response = await apiClient.get('/attendance/students/daily', { params: { date, class_id: classId } });
    return extractArrayData<ClassAttendanceItem>(response.data);
  } catch {
    return [];
  }
}

// Official API: marking attendance via /attendance/students/quick-mark/set-status
export async function saveAttendance(payload: SaveAttendancePayload): Promise<AttendanceResponse> {
  const response = await apiClient.post<AttendanceResponse>('/attendance/students/quick-mark/set-status', payload);
  return response.data;
}

// Official API: class student records via /attendance/students/daily filtered by class_id
export async function getClassAttendanceStudents(classId: string | number, date?: string): Promise<any> {
  const response = await apiClient.get('/attendance/students/daily', { params: { class_id: classId, date } });
  return response.data?.data || response.data;
}

// Official API: absent students list
export async function getAbsentStudents(params: Record<string, any> = {}): Promise<any[]> {
  try {
    const response = await apiClient.get('/attendance/students/absent', { params });
    return extractArrayData<any>(response.data);
  } catch {
    return [];
  }
}

// Official API: late students list
export async function getLateStudents(params: Record<string, any> = {}): Promise<any[]> {
  try {
    const response = await apiClient.get('/attendance/students/late', { params });
    return extractArrayData<any>(response.data);
  } catch {
    return [];
  }
}

// Official API: quick view
export async function getAttendanceQuickView(params: Record<string, any> = {}): Promise<any> {
  const response = await apiClient.get('/attendance/students/quick-view', { params });
  return response.data?.data || response.data;
}

export const attendanceApi = {
  getAttendanceSummary,
  getDailyAttendance,
  saveAttendance,
  getClassAttendanceStudents,
  getAbsentStudents,
  getLateStudents,
  getAttendanceQuickView,
};

export default attendanceApi;

