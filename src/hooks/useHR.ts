import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmployees,
  getEmployeeDetail,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getHRAttendance,
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
} from '../api/hr';
import { HRFilterParams, CreateEmployeePayload, CreateLeavePayload } from '../types/hr';

export function useEmployees(params: HRFilterParams = {}) {
  return useQuery({
    queryKey: ['hr', 'employees', params],
    queryFn: () => getEmployees(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useEmployeeDetail(id?: string | number) {
  return useQuery({
    queryKey: ['hr', 'employee', id],
    queryFn: () => getEmployeeDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useHRAttendance(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['hr', 'attendance', params],
    queryFn: () => getHRAttendance(params),
    staleTime: 1000 * 60 * 3,
  });
}

export function useLeaveRequests(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['hr', 'leaves', params],
    queryFn: () => getLeaveRequests(params),
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => createEmployee(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteEmployee(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'employees'] });
    },
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeavePayload) => createLeaveRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leaves'] });
    },
  });
}

export function useApproveLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => approveLeaveRequest(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leaves'] });
    },
  });
}

export function useRejectLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string | number; reason?: string }) => rejectLeaveRequest(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hr', 'leaves'] });
    },
  });
}
