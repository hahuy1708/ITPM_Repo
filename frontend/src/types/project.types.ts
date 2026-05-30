/**
 * Project Types
 * Phân hệ: LÕI CÔNG VIỆC
 */

import type { ProjectStatusValue, ProjectVisibilityValue } from '@itpm/shared';
import type { User, Department } from './user.types';

export type ProjectStatus = ProjectStatusValue;
export type ProjectVisibility = ProjectVisibilityValue;

export interface Project {
  _id?: string;
  id: string;
  name: string;
  description?: string;
  color?: string;
  status: ProjectStatus;
  visibility?: ProjectVisibility;
  progress: number;
  start_date?: string;
  end_date?: string;
  department_id?: string | Department;
  department?: Department;
  folder_id?: string | { _id?: string; id?: string; name: string } | null;
  owner_id?: string | User;
  owner?: User;
  member_ids?: Array<string | User>;
  members?: User[];
  createdAt?: string;
  updatedAt?: string;
}
