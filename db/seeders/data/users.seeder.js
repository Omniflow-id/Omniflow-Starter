const bcrypt = require("bcrypt");

/**
 * Seed the users table with default admin, manager, and user accounts.
 * This seeder is idempotent and can be run multiple times safely.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const seedUsers = async (knex) => {
  // Hash passwords with policy-compliant patterns
  const adminPassword = await bcrypt.hash("Admin12345.", 10);
  const managerPassword = await bcrypt.hash("SystemSupervisor@12345?.", 10);
  const userPassword = await bcrypt.hash("BasicStaff@12345?.", 10);

  await knex("users").insert([
    {
      username: "admin",
      email: "admin@omniflow.id",
      password_hash: adminPassword,
      full_name: "Admin",
      role: "Admin",
      is_active: true,
    },
    {
      username: "manager",
      email: "manager@omniflow.id",
      password_hash: managerPassword,
      full_name: "Manager",
      role: "Manager",
      is_active: true,
    },
    {
      username: "user",
      email: "user@omniflow.id",
      password_hash: userPassword,
      full_name: "User",
      role: "User",
      is_active: true,
    },
  ]);
};

// Export the seed function for the master seeder
module.exports = { seedUsers };
