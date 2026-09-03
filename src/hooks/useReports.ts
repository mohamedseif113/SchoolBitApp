import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getReportTemplates,
  generateReport,
  getReportHistory,
  downloadReport,
  getScheduledReports,
  createScheduledReport,
  updateScheduledReport,
  deleteScheduledReport,
} from '../api/reports';
import { GenerateReportPayload, ScheduledReport } from '../types/report';

export function useReportTemplates(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['reports', 'templates', params],
    queryFn: () => getReportTemplates(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useReportHistory(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['reports', 'history', params],
    queryFn: () => getReportHistory(params),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useScheduledReports(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['reports', 'scheduled', params],
    queryFn: () => getScheduledReports(params),
    staleTime: 1000 * 60 * 3,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: GenerateReportPayload) => generateReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'history'] });
    },
  });
}

export function useDownloadReport() {
  return useMutation({
    mutationFn: (id: string | number) => downloadReport(id),
  });
}

export function useCreateScheduledReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<ScheduledReport>) => createScheduledReport(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'scheduled'] });
    },
  });
}

export function useDeleteScheduledReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deleteScheduledReport(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'scheduled'] });
    },
  });
}
