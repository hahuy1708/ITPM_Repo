const NotificationType = Object.freeze({
  MENTION: "mention",
  TASK_COMMENT: "task_comment",
  TASK_ASSIGNED: "task_assigned",
  TASK_REASSIGNED: "task_reassigned",
  TASK_REVIEW_REQUESTED: "task_review_requested",
  REVIEW_REQUESTED: "review_requested",
  REVIEW_APPROVED: "review_approved",
  REVIEW_REJECTED: "review_rejected",
  DEADLINE_DUE: "deadline_due",
  DEADLINE_OVERDUE: "deadline_overdue",
  SYSTEM: "system",
});

module.exports = {
  NotificationType,
  NOTIFICATION_TYPES: Object.freeze(Object.values(NotificationType)),
};
