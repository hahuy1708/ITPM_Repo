import { API_ENDPOINTS, getApiUrl } from '@/lib/axios';
import type { ApiResponse } from '@/types';
import type { PermissionSectionDefinition } from '@itpm/shared';

export type PermissionScopeType = 'project' | 'department';

export interface PermissionEntry {
  permission_key: string;
  role_key: string;
  allowed: boolean;
  locked?: boolean;
}

export interface PermissionMatrixResponse {
  scope_type: PermissionScopeType;
  scope_id: string;
  sections: PermissionSectionDefinition[];
  entries: PermissionEntry[];
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

export const permissionService = {
  getPermissions: async (
    scopeType: PermissionScopeType,
    scopeId: string,
    token: string
  ): Promise<PermissionMatrixResponse> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.PERMISSIONS.GET(scopeType, scopeId)), {
      headers: authHeaders(token),
    });

    const payload = await readJson<ApiResponse<PermissionMatrixResponse>>(response);
    if (!payload.data) throw new Error('Permission matrix not found');
    return payload.data;
  },

  updatePermissions: async (
    scopeType: PermissionScopeType,
    scopeId: string,
    entries: PermissionEntry[],
    token: string
  ): Promise<PermissionMatrixResponse> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.PERMISSIONS.UPDATE(scopeType, scopeId)), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...authHeaders(token),
      },
      body: JSON.stringify({ entries }),
    });

    const payload = await readJson<ApiResponse<PermissionMatrixResponse>>(response);
    if (!payload.data) throw new Error('Permission matrix not found');
    return payload.data;
  },
};
