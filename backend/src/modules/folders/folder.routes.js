const express = require("express");
const { Folder, ActivityLog } = require("../../models");
const { verifyToken, requireRole } = require("../../middlewares/auth.middleware");
const { formatResponse, formatErrorResponse, createActivityLog } = require("../../utils/response");

const router = express.Router();

const populateFolder = (query) => query.populate("created_by", "full_name email avatar role");

router.get("/", verifyToken, async (_req, res) => {
  try {
    const folders = await populateFolder(Folder.find().sort({ name: 1 }));
    res.json(formatResponse(true, folders));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, error.statusCode || 500);
    res.status(statusCode).json(body);
  }
});

router.post("/", verifyToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Folder name is required" });
    }

    const folder = await Folder.create({
      name,
      created_by: req.user.userId,
    });

    await createActivityLog(
      ActivityLog,
      req.user.userId,
      "create_folder",
      "Folder",
      folder._id,
      { name }
    );

    res.status(201).json(formatResponse(true, await populateFolder(Folder.findById(folder._id)), "Folder created"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, error.statusCode || 500);
    res.status(statusCode).json(body);
  }
});

router.patch("/:id", verifyToken, requireRole(["admin", "manager"]), async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, message: "Folder name is required" });
    }

    const folder = await Folder.findByIdAndUpdate(req.params.id, { name }, { new: true });
    if (!folder) {
      return res.status(404).json({ success: false, message: "Folder not found" });
    }

    await createActivityLog(
      ActivityLog,
      req.user.userId,
      "update_folder",
      "Folder",
      folder._id,
      { name }
    );

    res.json(formatResponse(true, await populateFolder(Folder.findById(folder._id)), "Folder updated"));
  } catch (error) {
    const { statusCode, body } = formatErrorResponse(error, error.statusCode || 500);
    res.status(statusCode).json(body);
  }
});

module.exports = router;
