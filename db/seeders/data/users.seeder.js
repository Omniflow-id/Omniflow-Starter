require("module-alias/register");
const bcrypt = require("bcrypt");

/**
 * Seed the users table with default admin, manager, and user accounts.
 * IDEMPOTENT: Safe to run multiple times - will skip existing users.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const seedUsers = async (knex) => {
  console.log("🌱 [SEEDER] Checking users...");

  // Hash passwords with policy-compliant patterns
  const adminPassword = await bcrypt.hash("Admin12345.", 10);
  const managerPassword = await bcrypt.hash("Manager12345.", 10);
  const userPassword = await bcrypt.hash("User12345.", 10);

  // Get role IDs
  const adminRole = await knex("roles").where("role_name", "Admin").first();
  const managerRole = await knex("roles").where("role_name", "Manager").first();
  const userRole = await knex("roles").where("role_name", "User").first();

  if (!adminRole || !managerRole || !userRole) {
    console.log("⚠️  [SEEDER] Required roles not found, skipping user seeding");
    return;
  }

  const users = [
    {
      username: "admin",
      email: "admin@omniflow.id",
      password_hash: adminPassword,
      full_name: "Administrator",
      role_id: adminRole.role_id,
      is_active: true,
    },
    {
      username: "manager",
      email: "manager@omniflow.id",
      password_hash: managerPassword,
      full_name: "Manager",
      role_id: managerRole.role_id,
      is_active: true,
    },
    {
      username: "user",
      email: "user@omniflow.id",
      password_hash: userPassword,
      full_name: "Regular User",
      role_id: userRole.role_id,
      is_active: true,
    },
  ];

  let added = 0;
  let skipped = 0;

  for (const user of users) {
    const exists = await knex("users").where("username", user.username).first();

    if (!exists) {
      await knex("users").insert(user);
      added++;
    } else {
      skipped++;
    }
  }

  if (added > 0) {
    console.log(`✅ [SEEDER] Added ${added} users`);
  }
  if (skipped > 0) {
    console.log(`⏭️  [SEEDER] Skipped ${skipped} existing users`);
  }
};

module.exports = { seedUsers };
