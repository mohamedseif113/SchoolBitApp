import apiClient from './client';
import {
  BehaviorIncident,
  BehaviorRule,
  BehaviorAnalytics,
  IncidentFilterParams,
  CreateIncidentPayload,
  UpdateIncidentPayload,
} from '../types/behavior';

export async function getIncidents(params: IncidentFilterParams = {}): Promise<BehaviorIncident[]> {
  const response = await apiClient.get('/behavior/incidents', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getIncident(id: string | number): Promise<BehaviorIncident> {
  const response = await apiClient.get<BehaviorIncident>(`/behavior/incidents/${id}`);
  return response.data?.data || response.data;
}

export async function createIncident(payload: CreateIncidentPayload): Promise<BehaviorIncident> {
  const response = await apiClient.post<BehaviorIncident>('/behavior/incidents', payload);
  return response.data?.data || response.data;
}

export async function updateIncident(id: string | number, payload: Partial<CreateIncidentPayload>): Promise<BehaviorIncident> {
  const response = await apiClient.put<BehaviorIncident>(`/behavior/incidents/${id}`, payload);
  return response.data?.data || response.data;
}

export async function deleteIncident(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/behavior/incidents/${id}`);
  return response.data;
}

export async function closeIncident(
  id: string | number,
  data?: { resolution_notes?: string; action_taken?: string }
): Promise<BehaviorIncident> {
  const response = await apiClient.post<BehaviorIncident>(`/behavior/incidents/${id}/close`, data);
  return response.data?.data || response.data;
}

export async function getRules(params: Record<string, any> = {}): Promise<BehaviorRule[]> {
  const response = await apiClient.get('/behavior/rules', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getRule(id: string | number): Promise<BehaviorRule> {
  const response = await apiClient.get<BehaviorRule>(`/behavior/rules/${id}`);
  return response.data?.data || response.data;
}

export async function createRule(payload: Partial<BehaviorRule>): Promise<BehaviorRule> {
  const response = await apiClient.post<BehaviorRule>('/behavior/rules', payload);
  return response.data?.data || response.data;
}

export async function updateRule(id: string | number, payload: Partial<BehaviorRule>): Promise<BehaviorRule> {
  const response = await apiClient.put<BehaviorRule>(`/behavior/rules/${id}`, payload);
  return response.data?.data || response.data;
}

export async function deleteRule(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/behavior/rules/${id}`);
  return response.data;
}

export async function getBehaviorAnalytics(params: Record<string, any> = {}): Promise<BehaviorAnalytics> {
  const response = await apiClient.get('/behavior/analytics', { params });
  return response.data?.data || response.data;
}

export const behaviorApi = {
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  deleteIncident,
  closeIncident,
  getRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  getBehaviorAnalytics,
};

export default behaviorApi;
