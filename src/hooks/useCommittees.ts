import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCommittees,
  getCommittee,
  createCommittee,
  updateCommittee,
  deleteCommittee,
  getCommitteeMembers,
  addCommitteeMember,
  removeCommitteeMember,
  getCommitteeTasks,
  createCommitteeTask,
  getCommitteeMeetings,
  createCommitteeMeeting,
  getCommitteeFiles,
  uploadCommitteeFile,
} from '../api/committees';
import { CreateCommitteePayload } from '../types/committee';

export function useCommittees(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['committees', 'list', params],
    queryFn: () => getCommittees(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCommittee(id?: string | number) {
  return useQuery({
    queryKey: ['committees', 'detail', id],
    queryFn: () => getCommittee(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCommitteeMembers(committeeId?: string | number) {
  return useQuery({
    queryKey: ['committees', 'members', committeeId],
    queryFn: () => getCommitteeMembers(committeeId!),
    enabled: !!committeeId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCommitteeTasks(committeeId?: string | number) {
  return useQuery({
    queryKey: ['committees', 'tasks', committeeId],
    queryFn: () => getCommitteeTasks(committeeId!),
    enabled: !!committeeId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCommitteeMeetings(committeeId?: string | number) {
  return useQuery({
    queryKey: ['committees', 'meetings', committeeId],
    queryFn: () => getCommitteeMeetings(committeeId!),
    enabled: !!committeeId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCommitteeFiles(committeeId?: string | number) {
  return useQuery({
    queryKey: ['committees', 'files', committeeId],
    queryFn: () => getCommitteeFiles(committeeId!),
    enabled: !!committeeId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateCommittee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCommitteePayload) => createCommittee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committees'] });
    },
  });
}

export function useDeleteCommittee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteCommittee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['committees'] });
    },
  });
}

export function useAddCommitteeMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ committeeId, payload }: { committeeId: string | number; payload: { user_id: string | number; role: string } }) =>
      addCommitteeMember(committeeId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['committees', 'members', vars.committeeId] });
    },
  });
}

export function useCreateCommitteeTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ committeeId, payload }: { committeeId: string | number; payload: { title: string; due_date?: string } }) =>
      createCommitteeTask(committeeId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['committees', 'tasks', vars.committeeId] });
    },
  });
}

export function useCreateCommitteeMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ committeeId, payload }: { committeeId: string | number; payload: { title: string; meeting_date: string } }) =>
      createCommitteeMeeting(committeeId, payload),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['committees', 'meetings', vars.committeeId] });
    },
  });
}
