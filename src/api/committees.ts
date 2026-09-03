import apiClient from './client';
import {
  Committee,
  CommitteeMember,
  CommitteeTask,
  CommitteeMeeting,
  CommitteeFile,
  CreateCommitteePayload,
} from '../types/committee';

export async function getCommittees(params: Record<string, any> = {}): Promise<Committee[]> {
  const response = await apiClient.get('/committees', { params });
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function getCommittee(id: string | number): Promise<Committee> {
  const response = await apiClient.get<Committee>(`/committees/${id}`);
  return response.data?.data || response.data;
}

export async function createCommittee(payload: CreateCommitteePayload): Promise<Committee> {
  const response = await apiClient.post<Committee>('/committees', payload);
  return response.data?.data || response.data;
}

export async function updateCommittee(id: string | number, payload: Partial<CreateCommitteePayload>): Promise<Committee> {
  const response = await apiClient.put<Committee>(`/committees/${id}`, payload);
  return response.data?.data || response.data;
}

export async function deleteCommittee(id: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/committees/${id}`);
  return response.data;
}

// Committee Members
export async function getCommitteeMembers(committeeId: string | number): Promise<CommitteeMember[]> {
  const response = await apiClient.get(`/committees/${committeeId}/members`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function addCommitteeMember(committeeId: string | number, payload: { user_id: string | number; role: string }): Promise<CommitteeMember> {
  const response = await apiClient.post<CommitteeMember>(`/committees/${committeeId}/members`, payload);
  return response.data?.data || response.data;
}

export async function removeCommitteeMember(committeeId: string | number, memberId: string | number): Promise<{ success: boolean }> {
  const response = await apiClient.delete(`/committees/${committeeId}/members/${memberId}`);
  return response.data;
}

// Committee Tasks
export async function getCommitteeTasks(committeeId: string | number): Promise<CommitteeTask[]> {
  const response = await apiClient.get(`/committees/${committeeId}/tasks`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function createCommitteeTask(committeeId: string | number, payload: { title: string; due_date?: string }): Promise<CommitteeTask> {
  const response = await apiClient.post<CommitteeTask>(`/committees/${committeeId}/tasks`, payload);
  return response.data?.data || response.data;
}

// Committee Meetings
export async function getCommitteeMeetings(committeeId: string | number): Promise<CommitteeMeeting[]> {
  const response = await apiClient.get(`/committees/${committeeId}/meetings`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function createCommitteeMeeting(committeeId: string | number, payload: { title: string; meeting_date: string }): Promise<CommitteeMeeting> {
  const response = await apiClient.post<CommitteeMeeting>(`/committees/${committeeId}/meetings`, payload);
  return response.data?.data || response.data;
}

// Committee Files
export async function getCommitteeFiles(committeeId: string | number): Promise<CommitteeFile[]> {
  const response = await apiClient.get(`/committees/${committeeId}/files`);
  const data = response.data?.data || response.data;
  return Array.isArray(data) ? data : [];
}

export async function uploadCommitteeFile(committeeId: string | number, payload: { file_name: string; file_url?: string }): Promise<CommitteeFile> {
  const response = await apiClient.post<CommitteeFile>(`/committees/${committeeId}/files`, payload);
  return response.data?.data || response.data;
}

export const committeesApi = {
  getCommittees,
  getCommittee,
  createCommittee,
  updateCommittee,
  deleteCommittee,
  getCommitteeMembers,
  addCommitteeMember,
  removeCommitteeMember,
  getCommitteeTasks,
  createCommitteeTask,
  getCommitteeMeetings,
  createCommitteeMeeting,
  getCommitteeFiles,
  uploadCommitteeFile,
};

export default committeesApi;
