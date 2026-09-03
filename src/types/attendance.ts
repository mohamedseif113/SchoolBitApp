export type AttendanceStatus = 'present' | 'absent' | 'late' | string;

export interface AttendanceRecordItem {
  student_id: string | number;
  student_name?: string;
  status: AttendanceStatus;
  notes?: string;
  [key: string]: any;
}

export interface ClassAttendanceItem {
  id: string | number;
  name: string;
  grade_name?: string;
  section_name?: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  status: 'completed' | 'in_progress' | 'pending' | string;
  records?: AttendanceRecordItem[];
  [key: string]: any;
}

export interface AttendanceSummaryData {
  attendance_rate?: number;
  present_count?: number;
  absent_count?: number;
  late_count?: number;
  total_students?: number;
  [key: string]: any;
}

export interface SaveAttendancePayload {
  class_id?: string | number;
  section_id?: string | number;
  date: string; // YYYY-MM-DD
  records: AttendanceRecordItem[];
  [key: string]: any;
}

export interface AttendanceResponse {
  success?: boolean;
  message?: string;
  data?: any;
  summary?: AttendanceSummaryData;
  classes?: ClassAttendanceItem[];
  [key: string]: any;
}
