import apiClient from './client';
import {
  Message,
  MessageBalance,
  MessageDraft,
  ScheduledMessage,
  MessageTemplate,
  AutoRule,
  CreateMessagePayload,
  RecipientResolutionResult,
} from '../types/message';

export async function getMessages(params: Record<string, any> = {}): Promise<Message[]> {
  const response = await apiClient.get('/messages', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function sendMessage(payload: CreateMessagePayload): Promise<Message> {
  const response = await apiClient.post<Message>('/messages/send', payload);
  return response.data?.data || response.data;
}

export async function getMessageBalance(): Promise<MessageBalance> {
  const response = await apiClient.get<MessageBalance>('/messages/balance');
  return response.data?.data || response.data;
}

export async function resolveRecipients(payload: { recipient_type?: string; recipients?: any[] }): Promise<RecipientResolutionResult> {
  const response = await apiClient.post<RecipientResolutionResult>('/messages/resolve', payload);
  return response.data?.data || response.data;
}

export async function getDrafts(): Promise<MessageDraft[]> {
  const response = await apiClient.get('/messages/drafts');
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function createDraft(payload: Partial<MessageDraft>): Promise<MessageDraft> {
  const response = await apiClient.post<MessageDraft>('/messages/drafts', payload);
  return response.data?.data || response.data;
}

export async function updateDraft(id: string | number, payload: Partial<MessageDraft>): Promise<MessageDraft> {
  const response = await apiClient.put<MessageDraft>(`/messages/drafts/${id}`, payload);
  return response.data?.data || response.data;
}

export async function deleteDraft(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/messages/drafts/${id}`);
  return response.data;
}

export async function getScheduledMessages(): Promise<ScheduledMessage[]> {
  const response = await apiClient.get('/messages/scheduled');
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function scheduleMessage(payload: CreateMessagePayload): Promise<ScheduledMessage> {
  const response = await apiClient.post<ScheduledMessage>('/messages/scheduled', payload);
  return response.data?.data || response.data;
}

export async function deleteScheduledMessage(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/messages/scheduled/${id}`);
  return response.data;
}

export async function getTemplates(): Promise<MessageTemplate[]> {
  const response = await apiClient.get('/messages/templates');
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function createTemplate(payload: Partial<MessageTemplate>): Promise<MessageTemplate> {
  const response = await apiClient.post<MessageTemplate>('/messages/templates', payload);
  return response.data?.data || response.data;
}

export async function updateTemplate(id: string | number, payload: Partial<MessageTemplate>): Promise<MessageTemplate> {
  const response = await apiClient.put<MessageTemplate>(`/messages/templates/${id}`, payload);
  return response.data?.data || response.data;
}

export async function deleteTemplate(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/messages/templates/${id}`);
  return response.data;
}

export async function getAutoRules(): Promise<AutoRule[]> {
  const response = await apiClient.get('/messages/auto-rules');
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export const messagesApi = {
  getMessages,
  sendMessage,
  getMessageBalance,
  resolveRecipients,
  getDrafts,
  createDraft,
  updateDraft,
  deleteDraft,
  getScheduledMessages,
  scheduleMessage,
  deleteScheduledMessage,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAutoRules,
};

export default messagesApi;
