import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getIncidents,
  getIncident,
  createIncident,
  updateIncident,
  deleteIncident,
  closeIncident,
  getRules,
  getRule,
  createRule,
  updateRule,
  deleteRule,
  getBehaviorAnalytics,
} from '../api/behavior';
import { IncidentFilterParams, CreateIncidentPayload, BehaviorRule } from '../types/behavior';

export function useBehaviorIncidents(params: IncidentFilterParams = {}) {
  return useQuery({
    queryKey: ['behavior', 'incidents', params],
    queryFn: () => getIncidents(params),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useBehaviorIncident(id?: string | number) {
  return useQuery({
    queryKey: ['behavior', 'incident', id],
    queryFn: () => getIncident(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useBehaviorRules(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['behavior', 'rules', params],
    queryFn: () => getRules(params),
    staleTime: 1000 * 60 * 10,
  });
}

export function useBehaviorAnalytics(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['behavior', 'analytics', params],
    queryFn: () => getBehaviorAnalytics(params),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateIncidentPayload) => createIncident(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavior'] });
    },
  });
}

export function useUpdateIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string | number } & Partial<CreateIncidentPayload>) =>
      updateIncident(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavior'] });
    },
  });
}

export function useDeleteIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteIncident(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavior'] });
    },
  });
}

export function useCloseIncident() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data?: { resolution_notes?: string; action_taken?: string } }) =>
      closeIncident(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavior'] });
    },
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<BehaviorRule>) => createRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavior', 'rules'] });
    },
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['behavior', 'rules'] });
    },
  });
}
