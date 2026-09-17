export interface Subject {
  id: string | number;
  name: string;
  name_en?: string;
  color?: string;
  school_grade_id?: string | number;
  school_grade_name?: string;
  sub_group_id?: string | number;
  sub_group_name?: string;
  teacher_id?: string | number;
  teacher_name?: string;
  weekly_hours?: number;
  is_active?: boolean;
  created_at?: string;
  [key: string]: any;
}

export interface CreateSubjectPayload {
  name: string;
  name_en?: string;
  color?: string;
  school_grade_id?: string | number;
  sub_group_id?: string | number;
  teacher_id?: string | number;
  weekly_hours?: number;
}

export interface SubjectFilterParams {
  school_grade_id?: string | number;
  sub_group_id?: string | number;
  search?: string;
  per_page?: number;
  page?: number;
}
