// === Core modules ===
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");

// === Relative imports ===
const { db } = require("../db/db");
const config = require("../config");
const { invalidateCache } = require("./cache");
const { notifyDatabaseError } = require("./beepbot");

const LOG_LEVELS = {
  INFO: "INFO",
  ERROR: "ERROR",
  WARN: "WARN",
};

const ACTIVITY_TYPES = {
  USER: "user",
  SYSTEM: "system",
};

const ACTIVITY_STATUS = {
  SUCCESS: "success",
  FAILURE: "failure",
  WARNING: "warning",
  INFO: "info",
};

const ACTION_TYPES = {
  // Authentication
  LOGIN: "login",
  LOGOUT: "logout",
  REFRESH_TOKEN: "refresh_token",

  // CRUD Operations
  CREATE: "create",
  READ: "read",
  UPDATE: "update",
  DELETE: "delete",

  // System Operations
  CACHE_CLEAR: "cache_clear",
  CACHE_INVALIDATE: "cache_invalidate",
  QUEUE_SEND: "queue_send",
  QUEUE_PROCESS: "queue_process",
  SYSTEM_START: "system_start",
  SYSTEM_SHUTDOWN: "system_shutdown",
  DATABASE_CONNECT: "database_connect",

  // File Operations
  UPLOAD: "upload",
  DOWNLOAD: "download",
  EXPORT: "export",
  IMPORT: "import",
};

const RESOURCE_TYPES = {
  USER: "user",
  ROLE: "role",
  FILE: "file",
  CACHE: "cache",
  QUEUE: "queue",
  SESSION: "session",
  DATABASE: "database",
  SYSTEM: "system",
};

// Sensitive fields that should be masked in logs
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "key",
  "credential",
  "auth",
  "session",
  "csrf",
  "ssn",
  "credit_card",
  "cvv",
  "social_security",
  "bank_account",
  "routing_number",
  "passport",
  "id_number",
  "license",
];

// Partially sensitive fields (show only first/last characters)
const PARTIALLY_SENSITIVE_FIELDS = [
  "email",
  "phone",
  "ip_address",
  "user_agent",
];

/**
 * Mask sensitive data in objects
 * @param {any} data - Data to mask
 * @param {Object} options - Masking options
 * @param {boolean} options.deep - Deep masking for nested objects
 * @param {Array} options.customSensitive - Additional sensitive field names
 * @param {Array} options.customPartial - Additional partial field names
 * @returns {any} - Masked data
 */
function maskSensitiveData(data, options = {}) {
  const { deep = true, customSensitive = [], customPartial = [] } = options;

  if (!data || typeof data !== "object") {
    return data;
  }

  const allSensitive = [...SENSITIVE_FIELDS, ...customSensitive];
  const allPartial = [...PARTIALLY_SENSITIVE_FIELDS, ...customPartial];

  if (Array.isArray(data)) {
    return data.map((item) => (deep ? maskSensitiveData(item, options) : item));
  }

  const masked = {};

  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();

    // Check if field is sensitive (full masking)
    if (allSensitive.some((field) => lowerKey.includes(field))) {
      masked[key] = "***MASKED***";
      continue;
    }

    // Check if field is partially sensitive
    if (allPartial.some((field) => lowerKey.includes(field))) {
      if (typeof value === "string" && value.length > 4) {
        if (lowerKey.includes("email")) {
          // Email masking: show first 2 chars + @ + domain
          const parts = value.split("@");
          if (parts.length === 2) {
            masked[key] = `${parts[0].substring(0, 2)}***@${parts[1]}`;
          } else {
            masked[key] = `${value.substring(0, 2)}***${value.slice(-2)}`;
          }
        } else {
          // General partial masking: show first 2 and last 2 characters
          masked[key] = `${value.substring(0, 2)}***${value.slice(-2)}`;
        }
      } else {
        masked[key] = "***";
      }
      continue;
    }

    // Recursive masking for nested objects
    if (deep && value && typeof value === "object") {
      masked[key] = maskSensitiveData(value, options);
    } else {
      masked[key] = value;
    }
  }

  return masked;
}

/**
 * Create data change log
 * @param {Object} options - Change options
 * @param {Object} options.oldData - Data before change
 * @param {Object} options.newData - Data after change
 * @param {Array} options.excludeFields - Fields to exclude from comparison
 * @param {boolean} options.maskSensitive - Whether to mask sensitive data
 * @returns {Object} - Change summary
 */
function createDataChangeLog(options = {}) {
  const {
    oldData = null,
    newData = null,
    excludeFields = ["updated_at", "modified_at", "last_modified"],
    maskSensitive = true,
  } = options;

  const changes = {
    action: null,
    summary: null,
    changes: {},
    added: {},
    removed: {},
    masked: maskSensitive,
  };

  // Determine action type
  if (!oldData && newData) {
    changes.action = "INSERT";
    changes.summary = "New record created";
    changes.added = maskSensitive ? maskSensitiveData(newData) : newData;
  } else if (oldData && !newData) {
    changes.action = "DELETE";
    changes.summary = "Record deleted";
    changes.removed = maskSensitive ? maskSensitiveData(oldData) : oldData;
  } else if (oldData && newData) {
    changes.action = "UPDATE";

    // Compare fields
    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);
    let changeCount = 0;

    for (const key of allKeys) {
      if (excludeFields.includes(key)) continue;

      const oldValue = oldData[key];
      const newValue = newData[key];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changeCount++;
        changes.changes[key] = {
          from: maskSensitive ? maskSensitiveData(oldValue) : oldValue,
          to: maskSensitive ? maskSensitiveData(newValue) : newValue,
        };
      }
    }

    changes.summary = `${changeCount} field(s) modified`;
  }

  return changes;
}

const getTimestamp = () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  return `${day < 10 ? "0" : ""}${day}-${month < 10 ? "0" : ""}${month}-${year} ${hours < 10 ? "0" : ""}${hours}:${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};

/**
 * Comprehensive activity logging function
 * @param {Object} options - Logging options
 * @param {string} options.activity - Activity description (required)
 * @param {string} options.activityType - 'user' or 'system' (default: 'user')
 * @param {string} options.actionType - Action type (login, create, etc.)
 * @param {string} options.resourceType - Resource type (user, file, etc.)
 * @param {string} options.resourceId - Resource ID
 * @param {string} options.status - 'success', 'failure', 'warning', 'info'
 * @param {number} options.userId - User ID (nullable for system activities)
 * @param {Object} options.userInfo - User information object
 * @param {Object} options.requestInfo - Request information object
 * @param {Object} options.dataChanges - Data changes (oldData, newData)
 * @param {Object} options.metadata - Additional metadata
 * @param {string} options.errorMessage - Error message if any
 * @param {string} options.errorCode - Error code if any
 * @param {number} options.durationMs - Operation duration in milliseconds
 * @param {string} options.level - Log level for console/file logging
 * @param {Object} options.req - Express request object (for requestId)
 */
async function logActivity(options = {}) {
  const {
    activity,
    activityType = ACTIVITY_TYPES.USER,
    actionType = null,
    resourceType = null,
    resourceId = null,
    status = ACTIVITY_STATUS.SUCCESS,
    userId = null,
    userInfo = {},
    requestInfo = {},
    dataChanges = null,
    metadata = null,
    errorMessage = null,
    errorCode = null,
    durationMs = null,
    level = LOG_LEVELS.INFO,
    req = null,
  } = options;

  if (!activity) {
    throw new Error("Activity description is required");
  }

  const timestamp = getTimestamp();
  let userDetails = {};

  // Fetch user details if userId provided and not already in userInfo
  if (userId && (!userInfo.username || !userInfo.email || !userInfo.role)) {
    try {
      const [rows] = await db.query(
        "SELECT username, email, role FROM users WHERE id = ?",
        [userId]
      );
      if (rows.length > 0) {
        userDetails = rows[0];
      }
    } catch (err) {
      console.error("Error fetching user details:", err);
    }
  }

  // Merge user information
  const finalUserInfo = {
    username: userInfo.username || userDetails.username || null,
    email: userInfo.email || userDetails.email || null,
    role: userInfo.role || userDetails.role || null,
  };

  // Extract request information
  const {
    ip = null,
    userAgent = null,
    deviceType = null,
    browser = null,
    platform = null,
    method = null,
    url = null,
    requestId = null,
  } = requestInfo;

  // Auto-extract user agent from request if not provided
  const finalUserAgent = userAgent || req?.get?.("User-Agent") || null;

  // Get request ID from Express request object if available
  const finalRequestId = req?.requestId || requestId || null;

  // System information
  const systemInfo = {
    application: "omniflow-starter",
    environment: process.env.NODE_ENV || "development",
    serverInstance: os.hostname(),
    processId: process.pid.toString(),
  };

  // Performance information
  const memoryUsage = process.memoryUsage();
  const memoryUsageMB = Math.round(memoryUsage.rss / 1024 / 1024);

  // Process data changes if provided
  let changeLog = null;
  if (dataChanges && (dataChanges.oldData || dataChanges.newData)) {
    changeLog = createDataChangeLog({
      oldData: dataChanges.oldData,
      newData: dataChanges.newData,
      excludeFields: dataChanges.excludeFields,
      maskSensitive: dataChanges.maskSensitive !== false, // Default to true
    });
  }

  // Merge metadata with change log
  const finalMetadata = {
    ...metadata,
    ...(changeLog && { dataChanges: changeLog }),
  };

  // Console/file logging
  const displayUser = finalUserInfo.username || "System";
  const displayIp = ip || "N/A";
  const displayType = activityType.toUpperCase();

  const detailedLogMessage = `[${timestamp}] [${level}] [${displayType}] [User: ${displayUser}] [IP: ${displayIp}] ${activity}`;

  console.log(detailedLogMessage);

  // File logging
  const logFilePath = path.resolve(config.logging.file);
  if (!fs.existsSync(path.dirname(logFilePath))) {
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
  }
  fs.appendFileSync(logFilePath, `${detailedLogMessage}\n`, "utf8");

  // Database logging
  try {
    await db.query(
      `INSERT INTO activity_logs (
        activity_type, activity, action_type, resource_type, resource_id,
        user_id, username, user_email, user_role,
        ip_address, user_agent, device_type, browser, platform, request_method, request_url, request_id,
        application, environment, server_instance, process_id,
        metadata, status, error_message, error_code, duration_ms, memory_usage_mb,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        activityType,
        activity,
        actionType,
        resourceType,
        resourceId,
        userId,
        finalUserInfo.username,
        finalUserInfo.email,
        finalUserInfo.role,
        ip,
        finalUserAgent,
        deviceType,
        browser,
        platform,
        method,
        url,
        finalRequestId,
        systemInfo.application,
        systemInfo.environment,
        systemInfo.serverInstance,
        systemInfo.processId,
        finalMetadata ? JSON.stringify(finalMetadata) : null,
        status,
        errorMessage,
        errorCode,
        durationMs && !Number.isNaN(durationMs) ? durationMs : null,
        memoryUsageMB,
        new Date(),
      ]
    );

    // Invalidate logs cache after new log entry
    setImmediate(async () => {
      try {
        await invalidateCache("admin:logs:*", true);
      } catch (cacheErr) {
        console.warn(
          "Warning: Failed to invalidate logs cache:",
          cacheErr.message
        );
      }
    });
  } catch (err) {
    console.error("Error logging to database:", err);

    // Send BeepBot notification for database logging errors
    if (err.code?.startsWith("ER_")) {
      notifyDatabaseError(err, {
        operation: "activity_logging",
        activityType: activityType,
        originalActivity: activity,
        environment: process.env.NODE_ENV,
      }).catch((notifyErr) => {
        console.error(
          "❌ [BEEPBOT] Failed to send database logging error notification:",
          notifyErr.message
        );
      });
    }
  }
}

/**
 * Legacy log function for backward compatibility
 * @deprecated Use logActivity instead
 */
async function log(
  message,
  level = LOG_LEVELS.INFO,
  user_id = null,
  userAgentData = {},
  ip = ""
) {
  const { deviceType = null, browser = null, platform = null } = userAgentData;

  await logActivity({
    activity: message,
    activityType: ACTIVITY_TYPES.USER,
    userId: user_id,
    requestInfo: {
      ip,
      deviceType,
      browser,
      platform,
    },
    level,
    status:
      level === LOG_LEVELS.ERROR
        ? ACTIVITY_STATUS.FAILURE
        : ACTIVITY_STATUS.SUCCESS,
  });
}

/**
 * Log user activity
 */
async function logUserActivity(options) {
  await logActivity({
    ...options,
    activityType: ACTIVITY_TYPES.USER,
  });
}

/**
 * Log system activity
 */
async function logSystemActivity(options) {
  await logActivity({
    ...options,
    activityType: ACTIVITY_TYPES.SYSTEM,
    userId: null, // System activities don't have users
  });
}

module.exports = {
  log,
  logActivity,
  logUserActivity,
  logSystemActivity,
  maskSensitiveData,
  createDataChangeLog,
  LOG_LEVELS,
  ACTIVITY_TYPES,
  ACTIVITY_STATUS,
  ACTION_TYPES,
  RESOURCE_TYPES,
  SENSITIVE_FIELDS,
  PARTIALLY_SENSITIVE_FIELDS,
};
