export type ScheduleStatus = 'completed' | 'ongoing' | 'upcoming' | 'cancelled' | string;

export interface ScheduleItem {
  id: string | number;
  teacher_id?: string | number;
  teacher_name?: string;
  subject_id?: string | number;
  subject_name?: string;
  class_id?: string | number;
  class_name?: string;
  section_id?: string | number;
  section_name?: string;
  room_id?: string | number;
  room_name?: string;
  day?: number | string;
  day_name?: string;
  period: number;
  start_time?: string;
  end_time?: string;
  status?: ScheduleStatus;
  notes?: string;
  [key: string]: any;
}

export interface WeeklyScheduleDay {
  day: string;
  day_name: string;
  date?: string;
  items: ScheduleItem[];
}

export interface WeeklySchedule {
  start_date?: string;
  end_date?: string;
  days: WeeklyScheduleDay[];
  [key: string]: any;
}

export interface ScheduleGridRow {
  period: number;
  start_time?: string;
  end_time?: string;
  days: Record<string, ScheduleItem | null>;
}

export interface ScheduleGrid {
  periods: number[];
  days: string[];
  grid: ScheduleGridRow[];
  [key: string]: any;
}

export interface ScheduleFilterParams {
  date?: string;
  start_date?: string;
  end_date?: string;
  teacher_id?: string | number;
  class_id?: string | number;
  section_id?: string | number;
  room_id?: string | number;
  subject_id?: string | number;
  day?: string | number;
  period?: number;
  academic_year?: string;
  term?: string;
  [key: string]: any;
}

export interface CreateSchedulePayload {
  teacher_id?: string | number;
  teacher_name?: string;
  subject_id?: string | number;
  subject_name?: string;
  class_id?: string | number;
  class_name?: string;
  section_id?: string | number;
  room_id?: string | number;
  room_name?: string;
  day: number | string;
  period: number;
  start_time?: string;
  end_time?: string;
  date?: string;
  [key: string]: any;
}

export interface UpdateSchedulePayload extends Partial<CreateSchedulePayload> {
  id: string | number;
}

export interface ConflictCheckPayload {
  teacher_id?: string | number;
  class_id?: string | number;
  room_id?: string | number;
  day: number | string;
  period: number;
  date?: string;
  exclude_id?: string | number;
  [key: string]: any;
}

export interface ConflictCheckResult {
  has_conflict: boolean;
  message?: string;
  conflicts?: Array<{
    type: 'teacher' | 'class' | 'room' | string;
    message: string;
    existing_item?: ScheduleItem;
  }>;
  [key: string]: any;
}
