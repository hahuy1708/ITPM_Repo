export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: unknown;
  };
};

export type PaginatedResponse<T> = ApiResponse<T[]> & {
  pagination?: {
    total: number;
    skip?: number;
    limit: number;
    page?: number;
    pages?: number;
  };
};
