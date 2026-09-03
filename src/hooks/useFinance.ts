import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBillingSummary,
  getInvoices,
  getPayLinks,
  createPayLink,
  deletePayLink,
  getPaymentGateways,
  getSubscription,
  getPlans,
  submitBankTransfer,
} from '../api/finance';
import { BankTransferPayload } from '../types/finance';

export function useBillingSummary() {
  return useQuery({
    queryKey: ['finance', 'summary'],
    queryFn: () => getBillingSummary(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useInvoices(params: Record<string, any> = {}) {
  return useQuery({
    queryKey: ['finance', 'invoices', params],
    queryFn: () => getInvoices(params),
    staleTime: 1000 * 60 * 3,
  });
}

export function usePayLinks() {
  return useQuery({
    queryKey: ['finance', 'payLinks'],
    queryFn: () => getPayLinks(),
    staleTime: 1000 * 60 * 3,
  });
}

export function usePaymentGateways() {
  return useQuery({
    queryKey: ['finance', 'gateways'],
    queryFn: () => getPaymentGateways(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ['finance', 'subscription'],
    queryFn: () => getSubscription(),
    staleTime: 1000 * 60 * 5,
  });
}

export function usePlans() {
  return useQuery({
    queryKey: ['finance', 'plans'],
    queryFn: () => getPlans(),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreatePayLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { title: string; amount: number }) => createPayLink(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'payLinks'] });
    },
  });
}

export function useDeletePayLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) => deletePayLink(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance', 'payLinks'] });
    },
  });
}

export function useSubmitBankTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: BankTransferPayload) => submitBankTransfer(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance'] });
    },
  });
}
