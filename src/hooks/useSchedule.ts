import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSchedules,
  getWeeklySchedule,
  getScheduleGrid,
  getMySchedule,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  checkScheduleConflicts,
} from '../api/schedule';
import {
  ScheduleFilterParams,
  CreateSchedulePayload,
  UpdateSchedulePayload,
  ConflictCheckPayload,
} from '../types/schedule';

export function useSchedule(params: ScheduleFilterParams = {}) {
  return useQuery({
    queryKey: ['schedule', 'list', params],
    queryFn: () => getSchedules(params),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useWeeklySchedule(params: ScheduleFilterParams = {}) {
  return useQuery({
    queryKey: ['schedule', 'weekly', params],
    queryFn: () => getWeeklySchedule(params),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useScheduleGrid(params: ScheduleFilterParams = {}) {
  return useQuery({
    queryKey: ['schedule', 'grid', params],
    queryFn: () => getScheduleGrid(params),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useMySchedule(params: ScheduleFilterParams = {}) {
  return useQuery({
    queryKey: ['schedule', 'mine', params],
    queryFn: () => getMySchedule(params),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useCreateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSchedulePayload) => createSchedule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: UpdateSchedulePayload) => updateSchedule(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteSchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteSchedule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCheckScheduleConflicts() {
  return useMutation({
    mutationFn: (payload: ConflictCheckPayload) => checkScheduleConflicts(payload),
  });
}
