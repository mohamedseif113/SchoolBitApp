export interface StudentGuardian {
  id?: string | number;
  name?: string;
  relation?: string;
  phone?: string;
  mobile?: string;
  email?: string;
  national_id?: string;
  [key: string]: any;
}

export interface Student {
  id: string | number;
  name: string;
  first_name?: string;
  last_name?: string;
  academic_number?: string;
  student_id?: string;
  national_id?: string;
  idNum?: string;
  grade?: string;
  grade_name?: string;
  class_name?: string;
  section_name?: string;
  stage_name?: string;
  status?: 'active' | 'absent' | 'suspended' | 'regular' | string;
  gpa?: string | number;
  score?: string | number;
  avatar_url?: string;
  guardian?: StudentGuardian;
  guardian_name?: string;
  guardian_phone?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface StudentFilterParams {
  search?: string;
  page?: number;
  per_page?: number;
  limit?: number;
  stage?: string;
  grade_id?: string | number;
  class_id?: string | number;
  section_id?: string | number;
  status?: string;
  [key: string]: any;
}

export interface CreateStudentRequest {
  name: string;
  national_id?: string;
  academic_number?: string;
  grade_id?: string | number;
  class_id?: string | number;
  section_id?: string | number;
  guardian_name?: string;
  guardian_phone?: string;
  [key: string]: any;
}

export interface StudentPaginatedResponse {
  data: Student[];
  current_page?: number;
  last_page?: number;
  total?: number;
  per_page?: number;
  [key: string]: any;
}
