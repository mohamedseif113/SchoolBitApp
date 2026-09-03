export type ReportFormat = 'pdf' | 'xlsx' | 'csv' | 'json' | string;
export type ReportFrequency = 'daily' | 'weekly' | 'monthly' | 'term' | string;
export type ReportStatus = 'pending' | 'processing' | 'completed' | 'failed' | string;

export interface ReportTemplate {
  id: string | number;
  name: string;
  name_ar?: string;
  type: string;
  category?: string;
  description?: string;
  parameters_schema?: Record<string, any>;
  created_at?: string;
  [key: string]: any;
}

export interface ReportHistoryItem {
  id: string | number;
  report_name: string;
  template_id?: string | number;
  format: ReportFormat;
  status: ReportStatus;
  download_url?: string;
  file_size?: number;
  generated_at?: string;
  [key: string]: any;
}

export interface ScheduledReport {
  id: string | number;
  template_id?: string | number;
  name: string;
  frequency: ReportFrequency;
  format: ReportFormat;
  recipients?: string[];
  next_run_at?: string;
  is_active?: boolean;
  [key: string]: any;
}

export interface GenerateReportPayload {
  template_id?: string | number;
  type?: string;
  format?: ReportFormat;
  filters?: Record<string, any>;
  title?: string;
  date_from?: string;
  date_to?: string;
  [key: string]: any;
}
