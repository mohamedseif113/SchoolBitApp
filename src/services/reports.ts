import { apiFetch, buildQuery } from './api';

export interface ReportTemplate {
  id?: string | number;
  name: string;
  name_ar?: string;
  type: string;
  description?: string;
  parameters_schema?: Record<string, any>;
  layout?: any;
  created_at?: string;
  [key: string]: any;
}

export interface GenerateReportData {
  template_id?: string | number;
  type?: string;
  format?: 'pdf' | 'xlsx' | 'csv' | 'json' | string;
  filters?: Record<string, any>;
  title?: string;
  date_from?: string;
  date_to?: string;
  [key: string]: any;
}

export interface ScheduledReport {
  id?: string | number;
  template_id?: string | number;
  name: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'term' | string;
  format: 'pdf' | 'xlsx' | 'csv' | string;
  recipients?: string[];
  filters?: Record<string, any>;
  next_run_at?: string;
  is_active?: boolean;
  [key: string]: any;
}

export interface ReportHistoryItem {
  id: string | number;
  report_name: string;
  template_id?: string | number;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | string;
  download_url?: string;
  file_size?: number;
  generated_at?: string;
  [key: string]: any;
}

// Templates CRUD
export async function templates(params: Record<string, any> = {}): Promise<any> {
  return apiFetch(`/reports/templates${buildQuery(params)}`);
}

export async function template(id: string | number): Promise<ReportTemplate> {
  return apiFetch<ReportTemplate>(`/reports/templates/${id}`);
}

export async function createTemplate(data: Partial<ReportTemplate>): Promise<ReportTemplate> {
  return apiFetch<ReportTemplate>('/reports/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTemplate(id: string | number, data: Partial<ReportTemplate>): Promise<ReportTemplate> {
  return apiFetch<ReportTemplate>(`/reports/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(id: string | number): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/reports/templates/${id}`, {
    method: 'DELETE',
  });
}

// Generate & History & Download
export async function generate(data: GenerateReportData): Promise<any> {
  return apiFetch('/reports/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function history(params: Record<string, any> = {}): Promise<any> {
  return apiFetch(`/reports/history${buildQuery(params)}`);
}

export async function download(id: string | number): Promise<{ url: string; [key: string]: any }> {
  return apiFetch(`/reports/${id}/download`);
}

// Scheduled Reports CRUD
export async function scheduled(params: Record<string, any> = {}): Promise<any> {
  return apiFetch(`/reports/scheduled${buildQuery(params)}`);
}

export async function getScheduled(id: string | number): Promise<ScheduledReport> {
  return apiFetch<ScheduledReport>(`/reports/scheduled/${id}`);
}

export async function createScheduled(data: Partial<ScheduledReport>): Promise<ScheduledReport> {
  return apiFetch<ScheduledReport>('/reports/scheduled', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateScheduled(id: string | number, data: Partial<ScheduledReport>): Promise<ScheduledReport> {
  return apiFetch<ScheduledReport>(`/reports/scheduled/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteScheduled(id: string | number): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/reports/scheduled/${id}`, {
    method: 'DELETE',
  });
}

export const reportsApi = {
  templates,
  template,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  generate,
  history,
  download,
  scheduled,
  getScheduled,
  createScheduled,
  updateScheduled,
  deleteScheduled,
};

export default reportsApi;
