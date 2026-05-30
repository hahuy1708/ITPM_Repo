const express = require("express");
const { Department, User, ActivityLog } = require("../../models");
const { verifyToken, requireRole } = require("../../middlewares/auth.middleware");
const { formatResponse, formatErrorResponse, createActivityLog } = require("../../utils/response");
const { isAdmin } = require("../../services/rbac.service");
const { isValidObjectId } = require("../../utils/objectId");

const router = express.Router();

const populateDepartment = (query) =>
  query
    .populate("manager_id", "full_name email avatar role")
    .populate("folder_id", "name")
    .populate("member_ids", "full_name email avatar role");

const getDepartmentWithMembers = (id) => populateDepartment(Department.findById(id));

const normalizeCode = (value) => value?.trim().toUpperCase();

const getRequestedManagerId = (body) => body.managerId || body.manager_id;

const invalidIdResponse = (res, label = "id") => res.status(400).json({
  success: false,
  message: `Invalid ${label}`,
});

const validateDepartmentManager = async (managerId) => {
  if (!managerId) return null;

  if (!isValidObjectId(managerId)) {
    const error = new Error("managerId khong hop le");
    error.statusCode = 400;
    throw error;
  }

  const manager = await User.findById(managerId).select("_id role full_name email");
  if (!manager) {
    const error = new Error("Manager khong ton tai");
    error.statusCode = 404;
    throw error;
  }

  if (!["admin", "manager"].includes(manager.role)) {
    const error = new Error("managerId phai thuoc user co role manager hoac admin");
    error.statusCode = 400;
    throw error;
  }

  return manager;
};

const addMemberCount = (department) => ({
  ...department.toObject(),
  member_count: department.member_ids?.length || 0,
});

const buildDepartmentScopeFilter = (user) => {
  if (isAdmin(user)) return {};
  return {
    $or: [
      { manager_id: user.userId },
      { member_ids: user.userId },
    ],
  };
};

const canManageDepartmentMembers = (user, department) => (
  isAdmin(user) || department.manager_id?.toString() === user.userId
);

router.get("/", verifyToken, async (req, res) => {
  try {
    const filter = buildDepartmentScopeFilter(req.user);
    if (req.query.folder_id === "root") filter.folder_id = null;
    else if (req.query.folder_id && req.query.folder_id !== "all") {
      if (!isValidObjectId(req.query.folder_id)) return invalidIdResponse(res, "folder_id");
      filter.folder_id = req.query.folder_id;
    }

    const departments = await populateDepartment(Department.find(filter))
      .sort({ createdAt: -1 });

    res.json(formatResponse(true, departments.map(addMemberCount)));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, error.statusCode || 500);
    res.status(statusCode).json(body);
  }
});

router.get("/:id", verifyToken, async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return invalidIdResponse(res, "department id");

    const department = await getDepartmentWithMembers(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Phong ban khong ton tai",
      });
    }

    if (!isAdmin(req.user)) {
      const requesterId = req.user.userId;
      const isManager = department.manager_id?._id?.toString() === requesterId;
      const isMember = (department.member_ids || []).some((member) => member._id?.toString() === requesterId);

      if (!isManager && !isMember) {
        return res.status(403).json({
          success: false,
          message: "Ban khong co quyen xem phong ban nay",
        });
      }
    }

    res.json(formatResponse(true, addMemberCount(department)));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, error.statusCode || 500);
    res.status(statusCode).json(body);
  }
});

router.post("/", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    const { name, description, color, folder_id } = req.body;
    const code = normalizeCode(req.body.code);
    const managerId = getRequestedManagerId(req.body);

    if (!name?.trim() || !code || !managerId) {
      return res.status(400).json({
        success: false,
        message: "name, code va managerId la bat buoc",
      });
    }

    if (folder_id && !isValidObjectId(folder_id)) return invalidIdResponse(res, "folder_id");

    await validateDepartmentManager(managerId);

    const duplicated = await Department.exists({ code });
    if (duplicated) {
      return res.status(409).json({
        success: false,
        message: "Ma phong ban da ton tai",
      });
    }

    const department = await Department.create({
      name: name.trim(),
      code,
      description: description || "",
      color: color || "#2563EB",
      folder_id: folder_id || null,
      manager_id: managerId,
      member_ids: [managerId],
    });

    await createActivityLog(
      ActivityLog,
      req.user.userId,
      "create_department",
      "Department",
      department._id,
      { name: department.name, code, managerId, color: department.color }
    );

    res
      .status(201)
      .json(formatResponse(true, await getDepartmentWithMembers(department._id), "Department created"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, error.statusCode || 500);
    res.status(statusCode).json(body);
  }
});

router.patch("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return invalidIdResponse(res, "department id");

    const { name, description, color, folder_id } = req.body;
    const code = normalizeCode(req.body.code);
    const managerId = getRequestedManagerId(req.body);
    const updateData = {};

    if (name?.trim()) updateData.name = name.trim();
    if (code) updateData.code = code;
    if (description !== undefined) updateData.description = description;
    if (color) updateData.color = color;
    if (folder_id !== undefined) {
      if (folder_id && !isValidObjectId(folder_id)) return invalidIdResponse(res, "folder_id");
      updateData.folder_id = folder_id || null;
    }
    if (managerId) {
      await validateDepartmentManager(managerId);
      updateData.manager_id = managerId;
    }

    if (code) {
      const duplicated = await Department.exists({ code, _id: { $ne: req.params.id } });
      if (duplicated) {
        return res.status(409).json({
          success: false,
          message: "Ma phong ban da ton tai",
        });
      }
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Phong ban khong ton tai",
      });
    }

    if (managerId) {
      department.member_ids.addToSet(managerId);
      await department.save();
    }

    await createActivityLog(
      ActivityLog,
      req.user.userId,
      "update_department",
      "Department",
      department._id,
      updateData
    );

    res.json(formatResponse(true, await getDepartmentWithMembers(department._id), "Department updated"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, error.statusCode || 500);
    res.status(statusCode).json(body);
  }
});

router.post("/:id/members", verifyToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return invalidIdResponse(res, "department id");

    const { user_ids } = req.body;

    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: "user_ids phai la mang khong rong",
      });
    }
    const invalidUserId = user_ids.find((userId) => !isValidObjectId(userId));
    if (invalidUserId) return invalidIdResponse(res, "user id");

    const existingDepartment = await Department.findById(req.params.id).select("manager_id member_ids");
    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Phong ban khong ton tai",
      });
    }

    if (!canManageDepartmentMembers(req.user, existingDepartment)) {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen quan ly thanh vien phong ban nay",
      });
    }

    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { member_ids: { $each: user_ids } } },
      { new: true }
    );

    await createActivityLog(
      ActivityLog,
      req.user.userId,
      "add_department_members",
      "Department",
      department._id,
      { added_user_ids: user_ids, member_count: department.member_ids.length }
    );

    res.json(formatResponse(true, await getDepartmentWithMembers(department._id), "Members added"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, error.statusCode || 500);
    res.status(statusCode).json(body);
  }
});

router.delete("/:id/members/:userId", verifyToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const { id, userId } = req.params;
    if (!isValidObjectId(id)) return invalidIdResponse(res, "department id");
    if (!isValidObjectId(userId)) return invalidIdResponse(res, "user id");

    const existingDepartment = await Department.findById(id).select("manager_id");
    if (!existingDepartment) {
      return res.status(404).json({
        success: false,
        message: "Phong ban khong ton tai",
      });
    }

    if (!canManageDepartmentMembers(req.user, existingDepartment)) {
      return res.status(403).json({
        success: false,
        message: "Ban khong co quyen quan ly thanh vien phong ban nay",
      });
    }

    if (existingDepartment.manager_id?.toString() === userId) {
      return res.status(409).json({
        success: false,
        message: "Khong the xoa manager cua phong ban. Hay chi dinh manager khac truoc.",
      });
    }

    const department = await Department.findByIdAndUpdate(
      id,
      { $pull: { member_ids: userId } },
      { new: true }
    );

    await createActivityLog(
      ActivityLog,
      req.user.userId,
      "remove_department_member",
      "Department",
      department._id,
      { removed_user_id: userId, member_count: department.member_ids.length }
    );

    res.json(formatResponse(true, await getDepartmentWithMembers(department._id), "Member removed"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, error.statusCode || 500);
    res.status(statusCode).json(body);
  }
});

router.delete("/:id", verifyToken, requireRole("admin"), async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return invalidIdResponse(res, "department id");

    const department = await Department.findByIdAndDelete(req.params.id);

    if (!department) {
      return res.status(404).json({
        success: false,
        message: "Phong ban khong ton tai",
      });
    }

    await createActivityLog(
      ActivityLog,
      req.user.userId,
      "delete_department",
      "Department",
      department._id,
      { name: department.name, code: department.code }
    );

    res.json(formatResponse(true, null, "Department deleted"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, error.statusCode || 500);
    res.status(statusCode).json(body);
  }
});

module.exports = router;
