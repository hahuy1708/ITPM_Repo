const Permission = Object.freeze({
  MANAGE_USERS: "manage_users",
  MANAGE_DEPARTMENTS: "manage_departments",
  MANAGE_PROJECTS: "manage_projects",
  MANAGE_TASKS: "manage_tasks",
  REVIEW_TASKS: "review_tasks",
  VIEW_ANALYTICS: "view_analytics",
  CREATE_TASK: "create_task",
  CREATE_TASK_GROUP: "create_task_group",
  VIEW_OTHER_TASKS: "view_other_tasks",
  ASSIGN_TASK_TO_OTHERS: "assign_task_to_others",
  VIEW_WORKSPACE_REPORTS: "view_workspace_reports",
  CREATE_DISCUSSION: "create_discussion",
  CREATE_DOCUMENT: "create_document",
  EDIT_TASK_TITLE: "edit_task_title",
  MARK_TASK_DONE: "mark_task_done",
  EDIT_TASK_DESCRIPTION: "edit_task_description",
  EDIT_TASK_SCHEDULE: "edit_task_schedule",
});

const ROLE_PERMISSIONS = Object.freeze({
  admin: Object.freeze(Object.values(Permission)),
  manager: Object.freeze([
    Permission.MANAGE_PROJECTS,
    Permission.MANAGE_TASKS,
    Permission.REVIEW_TASKS,
    Permission.VIEW_ANALYTICS,
    Permission.CREATE_TASK,
    Permission.CREATE_TASK_GROUP,
    Permission.VIEW_OTHER_TASKS,
    Permission.ASSIGN_TASK_TO_OTHERS,
    Permission.VIEW_WORKSPACE_REPORTS,
    Permission.CREATE_DISCUSSION,
    Permission.CREATE_DOCUMENT,
    Permission.EDIT_TASK_TITLE,
    Permission.MARK_TASK_DONE,
    Permission.EDIT_TASK_DESCRIPTION,
    Permission.EDIT_TASK_SCHEDULE,
  ]),
  member: Object.freeze([
    Permission.CREATE_TASK,
    Permission.CREATE_DISCUSSION,
    Permission.CREATE_DOCUMENT,
    Permission.MARK_TASK_DONE,
    Permission.EDIT_TASK_DESCRIPTION,
  ]),
  guest: Object.freeze([
    Permission.VIEW_OTHER_TASKS,
  ]),
  employee: Object.freeze([]),
});

const PERMISSION_ROLE_KEYS = Object.freeze(["manager", "member", "guest", "assignee", "follower", "other"]);

const PERMISSION_SECTIONS = Object.freeze([
  Object.freeze({
    key: "account-type",
    title: "PHAN QUYEN SU DUNG THEO LOAI TAI KHOAN",
    roleKeys: Object.freeze(["manager", "member", "guest"]),
    permissions: Object.freeze([
      Object.freeze({ key: Permission.CREATE_TASK, label: "Tao cong viec moi", description: "Quyen tao cong viec moi trong workspace." }),
      Object.freeze({ key: Permission.CREATE_TASK_GROUP, label: "Tao nhom cong viec moi", description: "Quyen tao group/phase de gom task." }),
      Object.freeze({ key: Permission.VIEW_OTHER_TASKS, label: "Xem cong viec cua nguoi khac", description: "Cho phep xem task khong do minh phu trach." }),
      Object.freeze({ key: Permission.ASSIGN_TASK_TO_OTHERS, label: "Quyen xem - giao viec cho nguoi khac", description: "Cho phep giao task hoac doi nguoi phu trach.", danger: true }),
      Object.freeze({ key: Permission.VIEW_WORKSPACE_REPORTS, label: "Quyen xem bao cao tong the", description: "Cho phep xem dashboard, KPI va analytics tong hop." }),
      Object.freeze({ key: Permission.CREATE_DISCUSSION, label: "Quyen tao thao luan moi", description: "Cho phep tao thread thao luan trong workspace." }),
      Object.freeze({ key: Permission.CREATE_DOCUMENT, label: "Quyen tao tai lieu moi", description: "Cho phep tao tai lieu va upload file vao workspace." }),
    ]),
  }),
  Object.freeze({
    key: "task-update",
    title: "PHAN QUYEN CHINH SUA - CAP NHAT CONG VIEC",
    roleKeys: Object.freeze(["assignee", "follower", "other"]),
    permissions: Object.freeze([
      Object.freeze({ key: Permission.EDIT_TASK_TITLE, label: "Chinh sua ten cong viec", description: "Doi tieu de task trong he thong.", danger: true }),
      Object.freeze({ key: Permission.MARK_TASK_DONE, label: "Quyen mark done-undone", description: "Cap nhat tien trinh done/undone theo luong duyet task." }),
      Object.freeze({ key: Permission.EDIT_TASK_DESCRIPTION, label: "Chinh sua mieu ta cong viec", description: "Cap nhat mo ta, checklist va noi dung nghiem thu." }),
      Object.freeze({ key: Permission.EDIT_TASK_SCHEDULE, label: "Chinh sua thoi gian start-date-deadline", description: "Doi ngay bat dau, deadline hoac keo Gantt.", danger: true }),
    ]),
  }),
]);

module.exports = {
  Permission,
  ROLE_PERMISSIONS,
  PERMISSION_ROLE_KEYS,
  PERMISSION_SECTIONS,
};
