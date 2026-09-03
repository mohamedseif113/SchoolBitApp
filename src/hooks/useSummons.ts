import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSummons,
  getSummonsDetail,
  createSummons,
  updateSummons,
  deleteSummons,
  completeSummons,
  cancelSummons,
  markNoShow,
} from '../api/summons';
import { SummonsFilterParams, CreateSummonsPayload } from '../types/summons';

export function useSummons(params: SummonsFilterParams = {}) {
  return useQuery({
    queryKey: ['summons', 'list', params],
    queryFn: () => getSummons(params),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useSummonsDetail(id?: string | number) {
  return useQuery({
    queryKey: ['summons', 'detail', id],
    queryFn: () => getSummonsDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateSummons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSummonsPayload) => createSummons(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summons'] });
    },
  });
}

export function useUpdateSummons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string | number } & Partial<CreateSummonsPayload>) =>
      updateSummons(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summons'] });
    },
  });
}

export function useDeleteSummons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteSummons(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summons'] });
    },
  });
}

export function useCompleteSummons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data?: { outcome_notes?: string } }) =>
      completeSummons(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summons'] });
    },
  });
}

export function useCancelSummons() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data?: { cancellation_reason?: string } }) =>
      cancelSummons(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summons'] });
    },
  });
}

export function useMarkNoShow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => markNoShow(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['summons'] });
    },
  });
}
