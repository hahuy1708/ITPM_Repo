const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { v2: cloudinary } = require("cloudinary");
const { verifyToken } = require("../../middlewares/auth.middleware");
const env = require("../../config/env");
const {
  uploadRoot,
  maxFileSizeBytes,
  dangerousExtensions,
  allowedUploadMimeTypes,
} = require("../../config/storage");

const router = express.Router();

fs.mkdirSync(uploadRoot, { recursive: true });

const hasCloudinaryConfig = Boolean(
  env.cloudinary.cloudName
  && env.cloudinary.apiKey
  && env.cloudinary.apiSecret
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxFileSizeBytes },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname || "").toLowerCase();
    if (dangerousExtensions.has(extension)) {
      return cb(new Error("Executable or script files are not allowed"));
    }

    if (allowedUploadMimeTypes.has(file.mimetype)) return cb(null, true);
    cb(new Error("Unsupported file type"));
  },
});

const handleUpload = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();

    const statusCode = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message = error.code === "LIMIT_FILE_SIZE"
      ? `File size must be ${env.storage.maxFileSizeMb}MB or less`
      : error.message;

    return res.status(statusCode).json({ success: false, message });
  });
};

const uploadToCloudinary = (file) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: env.cloudinary.folder,
      resource_type: "auto",
      use_filename: true,
    },
    (error, result) => {
      if (error) reject(error);
      else resolve(result);
    }
  );

  stream.end(file.buffer);
});

const saveLocalFile = (req, file) => {
  const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
  const fileName = `${Date.now()}-${safeName}`;
  fs.writeFileSync(path.join(uploadRoot, fileName), file.buffer);
  const publicBaseUrl = env.storage.filePublicBaseUrl
    ? env.storage.filePublicBaseUrl.replace(/\/$/, "")
    : `${req.protocol}://${req.get("host")}/uploads`;

  return {
    fileUrl: `${publicBaseUrl}/${fileName}`,
    storageKey: fileName,
  };
};

router.post("/", verifyToken, handleUpload, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "file is required" });
    }

    let fileUrl;
    let storageKey = "";
    if (hasCloudinaryConfig) {
      const uploaded = await uploadToCloudinary(req.file);
      fileUrl = uploaded.secure_url;
      storageKey = uploaded.public_id;
    } else {
      const saved = saveLocalFile(req, req.file);
      fileUrl = saved.fileUrl;
      storageKey = saved.storageKey;
    }

    res.status(201).json({
      success: true,
      data: {
        file_url: fileUrl,
        file_name: req.file.originalname,
        file_type: req.file.mimetype,
        size: req.file.size,
        uploaded_by: req.user.userId,
        uploaded_at: new Date(),
        storage_key: storageKey,
        preview_url: fileUrl,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
