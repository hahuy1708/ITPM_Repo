const express = require("express");
const mongoose = require("mongoose");
const { Project, Task, User, Department, ActivityLog } = require("../../models");
const { verifyToken, requireRole } = require("../../middlewares/auth.middleware");
const { formatResponse, formatErrorResponse, createActivityLog } = require("../../utils/response");
const {
  buildProjectVisibilityFilter,
  canCreateProject,
  canManageProject,
  canViewProject,
  deny,
  getUserDepartmentIds,
  isAdmin,
  isManager,
} = require("../../services/rbac.service");

const router = express.Router();

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const invalidIdResponse = (res, label = "id") => res.status(400).json({
  success: false,
  message: `Invalid ${label}`,
});

const populateProject = (query) =>
  query
    .populate("department_id", "name code color manager_id")
    .populate("folder_id", "name")
    .populate("owner_id", "full_name email avatar role")
    .populate("member_ids", "full_name email avatar role isActive");

const getProjectWithMembers = (id) => populateProject(Project.findById(id));

const normalizeTaskGroupKey = (value, fallbackName = "") => {
  const source = String(value || fallbackName || "general").trim().toLowerCase();
  const normalized = source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\u0111\u0110]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "general";
};

const toTaskGroup = ({ key, name, task_count = 0, order_index = 0, created_at, created_by }) => ({
  key: key || "general",
  name: name || "Chung",
  task_count,
  order_index,
  created_at,
  created_by,
});

const getTaskGroupsForProject = async (projectId) => {
  const projectObjectId = new mongoose.Types.ObjectId(projectId);
  const [project, taskGroups] = await Promise.all([
    Project.findById(projectId).select("task_groups").lean(),
    Task.aggregate([
      { $match: { project_id: projectObjectId } },
      {
        $group: {
          _id: "$group_key",
          name: { $first: "$group_name" },
          task_count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const groups = new Map();
  const addGroup = (group) => {
    const key = normalizeTaskGroupKey(group.key || group._id, group.name);
    const current = groups.get(key);
    groups.set(key, {
      key,
      name: current?.name || group.name || "Chung",
      task_count: Math.max(current?.task_count || 0, group.task_count || 0),
      order_index: current?.order_index ?? group.order_index ?? Number.MAX_SAFE_INTEGER,
      created_at: current?.created_at || group.created_at,
      created_by: current?.created_by || group.created_by,
    });
  };

  (project?.task_groups || []).forEach((group, index) => addGroup({
    ...group,
    order_index: group.order_index ?? index,
  }));
  taskGroups.forEach((group) => addGroup({
    key: group._id || "general",
    name: group.name || "Chung",
    task_count: group.task_count,
    order_index: Number.MAX_SAFE_INTEGER,
  }));

  if (!groups.has("general")) addGroup({ key: "general", name: "Chung" });

  return [...groups.values()]
    .map(toTaskGroup)
    .sort((left, right) => {
      if (left.order_index !== right.order_index) return left.order_index - right.order_index;
      return left.name.localeCompare(right.name, "vi");
    });
};

router.get("/", verifyToken, async (req, res) => {
  try {
    const {
      status,
      department_id,
      folder_id,
      page = 1,
      limit = 20,
    } = req.query;

    const numericPage = Math.max(Number(page) || 1, 1);
    const numericLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const skip = (numericPage - 1) * numericLimit;
    const filter = buildProjectVisibilityFilter(req.user);

    if (isManager(req.user)) {
      const departmentIds = await getUserDepartmentIds(Department, req.user.userId);
      filter.$or = [
        ...(filter.$or || []),
        { department_id: { $in: departmentIds } },
      ];
    }

    if (status && status !== "all") filter.status = status;
    if (department_id && department_id !== "all") {
      if (!isValidObjectId(department_id)) return invalidIdResponse(res, "department_id");
      filter.department_id = department_id;
    }
    if (req.query.folder_id === "root") filter.folder_id = null;
    else if (req.query.folder_id && req.query.folder_id !== "all") {
      if (!isValidObjectId(req.query.folder_id)) return invalidIdResponse(res, "folder_id");
      filter.folder_id = req.query.folder_id;
    }

    const [projects, total] = await Promise.all([
      populateProject(Project.find(filter))
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(numericLimit),
      Project.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: projects,
      pagination: {
        total,
        page: numericPage,
        limit: numericLimit,
        pages: Math.ceil(total / numericLimit),
      },
    });
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error);
    res.status(statusCode).json(body);
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return invalidIdResponse(res, "project id");

    const project = await getProjectWithMembers(req.params.id);

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    const canView = canViewProject(req.user, project) || await canManageProject(req.user, project, Department);
    if (!canView) {
      return deny(res, "You do not have access to this project.");
    }

    res.json(formatResponse(true, project));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error);
    res.status(statusCode).json(body);
  }
});

router.get("/:id/task-groups", verifyToken, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project id" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const canView = canViewProject(req.user, project) || await canManageProject(req.user, project, Department);
    if (!canView) {
      return deny(res, "You do not have access to this project.");
    }

    res.json(formatResponse(true, await getTaskGroupsForProject(req.params.id)));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error);
    res.status(statusCode).json(body);
  }
});

router.post("/:id/task-groups", verifyToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project id" });
    }

    const name = String(req.body.name || "").trim();
    const key = normalizeTaskGroupKey(req.body.key, name);

    if (!name) {
      return res.status(400).json({ success: false, message: "Group name is required" });
    }

    if (name.length > 80) {
      return res.status(400).json({ success: false, message: "Group name must be 80 characters or fewer" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const allowed = await canManageProject(req.user, project, Department);
    if (!allowed) {
      return deny(res, "Only admins or project managers in scope can create task groups.");
    }

    const existingGroups = await getTaskGroupsForProject(req.params.id);
    if (existingGroups.some((group) => (
      group.key === key
      || group.name.trim().toLowerCase() === name.toLowerCase()
    ))) {
      return res.status(409).json({ success: false, message: "Task group already exists" });
    }

    project.task_groups = project.task_groups || [];
    project.task_groups.push({
      key,
      name,
      order_index: project.task_groups.length,
      created_by: req.user.userId,
      created_at: new Date(),
    });
    await project.save();

    await createActivityLog(
      ActivityLog,
      req.user.userId,
      "create_task_group",
      "Project",
      project._id,
      { key, name }
    );

    res.status(201).json(formatResponse(true, await getTaskGroupsForProject(req.params.id), "Task group created"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error);
    res.status(statusCode).json(body);
  }
});

router.patch("/:id/task-groups/reorder", verifyToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid project id" });
    }

    const requestedKeys = Array.isArray(req.body.group_keys)
      ? [...new Set(req.body.group_keys.map((key) => normalizeTaskGroupKey(key)).filter(Boolean))]
      : [];

    if (requestedKeys.length === 0) {
      return res.status(400).json({ success: false, message: "group_keys must be a non-empty array" });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const allowed = await canManageProject(req.user, project, Department);
    if (!allowed) {
      return deny(res, "Only admins or project managers in scope can reorder task groups.");
    }

    const existingGroups = await getTaskGroupsForProject(req.params.id);
    const groupMap = new Map(existingGroups.map((group) => [group.key, group]));
    const existingDocMap = new Map((project.task_groups || []).map((group) => [normalizeTaskGroupKey(group.key, group.name), group]));
    const orderedKeys = [
      ...requestedKeys.filter((key) => groupMap.has(key)),
      ...existingGroups.map((group) => group.key).filter((key) => !requestedKeys.includes(key)),
    ];

    project.task_groups = orderedKeys.map((key, index) => {
      const existing = existingDocMap.get(key);
      const group = groupMap.get(key);
      return {
        key,
        name: group?.name || existing?.name || "Chung",
        order_index: index,
        created_by: existing?.created_by || group?.created_by,
        created_at: existing?.created_at || group?.created_at || new Date(),
      };
    });
    await project.save();

    await createActivityLog(
      ActivityLog,
      req.user.userId,
      "reorder_task_groups",
      "Project",
      project._id,
      { group_keys: orderedKeys }
    );

    res.json(formatResponse(true, await getTaskGroupsForProject(req.params.id), "Task groups reordered"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error);
    res.status(statusCode).json(body);
  }
});

router.post("/", verifyToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const {
      name,
      description = "",
      color = "#059669",
      status = "planning",
      visibility = "private",
      progress = 0,
      start_date,
      end_date,
      department_id,
      folder_id,
      owner_id,
      member_ids = [],
    } = req.body;

    if (!name || !owner_id) {
      return res.status(400).json({
        success: false,
        message: "name and owner_id are required",
      });
    }

    if (!isValidObjectId(owner_id)) return invalidIdResponse(res, "owner_id");
    if (department_id && !isValidObjectId(department_id)) return invalidIdResponse(res, "department_id");
    if (folder_id && !isValidObjectId(folder_id)) return invalidIdResponse(res, "folder_id");
    if (!Array.isArray(member_ids)) {
      return res.status(400).json({ success: false, message: "member_ids must be an array" });
    }
    const invalidMemberId = member_ids.find((memberId) => memberId && !isValidObjectId(memberId));
    if (invalidMemberId) return invalidIdResponse(res, "member id");

    if (!["public", "private"].includes(visibility)) {
      return res.status(400).json({ success: false, message: "Invalid project visibility" });
    }

    const [owner, department] = await Promise.all([
      User.findById(owner_id),
      department_id ? Department.findById(department_id) : null,
    ]);

    if (!owner) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    if (department_id && !department) {
      return res.status(404).json({ success: false, message: "Department not found" });
    }

    const canCreate = await canCreateProject({ user: req.user, ownerId: owner_id, departmentId: department_id, Department });
    if (!canCreate) {
      return deny(res, "Managers can only create projects they own within their department scope.");
    }

    const uniqueMembers = [...new Set([owner_id, ...member_ids].filter(Boolean))];
    const project = await Project.create({
      name,
      description,
      color,
      status,
      visibility,
      progress,
      start_date: start_date || undefined,
      end_date: end_date || undefined,
      department_id: department_id || undefined,
      folder_id: folder_id || null,
      owner_id,
      member_ids: uniqueMembers,
    });

    await createActivityLog(
      ActivityLog,
      req.user.userId,
      "create_project",
      "Project",
      project._id,
      { name, owner_id, department_id, visibility }
    );

    res.status(201).json(formatResponse(true, await getProjectWithMembers(project._id), "Project created"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error);
    res.status(statusCode).json(body);
  }
});

router.patch("/:id", verifyToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return invalidIdResponse(res, "project id");

    const allowedFields = ["name", "description", "color", "status", "visibility", "progress", "start_date", "end_date", "department_id", "folder_id"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (field in req.body) updates[field] = req.body[field] === "" ? undefined : req.body[field];
    });

    if (updates.visibility && !["public", "private"].includes(updates.visibility)) {
      return res.status(400).json({ success: false, message: "Invalid project visibility" });
    }
    if (updates.department_id && !isValidObjectId(updates.department_id)) return invalidIdResponse(res, "department_id");
    if (updates.folder_id && !isValidObjectId(updates.folder_id)) return invalidIdResponse(res, "folder_id");

    const existingProject = await Project.findById(req.params.id);
    if (!existingProject) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const allowed = await canManageProject(req.user, existingProject, Department);
    if (!allowed) {
      return deny(res, "Only admins or project managers in scope can update this project.");
    }

    if (!isAdmin(req.user) && updates.department_id) {
      const canUseDepartment = await canCreateProject({
        user: req.user,
        ownerId: req.user.userId,
        departmentId: updates.department_id,
        Department,
      });
      if (!canUseDepartment) {
        return deny(res, "Managers can only move projects within their department scope.");
      }
    }

    const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    res.json(formatResponse(true, await getProjectWithMembers(project._id), "Project updated"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error);
    res.status(statusCode).json(body);
  }
});

router.patch("/:id/owner", verifyToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return invalidIdResponse(res, "project id");

    const { owner_id } = req.body;

    if (!owner_id) {
      return res.status(400).json({ success: false, message: "owner_id is required" });
    }
    if (!isValidObjectId(owner_id)) return invalidIdResponse(res, "owner_id");

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const allowed = await canManageProject(req.user, project, Department);
    if (!allowed) {
      return deny(res, "Only admins or project managers in scope can change the owner.");
    }

    const user = await User.findById(owner_id);
    if (!user) {
      return res.status(404).json({ success: false, message: "Owner not found" });
    }

    if (!isAdmin(req.user) && !["admin", "manager"].includes(user.role)) {
      return deny(res, "Project owner must be an admin or manager.");
    }

    project.owner_id = owner_id;
    project.member_ids.addToSet(owner_id);
    await project.save();

    res.json(formatResponse(true, await getProjectWithMembers(project._id), "Project owner updated"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error);
    res.status(statusCode).json(body);
  }
});

router.post("/:id/members", verifyToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return invalidIdResponse(res, "project id");

    const { user_ids } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "user_ids must be a non-empty array",
      });
    }
    const invalidUserId = user_ids.find((userId) => !isValidObjectId(userId));
    if (invalidUserId) return invalidIdResponse(res, "user id");

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const allowed = await canManageProject(req.user, project, Department);
    if (!allowed) {
      return deny(res, "Only admins or project managers in scope can add members.");
    }

    await Project.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { member_ids: { $each: user_ids } } },
      { new: true }
    );

    res.json(formatResponse(true, await getProjectWithMembers(project._id), "Members added"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error);
    res.status(statusCode).json(body);
  }
});

router.delete("/:id/members/:userId", verifyToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const { id, userId } = req.params;
    if (!isValidObjectId(id)) return invalidIdResponse(res, "project id");
    if (!isValidObjectId(userId)) return invalidIdResponse(res, "user id");

    const project = await Project.findById(id);

    if (!project) {
      return res.status(404).json({ success: false, message: "Project not found" });
    }

    const allowed = await canManageProject(req.user, project, Department);
    if (!allowed) {
      return deny(res, "Only admins or project managers in scope can remove members.");
    }

    if (project.owner_id.toString() === userId) {
      return res.status(409).json({
        success: false,
        message: "Cannot remove the project owner. Assign another owner first.",
      });
    }

    const blockingTasks = await Task.find({
      project_id: id,
      assignee_id: userId,
      status: "in_progress",
    }).select("title status");

    if (blockingTasks.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot remove member while they have in-progress tasks.",
        data: { blockingTasks },
      });
    }

    await Project.findByIdAndUpdate(id, { $pull: { member_ids: userId } });
    res.json(formatResponse(true, await getProjectWithMembers(id), "Member removed"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error);
    res.status(statusCode).json(body);
  }
});

module.exports = router;
