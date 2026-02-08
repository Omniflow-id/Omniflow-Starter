/**
 * Seed the roles table with default system roles.
 * IDEMPOTENT: Safe to run multiple times - will skip existing roles.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const seedRoles = async (knex) => {
  console.log("🌱 [SEEDER] Checking roles...");

  const roles = [
    { role_id: 1, role_name: "Admin", description: "Full system access" },
    { role_id: 2, role_name: "Manager", description: "User management and monitoring" },
    { role_id: 3, role_name: "User", description: "Basic user access" },
  ];

  let added = 0;
  let skipped = 0;

  for (const role of roles) {
    const exists = await knex("roles").where("role_id", role.role_id).first();
    
    if (!exists) {
      await knex("roles").insert({
        ...role,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
      added++;
    } else {
      skipped++;
    }
  }

  if (added > 0) {
    console.log(`✅ [SEEDER] Added ${added} roles`);
  }
  if (skipped > 0) {
    console.log(`⏭️  [SEEDER] Skipped ${skipped} existing roles`);
  }
};

module.exports = { seedRoles };
