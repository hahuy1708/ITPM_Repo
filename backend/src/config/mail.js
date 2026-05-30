const env = require("./env");

const getMailConfigStatus = () => {
  const missing = [];
  if (!env.smtp.host) missing.push("SMTP_HOST");
  if (!env.smtp.port) missing.push("SMTP_PORT");
  if (!env.smtp.user) missing.push("SMTP_USER");
  if (!env.smtp.pass) missing.push("SMTP_PASS");
  if (!env.smtp.from) missing.push("SMTP_FROM");

  return {
    configured: missing.length === 0,
    missing,
    provider: env.smtp.provider,
    from: env.smtp.from,
  };
};

module.exports = {
  getMailConfigStatus,
};
