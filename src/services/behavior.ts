import { apiFetch, buildQuery } from './api';

export interface IncidentFilterParams {
  student_id?: string | number;
  class_id?: string | number;
  rule_id?: string | number;
  severity?: 'minor' | 'moderate' | 'major' | 'severe' | string;
  status?: 'open' | 'investigating' | 'resolved' | 'closed' | string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
  search?: string;
  [key: string]: any;
}

export interface BehaviorIncident {
  id?: string | number;
  student_id: string | number;
  rule_id?: string | number;
  title?: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major' | 'severe' | string;
  status?: 'open' | 'investigating' | 'resolved' | 'closed' | string;
  action_taken?: string;
  points?: number;
  parent_notified?: boolean;
  incident_date?: string;
  created_at?: string;
  closed_at?: string;
  resolution_notes?: string;
  [key: string]: any;
}

export interface BehaviorRule {
  id?: string | number;
  code?: string;
  name: string;
  name_ar?: string;
  description?: string;
  category?: string;
  severity: 'minor' | 'moderate' | 'major' | 'severe' | string;
  points_deducted?: number;
  default_action?: string;
  is_active?: boolean;
  [key: string]: any;
}

export interface BehaviorAnalyticsParams {
  date_from?: string;
  date_to?: string;
  class_id?: string | number;
  grade_level?: string;
  [key: string]: any;
}

// Incidents CRUD + Close
export async function incidents(params: IncidentFilterParams = {}): Promise<any> {
  return apiFetch(`/behavior/incidents${buildQuery(params)}`);
}

export async function incident(id: string | number): Promise<BehaviorIncident> {
  return apiFetch<BehaviorIncident>(`/behavior/incidents/${id}`);
}

export async function createIncident(data: Partial<BehaviorIncident>): Promise<BehaviorIncident> {
  return apiFetch<BehaviorIncident>('/behavior/incidents', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateIncident(id: string | number, data: Partial<BehaviorIncident>): Promise<BehaviorIncident> {
  return apiFetch<BehaviorIncident>(`/behavior/incidents/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteIncident(id: string | number): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/behavior/incidents/${id}`, {
    method: 'DELETE',
  });
}

export async function closeIncident(
  id: string | number,
  data?: { resolution_notes?: string; action_taken?: string; [key: string]: any }
): Promise<BehaviorIncident> {
  return apiFetch<BehaviorIncident>(`/behavior/incidents/${id}/close`, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

// Rules CRUD
export async function rules(params: Record<string, any> = {}): Promise<any> {
  return apiFetch(`/behavior/rules${buildQuery(params)}`);
}

export async function rule(id: string | number): Promise<BehaviorRule> {
  return apiFetch<BehaviorRule>(`/behavior/rules/${id}`);
}

export async function createRule(data: Partial<BehaviorRule>): Promise<BehaviorRule> {
  return apiFetch<BehaviorRule>('/behavior/rules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateRule(id: string | number, data: Partial<BehaviorRule>): Promise<BehaviorRule> {
  return apiFetch<BehaviorRule>(`/behavior/rules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteRule(id: string | number): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/behavior/rules/${id}`, {
    method: 'DELETE',
  });
}

// Analytics
export async function analytics(params: BehaviorAnalyticsParams = {}): Promise<any> {
  return apiFetch(`/behavior/analytics${buildQuery(params)}`);
}

export const behaviorApi = {
  incidents,
  incident,
  createIncident,
  updateIncident,
  deleteIncident,
  closeIncident,
  rules,
  rule,
  createRule,
  updateRule,
  deleteRule,
  analytics,
};

export default behaviorApi;
