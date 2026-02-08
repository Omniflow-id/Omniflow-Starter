/**
 * Seed the permissions table with default system permissions.
 * IDEMPOTENT: Safe to run multiple times - will skip existing permissions.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const seedPermissions = async (knex) => {
  console.log("🌱 [SEEDER] Checking permissions...");

  const permissions = [
    {
      permission_id: 1,
      permission_name: "view_users",
      description: "View user accounts and information",
    },
    {
      permission_id: 2,
      permission_name: "manage_users",
      description: "Create, edit, and delete user accounts",
    },
    {
      permission_id: 3,
      permission_name: "manage_permissions",
      description: "Manage roles and permissions system",
    },
    {
      permission_id: 4,
      permission_name: "view_logs",
      description: "View system activity logs and audit trail",
    },
    {
      permission_id: 5,
      permission_name: "manage_cache",
      description: "Manage system cache and performance",
    },
    {
      permission_id: 6,
      permission_name: "manage_queue",
      description: "Manage job queues and background tasks",
    },
    {
      permission_id: 7,
      permission_name: "view_profile",
      description: "View and edit own user profile",
    },
    {
      permission_id: 8,
      permission_name: "manage_ai_models",
      description: "Manage AI models configuration",
    },
    {
      permission_id: 9,
      permission_name: "manage_ai_use_cases",
      description: "Manage AI use cases and prompts",
    },
    {
      permission_id: 10,
      permission_name: "use_ai_chat",
      description: "Use AI chat functionality",
    },
    {
      permission_id: 11,
      permission_name: "view_roles",
      description: "View system roles",
    },
  ];

  let added = 0;
  let skipped = 0;

  for (const perm of permissions) {
    const exists = await knex("permissions")
      .where("permission_id", perm.permission_id)
      .first();

    if (!exists) {
      await knex("permissions").insert({
        ...perm,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      });
      added++;
    } else {
      skipped++;
    }
  }

  if (added > 0) {
    console.log(`✅ [SEEDER] Added ${added} permissions`);
  }
  if (skipped > 0) {
    console.log(`⏭️  [SEEDER] Skipped ${skipped} existing permissions`);
  }
};

module.exports = { seedPermissions };
