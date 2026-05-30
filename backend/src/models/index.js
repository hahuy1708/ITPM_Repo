/**
 * MODELS INDEX FILE
 * Tập hợp tất cả các Mongoose models cho dễ import
 */

module.exports = {
  User: require('../modules/users/user.model'),
  Invitation: require('../modules/invitations/invitation.model'),
  Department: require('../modules/departments/department.model'),
  Folder: require('../modules/folders/folder.model'),
  Project: require('../modules/projects/project.model'),
  Task: require('../modules/tasks/task.model'),
  Comment: require('../modules/comments/comment.model'),
  Notification: require('../modules/notifications/notification.model'),
  Conversation: require('../modules/conversations/conversation.model'),
  Message: require('../modules/conversations/message.model'),
  ActivityLog: require('../modules/audit-logs/activity-log.model'),
  PermissionMatrix: require('../modules/permissions/permission.model'),
};
