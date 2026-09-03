import apiClient from './client';
import {
  Student,
  StudentFilterParams,
  CreateStudentRequest,
  StudentPaginatedResponse,
} from '../types/student';

// Official API: students are retrieved via /employees with type=student filter
export async function getStudents(params: StudentFilterParams = {}): Promise<StudentPaginatedResponse | Student[]> {
  const response = await apiClient.get('/employees', { params: { type: 'student', ...params } });
  return response.data?.data || response.data;
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
  const response = await apiClient.get(`/employees/${id}/guardians`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getStudentGrades(id: string | number): Promise<any[]> {
  const response = await apiClient.get(`/employees/${id}/grades`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
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

