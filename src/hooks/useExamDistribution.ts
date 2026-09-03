import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getExamDistributions,
  getExamDistributionDetail,
  createExamDistribution,
  getExamSessions,
  getExamRooms,
  getExamSeats,
  generateExamDistribution,
} from '../api/examDistribution';
import { CreateExamDistributionPayload } from '../types/examDistribution';

export function useExamDistributions(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['examDistribution', 'list', params],
    queryFn: () => getExamDistributions(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useExamDistributionDetail(id?: string | number) {
  return useQuery({
    queryKey: ['examDistribution', 'detail', id],
    queryFn: () => getExamDistributionDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useExamSessions(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['examDistribution', 'sessions', params],
    queryFn: () => getExamSessions(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useExamRooms(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['examDistribution', 'rooms', params],
    queryFn: () => getExamRooms(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useExamSeats(distributionId?: string | number) {
  return useQuery({
    queryKey: ['examDistribution', 'seats', distributionId],
    queryFn: () => getExamSeats(distributionId!),
    enabled: !!distributionId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateExamDistribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateExamDistributionPayload) => createExamDistribution(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examDistribution'] });
    },
  });
}

export function useGenerateExamDistribution() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (distributionId: string | number) => generateExamDistribution(distributionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['examDistribution'] });
    },
  });
}
