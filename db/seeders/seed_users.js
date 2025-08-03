const bcrypt = require("bcrypt");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async (knex) => {
  // Deletes ALL existing entries
  await knex("users").del();

  // Hash passwords with policy-compliant patterns (avoid username conflicts)
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
