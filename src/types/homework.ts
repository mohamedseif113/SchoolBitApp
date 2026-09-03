export type HomeworkStatus = 'draft' | 'published' | 'closed' | 'overdue' | string;

export interface HomeworkFilterParams {
  class_id?: string | number;
  subject_id?: string | number;
  teacher_id?: string | number;
  status?: HomeworkStatus;
  due_date?: string;
  search?: string;
  page?: number;
  per_page?: number;
  [key: string]: any;
}

export interface HomeworkSubmission {
  id: string | number;
  homework_id: string | number;
  student_id: string | number;
  student_name?: string;
  submitted_at?: string;
  content?: string;
  attachment_url?: string;
  status: 'submitted' | 'late' | 'pending' | 'graded' | string;
  grade?: number | string;
  feedback?: string;
  [key: string]: any;
}

export interface HomeworkItem {
  id: string | number;
  title: string;
  description?: string;
  subject_name: string;
  teacher_name?: string;
  class_name: string;
  due_date: string;
  status: HomeworkStatus;
  attachment_url?: string;
  submissions_count?: number;
  submitted_count?: number;
  pending_count?: number;
  created_at?: string;
  [key: string]: any;
}

export interface CreateHomeworkPayload {
  title: string;
  description?: string;
  subject_id?: string | number;
  subject_name?: string;
  class_id?: string | number;
  class_name?: string;
  due_date: string;
  status?: HomeworkStatus;
  attachment_url?: string;
  [key: string]: any;
}

export interface UpdateHomeworkPayload extends Partial<CreateHomeworkPayload> {
  id: string | number;
}
