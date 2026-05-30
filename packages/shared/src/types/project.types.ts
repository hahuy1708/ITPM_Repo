import type { ProjectStatusValue, ProjectVisibilityValue } from "../constants/project-status";
import type { Department, User } from "./user.types";
import type { TaskGroup } from "./task.types";

export interface Project {
  _id?: string;
  id: string;
  name: string;
  description?: string;
  color?: string;
  status: ProjectStatusValue;
  visibility?: ProjectVisibilityValue;
  progress?: number;
  start_date?: string;
  end_date?: string;
  department_id?: string | Department;
  owner_id?: string | User;
  member_ids?: Array<string | User>;
  task_groups?: TaskGroup[];
  createdAt?: string;
  updatedAt?: string;
}
