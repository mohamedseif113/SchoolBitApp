export type InvoiceStatus = 'paid' | 'pending' | 'overdue' | 'cancelled' | 'partially_paid' | 'partial' | string;

export interface BillingSummary {
  total_invoices_count?: number;
  total_invoices?: number;
  total_amount?: number;
  paid_amount?: number;
  total_paid?: number;
  collected_amount?: number;
  pending_amount?: number;
  overdue_amount?: number;
  outstanding_amount?: number;
  total_due?: number;
  remaining_amount?: number;
  successful_operations?: number;
  awaiting_matching?: number;
  failed_operations?: number;
  refunded_operations?: number;
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
  due_amount?: number;
  remaining_amount?: number;
  status: InvoiceStatus;
  due_date?: string;
  title?: string;
  installments?: Installment[];
  created_at?: string;
  [key: string]: any;
}

export interface PaymentTransaction {
  id: string | number;
  transaction_number: string;
  student_name: string;
  invoice_number?: string;
  channel: string;
  reference?: string;
  amount: number;
  fee?: number;
  net?: number;
  status: 'successful' | 'awaiting_matching' | 'failed' | 'refunded' | string;
  created_at: string;
  [key: string]: any;
}

export interface FeeType {
  id: string | number;
  code: string;
  name: string;
  description?: string;
  type: 'mandatory' | 'optional' | 'discount' | 'fine' | string;
  amount_tax?: string;
  is_active: boolean;
  account_code: string;
  status: 'active' | 'inactive' | 'suspended' | string;
  [key: string]: any;
}

export interface FinanceOverviewStats {
  collected_amount: number;
  due_amount: number;
  overdue_amount: number;
  collection_rate: number;
  target_rate: number;
  expected_annual_revenue: number;
  applied_discounts: number;
  unpaid_students_count: number;
  fully_paid_count: number;
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

