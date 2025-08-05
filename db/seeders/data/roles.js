const { db } = require("@db/db");

/**
 * Seed roles data
 */
async function seedRoles() {
  console.log("🌱 [SEEDER] Seeding roles...");

  // Clear existing data
  await db.query("DELETE FROM roles");

  // Reset auto increment
  await db.query("ALTER TABLE roles AUTO_INCREMENT = 1");

  const roles = [
    {
      role_name: "Admin",
      description: "Administrator with full permissions",
    },
    {
      role_name: "Manager",
      description: "Manager with limited admin permissions",
    },
    {
      role_name: "User",
      description: "Regular user with basic permissions",
    },
  ];

  for (const role of roles) {
    await db.query(
      "INSERT INTO roles (role_name, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
      [role.role_name, role.description]
    );
  }

  console.log(`✅ [SEEDER] Successfully seeded ${roles.length} roles`);
}

module.exports = { seedRoles };
