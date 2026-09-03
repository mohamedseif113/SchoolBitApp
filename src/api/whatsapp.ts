import apiClient from './client';
import { WhatsAppStatus, WhatsAppTestResult } from '../types/whatsapp';

export async function getWhatsAppStatus(): Promise<WhatsAppStatus> {
  const response = await apiClient.get<WhatsAppStatus>('/me/whatsapp/status');
  return response.data?.data || response.data;
}

export async function connectWhatsApp(): Promise<WhatsAppStatus> {
  const response = await apiClient.post<WhatsAppStatus>('/me/whatsapp/connect');
  return response.data?.data || response.data;
}

export async function disconnectWhatsApp(): Promise<{ success: boolean }> {
  const response = await apiClient.post('/me/whatsapp/disconnect');
  return response.data;
}

export async function getWhatsAppQR(): Promise<{ qr_code_url?: string; qr_code_base64?: string }> {
  const response = await apiClient.get('/me/whatsapp/qr');
  return response.data?.data || response.data;
}

export async function sendTestWhatsAppMessage(phone: string): Promise<WhatsAppTestResult> {
  const response = await apiClient.post<WhatsAppTestResult>('/me/whatsapp/test', { phone });
  return response.data?.data || response.data;
}

export const whatsappApi = {
  getWhatsAppStatus,
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppQR,
  sendTestWhatsAppMessage,
};

export default whatsappApi;
