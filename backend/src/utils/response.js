const formatResponse = (success, data = null, message = "") => ({
  success,
  data,
  ...(message && { message }),
});

const sendSuccess = (res, data = null, message = "OK", statusCode = 200) => (
  res.status(statusCode).json(formatResponse(true, data, message))
);

const sendError = (
  res,
  message = "Internal Server Error",
  statusCode = 500,
  code = "API_ERROR",
  details = undefined
) => (
  res.status(statusCode).json({
    success: false,
    message,
    error: {
      code,
      ...(details !== undefined && { details }),
    },
  })
);

const formatPaginatedResponse = (data, total, skip, limit) => ({
  success: true,
  data,
  pagination: {
    total,
    skip,
    limit,
    pages: Math.ceil(total / limit),
  },
});

const formatErrorResponse = (error, statusCode = 500) => {
  console.error("API Error:", error);
  return {
    statusCode,
    body: {
      success: false,
      message: error.message || "An error occurred",
      error: {
        code: error.code || "API_ERROR",
        ...(error.details !== undefined && { details: error.details }),
      },
    },
  };
};

const createActivityLog = async (ActivityLog, userId, action, targetType, targetId, details = {}) => {
  try {
    const log = new ActivityLog({
      user_id: userId,
      action,
      target_type: targetType,
      target_id: targetId,
      details,
    });
    await log.save();
    return log;
  } catch (error) {
    console.error("Error creating activity log:", error);
    return null;
  }
};

const sendNotification = async (Notification, recipientId, type, title, body, linkTo, senderId = null) => {
  try {
    const notification = new Notification({
      recipient_id: recipientId,
      sender_id: senderId,
      type,
      title,
      body,
      link_to: linkTo,
      is_read: false,
    });
    await notification.save();
    return notification;
  } catch (error) {
    console.error("Error sending notification:", error);
    return null;
  }
};

const isValidObjectId = (id) => /^[0-9a-fA-F]{24}$/.test(id);

module.exports = {
  formatResponse,
  sendSuccess,
  sendError,
  formatPaginatedResponse,
  formatErrorResponse,
  createActivityLog,
  sendNotification,
  isValidObjectId,
};
