export interface ExamSession {
  id: string | number;
  name: string;
  session_date: string;
  start_time: string;
  end_time: string;
  subject_name?: string;
  grade_name?: string;
  total_students?: number;
  [key: string]: any;
}

export interface ExamRoom {
  id: string | number;
  name: string;
  building?: string;
  floor?: string;
  capacity: number;
  rows_count?: number;
  cols_count?: number;
  [key: string]: any;
}

export interface ExamSeat {
  id: string | number;
  session_id: string | number;
  room_id: string | number;
  room_name?: string;
  seat_number: number | string;
  student_id: string | number;
  student_name: string;
  student_national_id?: string;
  class_name?: string;
  [key: string]: any;
}

export interface ExamDistribution {
  id: string | number;
  title: string;
  exam_date: string;
  sessions_count?: number;
  rooms_count?: number;
  total_students?: number;
  has_conflicts?: boolean;
  status: 'draft' | 'generated' | 'validated' | string;
  [key: string]: any;
}

export interface CreateExamDistributionPayload {
  title: string;
  exam_date: string;
  session_ids?: (string | number)[];
  room_ids?: (string | number)[];
  [key: string]: any;
}
