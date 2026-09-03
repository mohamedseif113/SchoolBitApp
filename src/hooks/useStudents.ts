import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getStudents, getStudent, createStudent, updateStudent, deleteStudent } from '../api/students';
import { StudentFilterParams, CreateStudentRequest, Student } from '../types/student';

export function useStudents(params: StudentFilterParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['students', params],
    queryFn: () => getStudents(params),
    staleTime: 1000 * 60 * 3, // 3 minutes cache
    refetchOnWindowFocus: false,
  });

  const createMutation = useMutation({
    mutationFn: (newStudentData: CreateStudentRequest) => createStudent(newStudentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<CreateStudentRequest> }) =>
      updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => deleteStudent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  return {
    ...query,
    students: Array.isArray(query.data) ? query.data : query.data?.data || [],
    pagination: Array.isArray(query.data) ? null : query.data,
    createStudent: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateStudent: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteStudent: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
  };
}

export function useStudent(id: string | number | null | undefined) {
  return useQuery<Student>({
    queryKey: ['students', 'detail', id],
    queryFn: () => getStudent(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

export default useStudents;
