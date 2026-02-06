// === Side-effect imports (HARUS PALING ATAS) ===
require("dotenv").config();

// === Relative imports ===
const { validateEnvVariables } = require("./validation");
validateEnvVariables();

const config = {
  app: {
    name: process.env.APP_NAME || "Omniflow Starter",
    url: process.env.APP_URL || "http://localhost",
    port: process.env.PORT || 1234,
    env: process.env.NODE_ENV || "development",
    // Dynamic URL generator for emails and links
    getFullUrl: function () {
      const baseUrl = this.url;
      const port = this.port;
      const env = this.env;

      // Production: use APP_URL as-is (should include https and domain)
      if (env === "production") {
        return baseUrl;
      }

      // Development: add port if localhost
      if (baseUrl.includes("localhost") || baseUrl.includes("127.0.0.1")) {
        return `${baseUrl}:${port}`;
      }

      // Default: return baseUrl as-is
      return baseUrl;
    },
  },

  session: {
    secret: process.env.SESSION_KEY,
    resave: false,
    saveUninitialized: false,
    rolling: true, // Reset session timeout on each request to implement sliding sessions
    cookie: {
      maxAge: (process.env.SESSION_TIMEOUT_HOURS || 24) * 60 * 60 * 1000, // Default 24 hours
      secure:
        process.env.NODE_ENV === "production" &&
        process.env.USE_HTTPS === "true",
      httpOnly: true, // Prevent client-side JS from accessing the cookie
      sameSite: "lax", // CSRF protection
    },
    // MySQL Session Store Options
    storeOptions: {
      clearExpired: true,
      checkExpirationInterval: 900000, // 15 minutes
      expiration: (process.env.SESSION_TIMEOUT_HOURS || 24) * 60 * 60 * 1000, // Sync with cookie maxAge
      createDatabaseTable: true,
      schema: {
        tableName: "sessions",
        columnNames: {
          session_id: "session_id",
          expires: "expires",
          data: "data",
        },
      },
    },
  },

  database: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    // Connection Pool Configuration (MySQL2 compatible)
    connectionLimit:
      parseInt(process.env.DB_CONNECTION_LIMIT, 10) ||
      (process.env.NODE_ENV === "production" ? 50 : 10),
    queueLimit: parseInt(process.env.DB_QUEUE_LIMIT, 10) || 0,
    waitForConnections: true,
    maxIdle: parseInt(process.env.DB_MAX_IDLE, 10) || 10,
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT, 10) || 60000,
    // Advanced Settings
    multipleStatements: process.env.DB_MULTIPLE_STATEMENTS === "true", // Default: false for security
    timezone: "+07:00", // MySQL2 compatible timezone format
    charset: process.env.DB_CHARSET || "utf8mb4",
    // SSL Configuration (optional)
    ssl:
      process.env.DB_SSL_ENABLED === "true"
        ? {
          rejectUnauthorized:
            process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
        }
        : false,
  },

  knex: {
    client: "mysql2",
    connection: {
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: parseInt(process.env.DB_PORT, 10) || 3306,
    },
    migrations: {
      directory: "./db/migrations",
    },
    seeds: {
      directory: "./db/seeders",
    },
  },

  otel: {
    serviceName: process.env.OTEL_SERVICE_NAME || "omniflow-express-starter",
    serviceVersion: process.env.OTEL_SERVICE_VERSION || "1.0.0",
    metricsPort: parseInt(process.env.OTEL_METRICS_PORT, 10) || 9096,
    metricsEndpoint: process.env.OTEL_METRICS_ENDPOINT || "/metrics",
    tracesEndpoint:
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
      "http://localhost:4318/v1/traces",
  },

  email: {
    enabled: process.env.EMAIL_ENABLED === "true",
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    fromName: process.env.SMTP_FROM_NAME || "Omniflow Starter",
    fromEmail: process.env.SMTP_FROM_EMAIL,
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
    // Disable file logging in production/Docker - use Docker logs instead
    file:
      process.env.DOCKER_ENV === "true"
        ? false
        : process.env.LOG_FILE || "./logs/app.log",
  },

  timezone: process.env.TIMEZONE || "Asia/Jakarta",

  security: {
    helmetConfig: {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: [
            "'self'",
            "https://connectivitycheck.gstatic.com",
            "https://*.google.com",
            "https://*.googleapis.com",
            "https://*.gstatic.com",
            "wss://*.google.com",
          ],
          connectSrc: [
            "'self'",
            "https://connectivitycheck.gstatic.com",
            "https://*.google.com",
            "https://*.googleapis.com",
            "https://*.gstatic.com",
            "wss://*.google.com",
          ],
          mediaSrc: ["'self'", "https://*.google.com", "blob:", "data:"],
          frameSrc: ["'self'", "https://*.google.com"],
          workerSrc: ["'self'", "blob:"],
          imgSrc: [
            "'self'",
            "data:",
            "https://*.google.com",
            "https://*.googleapis.com",
            "https://*.gstatic.com"
          ],
          scriptSrc: [
            "'self'",
            "'unsafe-inline'",
            "cdn.jsdelivr.net",
            "use.fontawesome.com",
          ],
          scriptSrcAttr: ["'unsafe-inline'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests:
            process.env.NODE_ENV === "production" ? [] : null,
        },
        reportOnly: false,
      },
      crossOriginEmbedderPolicy: process.env.NODE_ENV === "production",
      crossOriginOpenerPolicy: {
        policy:
          process.env.NODE_ENV === "production" ? "same-origin" : "unsafe-none",
      },
      crossOriginResourcePolicy: { policy: "same-origin" },
      dnsPrefetchControl: { allow: false },
      expectCt: { maxAge: 86400, enforce: true },
      frameguard: { action: "deny" },
      hidePoweredBy: true,
      hsts:
        process.env.NODE_ENV === "production"
          ? {
            maxAge: 63072000,
            includeSubDomains: true,
            preload: true,
          }
          : false,
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
    threshold: parseInt(process.env.COMPRESSION_THRESHOLD, 10) || 1024, // Only compress if >= 1KB
    level: parseInt(process.env.COMPRESSION_LEVEL, 10) || 6, // Balance between compression ratio and speed (1-9)
    chunkSize: parseInt(process.env.COMPRESSION_CHUNK_SIZE, 10) || 16 * 1024, // 16KB chunks
    enabled: process.env.COMPRESSION_ENABLED !== "false", // Default: enabled
    brotli: {
      enabled: process.env.BROTLI_ENABLED !== "false", // Default: enabled
      quality: parseInt(process.env.BROTLI_QUALITY, 10) || 4, // Brotli quality 0-11 (4 = balanced)
      chunkSize: parseInt(process.env.BROTLI_CHUNK_SIZE, 10) || 16 * 1024, // 16KB chunks
    },
  },

  jwt: {
    enabled: process.env.JWT_ENABLED === "true",
    secret: process.env.JWT_SECRET || process.env.SESSION_KEY,
    expiresIn: process.env.JWT_EXPIRES_IN || "24h",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  },

  cors: {
    enabled: process.env.CORS_ENABLED !== "false", // Default enabled
    origin: process.env.CORS_ORIGIN || "*",
    credentials: process.env.CORS_CREDENTIALS === "true",
    methods: process.env.CORS_METHODS || "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders:
      process.env.CORS_ALLOWED_HEADERS ||
      "Content-Type,Authorization,X-Requested-With",
    exposedHeaders: process.env.CORS_EXPOSED_HEADERS || "",
    maxAge: parseInt(process.env.CORS_MAX_AGE, 10) || 86400, // 24 hours
    preflightContinue: process.env.CORS_PREFLIGHT_CONTINUE === "true",
    optionsSuccessStatus:
      parseInt(process.env.CORS_OPTIONS_SUCCESS_STATUS, 10) || 204,
  },

  redis: {
    enabled: process.env.REDIS_ENABLED === "true",
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    username: process.env.REDIS_USERNAME || undefined,
    // Connection configuration
    maxRetries: parseInt(process.env.REDIS_MAX_RETRIES, 10) || 5,
    retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY, 10) || 100,
    enableReadyCheck: process.env.REDIS_READY_CHECK !== "false", // Default: true
    maxRetriesPerRequest:
      parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST, 10) || 3,
    lazyConnect: process.env.REDIS_LAZY_CONNECT !== "false", // Default: true
    keepAlive: parseInt(process.env.REDIS_KEEP_ALIVE, 10) || 30000, // 30 seconds
    // Cache configuration
    defaultTTL: parseInt(process.env.REDIS_DEFAULT_TTL, 10) || 3600, // 1 hour default
    keyPrefix: process.env.REDIS_KEY_PREFIX || "starter:",
  },

  rabbitmq: {
    enabled: process.env.RABBITMQ_ENABLED === "true",
    host: process.env.RABBITMQ_HOST || "localhost",
    port: parseInt(process.env.RABBITMQ_PORT, 10) || 5672,
    username: process.env.RABBITMQ_USER || "guest",
    password: process.env.RABBITMQ_PASSWORD || "guest",
    // Connection configuration
    maxReconnectAttempts:
      parseInt(process.env.RABBITMQ_MAX_RECONNECT_ATTEMPTS, 10) || 10,
    reconnectDelay: parseInt(process.env.RABBITMQ_RECONNECT_DELAY, 10) || 1000,
    // Queue configuration
    defaultQueueOptions: {
      durable: process.env.RABBITMQ_QUEUE_DURABLE !== "false", // Default: true
      autoDelete: process.env.RABBITMQ_QUEUE_AUTO_DELETE === "true", // Default: false
    },
    // Message configuration
    defaultMessageOptions: {
      persistent: process.env.RABBITMQ_MESSAGE_PERSISTENT !== "false", // Default: true
    },
  },

  llm: {
    enabled: process.env.LLM_ENABLED === "true", // Feature flag
    modelName: process.env.LLM_MODEL_NAME || "gpt-4o-mini",
    apiUrl: process.env.LLM_API_URL, // Optional
    apiKey: process.env.LLM_API_KEY, // Strict: No fallback to OPENAI_API_KEY
  },
};

module.exports = config;
