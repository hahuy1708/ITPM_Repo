const TaskStatus = Object.freeze({
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  REVIEW: "review",
  NEEDS_REVISION: "needs_revision",
  DONE: "done",
});

const TaskPriority = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
});

const ReviewStatus = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

module.exports = {
  TaskStatus,
  TaskPriority,
  ReviewStatus,
  TASK_STATUSES: Object.freeze(Object.values(TaskStatus)),
  TASK_PRIORITIES: Object.freeze(Object.values(TaskPriority)),
  REVIEW_STATUSES: Object.freeze(Object.values(ReviewStatus)),
};
