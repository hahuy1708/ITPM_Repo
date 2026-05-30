export enum UserRole {
  ADMIN = "admin",
  MANAGER = "manager",
  EMPLOYEE = "employee",
}

export const USER_ROLES = Object.values(UserRole);
export type UserRoleValue = `${UserRole}`;
