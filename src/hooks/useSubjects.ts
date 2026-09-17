import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../api/subjects';
import { SubjectFilterParams, CreateSubjectPayload } from '../types/subject';

export function useSubjects(params: SubjectFilterParams = {}) {
  return useQuery({
    queryKey: ['subjects', 'list', params],
    queryFn: () => getSubjects(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useCreateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubjectPayload) => createSubject(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

export function useUpdateSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string | number } & Partial<CreateSubjectPayload>) =>
      updateSubject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}

export function useDeleteSubject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
    },
  });
}
