const bcrypt = require("bcrypt");
const { db } = require("./db");

const insertUsersQuery = `
    INSERT INTO users (username, email, password_hash, full_name, role) VALUES 
    (?, ?, ?, ?, ?);
`;

const usersData = [
  {
    username: "admin",
    email: "admin@omniflow.id",
    password: "Admin12345.",
    full_name: "Administrator",
    role: "Admin",
  },
  {
    username: "manager",
    email: "manager@omniflow.id",
    password: "Manager12345.",
    full_name: "Manager",
    role: "Manager",
  },
  {
    username: "user",
    email: "user@omniflow.id",
    password: "User12345.",
    full_name: "User",
    role: "User",
  },
];

async function runSeeder() {
  try {
    for (let user of usersData) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.query(insertUsersQuery, [
        user.username,
        user.email,
        hashedPassword,
        user.full_name,
        user.role,
      ]);
    }
    console.log("Seeded 'users' table with hashed passwords.");
  } catch (err) {
    console.error("Error running seeder:", err);
  } finally {
    await db.end();
    console.log("Database connection closed.");
  }
}

runSeeder();
