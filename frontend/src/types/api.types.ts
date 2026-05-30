/**
 * API Response Types
 * Chuẩn hóa response từ backend
 */

import type { Task } from './task.types';
import type { ApiResponse as SharedApiResponse } from '@itpm/shared';

export type ApiResponse<T> = SharedApiResponse<T>;

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    total: number;
    skip: number;
    limit: number;
  };
}

export interface KanbanResponse {
  success: boolean;
  data: {
    todo: Task[];
    in_progress: Task[];
    review: Task[];
    done: Task[];
  };
}
