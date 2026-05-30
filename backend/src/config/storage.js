const path = require("path");
const env = require("./env");

const uploadRoot = path.resolve(env.storage.fileStoragePath);
const maxFileSizeBytes = env.storage.maxFileSizeMb * 1024 * 1024;

const dangerousExtensions = new Set([
  ".bat",
  ".cmd",
  ".com",
  ".exe",
  ".js",
  ".msi",
  ".ps1",
  ".scr",
  ".sh",
  ".vbs",
]);

const allowedUploadMimeTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "text/csv",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

module.exports = {
  uploadRoot,
  maxFileSizeBytes,
  dangerousExtensions,
  allowedUploadMimeTypes,
};
