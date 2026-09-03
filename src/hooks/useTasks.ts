import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTasks,
  getTask,
  getKanbanTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTask,
  getTaskComments,
  addTaskComment,
} from '../api/tasks';
import {
  TaskFilterParams,
  CreateTaskPayload,
  UpdateTaskPayload,
} from '../types/task';

export function useTasks(params: TaskFilterParams = {}) {
  return useQuery({
    queryKey: ['tasks', 'list', params],
    queryFn: () => getTasks(params),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useTask(id?: string | number) {
  return useQuery({
    queryKey: ['tasks', 'detail', id],
    queryFn: () => getTask(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useKanbanTasks(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['tasks', 'kanban', params],
    queryFn: () => getKanbanTasks(params),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useTaskComments(id?: string | number) {
  return useQuery({
    queryKey: ['tasks', 'comments', id],
    queryFn: () => getTaskComments(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTaskPayload) => createTask(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateTaskPayload) => updateTask(id, payload),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteTask(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => toggleTask(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useAddTaskComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, content }: { id: string | number; content: string }) => addTaskComment(id, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', 'comments', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', variables.id] });
    },
  });
}
