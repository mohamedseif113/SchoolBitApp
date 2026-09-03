import apiClient from './client';
import {
  ExamDistribution,
  ExamSession,
  ExamRoom,
  ExamSeat,
  CreateExamDistributionPayload,
} from '../types/examDistribution';

// Official API: exam CRUD is at /exams
export async function getExamDistributions(params: Record<string, any> = {}): Promise<ExamDistribution[]> {
  const response = await apiClient.get('/exams', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getExamDistributionDetail(id: string | number): Promise<ExamDistribution> {
  const response = await apiClient.get<ExamDistribution>(`/exams/${id}`);
  return response.data?.data || response.data;
}

export async function createExamDistribution(payload: CreateExamDistributionPayload): Promise<ExamDistribution> {
  const response = await apiClient.post<ExamDistribution>('/exams', payload);
  return response.data?.data || response.data;
}

// Official API: sessions and rooms are under /exam-dist
export async function getExamSessions(params: Record<string, any> = {}): Promise<ExamSession[]> {
  const response = await apiClient.get('/exam-dist/sessions', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getExamRooms(params: Record<string, any> = {}): Promise<ExamRoom[]> {
  const response = await apiClient.get('/exam-dist/rooms', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getExamSeats(sessionId: string | number): Promise<ExamSeat[]> {
  const response = await apiClient.get(`/exam-dist/sessions/${sessionId}/seats`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

// Official API: distribution is triggered via /exam-dist/sessions/{sessionId}/distribute
export async function generateExamDistribution(sessionId: string | number): Promise<ExamDistribution> {
  const response = await apiClient.post<ExamDistribution>(`/exam-dist/sessions/${sessionId}/distribute`);
  return response.data?.data || response.data;
}

export const examDistributionApi = {
  getExamDistributions,
  getExamDistributionDetail,
  createExamDistribution,
  getExamSessions,
  getExamRooms,
  getExamSeats,
  generateExamDistribution,
};

export default examDistributionApi;

