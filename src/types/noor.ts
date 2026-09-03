export interface NoorStatus {
  is_connected: boolean;
  system_name: string;
  last_synced_at?: string;
  synced_students_count?: number;
  synced_staff_count?: number;
  failed_records_count?: number;
  sync_in_progress?: boolean;
  last_error_message?: string;
  [key: string]: any;
}

export interface NoorSyncResult {
  success: boolean;
  message?: string;
  synced_records?: number;
  failed_records?: number;
  [key: string]: any;
}
