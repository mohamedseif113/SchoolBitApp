export type RiskLevel = 'low' | 'medium' | 'high' | 'critical' | string;

export interface AtRiskIntervention {
  id: string | number;
  at_risk_id: string | number;
  title: string;
  action_plan?: string;
  assigned_to_name?: string;
  status: 'pending' | 'in_progress' | 'resolved' | string;
  created_at: string;
  [key: string]: any;
}

export interface AtRiskStudent {
  id: string | number;
  student_id: string | number;
  student_name: string;
  grade_name: string;
  class_name?: string;
  risk_level: RiskLevel;
  risk_score: number;
  attendance_score?: number;
  academic_score?: number;
  behavior_score?: number;
  primary_reason?: string;
  interventions_count?: number;
  last_evaluated_at?: string;
  [key: string]: any;
}

export interface AtRiskAnalytics {
  total_at_risk?: number;
  by_level?: { low?: number; medium?: number; high?: number; critical?: number };
  resolved_count?: number;
  [key: string]: any;
}
