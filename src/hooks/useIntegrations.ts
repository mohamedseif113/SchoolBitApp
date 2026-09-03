import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getIntegrations,
  getIntegrationDetail,
  connectIntegration,
  disconnectIntegration,
  getWebhooks,
  createWebhook,
  getIntegrationLogs,
} from '../api/integrations';

export function useIntegrations(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['integrations', 'list', params],
    queryFn: () => getIntegrations(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useIntegrationDetail(id?: string | number) {
  return useQuery({
    queryKey: ['integrations', 'detail', id],
    queryFn: () => getIntegrationDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useWebhooks(integrationId?: string | number) {
  return useQuery({
    queryKey: ['integrations', 'webhooks', integrationId],
    queryFn: () => getWebhooks(integrationId!),
    enabled: !!integrationId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useIntegrationLogs(integrationId?: string | number) {
  return useQuery({
    queryKey: ['integrations', 'logs', integrationId],
    queryFn: () => getIntegrationLogs(integrationId!),
    enabled: !!integrationId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useConnectIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => connectIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}

export function useDisconnectIntegration() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => disconnectIntegration(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['integrations'] });
    },
  });
}
