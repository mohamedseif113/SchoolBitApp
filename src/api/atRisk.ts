import apiClient from './client';
import {
  AtRiskStudent,
  AtRiskIntervention,
  AtRiskAnalytics,
} from '../types/atRisk';

export async function getAtRiskStudents(params: Record<string, any> = {}): Promise<AtRiskStudent[]> {
  const response = await apiClient.get('/at-risk', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getAtRiskDetail(id: string | number): Promise<AtRiskStudent> {
  const response = await apiClient.get<AtRiskStudent>(`/at-risk/${id}`);
  return response.data?.data || response.data;
}

// Official API: summary is at /at-risk/summary (not /at-risk/analytics)
export async function getAtRiskAnalytics(): Promise<AtRiskAnalytics> {
  const response = await apiClient.get('/at-risk/summary');
  return response.data?.data || response.data;
}

export async function getInterventions(atRiskId: string | number): Promise<AtRiskIntervention[]> {
  const response = await apiClient.get(`/at-risk/${atRiskId}/interventions`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function createIntervention(
  atRiskId: string | number,
  payload: { title: string; action_plan?: string; assigned_to_name?: string }
): Promise<AtRiskIntervention> {
  const response = await apiClient.post<AtRiskIntervention>(`/at-risk/${atRiskId}/interventions`, payload);
  return response.data?.data || response.data;
}

export const atRiskApi = {
  getAtRiskStudents,
  getAtRiskDetail,
  getAtRiskAnalytics,
  getInterventions,
  createIntervention,
};

export default atRiskApi;
