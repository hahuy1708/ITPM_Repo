require("dotenv").config();

const parseList = (value = "") => value
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const required = (name, value) => {
  if (value === undefined || value === null || value === "") {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";
const configuredCorsOrigins = parseList(process.env.CORS_ORIGIN || "");
const clientUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || configuredCorsOrigins[0] || "";
const jwtAccessSecret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET || jwtAccessSecret;

const env = {
  nodeEnv,
  isProduction,
  port: Number(process.env.PORT || 5000),
  mongoUri: required("MONGO_URI or MONGODB_URI", process.env.MONGO_URI || process.env.MONGODB_URI),
  clientUrl: required("CLIENT_URL or FRONTEND_URL", clientUrl),
  corsOrigins: configuredCorsOrigins.length > 0 ? configuredCorsOrigins : [clientUrl],
  jwtAccessSecret: required("JWT_ACCESS_SECRET or JWT_SECRET", jwtAccessSecret),
  jwtRefreshSecret: required("JWT_REFRESH_SECRET or JWT_SECRET", jwtRefreshSecret),
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "",
    provider: process.env.MAIL_PROVIDER || "smtp",
  },
  storage: {
    driver: process.env.STORAGE_DRIVER || "local",
    fileStoragePath: process.env.FILE_STORAGE_PATH || "backend/uploads",
    filePublicBaseUrl: process.env.FILE_PUBLIC_BASE_URL || "",
    maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 20),
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    folder: process.env.CLOUDINARY_FOLDER || "itpm-task-attachments",
  },
  deadline: {
    enabled: process.env.DEADLINE_NOTIFIER_ENABLED !== "false",
    lookaheadHours: Number(process.env.DEADLINE_NOTIFICATION_LOOKAHEAD_HOURS || 24),
    intervalMinutes: Number(process.env.DEADLINE_NOTIFICATION_INTERVAL_MINUTES || 60),
  },
  integrations: {
    googleWorkspaceClientEmail: process.env.GOOGLE_WORKSPACE_CLIENT_EMAIL || "",
    googleWorkspacePrivateKey: process.env.GOOGLE_WORKSPACE_PRIVATE_KEY || "",
    googleWorkspaceAdminEmail: process.env.GOOGLE_WORKSPACE_ADMIN_EMAIL || "",
    officeViewerProvider: process.env.OFFICE_VIEWER_PROVIDER || "",
  },
};

module.exports = env;
