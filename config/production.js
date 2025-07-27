const baseConfig = require("./index");

module.exports = {
  ...baseConfig,

  // Production specific overrides
  app: {
    ...baseConfig.app,
    debug: false,
    logLevel: "error",
  },

  session: {
    ...baseConfig.session,
    cookie: {
      ...baseConfig.session.cookie,
      secure: true, // Require HTTPS in production
      httpOnly: true,
      sameSite: "strict",
    },
  },

  // No seeds in production - migrations only
  knex: {
    ...baseConfig.knex,
    seeds: false,
  },

  otel: {
    ...baseConfig.otel,
    // Production OTEL endpoints would be different
  },
};
