export interface WhatsAppStatus {
  is_connected: boolean;
  phone_number?: string;
  account_name?: string;
  qr_code_url?: string;
  qr_code_base64?: string;
  connected_at?: string;
  sent_messages_today_count?: number;
  [key: string]: any;
}

export interface WhatsAppTestResult {
  success: boolean;
  message?: string;
  message_id?: string;
  [key: string]: any;
}
