import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWhatsAppStatus,
  connectWhatsApp,
  disconnectWhatsApp,
  getWhatsAppQR,
  sendTestWhatsAppMessage,
} from '../api/whatsapp';

export function useWhatsAppStatus() {
  return useQuery({
    queryKey: ['whatsapp', 'status'],
    queryFn: () => getWhatsAppStatus(),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useWhatsAppQR() {
  return useQuery({
    queryKey: ['whatsapp', 'qr'],
    queryFn: () => getWhatsAppQR(),
    staleTime: 1000 * 30,
  });
}

export function useConnectWhatsApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => connectWhatsApp(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp'] });
    },
  });
}

export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => disconnectWhatsApp(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp'] });
    },
  });
}

export function useSendTestWhatsAppMessage() {
  return useMutation({
    mutationFn: (phone: string) => sendTestWhatsAppMessage(phone),
  });
}
