const {
  logUserActivity,
  LOG_LEVELS,
  ACTIVITY_STATUS,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("../helpers/log");
const { getClientIP } = require("../helpers/getClientIP");
const { getUserAgent } = require("../helpers/getUserAgent");
const { notifyDatabaseError, notifyError } = require("@helpers/beepbot");

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400);
    this.field = field;
  }
}

class AuthenticationError extends AppError {
  constructor(message = "Authentication required") {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = "Insufficient permissions") {
    super(message, 403);
  }
}

class DatabaseError extends AppError {
  constructor(message = "Database operation failed") {
    super(message, 500);
  }
}

// Centralized error handler middleware
const centralizedErrorHandler = async (err, req, res, _next) => {
  const clientIP = getClientIP(req);
  const userAgent = getUserAgent(req);
  const userId = req.session?.user?.id || null;

  // Set default error properties
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";
  let isOperational = err.isOperational || false;

  // Handle specific error types
  if (err.name === "ValidationError" || err.name === "CastError") {
    statusCode = 400;
    message = "Invalid input data";
    isOperational = true;
  }

  // Handle CSRF token validation errors
  if (err.code === "EBADCSRFTOKEN" || err.message === "invalid csrf token") {
    statusCode = 403;
    message =
      "CSRF token validation failed. Please refresh the page and try again.";
    isOperational = true;
  }

  if (err.code === "ER_DUP_ENTRY") {
    statusCode = 409;
    message = "Duplicate entry found";
    isOperational = true;
  }

  if (err.code?.startsWith("ER_")) {
    statusCode = 500;
    message = "Database operation failed";
    isOperational = false;

    // Send BeepBot notification for database errors
    notifyDatabaseError(err, {
      route: `${req.method} ${req.originalUrl}`,
      userAgent: req.get("User-Agent"),
      ip: clientIP,
      userId: userId,
      environment: process.env.NODE_ENV,
    }).catch((notifyErr) => {
      console.error(
        "❌ [BEEPBOT] Failed to send database error notification:",
        notifyErr.message
      );
    });
  }

  // Send BeepBot notification for HTTP 500+ errors
  if (statusCode >= 500 && !err.code?.startsWith("ER_")) {
    // Avoid duplicate notifications for database errors (already handled above)
    notifyError(`HTTP ${statusCode} error: ${message}`, "application", {
      route: `${req.method} ${req.originalUrl}`,
      statusCode: statusCode,
      userAgent: req.get("User-Agent"),
      ip: clientIP,
      userId: userId,
      errorType: err.name || "UnknownError",
      isOperational: isOperational,
      environment: process.env.NODE_ENV,
    }).catch((notifyErr) => {
      console.error(
        "❌ [BEEPBOT] Failed to send HTTP error notification:",
        notifyErr.message
      );
    });
  }

  // Log error using enhanced logging system
  const logLevel = statusCode >= 500 ? LOG_LEVELS.ERROR : LOG_LEVELS.WARN;
  const status =
    statusCode >= 500 ? ACTIVITY_STATUS.FAILURE : ACTIVITY_STATUS.WARNING;

  // Clean logging for CSRF errors (no stack trace needed)
  const isCsrfError =
    err.code === "EBADCSRFTOKEN" || err.message === "invalid csrf token";

  // Determine action and resource type based on error
  let actionType = ACTION_TYPES.READ; // Default
  let resourceType = RESOURCE_TYPES.SYSTEM;

  if (req.method === "POST") actionType = ACTION_TYPES.CREATE;
  else if (req.method === "PUT" || req.method === "PATCH")
    actionType = ACTION_TYPES.UPDATE;
  else if (req.method === "DELETE") actionType = ACTION_TYPES.DELETE;

  if (req.originalUrl.includes("/user")) resourceType = RESOURCE_TYPES.USER;
  else if (req.originalUrl.includes("/cache"))
    resourceType = RESOURCE_TYPES.CACHE;
  else if (req.originalUrl.includes("/queue"))
    resourceType = RESOURCE_TYPES.QUEUE;

  await logUserActivity({
    activity: `Error: ${req.method} ${req.originalUrl} - ${statusCode} ${message}`,
    actionType,
    resourceType,
    status,
    userId,
    requestInfo: {
      ip: clientIP,
      userAgent: userAgent.deviceType,
      browser: userAgent.browser,
      platform: userAgent.platform,
      method: req.method,
      url: req.originalUrl,
    },
    errorMessage: message,
    errorCode: err.code || err.name || "UNKNOWN_ERROR",
    metadata: {
      statusCode,
      isOperational,
      isCsrfError,
      originalError: err.name,
      userSession: req.session?.user
        ? {
            userId: req.session.user.id,
            username: req.session.user.username,
            role: req.session.user.role,
          }
        : null,
      ...(process.env.NODE_ENV === "development" &&
        !isCsrfError && { stack: err.stack }),
    },
    req,
    level: logLevel,
  });

  // Don't log stack trace for CSRF errors (too verbose) and in production for security
  if (isCsrfError) {
    console.log(
      `[CSRF] ${req.method} ${req.originalUrl} - Blocked request without valid CSRF token`
    );
  } else if (process.env.NODE_ENV === "development") {
    console.error("Error stack:", err.stack);
  } else {
    console.error("Error:", err.message);
  }

  // Handle different response types
  const isApiRequest =
    req.xhr ||
    req.headers.accept?.includes("application/json") ||
    req.originalUrl.startsWith("/api/");

  if (isApiRequest) {
    // API/AJAX request - return JSON
    return res.status(statusCode).json({
      success: false,
      message: isOperational ? message : "Something went wrong",
      data: null,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    });
  }

  // Web request - render error page or redirect
  if (statusCode === 401) {
    req.flash("error", message);
    return res.redirect("/admin/login");
  }

  if (statusCode === 403) {
    return res.status(403).render("pages/admin/errors/403", {
      error: { message, statusCode },
    });
  }

  if (statusCode === 400) {
    req.flash("error", message);
    return res.redirect("back");
  }

  if (statusCode === 404) {
    return res.status(404).render("pages/admin/errors/404", {
      error: { message, statusCode },
    });
  }

  // Default 500 error
  return res.status(500).render("pages/admin/errors/500", {
    error: {
      message: isOperational ? message : "Internal Server Error",
      statusCode: 500,
    },
  });
};

// Wrapper for async functions to catch errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler (keep existing functionality)
const notFoundHandler = (_req, res, _next) => {
  res.status(404).render("pages/admin/errors/404", {
    error: {
      message: "Page not found",
      statusCode: 404,
    },
  });
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  centralizedErrorHandler,
  asyncHandler,
  notFoundHandler,
};
