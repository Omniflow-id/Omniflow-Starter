const baseConfig = require("./index");

module.exports = {
  ...baseConfig,

  // Development specific overrides
  app: {
    ...baseConfig.app,
    debug: true,
    logLevel: "debug",
  },

  session: {
    ...baseConfig.session,
    cookie: {
      ...baseConfig.session.cookie,
      secure: false, // Allow HTTP in development
    },
  },

  // Enable seeds for development
  knex: {
    ...baseConfig.knex,
    seeds: {
      directory: "./db/seeders",
    },
  },

  otel: {
    ...baseConfig.otel,
    // Development might use different endpoints
    tracesEndpoint: "http://localhost:4318/v1/traces",
  },
};
