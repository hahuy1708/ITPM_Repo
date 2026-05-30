export enum Permission {
  MANAGE_USERS = "manage_users",
  MANAGE_DEPARTMENTS = "manage_departments",
  MANAGE_PROJECTS = "manage_projects",
  MANAGE_TASKS = "manage_tasks",
  REVIEW_TASKS = "review_tasks",
  VIEW_ANALYTICS = "view_analytics",
  CREATE_TASK = "create_task",
  CREATE_TASK_GROUP = "create_task_group",
  VIEW_OTHER_TASKS = "view_other_tasks",
  ASSIGN_TASK_TO_OTHERS = "assign_task_to_others",
  VIEW_WORKSPACE_REPORTS = "view_workspace_reports",
  CREATE_DISCUSSION = "create_discussion",
  CREATE_DOCUMENT = "create_document",
  EDIT_TASK_TITLE = "edit_task_title",
  MARK_TASK_DONE = "mark_task_done",
  EDIT_TASK_DESCRIPTION = "edit_task_description",
  EDIT_TASK_SCHEDULE = "edit_task_schedule",
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.values(Permission),
  manager: [
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
  ],
  member: [
    Permission.CREATE_TASK,
    Permission.CREATE_DISCUSSION,
    Permission.CREATE_DOCUMENT,
    Permission.MARK_TASK_DONE,
    Permission.EDIT_TASK_DESCRIPTION,
  ],
  guest: [
    Permission.VIEW_OTHER_TASKS,
  ],
  employee: [],
};

export type PermissionRoleKey = "manager" | "member" | "guest" | "assignee" | "follower" | "other";

export interface PermissionDefinition {
  key: Permission;
  label: string;
  description: string;
  danger?: boolean;
}

export interface PermissionSectionDefinition {
  key: string;
  title: string;
  roleKeys: PermissionRoleKey[];
  permissions: PermissionDefinition[];
}

export const PERMISSION_SECTIONS: PermissionSectionDefinition[] = [
  {
    key: "account-type",
    title: "PHAN QUYEN SU DUNG THEO LOAI TAI KHOAN",
    roleKeys: ["manager", "member", "guest"],
    permissions: [
      { key: Permission.CREATE_TASK, label: "Tao cong viec moi", description: "Quyen tao cong viec moi trong workspace." },
      { key: Permission.CREATE_TASK_GROUP, label: "Tao nhom cong viec moi", description: "Quyen tao group/phase de gom task." },
      { key: Permission.VIEW_OTHER_TASKS, label: "Xem cong viec cua nguoi khac", description: "Cho phep xem task khong do minh phu trach." },
      { key: Permission.ASSIGN_TASK_TO_OTHERS, label: "Quyen xem - giao viec cho nguoi khac", description: "Cho phep giao task hoac doi nguoi phu trach.", danger: true },
      { key: Permission.VIEW_WORKSPACE_REPORTS, label: "Quyen xem bao cao tong the", description: "Cho phep xem dashboard, KPI va analytics tong hop." },
      { key: Permission.CREATE_DISCUSSION, label: "Quyen tao thao luan moi", description: "Cho phep tao thread thao luan trong workspace." },
      { key: Permission.CREATE_DOCUMENT, label: "Quyen tao tai lieu moi", description: "Cho phep tao tai lieu va upload file vao workspace." },
    ],
  },
  {
    key: "task-update",
    title: "PHAN QUYEN CHINH SUA - CAP NHAT CONG VIEC",
    roleKeys: ["assignee", "follower", "other"],
    permissions: [
      { key: Permission.EDIT_TASK_TITLE, label: "Chinh sua ten cong viec", description: "Doi tieu de task trong he thong.", danger: true },
      { key: Permission.MARK_TASK_DONE, label: "Quyen mark done-undone", description: "Cap nhat tien trinh done/undone theo luong duyet task." },
      { key: Permission.EDIT_TASK_DESCRIPTION, label: "Chinh sua mieu ta cong viec", description: "Cap nhat mo ta, checklist va noi dung nghiem thu." },
      { key: Permission.EDIT_TASK_SCHEDULE, label: "Chinh sua thoi gian start-date-deadline", description: "Doi ngay bat dau, deadline hoac keo Gantt.", danger: true },
    ],
  },
];
