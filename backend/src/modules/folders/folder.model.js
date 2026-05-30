const mongoose = require("mongoose");

const folderSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
}, { timestamps: true });

folderSchema.index({ name: 1, created_by: 1 });

module.exports = mongoose.model("Folder", folderSchema);
