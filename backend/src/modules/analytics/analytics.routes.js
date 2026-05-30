const express = require("express");
const mongoose = require("mongoose");
const { Task, Project, Department, User } = require("../../models");
const { verifyToken } = require("../../middlewares/auth.middleware");
const {
  canAccessTaskContent,
  getUserDepartmentIds,
  isManager,
} = require("../../services/rbac.service");

const router = express.Router();

const getDateFilter = (range) => {
  const now = new Date();
  if (range === "week") {
    const start = new Date(now);
    start.setDate(now.getDate() - now.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  }

  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  start.setHours(0, 0, 0, 0);
  return start;
};

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const buildTaskProjectScopeFilter = async (user) => {
  const scope = [
    { owner_id: user.userId },
    { member_ids: user.userId },
  ];

  if (isManager(user)) {
    const departmentIds = await getUserDepartmentIds(Department, user.userId);
    scope.push({ department_id: { $in: departmentIds } });
  }

  return { $or: scope };
};

const getScopedProjectIds = async (user, projectId) => {
  if (projectId && projectId !== "all") {
    if (!mongoose.Types.ObjectId.isValid(projectId)) {
      throw createHttpError("Invalid projectId", 400);
    }

    const project = await Project.findById(projectId);
    if (!project) {
      throw createHttpError("Project not found", 404);
    }

    const allowed = await canAccessTaskContent(user, project, Department);
    if (!allowed) {
      throw createHttpError("You do not have access to this project's analytics.", 403);
    }

    return [new mongoose.Types.ObjectId(projectId)];
  }

  const projects = await Project.find(await buildTaskProjectScopeFilter(user)).select("_id").lean();
  return projects.map((project) => project._id);
};

const buildMatch = async (query, user) => {
  const match = {};
  const startDate = query.startDate ? new Date(query.startDate) : getDateFilter(query.range || "month");
  const endDate = query.endDate ? new Date(query.endDate) : null;
  const dateField = ["createdAt", "updatedAt", "due_date"].includes(query.dateField) ? query.dateField : "createdAt";

  match[dateField] = { $gte: startDate };
  if (endDate && !Number.isNaN(endDate.getTime())) {
    endDate.setHours(23, 59, 59, 999);
    match[dateField].$lte = endDate;
  }
  match.project_id = { $in: await getScopedProjectIds(user, query.projectId) };

  return match;
};

router.get("/summary", verifyToken, async (req, res) => {
  try {
    const match = await buildMatch(req.query, req.user);
    const now = new Date();

    const [summary] = await Task.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
          in_progress: { $sum: { $cond: [{ $eq: ["$status", "in_progress"] }, 1, 0] } },
          review: { $sum: { $cond: [{ $eq: ["$status", "review"] }, 1, 0] } },
          needs_revision: { $sum: { $cond: [{ $eq: ["$status", "needs_revision"] }, 1, 0] } },
          todo: { $sum: { $cond: [{ $eq: ["$status", "todo"] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $ne: ["$status", "done"] },
                    { $ne: ["$due_date", null] },
                    { $lt: ["$due_date", now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          total: 1,
          done: 1,
          in_progress: 1,
          review: 1,
          needs_revision: 1,
          todo: 1,
          overdue: 1,
          kpi: {
            $cond: [
              { $gt: ["$total", 0] },
              { $round: [{ $multiply: [{ $divide: ["$done", "$total"] }, 100] }, 0] },
              0,
            ],
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: summary || {
        total: 0,
        done: 0,
        in_progress: 0,
        review: 0,
        needs_revision: 0,
        todo: 0,
        overdue: 0,
        kpi: 0,
      },
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.get("/performance", verifyToken, async (req, res) => {
  try {
    const match = await buildMatch(req.query, req.user);

    const data = await Task.aggregate([
      { $match: { ...match, assignee_id: { $ne: null } } },
      {
        $group: {
          _id: "$assignee_id",
          total: { $sum: 1 },
          done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      {
        $project: {
          _id: 0,
          user_id: "$_id",
          full_name: "$user.full_name",
          email: "$user.email",
          avatar: "$user.avatar",
          total: 1,
          done: 1,
          completion_rate: {
            $cond: [
              { $gt: ["$total", 0] },
              { $round: [{ $multiply: [{ $divide: ["$done", "$total"] }, 100] }, 0] },
              0,
            ],
          },
        },
      },
      { $sort: { done: -1, completion_rate: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.get("/employees", verifyToken, async (req, res) => {
  try {
    const match = await buildMatch(req.query, req.user);
    const now = new Date();

    const [tasks, projects] = await Promise.all([
      Task.find(match)
        .select("status due_date actualFinishDate assignee_id project_id")
        .lean(),
      Project.find({ _id: { $in: match.project_id.$in } })
        .select("owner_id member_ids")
        .lean(),
    ]);

    const userIds = new Set();
    const projectIdsByUser = new Map();
    const ensureUserProjectSet = (userId) => {
      const key = userId?.toString();
      if (!key) return null;
      userIds.add(key);
      if (!projectIdsByUser.has(key)) projectIdsByUser.set(key, new Set());
      return projectIdsByUser.get(key);
    };

    projects.forEach((project) => {
      const projectId = project._id.toString();
      ensureUserProjectSet(project.owner_id)?.add(projectId);
      (project.member_ids || []).forEach((memberId) => ensureUserProjectSet(memberId)?.add(projectId));
    });

    const rows = new Map();
    const getRow = (userId) => {
      const key = userId?.toString();
      if (!key) return null;
      userIds.add(key);
      if (!rows.has(key)) {
        rows.set(key, {
          user_id: key,
          total: 0,
          done_on_time: 0,
          done_late: 0,
          review: 0,
          in_progress: 0,
          overdue: 0,
          project_count: 0,
        });
      }
      return rows.get(key);
    };

    tasks.forEach((task) => {
      const assigneeId = task.assignee_id?.toString();
      const row = getRow(assigneeId);
      if (!row) return;

      ensureUserProjectSet(assigneeId)?.add(task.project_id.toString());
      row.total += 1;

      const dueDate = task.due_date ? new Date(task.due_date) : null;
      const finishDate = task.actualFinishDate ? new Date(task.actualFinishDate) : null;
      const doneLate = task.status === "done" && dueDate && finishDate && finishDate > dueDate;
      const overdue = task.status !== "done" && dueDate && dueDate < now;

      if (task.status === "done" && doneLate) row.done_late += 1;
      else if (task.status === "done") row.done_on_time += 1;
      else if (task.status === "review") row.review += 1;
      else if (task.status === "in_progress") row.in_progress += 1;
      if (overdue) row.overdue += 1;
    });

    const users = await User.find({ _id: { $in: [...userIds] } })
      .select("full_name email avatar role position_title")
      .lean();

    const userMap = new Map(users.map((user) => [user._id.toString(), user]));
    const data = [...userIds].map((userId) => {
      const row = rows.get(userId) || {
        user_id: userId,
        total: 0,
        done_on_time: 0,
        done_late: 0,
        review: 0,
        in_progress: 0,
        overdue: 0,
      };
      const user = userMap.get(userId);
      const done = row.done_on_time + row.done_late;
      return {
        ...row,
        full_name: user?.full_name || "Unknown user",
        email: user?.email || "",
        avatar: user?.avatar || "",
        role: user?.role || "employee",
        position_title: user?.position_title || "",
        project_count: projectIdsByUser.get(userId)?.size || row.project_count || 0,
        completion_rate: row.total ? Math.round((done / row.total) * 100) : 0,
      };
    }).sort((left, right) => right.total - left.total || right.project_count - left.project_count);

    const totals = data.reduce((acc, row) => ({
      total: acc.total + row.total,
      done_on_time: acc.done_on_time + row.done_on_time,
      done_late: acc.done_late + row.done_late,
      review: acc.review + row.review,
      in_progress: acc.in_progress + row.in_progress,
      overdue: acc.overdue + row.overdue,
    }), {
      total: 0,
      done_on_time: 0,
      done_late: 0,
      review: 0,
      in_progress: 0,
      overdue: 0,
    });

    res.json({ success: true, data: { rows: data, totals } });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message });
  }
});

router.get("/projects", verifyToken, async (req, res) => {
  try {
    const filter = await buildTaskProjectScopeFilter(req.user);
    const projects = await Project.find(filter).select("name color status visibility").sort({ createdAt: -1 });
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
