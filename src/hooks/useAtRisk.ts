import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAtRiskStudents,
  getAtRiskDetail,
  getAtRiskAnalytics,
  getInterventions,
  createIntervention,
} from '../api/atRisk';

export function useAtRiskStudents(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['atRisk', 'list', params],
    queryFn: () => getAtRiskStudents(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useAtRiskDetail(id?: string | number) {
  return useQuery({
    queryKey: ['atRisk', 'detail', id],
    queryFn: () => getAtRiskDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useAtRiskAnalytics() {
  return useQuery({
    queryKey: ['atRisk', 'analytics'],
    queryFn: () => getAtRiskAnalytics(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useInterventions(atRiskId?: string | number) {
  return useQuery({
    queryKey: ['atRisk', 'interventions', atRiskId],
    queryFn: () => getInterventions(atRiskId!),
    enabled: !!atRiskId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateIntervention() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ atRiskId, payload }: { atRiskId: string | number; payload: { title: string; action_plan?: string } }) =>
      createIntervention(atRiskId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['atRisk', 'interventions', vars.atRiskId] });
      queryClient.invalidateQueries({ queryKey: ['atRisk', 'list'] });
    },
  });
}
