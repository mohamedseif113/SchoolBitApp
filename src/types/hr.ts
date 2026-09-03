export type EmploymentStatus = 'active' | 'on_leave' | 'suspended' | 'terminated' | string;
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | string;

export interface HRFilterParams {
  department_id?: string | number;
  role?: string;
  status?: EmploymentStatus;
  search?: string;
  page?: number;
  per_page?: number;
  [key: string]: any;
}

export interface HREmployee {
  id: string | number;
  employee_number?: string;
  name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  department_name?: string;
  employment_status: EmploymentStatus;
  joining_date?: string;
  national_id?: string;
  [key: string]: any;
}

export interface HRAttendanceRecord {
  id: string | number;
  employee_id: string | number;
  employee_name?: string;
  date: string;
  check_in?: string;
  check_out?: string;
  status: 'present' | 'absent' | 'late' | 'leave' | string;
  [key: string]: any;
}

export interface HRLeaveRequest {
  id: string | number;
  employee_id: string | number;
  employee_name?: string;
  leave_type: 'annual' | 'sick' | 'emergency' | string;
  start_date: string;
  end_date: string;
  days_count?: number;
  reason?: string;
  status: LeaveStatus;
  applied_at?: string;
  [key: string]: any;
}

export interface CreateEmployeePayload {
  name: string;
  email?: string;
  phone?: string;
  job_title?: string;
  department_name?: string;
  joining_date?: string;
  national_id?: string;
  [key: string]: any;
}

export interface CreateLeavePayload {
  employee_id?: string | number;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason?: string;
  [key: string]: any;
}
