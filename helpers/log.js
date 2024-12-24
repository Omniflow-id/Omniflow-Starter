const fs = require('fs');
const path = require('path');
const { db } = require('../db/db');

const LOG_LEVELS = {
  INFO: 'INFO',
  ERROR: 'ERROR',
  WARN: 'WARN',
};

const getTimestamp = () => {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();
  return `${day < 10 ? '0' : ''}${day}-${month < 10 ? '0' : ''}${month}-${year} ${hours < 10 ? '0' : ''}${hours}:${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

async function log(message, level = LOG_LEVELS.INFO, user_id = null, userAgentData = {}, ip = '') {
  const timestamp = getTimestamp();
  const { deviceType = 'Unknown', browser = 'Unknown', platform = 'Unknown' } = userAgentData;
  
  let username = 'Unknown User';
  if (user_id) {
    try {
      const [rows] = await db.query("SELECT username FROM users WHERE id = ?", [user_id]);
      if (rows.length > 0) {
        username = rows[0].username;
      }
    } catch (err) {
      console.error("Error fetching username:", err);
    }
  }

  const detailedLogMessage = `[${timestamp}] [${level}] [User: ${username}] [IP: ${ip}] [Device: ${deviceType}] [Browser: ${browser}] [Platform: ${platform}] ${message}`;

  console.log(detailedLogMessage);

  const logFilePath = path.join(__dirname, '..', 'logs', 'app.log');
  if (!fs.existsSync(path.dirname(logFilePath))) {
    fs.mkdirSync(path.dirname(logFilePath), { recursive: true });
  }
  fs.appendFileSync(logFilePath, detailedLogMessage + '\n', 'utf8');

  try {
    await db.query(
      "INSERT INTO activity_logs (user_id, activity, ip_address, device_type, browser, platform, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [user_id, message, ip, deviceType, browser, platform, new Date()]
    );
  } catch (err) {
    console.error("Error logging to database:", err);
  }
}

module.exports = { log, LOG_LEVELS };