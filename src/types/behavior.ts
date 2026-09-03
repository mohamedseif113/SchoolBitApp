export type IncidentSeverity = 'minor' | 'moderate' | 'major' | 'severe' | string;
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed' | string;

export interface IncidentFilterParams {
  student_id?: string | number;
  class_id?: string | number;
  rule_id?: string | number;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  date_from?: string;
  date_to?: string;
  search?: string;
  page?: number;
  per_page?: number;
  [key: string]: any;
}

export interface BehaviorIncident {
  id: string | number;
  student_id: string | number;
  student_name?: string;
  rule_id?: string | number;
  rule_name?: string;
  title?: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  action_taken?: string;
  points?: number;
  parent_notified?: boolean;
  incident_date?: string;
  created_at?: string;
  closed_at?: string;
  resolution_notes?: string;
  [key: string]: any;
}

export interface BehaviorRule {
  id: string | number;
  code?: string;
  name: string;
  name_ar?: string;
  description?: string;
  category?: string;
  severity: IncidentSeverity;
  points_deducted?: number;
  default_action?: string;
  is_active?: boolean;
  [key: string]: any;
}

export interface BehaviorAnalytics {
  total_incidents?: number;
  open_count?: number;
  closed_count?: number;
  by_severity?: Record<string, number>;
  by_category?: Record<string, number>;
  top_offenders?: { student_id: string | number; name: string; count: number }[];
  [key: string]: any;
}

export interface CreateIncidentPayload {
  student_id: string | number;
  rule_id?: string | number;
  title?: string;
  description: string;
  severity: IncidentSeverity;
  action_taken?: string;
  incident_date?: string;
  parent_notified?: boolean;
  [key: string]: any;
}

export interface UpdateIncidentPayload extends Partial<CreateIncidentPayload> {
  id: string | number;
  status?: IncidentStatus;
  resolution_notes?: string;
}
