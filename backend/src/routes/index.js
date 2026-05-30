const express = require("express");

const authRoutes = require("../modules/auth/auth.routes");
const workspaceRoutes = require("../modules/workspaces/workspace.routes");
const userRoutes = require("../modules/users/user.routes");
const departmentRoutes = require("../modules/departments/department.routes");
const folderRoutes = require("../modules/folders/folder.routes");
const projectRoutes = require("../modules/projects/project.routes");
const taskRoutes = require("../modules/tasks/task.routes");
const uploadRoutes = require("../modules/uploads/upload.routes");
const analyticsRoutes = require("../modules/analytics/analytics.routes");
const notificationRoutes = require("../modules/notifications/notification.routes");
const auditRoutes = require("../modules/audit-logs/audit-log.routes");
const permissionRoutes = require("../modules/permissions/permission.routes");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "ITPM API is healthy",
  });
});

router.use("/auth", authRoutes);
router.use("/workspace", workspaceRoutes);
router.use("/users", userRoutes);
router.use("/departments", departmentRoutes);
router.use("/folders", folderRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/upload", uploadRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/notifications", notificationRoutes);
router.use("/audit-logs", auditRoutes);
router.use("/permissions", permissionRoutes);

module.exports = router;
