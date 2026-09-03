import apiClient from './client';
import { setToken, removeToken } from '../utils/secureStorage';

export interface PortalStudentInfo {
  id: number;
  name: string;
  class_number?: string;
  class_name?: string;
  grade_name?: string;
  school?: string;
  avatar_url?: string | null;
}

export interface PortalRequestCodeResponse {
  success: boolean;
  data: {
    sent: boolean;
    expires_in: number;
  };
  message?: string;
}

export interface PortalVerifyResponse {
  success: boolean;
  data: {
    token: string;
    phone: string;
    students: PortalStudentInfo[];
  };
  message?: string;
}

export interface PortalMeResponse {
  success: boolean;
  data: {
    phone: string;
    students: PortalStudentInfo[];
  };
}

/**
 * Request SMS OTP code for Student & Parent Portal
 * POST /portal/auth/request-code
 */
export async function requestPortalCode(phone: string): Promise<PortalRequestCodeResponse> {
  const response = await apiClient.post<PortalRequestCodeResponse>('/portal/auth/request-code', { phone });
  return response.data;
}

/**
 * Verify SMS OTP code and receive 30-day portal token
 * POST /portal/auth/verify
 */
export async function verifyPortalCode(phone: string, code: string): Promise<PortalVerifyResponse> {
  const response = await apiClient.post<PortalVerifyResponse>('/portal/auth/verify', { phone, code });
  const data = response.data;
  if (data?.data?.token) {
    await setToken(data.data.token);
  }
  return data;
}

/**
 * Get authenticated portal user profile & linked students
 * GET /portal/me
 */
export async function getPortalMe(): Promise<PortalMeResponse> {
  const response = await apiClient.get<PortalMeResponse>('/portal/me');
  return response.data;
}

/**
 * Logout from student/parent portal
 * POST /portal/logout
 */
export async function portalLogout(): Promise<void> {
  try {
    await apiClient.post('/portal/logout');
  } catch (error) {
    // If backend fails, still remove local token
  } finally {
    await removeToken();
  }
}

/**
 * Student Portal Modules
 */
export async function getStudentHomework(studentId: number | string): Promise<any> {
  const response = await apiClient.get(`/portal/students/${studentId}/homework`);
  return response.data?.data || response.data;
}

export async function getStudentGrades(studentId: number | string): Promise<any> {
  const response = await apiClient.get(`/portal/students/${studentId}/grades`);
  return response.data?.data || response.data;
}

export async function getStudentSchedule(studentId: number | string): Promise<any> {
  const response = await apiClient.get(`/portal/students/${studentId}/schedule`);
  return response.data?.data || response.data;
}

export async function getStudentAttendance(studentId: number | string): Promise<any> {
  const response = await apiClient.get(`/portal/students/${studentId}/attendance`);
  return response.data?.data || response.data;
}

export async function getStudentBehavior(studentId: number | string): Promise<any> {
  const response = await apiClient.get(`/portal/students/${studentId}/behavior`);
  return response.data?.data || response.data;
}

export async function getStudentFees(studentId: number | string): Promise<any> {
  const response = await apiClient.get(`/portal/students/${studentId}/fees`);
  return response.data?.data || response.data;
}

export async function getStudentTeachers(studentId: number | string): Promise<any> {
  const response = await apiClient.get(`/portal/students/${studentId}/messages`);
  return response.data?.data || response.data;
}

export async function sendStudentMessage(studentId: number | string, body: string): Promise<any> {
  const response = await apiClient.post(`/portal/students/${studentId}/messages`, { body });
  return response.data?.data || response.data;
}

export async function getStudentRequests(studentId: number | string): Promise<any> {
  const response = await apiClient.get(`/portal/students/${studentId}/requests`);
  return response.data?.data || response.data;
}

export async function createStudentRequest(
  studentId: number | string,
  data: { type: string; description: string; details?: string }
): Promise<any> {
  const response = await apiClient.post(`/portal/students/${studentId}/requests`, data);
  return response.data?.data || response.data;
}

export async function getStudentSummons(studentId: number | string): Promise<any> {
  const response = await apiClient.get(`/portal/students/${studentId}/summons`);
  return response.data?.data || response.data;
}

export async function confirmStudentSummons(
  studentId: number | string,
  summonId: number | string
): Promise<any> {
  const response = await apiClient.post(`/portal/students/${studentId}/summons/${summonId}/confirm`);
  return response.data?.data || response.data;
}

export async function getStudentAlerts(studentId: number | string): Promise<any> {
  const response = await apiClient.get(`/portal/students/${studentId}/alerts`);
  return response.data?.data || response.data;
}

export async function submitStudentHomework(
  studentId: number | string,
  submissionId: number | string,
  data?: any
): Promise<any> {
  const response = await apiClient.post(
    `/portal/students/${studentId}/homework/${submissionId}/submit`,
    data || {}
  );
  return response.data?.data || response.data;
}

export const portalApi = {
  requestPortalCode,
  verifyPortalCode,
  getPortalMe,
  portalLogout,
  getStudentHomework,
  getStudentGrades,
  getStudentSchedule,
  getStudentAttendance,
  getStudentBehavior,
  getStudentFees,
  getStudentTeachers,
  sendStudentMessage,
  getStudentRequests,
  createStudentRequest,
  getStudentSummons,
  confirmStudentSummons,
  getStudentAlerts,
  submitStudentHomework,
};

export default portalApi;
