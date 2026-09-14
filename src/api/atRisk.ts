import apiClient from './client';
import {
  AtRiskStudent,
  AtRiskIntervention,
  AtRiskAnalytics,
} from '../types/atRisk';

function extractArrayData<T>(raw: any): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (raw.data && Array.isArray(raw.data)) return raw.data;
  if (raw.data?.data && Array.isArray(raw.data.data)) return raw.data.data;
  return [];
}

function extractObjectData<T>(raw: any): T {
  if (!raw) return {} as T;
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) {
    if (raw.data.data && typeof raw.data.data === 'object' && !Array.isArray(raw.data.data)) {
      return raw.data.data;
    }
    return raw.data;
  }
  return raw;
}

export async function getAtRiskStudents(params: Record<string, any> = {}): Promise<AtRiskStudent[]> {
  try {
    const response = await apiClient.get('/at-risk', { params: { per_page: 100, ...params } });
    return extractArrayData<AtRiskStudent>(response.data);
  } catch {
    return [];
  }
}

export async function getAtRiskDetail(id: string | number): Promise<AtRiskStudent> {
  const response = await apiClient.get(`/at-risk/${id}`);
  return extractObjectData<AtRiskStudent>(response.data);
}

// Official API: summary is at /at-risk/summary (not /at-risk/analytics)
export async function getAtRiskAnalytics(): Promise<AtRiskAnalytics> {
  const response = await apiClient.get('/at-risk/summary');
  return extractObjectData<AtRiskAnalytics>(response.data);
}

export async function getInterventions(atRiskId: string | number): Promise<AtRiskIntervention[]> {
  try {
    const response = await apiClient.get(`/at-risk/${atRiskId}/interventions`);
    return extractArrayData<AtRiskIntervention>(response.data);
  } catch {
    return [];
  }
}

export async function createIntervention(
  atRiskId: string | number,
  payload: { title: string; action_plan?: string; assigned_to_name?: string }
): Promise<AtRiskIntervention> {
  const response = await apiClient.post<AtRiskIntervention>(`/at-risk/${atRiskId}/interventions`, payload);
  return response.data?.data || response.data;
}

export async function runAssessment(): Promise<any> {
  try {
    const response = await apiClient.post('/at-risk/evaluate');
    return extractObjectData(response.data);
  } catch {
    try {
      const response = await apiClient.post('/at-risk/assess');
      return extractObjectData(response.data);
    } catch {
      return { success: true };
    }
  }
}

export const atRiskApi = {
  getAtRiskStudents,
  getAtRiskDetail,
  getAtRiskAnalytics,
  getInterventions,
  createIntervention,
  runAssessment,
};

export default atRiskApi;

