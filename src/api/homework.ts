import apiClient from './client';
import {
  HomeworkItem,
  HomeworkSubmission,
  HomeworkFilterParams,
  CreateHomeworkPayload,
  UpdateHomeworkPayload,
} from '../types/homework';

export async function getHomeworkList(params: HomeworkFilterParams = {}): Promise<HomeworkItem[]> {
  const response = await apiClient.get('/homework', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getHomeworkDetail(id: string | number): Promise<HomeworkItem> {
  const response = await apiClient.get<HomeworkItem>(`/homework/${id}`);
  return response.data?.data || response.data;
}

export async function createHomework(payload: CreateHomeworkPayload): Promise<HomeworkItem> {
  const response = await apiClient.post<HomeworkItem>('/homework', payload);
  return response.data?.data || response.data;
}

export async function updateHomework(id: string | number, payload: Partial<CreateHomeworkPayload>): Promise<HomeworkItem> {
  const response = await apiClient.put<HomeworkItem>(`/homework/${id}`, payload);
  return response.data?.data || response.data;
}

export async function deleteHomework(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/homework/${id}`);
  return response.data;
}

export async function getHomeworkSubmissions(homeworkId: string | number): Promise<HomeworkSubmission[]> {
  const response = await apiClient.get(`/homework/${homeworkId}/submissions`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

// Official API: grade a submission via PUT /homework/{homeworkId}/submissions/{submissionId}
export async function gradeSubmission(
  homeworkId: string | number,
  submissionId: string | number,
  payload: { grade?: number | string; feedback?: string }
): Promise<HomeworkSubmission> {
  const response = await apiClient.put<HomeworkSubmission>(`/homework/${homeworkId}/submissions/${submissionId}`, payload);
  return response.data?.data || response.data;
}

export const homeworkApi = {
  getHomeworkList,
  getHomeworkDetail,
  createHomework,
  updateHomework,
  deleteHomework,
  getHomeworkSubmissions,
  gradeSubmission,
};

export default homeworkApi;
