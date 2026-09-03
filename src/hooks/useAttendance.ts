import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAttendanceSummary, getDailyAttendance, saveAttendance as saveAttendanceApi } from '../api/attendance';
import { SaveAttendancePayload, AttendanceSummaryData, ClassAttendanceItem } from '../types/attendance';

export function useAttendance(date?: string) {
  const queryClient = useQueryClient();

  const summaryQuery = useQuery<AttendanceSummaryData>({
    queryKey: ['attendance', 'summary', date],
    queryFn: () => getAttendanceSummary(date),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });

  const dailyQuery = useQuery<ClassAttendanceItem[]>({
    queryKey: ['attendance', 'daily', date],
    queryFn: () => getDailyAttendance(date),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: SaveAttendancePayload) => saveAttendanceApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const isLoading = summaryQuery.isLoading || dailyQuery.isLoading;
  const isError = summaryQuery.isError || dailyQuery.isError;
  const error = summaryQuery.error || dailyQuery.error;

  const refetchAll = async () => {
    await Promise.all([summaryQuery.refetch(), dailyQuery.refetch()]);
  };

  return {
    summary: summaryQuery.data,
    classes: Array.isArray(dailyQuery.data) ? dailyQuery.data : [],
    isLoading,
    isError,
    error,
    refetch: refetchAll,
    saveAttendance: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}

export default useAttendance;
