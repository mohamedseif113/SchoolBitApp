import { apiFetch, buildQuery } from './api';

export interface ScheduleFilterParams {
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

export interface ScheduleItem {
  id?: string | number;
  teacher_id: string | number;
  subject_id: string | number;
  class_id: string | number;
  section_id?: string | number;
  room_id?: string | number;
  day: number | string;
  period: number;
  start_time?: string;
  end_time?: string;
  [key: string]: any;
}

export interface ConflictCheckData {
  teacher_id?: string | number;
  class_id?: string | number;
  room_id?: string | number;
  day: number | string;
  period: number;
  exclude_id?: string | number;
  [key: string]: any;
}

export interface ConflictCheckResult {
  has_conflict: boolean;
  conflicts?: Array<{
    type: 'teacher' | 'class' | 'room' | string;
    message: string;
    existing_item?: any;
  }>;
  [key: string]: any;
}

export async function list(params: ScheduleFilterParams = {}): Promise<any> {
  return apiFetch(`/schedules${buildQuery(params)}`);
}

export async function weekly(params: ScheduleFilterParams = {}): Promise<any> {
  return apiFetch(`/schedules/weekly${buildQuery(params)}`);
}

export async function grid(params: ScheduleFilterParams = {}): Promise<any> {
  return apiFetch(`/schedules/grid${buildQuery(params)}`);
}

export async function mine(params: Record<string, any> = {}): Promise<any> {
  return apiFetch(`/schedules/mine${buildQuery(params)}`);
}

export async function show(id: string | number): Promise<ScheduleItem> {
  return apiFetch<ScheduleItem>(`/schedules/${id}`);
}

export async function create(data: Partial<ScheduleItem>): Promise<ScheduleItem> {
  return apiFetch<ScheduleItem>('/schedules', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function update(id: string | number, data: Partial<ScheduleItem>): Promise<ScheduleItem> {
  return apiFetch<ScheduleItem>(`/schedules/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSchedule(id: string | number): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/schedules/${id}`, {
    method: 'DELETE',
  });
}

export async function checkConflicts(data: ConflictCheckData): Promise<ConflictCheckResult> {
  return apiFetch<ConflictCheckResult>('/schedules/conflicts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export { deleteSchedule as delete };

export const scheduleApi = {
  list,
  weekly,
  grid,
  mine,
  show,
  create,
  update,
  delete: deleteSchedule,
  deleteSchedule,
  checkConflicts,
};

export default scheduleApi;
