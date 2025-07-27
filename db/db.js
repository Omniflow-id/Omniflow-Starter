const mysql = require("mysql2/promise");
const config = require("../config");

// Create the connection pool using centralized config
const db = mysql.createPool(config.database);

module.exports = { db };
