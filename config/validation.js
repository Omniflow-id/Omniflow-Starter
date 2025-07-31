/**
 * Environment Variable Validation
 * Feature-based validation for batteries-included boilerplate
 * Only validates variables for enabled features
 */

const validateEnvVariables = () => {
  // Core required variables (always needed)
  const coreRequired = [
    "SESSION_KEY",
    "DB_HOST",
    "DB_USER",
    "DB_PASSWORD",
    "DB_NAME",
  ];

  // Feature-based conditional validation
  const featureValidation = {
    redis: {
      enableFlag: "REDIS_ENABLED",
      required: ["REDIS_HOST", "REDIS_PORT"],
      optional: ["REDIS_PASSWORD", "REDIS_DB", "REDIS_USERNAME"],
      description: "Redis caching",
    },
    email: {
      enableFlag: "EMAIL_ENABLED",
      required: ["SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD"],
      optional: ["SMTP_FROM_NAME", "SMTP_FROM_EMAIL"],
      description: "Email notifications",
    },
    s3: {
      enableFlag: "S3_ENABLED",
      required: [
        "S3_ENDPOINT_URL",
        "S3_ACCESS_KEY",
        "S3_SECRET_KEY",
        "S3_BUCKET_NAME",
      ],
      optional: ["S3_FOLDER_NAME", "S3_REGION"],
      description: "S3 file storage",
    },
    monitoring: {
      enableFlag: "MONITORING_ENABLED",
      required: ["OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"],
      optional: [
        "OTEL_SERVICE_NAME",
        "OTEL_SERVICE_VERSION",
        "OTEL_METRICS_PORT",
      ],
      description: "OpenTelemetry monitoring",
    },
    jwt: {
      enableFlag: "JWT_ENABLED",
      required: ["JWT_SECRET"],
      optional: ["JWT_EXPIRES_IN", "JWT_REFRESH_EXPIRES_IN"],
      description: "JWT authentication",
    },
  };

  // Variables with defaults (always optional)
  const optionalWithDefaults = [
    "NODE_ENV",
    "APP_URL",
    "PORT",
    "SESSION_TIMEOUT_HOURS",
    "CSRF_SECRET", // falls back to SESSION_KEY
    "JWT_SECRET", // falls back to SESSION_KEY
    "JWT_EXPIRES_IN",
    "JWT_REFRESH_EXPIRES_IN",
    "COMPRESSION_ENABLED",
    "COMPRESSION_THRESHOLD",
    "COMPRESSION_LEVEL",
    "COMPRESSION_CHUNK_SIZE",
    "BROTLI_ENABLED",
    "BROTLI_QUALITY",
    "BROTLI_CHUNK_SIZE",
    "OTEL_SERVICE_NAME",
    "OTEL_SERVICE_VERSION",
    "OTEL_METRICS_PORT",
    "OTEL_METRICS_ENDPOINT",
    "LOG_LEVEL",
    "LOG_FILE",
    "TIMEZONE",
  ];

  const missing = [];
  const warnings = [];
  const enabledFeatures = [];

  // Check core required variables
  for (const envVar of coreRequired) {
    if (!process.env[envVar] || process.env[envVar].trim() === "") {
      missing.push(envVar);
    }
  }

  // CSRF_SECRET validation - must exist if SESSION_KEY doesn't exist
  if (!process.env.CSRF_SECRET && !process.env.SESSION_KEY) {
    missing.push("CSRF_SECRET (or SESSION_KEY as fallback)");
  }

  // JWT_SECRET validation - must exist if SESSION_KEY doesn't exist and JWT is enabled
  const isJwtEnabled = process.env.JWT_ENABLED === "true";
  if (isJwtEnabled && !process.env.JWT_SECRET && !process.env.SESSION_KEY) {
    missing.push("JWT_SECRET (or SESSION_KEY as fallback)");
  }

  // Check feature-based validation
  for (const [_featureName, config] of Object.entries(featureValidation)) {
    const isEnabled = process.env[config.enableFlag] === "true";

    if (isEnabled) {
      enabledFeatures.push(`${config.description} (${config.enableFlag}=true)`);

      // Check required variables for this feature
      for (const envVar of config.required) {
        if (!process.env[envVar] || process.env[envVar].trim() === "") {
          missing.push(`${envVar} (required for ${config.description})`);
        }
      }

      // Warn about empty optional variables for enabled features
      for (const envVar of config.optional || []) {
        if (process.env[envVar] === "") {
          warnings.push(
            `${envVar} is empty (optional for ${config.description})`
          );
        }
      }
    }
  }

  // Check for empty optional variables with defaults
  for (const envVar of optionalWithDefaults) {
    if (process.env[envVar] === "") {
      warnings.push(`${envVar} is set but empty - using default value`);
    }
  }

  // Display enabled features
  if (enabledFeatures.length > 0) {
    console.log("\n🔧 [CONFIG] Enabled optional features:");
    enabledFeatures.forEach((feature) => console.log(`   • ${feature}`));
  }

  // Display warnings for empty variables
  if (warnings.length > 0) {
    console.log("\n⚠️  [CONFIG] Warnings:");
    warnings.forEach((warning) => console.log(`   ${warning}`));
  }

  // If any required variables are missing, exit the application
  if (missing.length > 0) {
    console.error("\n❌ [CONFIG] Missing required environment variables:");
    missing.forEach((variable) => {
      console.error(`   ${variable}`);
    });

    console.error("\n💡 [CONFIG] Tips:");
    console.error("   • Check your .env file (example: .env.example)");
    console.error(
      "   • Disable unused features by setting FEATURE_ENABLED=false"
    );
    console.error("   • Only enabled features require their variables\n");

    process.exit(1);
  }

  // Success message
  const featureCount = enabledFeatures.length;
  console.log(
    `✅ [CONFIG] Validation passed (${featureCount} optional features enabled)`
  );

  return true;
};

module.exports = {
  validateEnvVariables,
};
