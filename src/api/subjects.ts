import apiClient from './client';
import { Subject, CreateSubjectPayload, SubjectFilterParams } from '../types/subject';

export async function getSubjects(params: SubjectFilterParams = {}): Promise<Subject[]> {
  const response = await apiClient.get('/subjects', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getSubject(id: string | number): Promise<Subject> {
  const response = await apiClient.get<Subject>(`/subjects/${id}`);
  return response.data?.data || response.data;
}

export async function createSubject(payload: CreateSubjectPayload): Promise<Subject> {
  const response = await apiClient.post<Subject>('/subjects', payload);
  return response.data?.data || response.data;
}

export async function updateSubject(id: string | number, payload: Partial<CreateSubjectPayload>): Promise<Subject> {
  const response = await apiClient.put<Subject>(`/subjects/${id}`, payload);
  return response.data?.data || response.data;
}

export async function deleteSubject(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/subjects/${id}`);
  return response.data;
}

export const subjectsApi = {
  getSubjects,
  getSubject,
  createSubject,
  updateSubject,
  deleteSubject,
};

export default subjectsApi;
