const UserRole = Object.freeze({
  ADMIN: "admin",
  MANAGER: "manager",
  EMPLOYEE: "employee",
});

const USER_ROLES = Object.freeze(Object.values(UserRole));

module.exports = {
  UserRole,
  USER_ROLES,
};
