import { apiFetch, buildQuery } from './api';

export interface MessageFilterParams {
  type?: string;
  status?: string;
  search?: string;
  page?: number;
  per_page?: number;
  date_from?: string;
  date_to?: string;
  [key: string]: any;
}

export interface SendMessageData {
  recipients?: string[] | number[];
  recipient_type?: 'all' | 'teachers' | 'students' | 'parents' | 'custom' | string;
  channels?: ('sms' | 'whatsapp' | 'email' | 'push' | string)[];
  title?: string;
  content: string;
  template_id?: string | number;
  scheduled_at?: string;
  [key: string]: any;
}

export interface MessageDraft {
  id?: string | number;
  title?: string;
  content?: string;
  recipient_type?: string;
  recipients?: any[];
  [key: string]: any;
}

export interface MessageTemplate {
  id?: string | number;
  name: string;
  content: string;
  variables?: string[];
  category?: string;
  [key: string]: any;
}

export async function list(params: MessageFilterParams = {}): Promise<any> {
  return apiFetch(`/messages${buildQuery(params)}`);
}

export async function history(params: MessageFilterParams = {}): Promise<any> {
  return apiFetch(`/messages/history${buildQuery(params)}`);
}

export async function show(id: string | number): Promise<any> {
  return apiFetch(`/messages/${id}`);
}

export async function send(data: SendMessageData): Promise<any> {
  return apiFetch('/messages/send', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function balance(): Promise<{ balance: number; currency?: string; sms_count?: number; [key: string]: any }> {
  return apiFetch('/messages/balance');
}

// Drafts CRUD
export async function drafts(params: Record<string, any> = {}): Promise<MessageDraft[]> {
  return apiFetch(`/messages/drafts${buildQuery(params)}`);
}

export async function showDraft(id: string | number): Promise<MessageDraft> {
  return apiFetch(`/messages/drafts/${id}`);
}

export async function createDraft(data: Partial<MessageDraft>): Promise<MessageDraft> {
  return apiFetch('/messages/drafts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateDraft(id: string | number, data: Partial<MessageDraft>): Promise<MessageDraft> {
  return apiFetch(`/messages/drafts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteDraft(id: string | number): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/messages/drafts/${id}`, {
    method: 'DELETE',
  });
}

// Templates CRUD
export async function templates(params: Record<string, any> = {}): Promise<MessageTemplate[]> {
  return apiFetch(`/messages/templates${buildQuery(params)}`);
}

export async function template(id: string | number): Promise<MessageTemplate> {
  return apiFetch(`/messages/templates/${id}`);
}

export async function createTemplate(data: Partial<MessageTemplate>): Promise<MessageTemplate> {
  return apiFetch('/messages/templates', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateTemplate(id: string | number, data: Partial<MessageTemplate>): Promise<MessageTemplate> {
  return apiFetch(`/messages/templates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTemplate(id: string | number): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/messages/templates/${id}`, {
    method: 'DELETE',
  });
}

export const messagesApi = {
  list,
  history,
  show,
  send,
  balance,
  drafts,
  showDraft,
  createDraft,
  updateDraft,
  deleteDraft,
  templates,
  template,
  createTemplate,
  updateTemplate,
  deleteTemplate,
};

export default messagesApi;
