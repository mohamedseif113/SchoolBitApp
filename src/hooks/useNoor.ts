import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNoorStatus, syncNoorData } from '../api/noor';

export function useNoorStatus() {
  return useQuery({
    queryKey: ['noor', 'status'],
    queryFn: () => getNoorStatus(),
    staleTime: 1000 * 60 * 3,
    refetchOnWindowFocus: false,
  });
}

export function useSyncNoorData() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => syncNoorData(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['noor'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
