// === Third-party modules ===
const mysql = require("mysql2/promise");

// === Relative imports ===
const config = require("../config");

// Create the connection pool using centralized config
const db = mysql.createPool(config.database);

module.exports = { db };
