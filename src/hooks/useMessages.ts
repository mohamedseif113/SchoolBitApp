import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMessages,
  sendMessage,
  getMessageBalance,
  resolveRecipients,
  getDrafts,
  createDraft,
  updateDraft,
  deleteDraft,
  getScheduledMessages,
  scheduleMessage,
  deleteScheduledMessage,
  getTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getAutoRules,
} from '../api/messages';
import { CreateMessagePayload, MessageDraft, MessageTemplate } from '../types/message';

export function useMessages(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['messages', 'list', params],
    queryFn: () => getMessages(params),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useMessageBalance() {
  return useQuery({
    queryKey: ['messages', 'balance'],
    queryFn: () => getMessageBalance(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useDrafts() {
  return useQuery({
    queryKey: ['messages', 'drafts'],
    queryFn: () => getDrafts(),
    staleTime: 1000 * 60 * 3,
  });
}

export function useScheduledMessages() {
  return useQuery({
    queryKey: ['messages', 'scheduled'],
    queryFn: () => getScheduledMessages(),
    staleTime: 1000 * 60 * 3,
  });
}

export function useTemplates() {
  return useQuery({
    queryKey: ['messages', 'templates'],
    queryFn: () => getTemplates(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useAutoRules() {
  return useQuery({
    queryKey: ['messages', 'autoRules'],
    queryFn: () => getAutoRules(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMessagePayload) => sendMessage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
}

export function useResolveRecipients() {
  return useMutation({
    mutationFn: (payload: { recipient_type?: string; recipients?: any[] }) => resolveRecipients(payload),
  });
}

export function useCreateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<MessageDraft>) => createDraft(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'drafts'] });
    },
  });
}

export function useUpdateDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string | number } & Partial<MessageDraft>) => updateDraft(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'drafts'] });
    },
  });
}

export function useDeleteDraft() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteDraft(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'drafts'] });
    },
  });
}

export function useScheduleMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateMessagePayload) => scheduleMessage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'scheduled'] });
    },
  });
}

export function useDeleteScheduledMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteScheduledMessage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'scheduled'] });
    },
  });
}

export function useCreateTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<MessageTemplate>) => createTemplate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'templates'] });
    },
  });
}

export function useDeleteTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', 'templates'] });
    },
  });
}
