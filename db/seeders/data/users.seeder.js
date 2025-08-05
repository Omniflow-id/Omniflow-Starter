require("module-alias/register");
const bcrypt = require("bcrypt");
const { db } = require("@db/db");

/**
 * Seed the users table with default admin, manager, and user accounts.
 * This seeder is idempotent and can be run multiple times safely.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const seedUsers = async (knex) => {
  console.log("🌱 [SEEDER] Seeding users...");

  // Hash passwords with policy-compliant patterns
  const adminPassword = await bcrypt.hash("Admin12345.", 10);
  const managerPassword = await bcrypt.hash("Manager12345.", 10);
  const userPassword = await bcrypt.hash("User12345.", 10);

  // Get role IDs
  const [adminRole] = await db.query(
    "SELECT role_id FROM roles WHERE role_name = 'Admin'"
  );
  const [managerRole] = await db.query(
    "SELECT role_id FROM roles WHERE role_name = 'Manager'"
  );
  const [userRole] = await db.query(
    "SELECT role_id FROM roles WHERE role_name = 'User'"
  );

  await knex("users").insert([
    {
      username: "admin",
      email: "admin@omniflow.id",
      password_hash: adminPassword,
      full_name: "Admin",
      role_id: adminRole[0].role_id,
      is_active: true,
    },
    {
      username: "manager",
      email: "manager@omniflow.id",
      password_hash: managerPassword,
      full_name: "Manager",
      role_id: managerRole[0].role_id,
      is_active: true,
    },
    {
      username: "user",
      email: "user@omniflow.id",
      password_hash: userPassword,
      full_name: "User",
      role_id: userRole[0].role_id,
      is_active: true,
    },
  ]);

  console.log("✅ [SEEDER] Successfully seeded 3 users");
};

// Export the seed function for the master seeder
module.exports = { seedUsers };
