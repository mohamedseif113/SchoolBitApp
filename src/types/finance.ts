export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled' | string;

export interface BillingSummary {
  total_invoices_count?: number;
  total_amount?: number;
  paid_amount?: number;
  pending_amount?: number;
  overdue_amount?: number;
  outstanding_amount?: number;
  currency?: string;
  [key: string]: any;
}

export interface Installment {
  id: string | number;
  number: number;
  amount: number;
  due_date: string;
  status: InvoiceStatus;
  paid_at?: string;
  [key: string]: any;
}

export interface Invoice {
  id: string | number;
  invoice_number: string;
  student_name?: string;
  amount: number;
  paid_amount?: number;
  status: InvoiceStatus;
  due_date?: string;
  installments?: Installment[];
  created_at?: string;
  [key: string]: any;
}

export interface PaymentLink {
  id: string | number;
  title: string;
  amount: number;
  url: string;
  status: 'active' | 'expired' | string;
  created_at?: string;
  [key: string]: any;
}

export interface PaymentGateway {
  id: string | number;
  name: string;
  provider: 'mada' | 'visa' | 'mastercard' | 'apple_pay' | 'stc_pay' | string;
  is_enabled: boolean;
  [key: string]: any;
}

export interface SubscriptionPlan {
  id: string | number;
  name: string;
  price: number;
  interval: 'monthly' | 'yearly' | string;
  max_students?: number;
  features?: string[];
  [key: string]: any;
}

export interface Subscription {
  id: string | number;
  plan_name: string;
  status: 'active' | 'trial' | 'expired' | string;
  renews_at?: string;
  days_left?: number;
  [key: string]: any;
}

export interface BankTransferPayload {
  bank_name: string;
  account_name: string;
  amount: number;
  reference_number: string;
  transfer_date?: string;
  notes?: string;
  receipt_image?: string;
  [key: string]: any;
}
