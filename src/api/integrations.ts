import apiClient from './client';
import {
  IntegrationItem,
  WebhookConfig,
  IntegrationLog,
} from '../types/integrations';

export async function getIntegrations(params: Record<string, any> = {}): Promise<IntegrationItem[]> {
  const response = await apiClient.get('/integrations', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getIntegrationDetail(id: string | number): Promise<IntegrationItem> {
  const response = await apiClient.get<IntegrationItem>(`/integrations/${id}`);
  return response.data?.data || response.data;
}

// Official API: uses PUT /integrations/{id} to update/configure, DELETE /integrations/{id} to remove
export async function connectIntegration(id: string | number, payload?: Record<string, any>): Promise<IntegrationItem> {
  const response = await apiClient.put<IntegrationItem>(`/integrations/${id}`, payload);
  return response.data?.data || response.data;
}

export async function disconnectIntegration(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/integrations/${id}`);
  return response.data;
}

// Official API: webhook endpoint is singular /webhook (not /webhooks)
export async function getWebhooks(integrationId: string | number): Promise<WebhookConfig[]> {
  const response = await apiClient.get(`/integrations/${integrationId}/webhook`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function createWebhook(integrationId: string | number, payload: { url: string; events?: string[] }): Promise<WebhookConfig> {
  const response = await apiClient.post<WebhookConfig>(`/integrations/${integrationId}/webhooks`, payload);
  return response.data?.data || response.data;
}

export async function getIntegrationLogs(integrationId: string | number): Promise<IntegrationLog[]> {
  const response = await apiClient.get(`/integrations/${integrationId}/logs`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export const integrationsApi = {
  getIntegrations,
  getIntegrationDetail,
  connectIntegration,
  disconnectIntegration,
  getWebhooks,
  createWebhook,
  getIntegrationLogs,
};

export default integrationsApi;
