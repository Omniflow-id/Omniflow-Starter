/**
 * Password Policy Management System
 *
 * Handles password complexity validation, generation, and policy enforcement
 * for user accounts with configurable rules and automatic generation patterns.
 *
 * Features:
 * - Configurable complexity requirements
 * - Automatic password generation for bulk uploads
 * - Pattern-based generation (username-based)
 * - Security-focused validation rules
 * - Detailed validation feedback
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
      parseInt(process.env.PASSWORD_MIN_LENGTH) || DEFAULT_POLICY.minLength,
    maxLength:
      parseInt(process.env.PASSWORD_MAX_LENGTH) || DEFAULT_POLICY.maxLength,
    requireUppercase: process.env.PASSWORD_REQUIRE_UPPERCASE !== "false",
    requireLowercase: process.env.PASSWORD_REQUIRE_LOWERCASE !== "false",
    requireNumbers: process.env.PASSWORD_REQUIRE_NUMBERS !== "false",
    requireSymbols: process.env.PASSWORD_REQUIRE_SYMBOLS !== "false",
    minSymbols:
      parseInt(process.env.PASSWORD_MIN_SYMBOLS) || DEFAULT_POLICY.minSymbols,
    minNumbers:
      parseInt(process.env.PASSWORD_MIN_NUMBERS) || DEFAULT_POLICY.minNumbers,
    minUppercase:
      parseInt(process.env.PASSWORD_MIN_UPPERCASE) ||
      DEFAULT_POLICY.minUppercase,
    minLowercase:
      parseInt(process.env.PASSWORD_MIN_LOWERCASE) ||
      DEFAULT_POLICY.minLowercase,
    maxRepeatingChars:
      parseInt(process.env.PASSWORD_MAX_REPEATING) ||
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

  // Password strength calculation
  const strength = calculatePasswordStrength(password, policy);

  // Warnings for weak but valid passwords
  if (strength === "weak" && errors.length === 0) {
    warnings.push(
      "Consider using a stronger password with more character variety"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength,
    score: getPasswordScore(password, policy),
  };
}

/**
 * Generate username-based password for bulk uploads
 * Pattern: Username + Numbers + Symbols + Random
 * @param {string} username - Base username
 * @param {number} length - Target length
 * @param {Object} policy - Password policy
 * @returns {string} Generated password
 */

/**
 * Generate predictable password for bulk user creation
 * Pattern: AllNamesJoined@12345?. (with proper capitalization)
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
 * Helper functions
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

function calculatePasswordStrength(password, policy) {
  const score = getPasswordScore(password, policy);

  if (score >= 80) return "very-strong";
  if (score >= 60) return "strong";
  if (score >= 40) return "medium";
  if (score >= 20) return "weak";
  return "very-weak";
}

function getPasswordScore(password, policy) {
  let score = 0;

  // Length score (0-25 points)
  score += Math.min(25, (password.length / policy.maxLength) * 25);

  // Character variety (0-40 points)
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/\d/.test(password)) score += 10;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password)) score += 10;

  // Complexity bonus (0-35 points)
  const uniqueChars = new Set(password).size;
  score += Math.min(15, uniqueChars);

  // No repeating characters bonus
  if (findMaxRepeatingChars(password) <= 2) score += 10;

  // No common patterns bonus
  const hasCommonPatterns = policy.forbiddenPatterns.some((pattern) =>
    password.toLowerCase().includes(pattern.toLowerCase())
  );
  if (!hasCommonPatterns) score += 10;

  return Math.min(100, score);
}

/**
 * Get password policy requirements as human-readable text
 * @returns {Array} Array of requirement strings
 */
function getPasswordRequirements() {
  const policy = getPasswordPolicy();
  const requirements = [];

  requirements.push(
    `Must be ${policy.minLength}-${policy.maxLength} characters long`
  );

  if (policy.requireUppercase) {
    requirements.push(
      `Must contain at least ${policy.minUppercase} uppercase letter(s)`
    );
  }

  if (policy.requireLowercase) {
    requirements.push(
      `Must contain at least ${policy.minLowercase} lowercase letter(s)`
    );
  }

  if (policy.requireNumbers) {
    requirements.push(`Must contain at least ${policy.minNumbers} number(s)`);
  }

  if (policy.requireSymbols) {
    requirements.push(
      `Must contain at least ${policy.minSymbols} special character(s)`
    );
  }

  requirements.push(
    `Cannot have more than ${policy.maxRepeatingChars} consecutive identical characters`
  );
  requirements.push("Cannot contain common words or personal information");

  return requirements;
}

module.exports = {
  validatePassword,
  generatePredictablePassword,
  getPasswordPolicy,
  getPasswordRequirements,
  DEFAULT_POLICY,
};
