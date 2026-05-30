import { API_ENDPOINTS, getApiUrl } from '@/lib/axios';
import type { ApiResponse, Project } from '@/types';

export type AnalyticsRange = 'week' | 'month';

export interface AnalyticsParams {
  range: AnalyticsRange;
  projectId?: string;
  startDate?: string;
  endDate?: string;
  dateField?: 'createdAt' | 'updatedAt' | 'due_date';
}

export interface AnalyticsSummary {
  total: number;
  done: number;
  in_progress: number;
  review: number;
  needs_revision: number;
  todo: number;
  overdue: number;
  kpi: number;
}

export interface PerformanceRow {
  user_id: string;
  full_name: string;
  email: string;
  avatar?: string;
  total: number;
  done: number;
  completion_rate: number;
}

export interface EmployeeAnalyticsRow {
  user_id: string;
  full_name: string;
  email: string;
  avatar?: string;
  role?: string;
  position_title?: string;
  total: number;
  done_on_time: number;
  done_late: number;
  review: number;
  in_progress: number;
  overdue: number;
  project_count: number;
  completion_rate: number;
}

export interface EmployeeAnalyticsResponse {
  rows: EmployeeAnalyticsRow[];
  totals: {
    total: number;
    done_on_time: number;
    done_late: number;
    review: number;
    in_progress: number;
    overdue: number;
  };
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

const withAnalyticsParams = (endpoint: string, params: AnalyticsParams) => {
  const url = new URL(getApiUrl(endpoint));
  url.searchParams.set('range', params.range);

  if (params.projectId && params.projectId !== 'all') {
    url.searchParams.set('projectId', params.projectId);
  }
  if (params.startDate) url.searchParams.set('startDate', params.startDate);
  if (params.endDate) url.searchParams.set('endDate', params.endDate);
  if (params.dateField) url.searchParams.set('dateField', params.dateField);

  return url.toString();
};

export const analyticsService = {
  getSummary: async (token: string, params: AnalyticsParams): Promise<AnalyticsSummary> => {
    const response = await fetch(withAnalyticsParams(API_ENDPOINTS.ANALYTICS.SUMMARY, params), {
      headers: authHeaders(token),
    });

    const payload = await readJson<ApiResponse<AnalyticsSummary>>(response);
    return payload.data || {
      total: 0,
      done: 0,
      in_progress: 0,
      review: 0,
      needs_revision: 0,
      todo: 0,
      overdue: 0,
      kpi: 0,
    };
  },

  getPerformance: async (token: string, params: AnalyticsParams): Promise<PerformanceRow[]> => {
    const response = await fetch(withAnalyticsParams(API_ENDPOINTS.ANALYTICS.PERFORMANCE, params), {
      headers: authHeaders(token),
    });

    const payload = await readJson<ApiResponse<PerformanceRow[]>>(response);
    return payload.data || [];
  },

  getEmployees: async (token: string, params: AnalyticsParams): Promise<EmployeeAnalyticsResponse> => {
    const response = await fetch(withAnalyticsParams(API_ENDPOINTS.ANALYTICS.EMPLOYEES, params), {
      headers: authHeaders(token),
    });

    const payload = await readJson<ApiResponse<EmployeeAnalyticsResponse>>(response);
    return payload.data || {
      rows: [],
      totals: {
        total: 0,
        done_on_time: 0,
        done_late: 0,
        review: 0,
        in_progress: 0,
        overdue: 0,
      },
    };
  },

  getProjects: async (token: string): Promise<Project[]> => {
    const response = await fetch(getApiUrl(API_ENDPOINTS.ANALYTICS.PROJECTS), {
      headers: authHeaders(token),
    });

    const payload = await readJson<ApiResponse<Project[]>>(response);
    return (payload.data || []).map((project) => ({
      ...project,
      id: project.id || project._id || '',
      progress: project.progress ?? 0,
    }));
  },
};
