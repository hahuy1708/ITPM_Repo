const mongoose = require('mongoose');
const {
  PROJECT_STATUSES,
  PROJECT_VISIBILITIES,
} = require('../../constants/projectStatus');

const taskGroupSchema = new mongoose.Schema({
  key: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  order_index: { type: Number, default: 0 },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  created_at: { type: Date, default: Date.now },
}, { _id: false });

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#059669' },
  status: { type: String, enum: PROJECT_STATUSES, default: 'planning' },
  visibility: { type: String, enum: PROJECT_VISIBILITIES, default: 'private' },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  start_date: { type: Date },
  end_date: { type: Date },
  
  department_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
  folder_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Folder', default: null },
  owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Quản lý dự án
  member_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  task_groups: {
    type: [taskGroupSchema],
    default: () => [{ key: 'general', name: 'Chung' }],
  },
}, { timestamps: true });

projectSchema.index({ department_id: 1 });
projectSchema.index({ folder_id: 1 });
projectSchema.index({ visibility: 1 });
projectSchema.index({ 'task_groups.key': 1 });
module.exports = mongoose.model('Project', projectSchema);
