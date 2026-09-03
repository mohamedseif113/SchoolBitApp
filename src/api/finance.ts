import apiClient from './client';
import {
  BillingSummary,
  Invoice,
  PaymentLink,
  PaymentGateway,
  Subscription,
  SubscriptionPlan,
  BankTransferPayload,
} from '../types/finance';

// Official API: finance dashboard stats are at /finance/dashboard (not /finance/summary)
export async function getBillingSummary(): Promise<BillingSummary> {
  const response = await apiClient.get('/finance/dashboard');
  return response.data?.data || response.data;
}

export async function getInvoices(params: Record<string, any> = {}): Promise<Invoice[]> {
  const response = await apiClient.get('/finance/invoices', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getInvoiceDetails(id: string | number): Promise<Invoice> {
  const response = await apiClient.get(`/finance/invoices/${id}`);
  return response.data?.data || response.data;
}

export async function getPayLinks(): Promise<PaymentLink[]> {
  const response = await apiClient.get('/finance/pay-links');
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function createPayLink(payload: { title: string; amount: number }): Promise<PaymentLink> {
  const response = await apiClient.post<PaymentLink>('/finance/pay-links', payload);
  return response.data?.data || response.data;
}

// Official API: cancelling a pay-link is POST /cancel, not DELETE
export async function deletePayLink(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.post(`/finance/pay-links/${id}/cancel`);
  return response.data;
}

export async function getPaymentGateways(): Promise<PaymentGateway[]> {
  const response = await apiClient.get('/finance/gateways');
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getSubscription(): Promise<Subscription> {
  const response = await apiClient.get('/me/subscription');
  return response.data?.data || response.data;
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const response = await apiClient.get('/plans');
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function submitBankTransfer(payload: BankTransferPayload): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post('/me/billing/bank-transfer', payload);
  return response.data?.data || response.data;
}

export const financeApi = {
  getBillingSummary,
  getInvoices,
  getInvoiceDetails,
  getPayLinks,
  createPayLink,
  deletePayLink,
  getPaymentGateways,
  getSubscription,
  getPlans,
  submitBankTransfer,
};

export default financeApi;
