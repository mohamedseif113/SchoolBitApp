import apiClient from './client';
import {
  HREmployee,
  HRAttendanceRecord,
  HRLeaveRequest,
  HRFilterParams,
  CreateEmployeePayload,
  CreateLeavePayload,
} from '../types/hr';

// Official API: staff employees are retrieved via /employees (no /staff prefix)
export async function getEmployees(params: HRFilterParams = {}): Promise<HREmployee[]> {
  const response = await apiClient.get('/employees', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getEmployeeDetail(id: string | number): Promise<HREmployee> {
  const response = await apiClient.get<HREmployee>(`/hr/employees/${id}/profile`);
  return response.data?.data || response.data;
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<HREmployee> {
  const response = await apiClient.post<HREmployee>('/employees', payload);
  return response.data?.data || response.data;
}

export async function updateEmployee(id: string | number, payload: Partial<CreateEmployeePayload>): Promise<HREmployee> {
  const response = await apiClient.put<HREmployee>(`/employees/${id}`, payload);
  return response.data?.data || response.data;
}

export async function deleteEmployee(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/employees/${id}`);
  return response.data;
}

// Official API: HR attendance is at /hr/attendance (not /reports/staff-attendance)
export async function getHRAttendance(params: Record<string, any> = {}): Promise<HRAttendanceRecord[]> {
  const response = await apiClient.get('/hr/attendance', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

// Official API: HR leaves are at /hr/leaves (not /attendance/leaves)
export async function getLeaveRequests(params: Record<string, any> = {}): Promise<HRLeaveRequest[]> {
  const response = await apiClient.get('/hr/leaves', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function createLeaveRequest(payload: CreateLeavePayload): Promise<HRLeaveRequest> {
  const response = await apiClient.post<HRLeaveRequest>('/hr/leaves', payload);
  return response.data?.data || response.data;
}

// Official API: approve and reject share the same endpoint /hr/leaves/{id}/decide with action field
export async function approveLeaveRequest(id: string | number): Promise<HRLeaveRequest> {
  const response = await apiClient.post<HRLeaveRequest>(`/hr/leaves/${id}/decide`, { action: 'approve' });
  return response.data?.data || response.data;
}

export async function rejectLeaveRequest(id: string | number, reason?: string): Promise<HRLeaveRequest> {
  const response = await apiClient.post<HRLeaveRequest>(`/hr/leaves/${id}/decide`, { action: 'reject', reason });
  return response.data?.data || response.data;
}

export const hrApi = {
  getEmployees,
  getEmployeeDetail,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getHRAttendance,
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
};

export default hrApi;

