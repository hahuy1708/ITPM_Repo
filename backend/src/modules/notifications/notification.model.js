const mongoose = require('mongoose');
const { NOTIFICATION_TYPES } = require('../../constants/notificationTypes');

const notificationSchema = new mongoose.Schema({
  recipient_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: NOTIFICATION_TYPES,
    required: true 
  },
  title: { type: String, required: true },
  body: { type: String, required: true },
  link_to: { type: String, required: true }, // Đường dẫn mở Task
  is_read: { type: Boolean, default: false },
  dedupe_key: { type: String, default: "" }
}, { timestamps: true });

notificationSchema.index({ recipient_id: 1, is_read: 1 });
notificationSchema.index({ dedupe_key: 1 }, { unique: true, partialFilterExpression: { dedupe_key: { $type: "string", $gt: "" } } });
module.exports = mongoose.model('Notification', notificationSchema);
