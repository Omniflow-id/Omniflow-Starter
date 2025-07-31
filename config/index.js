// === Side-effect imports (HARUS PALING ATAS) ===
require("dotenv").config();

// === Relative imports ===
const { validateEnvVariables } = require("./validation");
validateEnvVariables();

const config = {
  app: {
    name: "Omniflow Starter",
    url: process.env.APP_URL || "http://localhost",
    port: process.env.PORT || 1234,
    env: process.env.NODE_ENV || "development",
  },

  session: {
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: (process.env.SESSION_TIMEOUT_HOURS || 24) * 60 * 60 * 1000, // Default 24 hours
      secure: process.env.NODE_ENV === "production",
    },
  },

  database: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },

  knex: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    },
    migrations: {
      directory: "./db/migrations",
    },
    seeds: {
      directory: "./db/seeders",
    },
  },

  otel: {
    serviceName: process.env.OTEL_SERVICE_NAME || "omniflow-starter",
    serviceVersion: process.env.OTEL_SERVICE_VERSION || "1.0.0",
    metricsPort: process.env.OTEL_METRICS_PORT || 9091,
    metricsEndpoint: process.env.OTEL_METRICS_ENDPOINT || "/metrics",
    tracesEndpoint:
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
      "http://localhost:4318/v1/traces",
  },

  s3: {
    endpointUrl: process.env.S3_ENDPOINT_URL,
    accessKey: process.env.S3_ACCESS_KEY,
    secretKey: process.env.S3_SECRET_KEY,
    bucketName: process.env.S3_BUCKET_NAME,
    folderName: process.env.S3_FOLDER_NAME,
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
    file: process.env.LOG_FILE || "./logs/app.log",
  },

  timezone: process.env.TIMEZONE || "Asia/Jakarta",

  security: {
    helmetConfig: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "cdn.jsdelivr.net",
            "use.fontawesome.com",
          ],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: true,
      crossOriginOpenerPolicy: { policy: "same-origin" },
      crossOriginResourcePolicy: { policy: "same-origin" },
      dnsPrefetchControl: { allow: false },
      expectCt: { maxAge: 86400, enforce: true },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts: {
        maxAge: 63072000,
        includeSubDomains: true,
        preload: true,
      },
      ieNoOpen: true,
      noSniff: true,
      permittedCrossDomainPolicies: { policy: "none" },
      referrerPolicy: { policy: "no-referrer" },
      xssFilter: true,
    },
  },

  csrf: {
    secret: process.env.CSRF_SECRET,
    cookieName: "csrf-token",
    cookieOptions: {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  },

  compression: {
    threshold: parseInt(process.env.COMPRESSION_THRESHOLD) || 1024, // Only compress if >= 1KB
    level: parseInt(process.env.COMPRESSION_LEVEL) || 6, // Balance between compression ratio and speed (1-9)
    chunkSize: parseInt(process.env.COMPRESSION_CHUNK_SIZE) || 16 * 1024, // 16KB chunks
    enabled: process.env.COMPRESSION_ENABLED !== "false", // Default: enabled
    brotli: {
      enabled: process.env.BROTLI_ENABLED !== "false", // Default: enabled
      quality: parseInt(process.env.BROTLI_QUALITY) || 4, // Brotli quality 0-11 (4 = balanced)
      chunkSize: parseInt(process.env.BROTLI_CHUNK_SIZE) || 16 * 1024, // 16KB chunks
    },
  },
};

module.exports = config;
