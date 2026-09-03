import apiClient from './client';
import { NoorStatus, NoorSyncResult } from '../types/noor';

export async function getNoorStatus(): Promise<NoorStatus> {
  const response = await apiClient.get<NoorStatus>('/noor/status');
  return response.data?.data || response.data;
}

export async function syncNoorData(): Promise<NoorSyncResult> {
  const response = await apiClient.post<NoorSyncResult>('/noor/sync');
  return response.data?.data || response.data;
}

export const noorApi = {
  getNoorStatus,
  syncNoorData,
};

export default noorApi;
