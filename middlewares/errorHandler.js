// Re-export centralized error handling
const {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  centralizedErrorHandler,
  asyncHandler,
  notFoundHandler,
} = require("./centralizedErrorHandler");

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  DatabaseError,
  centralizedErrorHandler,
  asyncHandler,
  notFoundHandler,
  // Keep backward compatibility
  default: notFoundHandler,
};
