import { API_ENDPOINTS, getApiUrl } from '@/lib/axios';
import type { ApiResponse, User } from '@/types';

export interface Folder {
  _id?: string;
  id?: string;
  name: string;
  created_by?: string | User;
  createdAt?: string;
  updatedAt?: string;
}

const authHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

const readJson = async <T>(response: Response): Promise<T> => {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || response.statusText);
  }
  return payload;
};

export const folderService = {
  getFolders: async (token: string): Promise<ApiResponse<Folder[]>> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.FOLDERS.LIST), {
      headers: authHeaders(token),
    });
    return readJson<ApiResponse<Folder[]>>(response);
  },

  createFolder: async (name: string, token: string): Promise<ApiResponse<Folder>> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.FOLDERS.CREATE), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({ name }),
    });
    return readJson<ApiResponse<Folder>>(response);
  },

  updateFolder: async (id: string, name: string, token: string): Promise<ApiResponse<Folder>> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.FOLDERS.UPDATE(id)), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({ name }),
    });
    return readJson<ApiResponse<Folder>>(response);
  },
};
