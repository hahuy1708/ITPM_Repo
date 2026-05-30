export enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  REVIEW = "review",
  NEEDS_REVISION = "needs_revision",
  DONE = "done",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export enum ReviewStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

export const TASK_STATUSES = Object.values(TaskStatus);
export const TASK_PRIORITIES = Object.values(TaskPriority);
export type TaskStatusValue = `${TaskStatus}`;
export type TaskPriorityValue = `${TaskPriority}`;
export type ReviewStatusValue = `${ReviewStatus}`;
