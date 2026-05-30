const validateRequest = (schema) => (req, _res, next) => {
  if (!schema) return next();

  const result = schema.safeParse
    ? schema.safeParse({ body: req.body, params: req.params, query: req.query })
    : { success: true };

  if (!result.success) {
    const error = new Error("Validation failed");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    error.details = result.error?.flatten?.() || result.error;
    return next(error);
  }

  return next();
};

module.exports = {
  validateRequest,
};
