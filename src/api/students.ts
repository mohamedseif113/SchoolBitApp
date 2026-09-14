import apiClient from './client';
import {
  Student,
  StudentFilterParams,
  CreateStudentRequest,
  StudentPaginatedResponse,
} from '../types/student';

function extractArrayData<T>(raw: any): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (Array.isArray(raw.items)) return raw.items;
  return [];
}

// Official API: students are retrieved via /employees with type=student filter
export async function getStudents(params: StudentFilterParams = {}): Promise<Student[]> {
  const response = await apiClient.get('/employees', { params: { type: 'student', per_page: 100, ...params } });
  return extractArrayData<Student>(response.data);
}

export async function getStudent(id: string | number): Promise<Student> {
  const response = await apiClient.get<Student>(`/employees/${id}`);
  return (response.data as any)?.data || response.data;
}

export async function createStudent(data: CreateStudentRequest): Promise<Student> {
  const response = await apiClient.post<Student>('/employees', data);
  return (response.data as any)?.data || response.data;
}

export async function updateStudent(
  id: string | number,
  data: Partial<CreateStudentRequest>
): Promise<Student> {
  const response = await apiClient.put<Student>(`/employees/${id}`, data);
  return (response.data as any)?.data || response.data;
}

export async function deleteStudent(id: string | number): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.delete(`/employees/${id}`);
  return response.data;
}

export async function getStudentGuardians(id: string | number): Promise<any[]> {
  try {
    const response = await apiClient.get(`/employees/${id}/guardians`);
    return extractArrayData<any>(response.data);
  } catch {
    return [];
  }
}

export async function getStudentGrades(id: string | number): Promise<any[]> {
  try {
    const response = await apiClient.get(`/employees/${id}/grades`);
    return extractArrayData<any>(response.data);
  } catch {
    return [];
  }
}

export const studentsApi = {
  getStudents,
  getStudent,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentGuardians,
  getStudentGrades,
};

export default studentsApi;

