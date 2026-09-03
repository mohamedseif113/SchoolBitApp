export interface DashboardKPIs {
  students_count?: number;
  staff_count?: number;
  staff_present_today?: number;
  attendance_rate?: number;
  attendance_rate_delta?: number;
  is_school_day?: boolean;
  atrisk_count?: number;
  atrisk_assessed?: number;
  atrisk_delta?: number;
  weekly_violations?: number;
  weekly_violations_delta?: number;
  total_employees?: number;
  today_present?: number;
  today_absent?: number;
  incidents_count?: number;
  pending_tasks?: number;
  pending_summons?: number;
  [key: string]: any;
}

export interface ActivityItem {
  type?: string;
  icon?: string;
  description?: string;
  color?: string;
  created_at?: string;
}

export interface WeeklyAttendanceDay {
  day?: string;
  date?: string;
  present?: number;
  absent?: number;
  rate?: number;
}

export interface MonthlyAttendanceMonth {
  month?: string;
  value?: number;
}

export interface ClassPerformanceItem {
  cls?: string;
  class_name?: string;
  total?: number;
  att?: number;
  attendance_rate?: number | null;
  average?: number | null;
  viol?: number;
}

export interface TodayAbsentTotals {
  total_absent?: number;
  unnotified?: number;
}

export interface ManagerDashboardData {
  kpis?: DashboardKPIs;
  recent_activity?: ActivityItem[];
  weekly_attendance?: WeeklyAttendanceDay[];
  monthly_attendance?: MonthlyAttendanceMonth[];
  classes_performance?: ClassPerformanceItem[];
  today_absent_totals?: TodayAbsentTotals;
  today_absent_students?: any[];
  violation_types?: any[];
  at_risk_students?: any[];
  [key: string]: any;
}

export interface TeacherKPIs {
  students_today?: number;
  periods_today?: number;
  periods_done?: number;
  attendance_rate?: number;
  pending_tasks?: number;
  overdue_tasks?: number;
  [key: string]: any;
}

export interface TeacherPeriodItem {
  id?: string | number;
  period?: number;
  time?: string;
  subject?: string;
  class_name?: string;
  room?: string;
  status?: string;
  is_done?: boolean;
}

export interface TeacherTaskItem {
  id?: string | number;
  title?: string;
  due_date?: string;
  status?: string;
  is_overdue?: boolean;
  priority?: string;
  category?: string;
  completed?: boolean;
}

export interface StudentInsightItem {
  id?: string | number;
  name?: string;
  class_name?: string;
  score?: number;
  reason?: string;
}

export interface TeacherDashboardData {
  kpis?: TeacherKPIs;
  today_periods?: TeacherPeriodItem[];
  tasks?: TeacherTaskItem[];
  class_performance?: ClassPerformanceItem[];
  top_students?: StudentInsightItem[];
  needs_followup_students?: StudentInsightItem[];
  is_linked?: boolean;
  [key: string]: any;
}

export interface CounselorKPIs {
  atrisk_cases?: number;
  pending_summons?: number;
  monthly_sessions?: number;
  resolved_cases?: number;
  today_sessions?: number;
  [key: string]: any;
}

export interface CounselorSessionItem {
  id?: string | number;
  student_name?: string;
  class_name?: string;
  time?: string;
  title?: string;
  status?: string;
}

export interface CounselorPriorityItem {
  id?: string | number;
  student_name?: string;
  class_name?: string;
  reason?: string;
  severity?: 'high' | 'medium' | 'low' | string;
  date?: string;
}

export interface CounselorDashboardData {
  kpis?: CounselorKPIs;
  priorities?: CounselorPriorityItem[];
  today_sessions?: CounselorSessionItem[];
  pending_summons?: any[];
  case_distribution?: any[];
  response_rate?: number;
  recent_activity?: ActivityItem[];
  [key: string]: any;
}

export interface DashboardBadgesData {
  messages_unread?: number;
  atrisk?: number;
  summons_pending?: number;
  behavior_open?: number;
  tasks_pending?: number;
  attendance_today?: number;
  [key: string]: any;
}

export interface DashboardOverview {
  kpis?: DashboardKPIs | TeacherKPIs | CounselorKPIs;
  stats?: DashboardKPIs;
  attendance?: any;
  timetable?: any[];
  tasks?: any[];
  notifications?: any[];
  unread_notifications_count?: number;
  badges?: DashboardBadgesData;
  teacher?: TeacherDashboardData;
  counselor?: CounselorDashboardData;
  manager?: ManagerDashboardData;
  [key: string]: any;
}

