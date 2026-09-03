import apiClient from './client';
import {
  ReportTemplate,
  ReportHistoryItem,
  ScheduledReport,
  GenerateReportPayload,
} from '../types/report';

export async function getReportTemplates(params: Record<string, any> = {}): Promise<ReportTemplate[]> {
  const response = await apiClient.get('/reports/templates', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function generateReport(payload: GenerateReportPayload): Promise<ReportHistoryItem> {
  const response = await apiClient.post<ReportHistoryItem>('/reports/generate', payload);
  return response.data?.data || response.data;
}

export async function getReportHistory(params: Record<string, any> = {}): Promise<ReportHistoryItem[]> {
  const response = await apiClient.get('/reports/history', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function downloadReport(id: string | number): Promise<{ url: string; [key: string]: any }> {
  const response = await apiClient.get(`/reports/${id}/download`);
  return response.data?.data || response.data;
}

export async function getScheduledReports(params: Record<string, any> = {}): Promise<ScheduledReport[]> {
  const response = await apiClient.get('/reports/scheduled', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function createScheduledReport(payload: Partial<ScheduledReport>): Promise<ScheduledReport> {
  const response = await apiClient.post<ScheduledReport>('/reports/scheduled', payload);
  return response.data?.data || response.data;
}

export async function updateScheduledReport(id: string | number, payload: Partial<ScheduledReport>): Promise<ScheduledReport> {
  const response = await apiClient.put<ScheduledReport>(`/reports/scheduled/${id}`, payload);
  return response.data?.data || response.data;
}

export async function deleteScheduledReport(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/reports/scheduled/${id}`);
  return response.data;
}

export const reportsApi = {
  getReportTemplates,
  generateReport,
  getReportHistory,
  downloadReport,
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
};

export default reportsApi;
