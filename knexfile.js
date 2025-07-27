const config = require("./config");

const env = process.env.NODE_ENV || "development";
const envConfig = env === "production" 
  ? require("./config/production")
  : require("./config/development");

module.exports = {
  development: envConfig.knex,
  production: envConfig.knex,
};
