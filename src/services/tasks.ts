import { apiFetch, buildQuery } from './api';

export interface TaskFilterParams {
  status?: string;
  priority?: string;
  assigned_to?: string | number;
  due_date?: string;
  page?: number;
  per_page?: number;
  search?: string;
  [key: string]: any;
}

export interface Task {
  id: string | number;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | string;
  priority?: 'low' | 'medium' | 'high' | 'urgent' | string;
  due_date?: string;
  assigned_to?: any;
  created_at?: string;
  updated_at?: string;
  comments_count?: number;
  [key: string]: any;
}

export interface TaskComment {
  id: string | number;
  task_id: string | number;
  user_id: string | number;
  user?: any;
  content: string;
  created_at?: string;
  [key: string]: any;
}

export async function list(params: TaskFilterParams = {}): Promise<any> {
  return apiFetch(`/tasks${buildQuery(params)}`);
}

export async function kanban(params: Record<string, any> = {}): Promise<any> {
  return apiFetch(`/tasks/kanban${buildQuery(params)}`);
}

export async function show(id: string | number): Promise<Task> {
  return apiFetch<Task>(`/tasks/${id}`);
}

export async function create(data: Partial<Task>): Promise<Task> {
  return apiFetch<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function update(id: string | number, data: Partial<Task>): Promise<Task> {
  return apiFetch<Task>(`/tasks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteTask(id: string | number): Promise<{ success: boolean; message?: string }> {
  return apiFetch(`/tasks/${id}`, {
    method: 'DELETE',
  });
}

export async function toggle(id: string | number): Promise<Task> {
  return apiFetch<Task>(`/tasks/${id}/toggle`, {
    method: 'POST',
  });
}

export async function comments(id: string | number): Promise<TaskComment[]> {
  return apiFetch<TaskComment[]>(`/tasks/${id}/comments`);
}

export async function addComment(
  id: string | number,
  content: string | { content: string; [key: string]: any }
): Promise<TaskComment> {
  const body = typeof content === 'string' ? { content } : content;
  return apiFetch<TaskComment>(`/tasks/${id}/comments`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export { deleteTask as delete };

export const tasksApi = {
  list,
  kanban,
  show,
  create,
  update,
  delete: deleteTask,
  deleteTask,
  toggle,
  comments,
  addComment,
};

export default tasksApi;
