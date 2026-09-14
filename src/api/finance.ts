import apiClient from './client';
import {
  BillingSummary,
  Invoice,
  PaymentTransaction,
  FeeType,
  PaymentLink,
  PaymentGateway,
  Subscription,
  SubscriptionPlan,
  BankTransferPayload,
} from '../types/finance';

function extractArrayData<T>(raw: any): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.data)) return raw.data;
  if (raw.data && Array.isArray(raw.data.data)) return raw.data.data;
  if (raw.invoices && Array.isArray(raw.invoices)) return raw.invoices;
  if (raw.transactions && Array.isArray(raw.transactions)) return raw.transactions;
  if (raw.fee_types && Array.isArray(raw.fee_types)) return raw.fee_types;
  if (raw.items && Array.isArray(raw.items)) return raw.items;
  return [];
}

function extractObjectData<T>(raw: any): T {
  if (!raw) return {} as T;
  if (raw.data?.summary) return raw.data.summary as T;
  if (raw.data && typeof raw.data === 'object' && !Array.isArray(raw.data)) return raw.data as T;
  if (raw.summary) return raw.summary as T;
  return raw as T;
}

export async function getBillingSummary(): Promise<BillingSummary> {
  const response = await apiClient.get('/finance/dashboard');
  return extractObjectData<BillingSummary>(response.data);
}

export async function getInvoices(params: Record<string, any> = {}): Promise<Invoice[]> {
  const response = await apiClient.get('/finance/invoices', { params: { per_page: 100, ...params } });
  return extractArrayData<Invoice>(response.data);
}

export async function getInvoiceDetails(id: string | number): Promise<Invoice> {
  const response = await apiClient.get(`/finance/invoices/${id}`);
  return extractObjectData<Invoice>(response.data);
}

export async function getPaymentTransactions(params: Record<string, any> = {}): Promise<PaymentTransaction[]> {
  try {
    const response = await apiClient.get('/finance/payments', { params: { per_page: 100, ...params } });
    return extractArrayData<PaymentTransaction>(response.data);
  } catch {
    return [];
  }
}

export async function getFeeTypes(params: Record<string, any> = {}): Promise<FeeType[]> {
  try {
    const response = await apiClient.get('/finance/fee-types', { params });
    return extractArrayData<FeeType>(response.data);
  } catch {
    return [];
  }
}

export async function getPayLinks(): Promise<PaymentLink[]> {
  const response = await apiClient.get('/finance/pay-links');
  return extractArrayData<PaymentLink>(response.data);
}

export async function createPayLink(payload: { title: string; amount: number }): Promise<PaymentLink> {
  const response = await apiClient.post<PaymentLink>('/finance/pay-links', payload);
  return extractObjectData<PaymentLink>(response.data);
}

export async function deletePayLink(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.post(`/finance/pay-links/${id}/cancel`);
  return response.data;
}

export async function getPaymentGateways(): Promise<PaymentGateway[]> {
  const response = await apiClient.get('/finance/gateways');
  return extractArrayData<PaymentGateway>(response.data);
}

export async function getSubscription(): Promise<Subscription> {
  const response = await apiClient.get('/me/subscription');
  return extractObjectData<Subscription>(response.data);
}

export async function getPlans(): Promise<SubscriptionPlan[]> {
  const response = await apiClient.get('/plans');
  return extractArrayData<SubscriptionPlan>(response.data);
}

export async function submitBankTransfer(payload: BankTransferPayload): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.post('/me/billing/bank-transfer', payload);
  return extractObjectData<{ success: boolean; message?: string }>(response.data);
}

export async function getAgingReport(params: Record<string, any> = {}): Promise<any> {
  try {
    const response = await apiClient.get('/finance/reports/aging', { params });
    return extractObjectData(response.data);
  } catch {
    return {};
  }
}

export async function getOverdueReport(params: Record<string, any> = {}): Promise<any> {
  try {
    const response = await apiClient.get('/finance/overdue', { params });
    return extractObjectData(response.data);
  } catch {
    return {};
  }
}

export async function getFinancialReport(reportType: string, params: Record<string, any> = {}): Promise<any> {
  try {
    const response = await apiClient.get(`/finance/reports/${reportType}`, { params });
    return extractObjectData(response.data);
  } catch {
    return {};
  }
}

export const financeApi = {
  getBillingSummary,
  getInvoices,
  getInvoiceDetails,
  getPaymentTransactions,
  getFeeTypes,
  getPayLinks,
  createPayLink,
  deletePayLink,
  getPaymentGateways,
  getSubscription,
  getPlans,
  submitBankTransfer,
  getAgingReport,
  getOverdueReport,
  getFinancialReport,
};

export default financeApi;

