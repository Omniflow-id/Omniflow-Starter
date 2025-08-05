// === Third-party modules ===
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const multer = require("multer");
const fs = require("node:fs");
const path = require("node:path");

// === Absolute / alias imports ===
const config = require("@/config");

// Initialize S3 Client
const s3Client = new S3Client({
  region: config.s3.region || "auto",
  endpoint: config.s3.endpointUrl,
  credentials: {
    accessKeyId: config.s3.accessKey,
    secretAccessKey: config.s3.secretKey,
  },
});

// Helper to generate filename with format original_randomstring.ext
const generateFilename = (originalname) => {
  const ext = path.extname(originalname);
  const nameWithoutExt = path.basename(originalname, ext);
  const randomString = `${Date.now()}_${Math.round(Math.random() * 1e9)}`;
  return `${nameWithoutExt}_${randomString}${ext}`;
};

// Multer storage configuration - using memoryStorage to store file as buffer
const storage = multer.memoryStorage();

// File filter for file type validation
const fileFilter = (_req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv",
    "application/msword", // .doc
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only images, PDFs, Excel files, and Word documents are allowed."
      ),
      false
    );
  }
};

// Multer upload configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 20, // Maximum 20 files
  },
});

// Helper to upload to S3 (supports file from disk or buffer)
async function uploadFileToS3(fileOrBuffer, filename, mimetype) {
  try {
    let fileContent;
    let fileToDelete = null;

    // Check if input is buffer, file from disk, or from multer memoryStorage
    if (Buffer.isBuffer(fileOrBuffer)) {
      // If buffer, use directly
      fileContent = fileOrBuffer;
    } else if (fileOrBuffer?.path) {
      // If file from disk, read file and save path to delete later
      fileContent = fs.readFileSync(fileOrBuffer.path);
      fileToDelete = fileOrBuffer.path;
      filename = fileOrBuffer.filename;
      mimetype = fileOrBuffer.mimetype;
    } else if (fileOrBuffer?.buffer) {
      // If file from multer memoryStorage
      fileContent = fileOrBuffer.buffer;
      filename = fileOrBuffer.originalname
        ? generateFilename(fileOrBuffer.originalname)
        : filename;
      mimetype = fileOrBuffer.mimetype || mimetype;
    } else {
      throw new Error(
        "Invalid file input: expected Buffer or file object with path or buffer"
      );
    }

    const key = config.s3.folderName
      ? `${config.s3.folderName}/${filename}`
      : filename;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.s3.bucketName,
        Key: key,
        Body: fileContent,
        ContentType: mimetype,
        ACL: "public-read",
      })
    );

    // Delete local file if exists
    if (fileToDelete && fs.existsSync(fileToDelete)) {
      fs.unlinkSync(fileToDelete);
    }

    return {
      filename,
      key,
      url: `${config.s3.endpointUrl}/${config.s3.bucketName}/${key}`,
      size: fileContent.length,
    };
  } catch (error) {
    // Delete local file if error occurs and file still exists
    if (fileOrBuffer?.path && fs.existsSync(fileOrBuffer.path)) {
      fs.unlinkSync(fileOrBuffer.path);
    }
    throw error;
  }
}

// Helper to delete file from S3
async function deleteFileFromS3(filename) {
  const key = config.s3.folderName
    ? `${config.s3.folderName}/${filename}`
    : filename;

  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: config.s3.bucketName,
      Key: key,
    })
  );

  return true;
}

// Helper to upload multiple files
async function uploadMultipleFilesToS3(files) {
  const results = [];
  const errors = [];

  for (const file of files) {
    try {
      const result = await uploadFileToS3(file);
      results.push(result);
    } catch (error) {
      errors.push({
        originalname: file.originalname,
        error: error.message,
      });
    }
  }

  return {
    successful: results,
    failed: errors,
    totalUploaded: results.length,
    totalFailed: errors.length,
  };
}

module.exports = {
  uploadFileToS3,
  deleteFileFromS3,
  uploadMultipleFilesToS3,
  upload,
  generateFilename,
  s3Client,
};
