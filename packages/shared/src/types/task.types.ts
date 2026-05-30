import type { TaskPriorityValue, TaskStatusValue, ReviewStatusValue } from "../constants/task-status";
import type { Project } from "./project.types";
import type { User } from "./user.types";
import type { Attachment } from "./file.types";

export interface Subtask {
  _id?: string;
  id: string;
  title: string;
  text?: string;
  is_completed?: boolean;
  isDone?: boolean;
  done?: boolean;
}

export interface TaskDependency {
  _id?: string;
  id?: string;
  title: string;
  status: TaskStatusValue;
  due_date?: string;
}

export interface TaskGroup {
  key: string;
  name: string;
  task_count?: number;
  order_index?: number;
  created_at?: string;
  created_by?: string | User;
}

export interface ExecutionResult {
  note?: string;
  submitted_files?: Attachment[];
  submitted_at?: string;
  review_status?: ReviewStatusValue;
  feedback?: string;
  reject_reason?: string;
  reviewed_at?: string;
  reviewed_by?: string;
}

export interface TaskKpiResult {
  score?: number;
  difficulty_weight?: number;
  timeliness_bonus?: number;
  days_delta?: number;
  completed_early?: boolean;
  calculated_at?: string;
}

export interface Task {
  _id?: string;
  id: string;
  title: string;
  content_html?: string;
  description?: string;
  status: TaskStatusValue;
  priority: TaskPriorityValue;
  group_key?: string;
  group_name?: string;
  kpi_weight?: number;
  start_date?: string;
  due_date?: string;
  actualStartDate?: string;
  actualFinishDate?: string;
  attachment_count?: number;
  attachments?: Attachment[];
  subtasks?: Subtask[];
  project_id: string;
  project?: Project;
  assignee_id?: string;
  assignee?: User;
  reviewer_id?: string;
  reviewer?: User;
  created_by?: string;
  createdBy?: User;
  dependency_ids?: Array<string | TaskDependency>;
  dependencies?: TaskDependency[];
  execution_result?: ExecutionResult;
  kpi_result?: TaskKpiResult;
  createdAt?: string;
  updatedAt?: string;
}
