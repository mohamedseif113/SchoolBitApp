import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHomeworkList,
  getHomeworkDetail,
  createHomework,
  updateHomework,
  deleteHomework,
  getHomeworkSubmissions,
  gradeSubmission,
} from '../api/homework';
import { HomeworkFilterParams, CreateHomeworkPayload } from '../types/homework';

export function useHomeworkList(params: HomeworkFilterParams = {}) {
  return useQuery({
    queryKey: ['homework', 'list', params],
    queryFn: () => getHomeworkList(params),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useHomeworkDetail(id?: string | number) {
  return useQuery({
    queryKey: ['homework', 'detail', id],
    queryFn: () => getHomeworkDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useHomeworkSubmissions(homeworkId?: string | number) {
  return useQuery({
    queryKey: ['homework', 'submissions', homeworkId],
    queryFn: () => getHomeworkSubmissions(homeworkId!),
    enabled: !!homeworkId,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateHomeworkPayload) => createHomework(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
    },
  });
}

export function useUpdateHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string | number } & Partial<CreateHomeworkPayload>) =>
      updateHomework(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
    },
  });
}

export function useDeleteHomework() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteHomework(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
    },
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ homeworkId, submissionId, payload }: { homeworkId: string | number; submissionId: string | number; payload: { grade?: number | string; feedback?: string } }) =>
      gradeSubmission(homeworkId, submissionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homework'] });
    },
  });
}
