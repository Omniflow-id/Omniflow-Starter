/**
 * Password Policy Management System
 *
 * Handles password complexity validation and automatic generation for bulk uploads.
 *
 * Features:
 * - Configurable complexity requirements
 * - Predictable password generation using full name pattern
 * - Security-focused validation rules
 */

/**
 * Default password policy configuration
 * Can be overridden via environment variables
 */
const DEFAULT_POLICY = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSymbols: true,
  minSymbols: 1,
  minNumbers: 1,
  minUppercase: 1,
  minLowercase: 1,
  forbiddenPatterns: [
    "password",
    "123456",
    "qwerty",
    "admin",
    "user",
    "omniflow",
  ],
  maxRepeatingChars: 3,
};

/**
 * Get current password policy from config with fallbacks
 * @returns {Object} Password policy configuration
 */
function getPasswordPolicy() {
  return {
    minLength:
      parseInt(process.env.PASSWORD_MIN_LENGTH, 10) || DEFAULT_POLICY.minLength,
    maxLength:
      parseInt(process.env.PASSWORD_MAX_LENGTH, 10) || DEFAULT_POLICY.maxLength,
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== "false",
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== "false",
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== "false",
    requireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS !== "false",
    minSymbols:
      parseInt(process.env.PASSWORD_MIN_SYMBOLS, 10) ||
      DEFAULT_POLICY.minSymbols,
    minNumbers:
      parseInt(process.env.PASSWORD_MIN_NUMBERS, 10) ||
      DEFAULT_POLICY.minNumbers,
    minUppercase:
      parseInt(process.env.PASSWORD_MIN_UPPERCASE, 10) ||
      DEFAULT_POLICY.minUppercase,
    minLowercase:
      parseInt(process.env.PASSWORD_MIN_LOWERCASE, 10) ||
      DEFAULT_POLICY.minLowercase,
    maxRepeatingChars:
      parseInt(process.env.PASSWORD_MAX_REPEATING, 10) ||
      DEFAULT_POLICY.maxRepeatingChars,
    forbiddenPatterns:
      process.env.PASSWORD_FORBIDDEN_PATTERNS?.split(",") ||
      DEFAULT_POLICY.forbiddenPatterns,
  };
}

/**
 * Validate password against policy rules
 * @param {string} password - Password to validate
 * @param {Object} options - Additional validation options
 * @param {string} options.username - Username for pattern checking
 * @param {string} options.email - Email for pattern checking
 * @returns {Object} Validation result with details
 */
function validatePassword(password, options = {}) {
  const policy = getPasswordPolicy();
  const errors = [];
  const warnings = [];

  if (!password || typeof password !== "string") {
    return {
      isValid: false,
      errors: ["Password is required"],
      warnings: [],
      strength: "invalid",
    };
  }

  // Length validation
  if (password.length < policy.minLength) {
    errors.push(
      `Password must be at least ${policy.minLength} characters long`
    );
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must not exceed ${policy.maxLength} characters`);
  }

  // Character type requirements
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSymbols = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password);

  if (policy.requireUppercase && !hasUppercase) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (policy.requireLowercase && !hasLowercase) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (policy.requireNumbers && !hasNumbers) {
    errors.push("Password must contain at least one number");
  }

  if (policy.requireSymbols && !hasSymbols) {
    errors.push("Password must contain at least one special character");
  }

  // Count specific character types
  const uppercaseCount = (password.match(/[A-Z]/g) || []).length;
  const lowercaseCount = (password.match(/[a-z]/g) || []).length;
  const numberCount = (password.match(/\d/g) || []).length;
  const symbolCount = (
    password.match(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/g) || []
  ).length;

  if (uppercaseCount < policy.minUppercase) {
    errors.push(
      `Password must contain at least ${policy.minUppercase} uppercase letter(s)`
    );
  }

  if (lowercaseCount < policy.minLowercase) {
    errors.push(
      `Password must contain at least ${policy.minLowercase} lowercase letter(s)`
    );
  }

  if (numberCount < policy.minNumbers) {
    errors.push(
      `Password must contain at least ${policy.minNumbers} number(s)`
    );
  }

  if (symbolCount < policy.minSymbols) {
    errors.push(
      `Password must contain at least ${policy.minSymbols} special character(s)`
    );
  }

  // Repeating characters check
  const maxRepeating = findMaxRepeatingChars(password);
  if (maxRepeating > policy.maxRepeatingChars) {
    errors.push(
      `Password cannot have more than ${policy.maxRepeatingChars} consecutive identical characters`
    );
  }

  // Forbidden patterns check
  const lowerPassword = password.toLowerCase();
  for (const pattern of policy.forbiddenPatterns) {
    if (lowerPassword.includes(pattern.toLowerCase())) {
      errors.push(`Password cannot contain common words like "${pattern}"`);
    }
  }

  // Personal information check
  if (
    options.username &&
    lowerPassword.includes(options.username.toLowerCase())
  ) {
    errors.push("Password cannot contain your username");
  }

  if (options.email) {
    const emailPrefix = options.email.split("@")[0].toLowerCase();
    if (lowerPassword.includes(emailPrefix)) {
      errors.push("Password cannot contain parts of your email address");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Generate predictable password for bulk user creation
 * Pattern: FullNameWithoutSpaces@12345?. (with proper capitalization)
 * @param {string} fullName - User's full name
 * @returns {string} Predictable password
 */
function generatePredictablePassword(fullName) {
  if (!fullName || typeof fullName !== "string") {
    return null;
  }

  // Split by spaces, capitalize each word, then join
  const words = fullName.trim().split(/\s+/);
  const capitalizedName = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");

  if (!capitalizedName) {
    return null;
  }

  // Pattern: CapitalizedName@12345?.
  return `${capitalizedName}@12345?.`;
}

/**
 * Helper function to find maximum repeating characters
 */
function findMaxRepeatingChars(str) {
  let maxCount = 1;
  let currentCount = 1;

  for (let i = 1; i < str.length; i++) {
    if (str[i] === str[i - 1]) {
      currentCount++;
      maxCount = Math.max(maxCount, currentCount);
    } else {
      currentCount = 1;
    }
  }

  return maxCount;
}

module.exports = {
  validatePassword,
  generatePredictablePassword,
  getPasswordPolicy,
  DEFAULT_POLICY,
};
