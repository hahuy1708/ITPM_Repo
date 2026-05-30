const mongoose = require("mongoose");

const permissionEntrySchema = new mongoose.Schema({
  permission_key: { type: String, required: true, trim: true },
  role_key: { type: String, required: true, trim: true },
  allowed: { type: Boolean, default: false },
}, { _id: false });

const permissionMatrixSchema = new mongoose.Schema({
  scope_type: { type: String, enum: ["project", "department"], required: true },
  scope_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  entries: { type: [permissionEntrySchema], default: [] },
  updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

permissionMatrixSchema.index({ scope_type: 1, scope_id: 1 }, { unique: true });

module.exports = mongoose.model("PermissionMatrix", permissionMatrixSchema);
