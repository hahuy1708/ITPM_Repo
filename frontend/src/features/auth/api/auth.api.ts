import { API_ENDPOINTS, getApiUrl } from '@/lib/axios';
import type { ApiResponse, Invitation, User, UserRole } from '@/types';

interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token?: string;
  requiresPasswordChange?: boolean;
  passwordChangeToken?: string;
}

interface InviteRequest {
  email: string;
  full_name: string;
  role: UserRole;
  department_id?: string;
  position_title?: string;
  manager_id?: string;
  notification_email?: string;
}

interface AcceptInviteRequest {
  token: string;
  full_name: string;
  password: string;
}

interface ChangePasswordRequest {
  passwordChangeToken: string;
  newPassword: string;
}

interface ForgotPasswordRequest {
  email: string;
}

interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

const readJson = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.message || response.statusText);
  }
  return payload;
};

const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return atob(padded);
};

const isExpiredJwt = (token: string) => {
  const [, payload] = token.split('.');
  if (!payload) return false;

  try {
    const decoded = JSON.parse(decodeBase64Url(payload)) as { exp?: number };
    return typeof decoded.exp === 'number' && decoded.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
};

export const authService = {
  login: async (data: LoginRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.LOGIN), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return readJson<LoginResponse>(response);
  },

  changePassword: async (data: ChangePasswordRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.CHANGE_PASSWORD), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return readJson<LoginResponse>(response);
  },

  forgotPassword: async (data: ForgotPasswordRequest): Promise<ApiResponse<null>> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.FORGOT_PASSWORD), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return readJson<null>(response);
  },

  resetPassword: async (data: ResetPasswordRequest): Promise<ApiResponse<null>> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.AUTH.RESET_PASSWORD), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    return readJson<null>(response);
  },

  sendInvitation: async (data: InviteRequest, token: string): Promise<ApiResponse<unknown>> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.WORKSPACE.INVITE), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    return readJson<unknown>(response);
  },

  acceptInvitation: async (data: AcceptInviteRequest): Promise<ApiResponse<LoginResponse>> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.WORKSPACE.ACCEPT_INVITE), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    });

    return readJson<LoginResponse>(response);
  },

  getInvitations: async (token: string, status?: string): Promise<ApiResponse<Invitation[]>> => {
    const url = new URL(getApiUrl(API_ENDPOINTS.WORKSPACE.INVITATIONS));
    if (status) {
      url.searchParams.set('status', status);
    }

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return readJson<Invitation[]>(response);
  },

  getToken: (): string | null => {
    const token = localStorage.getItem('authToken');
    if (token && isExpiredJwt(token)) {
      authService.clearToken();
      return null;
    }
    return token;
  },

  setToken: (token: string): void => {
    localStorage.setItem('authToken', token);
  },

  clearToken: (): void => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
  },

  getCurrentUser: (): User | null => {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  },

  setCurrentUser: (user: User): void => {
    localStorage.setItem('currentUser', JSON.stringify(user));
  },
};
