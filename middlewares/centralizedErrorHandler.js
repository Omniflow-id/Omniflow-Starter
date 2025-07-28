const { log, LOG_LEVELS } = require("../helpers/log");
const { getClientIP } = require("../helpers/getClientIP");
const { getUserAgent } = require("../helpers/getUserAgent");

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
  }

  // Log error based on severity
  const logLevel = statusCode >= 500 ? LOG_LEVELS.ERROR : LOG_LEVELS.WARN;

  // Clean logging for CSRF errors (no stack trace needed)
  const isCsrfError =
    err.code === "EBADCSRFTOKEN" || err.message === "invalid csrf token";
  const logMessage = `${req.method} ${req.originalUrl} - ${statusCode} - ${message}${
    !isCsrfError && err.stack ? ` - Stack: ${err.stack}` : ""
  }`;

  await log(logMessage, logLevel, userId, userAgent, clientIP);

  // Don't log stack trace for CSRF errors (too verbose) and in production for security
  if (isCsrfError) {
    console.log(
      `[CSRF] ${req.method} ${req.originalUrl} - Blocked request without valid CSRF token`
    );
  } else if (process.env.NODE_ENV === "production" && !isOperational) {
    console.error("Error:", err);
  } else {
    console.error("Error stack:", err.stack);
  }

  // Handle different response types
  if (req.xhr || req.headers.accept?.includes("application/json")) {
    // API/AJAX request - return JSON
    return res.status(statusCode).json({
      success: false,
      error: {
        message: isOperational ? message : "Something went wrong",
        statusCode,
        ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
      },
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
