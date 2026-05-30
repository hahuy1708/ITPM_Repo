const globalErrorHandler = (err, _req, res, _next) => {
  console.error("Unhandled error:", err);

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      ...(err.details !== undefined && { details: err.details }),
    },
  });
};

const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    error: {
      code: "NOT_FOUND",
    },
  });
};

module.exports = {
  globalErrorHandler,
  notFoundHandler,
};
