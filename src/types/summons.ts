export type SummonsStatus = 'scheduled' | 'completed' | 'cancelled' | 'no_show' | string;
export type SummonsReason = 'academic_decline' | 'behavioral_incident' | 'frequent_absence' | 'administrative' | string;

export interface SummonsFilterParams {
  student_id?: string | number;
  status?: SummonsStatus;
  reason?: SummonsReason;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
  [key: string]: any;
}

export interface Summons {
  id: string | number;
  student_id: string | number;
  student_name?: string;
  guardian_name?: string;
  guardian_phone?: string;
  reason: SummonsReason;
  reason_text?: string;
  notes?: string;
  status: SummonsStatus;
  scheduled_date: string;
  scheduled_time?: string;
  location?: string;
  created_at?: string;
  completed_at?: string;
  outcome_notes?: string;
  [key: string]: any;
}

export interface CreateSummonsPayload {
  student_id: string | number;
  reason: SummonsReason;
  reason_text?: string;
  notes?: string;
  scheduled_date: string;
  scheduled_time?: string;
  location?: string;
  [key: string]: any;
}

export interface UpdateSummonsPayload extends Partial<CreateSummonsPayload> {
  id: string | number;
  status?: SummonsStatus;
  outcome_notes?: string;
}
