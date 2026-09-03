export interface IntegrationItem {
  id: string | number;
  name: string;
  provider: string;
  category?: string;
  is_connected: boolean;
  icon_url?: string;
  description?: string;
  last_sync_at?: string;
  webhooks_count?: number;
  [key: string]: any;
}

export interface WebhookConfig {
  id: string | number;
  integration_id: string | number;
  url: string;
  events: string[];
  is_active: boolean;
  secret_token_masked?: string;
  created_at?: string;
  [key: string]: any;
}

export interface IntegrationLog {
  id: string | number;
  integration_id: string | number;
  event: string;
  status: 'success' | 'failed' | string;
  response_code?: number;
  error_message?: string;
  created_at: string;
  [key: string]: any;
}
