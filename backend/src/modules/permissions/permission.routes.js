const express = require("express");
const mongoose = require("mongoose");
const { ActivityLog, Department, PermissionMatrix, Project } = require("../../models");
const { verifyToken, requireRole } = require("../../middlewares/auth.middleware");
const { formatResponse, formatErrorResponse, createActivityLog } = require("../../utils/response");
const { canManageProject, deny, isAdmin } = require("../../services/rbac.service");
const {
  PERMISSION_ROLE_KEYS,
  PERMISSION_SECTIONS,
  ROLE_PERMISSIONS,
} = require("../../constants/permissions");

const router = express.Router();

const LOCKED_RULES = new Set([
  "manager:create_task",
  "manager:create_task_group",
  "manager:assign_task_to_others",
  "manager:view_workspace_reports",
  "assignee:mark_task_done",
  "assignee:edit_task_description",
]);

const isLockedEntry = (roleKey, permissionKey) => LOCKED_RULES.has(`${roleKey}:${permissionKey}`);

const getDefaultAllowed = (roleKey, permissionKey) => {
  if (roleKey === "assignee") return ["mark_task_done", "edit_task_description", "edit_task_schedule"].includes(permissionKey);
  if (roleKey === "follower") return ["edit_task_description"].includes(permissionKey);
  if (roleKey === "other") return false;
  return (ROLE_PERMISSIONS[roleKey] || []).includes(permissionKey);
};

const buildDefaultEntries = () => (
  PERMISSION_SECTIONS.flatMap((section) => (
    section.permissions.flatMap((permission) => (
      section.roleKeys.map((roleKey) => ({
        permission_key: permission.key,
        role_key: roleKey,
        allowed: getDefaultAllowed(roleKey, permission.key),
      }))
    ))
  ))
);

const mergeEntries = (customEntries = []) => {
  const customMap = new Map(customEntries.map((entry) => [`${entry.role_key}:${entry.permission_key}`, entry]));
  return buildDefaultEntries().map((entry) => {
    const custom = customMap.get(`${entry.role_key}:${entry.permission_key}`);
    const locked = isLockedEntry(entry.role_key, entry.permission_key);
    return {
      ...entry,
      allowed: locked ? entry.allowed : custom?.allowed ?? entry.allowed,
      locked,
    };
  });
};

const toMatrixPayload = (matrix) => ({
  scope_type: matrix.scope_type,
  scope_id: matrix.scope_id,
  sections: PERMISSION_SECTIONS,
  entries: mergeEntries(matrix.entries),
  updatedAt: matrix.updatedAt,
});

const loadScope = async (scopeType, scopeId, user) => {
  if (!["project", "department"].includes(scopeType)) {
    const error = new Error("scopeType must be project or department");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(scopeId)) {
    const error = new Error("Invalid scope id");
    error.statusCode = 400;
    throw error;
  }

  if (scopeType === "project") {
    const project = await Project.findById(scopeId);
    if (!project) {
      const error = new Error("Project not found");
      error.statusCode = 404;
      throw error;
    }
    const allowed = await canManageProject(user, project, Department);
    return { allowed, target: project };
  }

  const department = await Department.findById(scopeId);
  if (!department) {
    const error = new Error("Department not found");
    error.statusCode = 404;
    throw error;
  }

  return {
    allowed: isAdmin(user) || department.manager_id?.toString() === user.userId,
    target: department,
  };
};

const getOrCreateMatrix = async (scopeType, scopeId) => (
  PermissionMatrix.findOneAndUpdate(
    { scope_type: scopeType, scope_id: scopeId },
    { $setOnInsert: { entries: buildDefaultEntries() } },
    { new: true, upsert: true }
  )
);

router.get("/:scopeType/:scopeId", verifyToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const { scopeType, scopeId } = req.params;
    const { allowed } = await loadScope(scopeType, scopeId, req.user);
    if (!allowed) return deny(res, "You do not have permission to view this permission matrix.");

    const matrix = await getOrCreateMatrix(scopeType, scopeId);
    res.json(formatResponse(true, toMatrixPayload(matrix)));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, error.statusCode || 500);
    res.status(statusCode).json(body);
  }
});

router.patch("/:scopeType/:scopeId", verifyToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const { scopeType, scopeId } = req.params;
    const { allowed, target } = await loadScope(scopeType, scopeId, req.user);
    if (!allowed) return deny(res, "You do not have permission to update this permission matrix.");

    const requestedEntries = Array.isArray(req.body.entries) ? req.body.entries : [];
    const validPermissionKeys = new Set(PERMISSION_SECTIONS.flatMap((section) => section.permissions.map((permission) => permission.key)));
    const currentEntries = mergeEntries((await getOrCreateMatrix(scopeType, scopeId)).entries);
    const entryMap = new Map(currentEntries.map((entry) => [`${entry.role_key}:${entry.permission_key}`, entry]));
    const changedEntries = [];

    requestedEntries.forEach((entry) => {
      const roleKey = String(entry.role_key || "");
      const permissionKey = String(entry.permission_key || "");
      if (!PERMISSION_ROLE_KEYS.includes(roleKey) || !validPermissionKeys.has(permissionKey)) return;
      if (isLockedEntry(roleKey, permissionKey)) return;

      const key = `${roleKey}:${permissionKey}`;
      const existing = entryMap.get(key);
      const allowedValue = Boolean(entry.allowed);
      if (existing && existing.allowed !== allowedValue) {
        entryMap.set(key, { ...existing, allowed: allowedValue });
        changedEntries.push({ role_key: roleKey, permission_key: permissionKey, allowed: allowedValue });
      }
    });

    const matrix = await PermissionMatrix.findOneAndUpdate(
      { scope_type: scopeType, scope_id: scopeId },
      {
        entries: [...entryMap.values()].map(({ locked, ...entry }) => entry),
        updated_by: req.user.userId,
      },
      { new: true, upsert: true }
    );

    if (changedEntries.length > 0) {
      await createActivityLog(
        ActivityLog,
        req.user.userId,
        "update_permissions",
        scopeType === "project" ? "Project" : "Department",
        target._id,
        { changed_entries: changedEntries }
      );
    }

    res.json(formatResponse(true, toMatrixPayload(matrix), "Permission matrix updated"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, error.statusCode || 500);
    res.status(statusCode).json(body);
  }
});

module.exports = router;
