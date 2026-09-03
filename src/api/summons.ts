import apiClient from './client';
import {
  Summons,
  SummonsFilterParams,
  CreateSummonsPayload,
  UpdateSummonsPayload,
} from '../types/summons';

export async function getSummons(params: SummonsFilterParams = {}): Promise<Summons[]> {
  const response = await apiClient.get('/summons', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getSummonsDetail(id: string | number): Promise<Summons> {
  const response = await apiClient.get<Summons>(`/summons/${id}`);
  return response.data?.data || response.data;
}

export async function createSummons(payload: CreateSummonsPayload): Promise<Summons> {
  const response = await apiClient.post<Summons>('/summons', payload);
  return response.data?.data || response.data;
}

export async function updateSummons(id: string | number, payload: Partial<CreateSummonsPayload>): Promise<Summons> {
  const response = await apiClient.put<Summons>(`/summons/${id}`, payload);
  return response.data?.data || response.data;
}

export async function deleteSummons(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/summons/${id}`);
  return response.data;
}

export async function completeSummons(
  id: string | number,
  data?: { outcome_notes?: string }
): Promise<Summons> {
  const response = await apiClient.post<Summons>(`/summons/${id}/complete`, data);
  return response.data?.data || response.data;
}

export async function cancelSummons(
  id: string | number,
  data?: { cancellation_reason?: string }
): Promise<Summons> {
  const response = await apiClient.post<Summons>(`/summons/${id}/cancel`, data);
  return response.data?.data || response.data;
}

export async function markNoShow(id: string | number): Promise<Summons> {
  const response = await apiClient.post<Summons>(`/summons/${id}/no-show`);
  return response.data?.data || response.data;
}

export const summonsApi = {
  getSummons,
  getSummonsDetail,
  createSummons,
  updateSummons,
  deleteSummons,
  completeSummons,
  cancelSummons,
  markNoShow,
};

export default summonsApi;
