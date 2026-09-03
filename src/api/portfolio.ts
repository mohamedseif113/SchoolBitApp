import apiClient from './client';
import {
  PortfolioItem,
  PortfolioDocument,
  PortfolioNote,
  CreatePortfolioPayload,
} from '../types/portfolio';

export async function getPortfolioList(params: Record<string, any> = {}): Promise<PortfolioItem[]> {
  const response = await apiClient.get('/portfolio', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getPortfolioDetail(id: string | number): Promise<PortfolioItem> {
  const response = await apiClient.get<PortfolioItem>(`/portfolio/${id}`);
  return response.data?.data || response.data;
}

export async function createPortfolio(payload: CreatePortfolioPayload): Promise<PortfolioItem> {
  const response = await apiClient.post<PortfolioItem>('/portfolio', payload);
  return response.data?.data || response.data;
}

export async function updatePortfolio(id: string | number, payload: Partial<CreatePortfolioPayload>): Promise<PortfolioItem> {
  const response = await apiClient.put<PortfolioItem>(`/portfolio/${id}`, payload);
  return response.data?.data || response.data;
}

export async function deletePortfolio(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/portfolio/${id}`);
  return response.data;
}

export async function getPortfolioDocuments(id: string | number): Promise<PortfolioDocument[]> {
  const response = await apiClient.get(`/portfolio/${id}/documents`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function uploadPortfolioDocument(id: string | number, payload: { file_name: string; file_url?: string }): Promise<PortfolioDocument> {
  const response = await apiClient.post<PortfolioDocument>(`/portfolio/${id}/documents`, payload);
  return response.data?.data || response.data;
}

export async function deletePortfolioDocument(id: string | number, documentId: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/portfolio/${id}/documents/${documentId}`);
  return response.data;
}

// Official API: portfolio notes are at /feedback (not /notes)
export async function getPortfolioNotes(id: string | number): Promise<PortfolioNote[]> {
  const response = await apiClient.get(`/portfolio/${id}/feedback`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function addPortfolioNote(id: string | number, payload: { content: string }): Promise<PortfolioNote> {
  const response = await apiClient.post<PortfolioNote>(`/portfolio/${id}/feedback`, payload);
  return response.data?.data || response.data;
}

export async function approvePortfolio(id: string | number): Promise<PortfolioItem> {
  const response = await apiClient.post<PortfolioItem>(`/portfolio/${id}/approve`);
  return response.data?.data || response.data;
}

// Official API: reminder endpoint is /reminder (not /remind)
export async function remindPortfolio(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.post(`/portfolio/${id}/reminder`);
  return response.data;
}

export const portfolioApi = {
  getPortfolioList,
  getPortfolioDetail,
  createPortfolio,
  updatePortfolio,
  deletePortfolio,
  getPortfolioDocuments,
  uploadPortfolioDocument,
  deletePortfolioDocument,
  getPortfolioNotes,
  addPortfolioNote,
  approvePortfolio,
  remindPortfolio,
};

export default portfolioApi;
