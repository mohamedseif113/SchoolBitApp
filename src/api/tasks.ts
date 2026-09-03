import apiClient from './client';
import {
  Task,
  TaskComment,
  TaskFilterParams,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '../types/task';

export async function getTasks(params: TaskFilterParams = {}): Promise<Task[]> {
  const response = await apiClient.get('/tasks', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getTask(id: string | number): Promise<Task> {
  const response = await apiClient.get<Task>(`/tasks/${id}`);
  return response.data?.data || response.data;
}

export async function getKanbanTasks(params: Record<string, any> = {}): Promise<any> {
  const response = await apiClient.get('/tasks/kanban', { params });
  return response.data?.data || response.data;
}

export async function createTask(payload: CreateTaskPayload): Promise<Task> {
  const response = await apiClient.post<Task>('/tasks', payload);
  return response.data?.data || response.data;
}

export async function updateTask(id: string | number, payload: Partial<CreateTaskPayload>): Promise<Task> {
  const response = await apiClient.put<Task>(`/tasks/${id}`, payload);
  return response.data?.data || response.data;
}

export async function deleteTask(id: string | number): Promise<{ success: boolean; message?: string }> {
  const response = await apiClient.delete(`/tasks/${id}`);
  return response.data;
}

export async function toggleTask(id: string | number): Promise<Task> {
  const response = await apiClient.post<Task>(`/tasks/${id}/toggle`);
  return response.data?.data || response.data;
}

export async function getTaskComments(id: string | number): Promise<TaskComment[]> {
  const response = await apiClient.get(`/tasks/${id}/comments`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function addTaskComment(
  id: string | number,
  content: string | { content: string; [key: string]: any }
): Promise<TaskComment> {
  const body = typeof content === 'string' ? { content } : content;
  const response = await apiClient.post<TaskComment>(`/tasks/${id}/comments`, body);
  return response.data?.data || response.data;
}

export const tasksApi = {
  getTasks,
  getTask,
  getKanbanTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  getTaskComments,
  addTaskComment,
};

export default tasksApi;
