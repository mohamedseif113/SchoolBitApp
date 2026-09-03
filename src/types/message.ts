export type MessageChannel = 'sms' | 'whatsapp' | 'email' | 'push' | string;
export type MessageStatus = 'sent' | 'pending' | 'failed' | 'scheduled' | 'draft' | string;
export type RecipientType = 'all' | 'teachers' | 'students' | 'parents' | 'custom' | string;

export interface MessageRecipient {
  id: string | number;
  name: string;
  phone?: string;
  email?: string;
  role?: string;
  valid?: boolean;
  [key: string]: any;
}

export interface Message {
  id: string | number;
  title?: string;
  content: string;
  sender_name?: string;
  recipient_type?: RecipientType;
  recipients_count?: number;
  channels?: MessageChannel[];
  status: MessageStatus;
  sent_at?: string;
  created_at?: string;
  [key: string]: any;
}

export interface MessageBalance {
  balance: number;
  currency?: string;
  sms_count?: number;
  whatsapp_count?: number;
  [key: string]: any;
}

export interface MessageDraft {
  id: string | number;
  title?: string;
  content?: string;
  recipient_type?: RecipientType;
  recipients?: MessageRecipient[];
  channels?: MessageChannel[];
  updated_at?: string;
  [key: string]: any;
}

export interface ScheduledMessage {
  id: string | number;
  title?: string;
  content: string;
  scheduled_at: string;
  recipient_type?: RecipientType;
  recipients_count?: number;
  channels?: MessageChannel[];
  [key: string]: any;
}

export interface MessageTemplate {
  id: string | number;
  name: string;
  content: string;
  category?: string;
  variables?: string[];
  [key: string]: any;
}

export interface AutoRule {
  id: string | number;
  title: string;
  trigger_event: 'absence' | 'lateness' | 'grade' | string;
  channel: MessageChannel;
  template_id?: string | number;
  is_active: boolean;
  [key: string]: any;
}

export interface CreateMessagePayload {
  title?: string;
  content: string;
  recipient_type?: RecipientType;
  recipients?: (string | number)[];
  channels?: MessageChannel[];
  scheduled_at?: string;
  [key: string]: any;
}

export interface RecipientResolutionResult {
  total: number;
  valid_count: number;
  invalid_count: number;
  recipients: MessageRecipient[];
  [key: string]: any;
}
