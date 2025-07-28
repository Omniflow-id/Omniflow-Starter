const compression = require("compression");
const config = require("@config");

// Comprehensive filter for compression
const compressionFilter = (req, res) => {
  // Skip if explicitly disabled
  if (req.headers["x-no-compression"]) return false;

  const contentType = res.get("Content-Type") || "";

  // SKIP compression for these MIME types (already compressed)
  const skipTypes = [
    // Images
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
    "image/tiff",
    "image/ico",
    "image/svg+xml", // SVG can benefit from compression but often small

    // Videos
    "video/mp4",
    "video/mpeg",
    "video/quicktime",
    "video/x-msvideo",
    "video/webm",
    "video/x-flv",

    // Audio
    "audio/mpeg",
    "audio/mp4",
    "audio/ogg",
    "audio/wav",
    "audio/webm",

    // Archives & Compressed
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/gzip",
    "application/x-bzip2",
    "application/x-tar",

    // Executables
    "application/octet-stream",
    "application/x-msdownload",
    "application/x-executable",
    "application/x-deb",

    // Already compressed documents
    "application/pdf", // PDF has internal compression
  ];

  // Check if current content type should be skipped
  if (skipTypes.some((type) => contentType.startsWith(type))) {
    return false;
  }

  // COMPRESS these types (text-based, benefit from compression)
  const compressTypes = [
    "text/", // text/html, text/css, text/javascript, text/plain
    "application/json",
    "application/javascript",
    "application/xml",
    "application/xhtml+xml",
    "application/rss+xml",
    "application/atom+xml",

    // Office formats that can benefit (older formats)
    "application/msword", // .doc (older format)
    "application/vnd.ms-excel", // .xls (older format)
    "application/vnd.ms-powerpoint", // .ppt (older format)

    // Modern office formats are already ZIP compressed, but might still benefit
    "application/vnd.openxmlformats-officedocument", // .docx, .xlsx, .pptx
  ];

  // Check if should compress
  const shouldCompress = compressTypes.some((type) =>
    contentType.startsWith(type)
  );

  if (shouldCompress) {
    return compression.filter(req, res);
  }

  // Default: don't compress unknown types
  return false;
};

// Response size logging middleware for monitoring compression effectiveness
const compressionLogger = (req, res, next) => {
  // Only log in development mode
  if (process.env.NODE_ENV !== "development") {
    return next();
  }

  const originalEnd = res.end;
  let responseBody = "";

  res.end = function (chunk, encoding) {
    if (chunk) {
      responseBody += chunk;
    }

    const size = Buffer.byteLength(responseBody);
    const isCompressed = res.getHeader("content-encoding");
    const contentType = res.get("Content-Type") || "";

    // Only log for responses that could benefit from compression
    if (size > 1024) {
      // Only log responses > 1KB
      const compressionInfo = isCompressed
        ? ` (${isCompressed}${isCompressed === "br" ? " - brotli" : isCompressed === "gzip" ? " - gzip" : ""})`
        : "";

      console.log(
        `[COMPRESSION] ${req.method} ${req.originalUrl} - ` +
          `${size} bytes - ${contentType}${compressionInfo}`
      );
    }

    return originalEnd.call(this, chunk, encoding);
  };

  next();
};

// Create compression middleware with configuration
const createCompressionMiddleware = () => {
  const compressionConfig = config.compression || {};

  const options = {
    threshold: compressionConfig.threshold || 1024, // Only compress if >= 1KB
    filter: compressionFilter,
    level: compressionConfig.level || 6, // Balance between compression ratio and speed (1-9)
    chunkSize: compressionConfig.chunkSize || 16 * 1024, // 16KB chunks
  };

  // Add brotli configuration if enabled
  if (compressionConfig.brotli?.enabled !== false) {
    options.brotli = {
      quality: compressionConfig.brotli?.quality || 4, // Brotli quality 0-11 (4 = balanced)
      chunkSize: compressionConfig.brotli?.chunkSize || 16 * 1024, // 16KB chunks
    };
  }

  return compression(options);
};

module.exports = {
  compressionMiddleware: createCompressionMiddleware(),
  compressionFilter,
  compressionLogger,
  createCompressionMiddleware,
};
