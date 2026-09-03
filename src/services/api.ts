export { BASE_URL, apiClient as default } from '../api/client';
export { getToken, setToken, removeToken, TOKEN_KEY } from '../utils/secureStorage';
export { ApiError } from '../types/api';

export function buildQuery(params: Record<string, any> = {}): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  return entries.length ? '?' + new URLSearchParams(entries.map(([k, v]) => [k, String(v)])).toString() : '';
}

import apiClient from '../api/client';

export async function apiFetch<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  let data: any = undefined;

  if (options.body) {
    if (typeof options.body === 'string') {
      try {
        data = JSON.parse(options.body);
      } catch {
        data = options.body;
      }
    } else {
      data = options.body;
    }
  }

  const response = await apiClient.request<T>({
    url: endpoint,
    method,
    data,
    headers: options.headers as any,
  });

  return response.data;
}
