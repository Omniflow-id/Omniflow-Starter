const { db } = require("./db");

const createUsersTableQuery = `
    CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('Admin', 'Manager', 'User') NOT NULL DEFAULT 'User',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    );
`;

const createActivityLogsTableQuery = `

    CREATE TABLE activity_logs (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT,
        activity VARCHAR(255) NOT NULL,
        ip_address VARCHAR(45),
        device_type VARCHAR(50),
        browser VARCHAR(50),
        platform VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

`;

async function runMigration() {
  try {
    await db.query("DROP TABLE IF EXISTS activity_logs, users");
    await db.query(createUsersTableQuery);
    console.log("Users table created"); 
    await db.query(createActivityLogsTableQuery);
    console.log("Activity logs table created");
    console.log("Migration completed successfully");
  } catch (err) {
    console.error("Error running migration:", err);
  } finally {
    await db.end();
  }
}

runMigration();
