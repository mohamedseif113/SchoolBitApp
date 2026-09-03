import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPortfolioList,
  getPortfolioDetail,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  getPortfolioDocuments,
  uploadPortfolioDocument,
  getPortfolioNotes,
  addPortfolioNote,
  approvePortfolio,
  remindPortfolio,
} from '../api/portfolio';
import { CreatePortfolioPayload } from '../types/portfolio';

export function usePortfolioList(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['portfolio', 'list', params],
    queryFn: () => getPortfolioList(params),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function usePortfolioDetail(id?: string | number) {
  return useQuery({
    queryKey: ['portfolio', 'detail', id],
    queryFn: () => getPortfolioDetail(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function usePortfolioDocuments(id?: string | number) {
  return useQuery({
    queryKey: ['portfolio', 'documents', id],
    queryFn: () => getPortfolioDocuments(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function usePortfolioNotes(id?: string | number) {
  return useQuery({
    queryKey: ['portfolio', 'notes', id],
    queryFn: () => getPortfolioNotes(id!),
    enabled: !!id,
    staleTime: 1000 * 60 * 3,
  });
}

export function useCreatePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePortfolioPayload) => createPortfolio(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

export function useApprovePortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => approvePortfolio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}

export function useRemindPortfolio() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => remindPortfolio(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
    },
  });
}
