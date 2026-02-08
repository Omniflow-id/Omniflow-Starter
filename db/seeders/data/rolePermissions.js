/**
 * Seed role_permissions mapping data
 * IDEMPOTENT: Safe to run multiple times - will skip existing mappings.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
async function seedRolePermissions(knex) {
  console.log("🌱 [SEEDER] Checking role_permissions mapping...");

  const roleMappings = [
    // Admin (role_id: 1) - Full system access
    {
      role_name: "Admin",
      permissions: [
        "view_users",
        "manage_users",
        "manage_permissions",
        "manage_cache",
        "manage_queue",
        "view_logs",
        "view_profile",
        "view_roles",
        // AI Management permissions
        "manage_ai_models",
        "manage_ai_use_cases",
        "use_ai_chat",
      ],
    },

    // Manager (role_id: 2) - User management + cache/queue monitoring
    {
      role_name: "Manager",
      permissions: [
        "view_users",
        "view_logs",
        "view_profile",
        // AI access for Managers
        "use_ai_chat",
      ],
    },

    // User (role_id: 3) - Can view logs and manage own profile
    {
      role_name: "User",
      permissions: [
        "view_profile",
        // AI access for Users
        "use_ai_chat",
      ],
    },
  ];

  let totalAdded = 0;
  let totalSkipped = 0;

  for (const roleMapping of roleMappings) {
    // Get role_id
    const role = await knex("roles")
      .where("role_name", roleMapping.role_name)
      .first();

    if (!role) {
      console.log(
        `⚠️  [SEEDER] Role '${roleMapping.role_name}' not found, skipping...`
      );
      continue;
    }

    const roleId = role.role_id;
    let roleAdded = 0;
    let roleSkipped = 0;

    for (const permissionName of roleMapping.permissions) {
      // Get permission_id
      const permission = await knex("permissions")
        .where("permission_name", permissionName)
        .first();

      if (!permission) {
        console.log(
          `⚠️  [SEEDER] Permission '${permissionName}' not found, skipping...`
        );
        continue;
      }

      const permissionId = permission.permission_id;

      // Check if mapping already exists
      const exists = await knex("role_permissions")
        .where({
          role_id: roleId,
          permission_id: permissionId,
        })
        .first();

      if (!exists) {
        await knex("role_permissions").insert({
          role_id: roleId,
          permission_id: permissionId,
          created_at: knex.fn.now(),
        });
        roleAdded++;
        totalAdded++;
      } else {
        roleSkipped++;
        totalSkipped++;
      }
    }

    if (roleAdded > 0) {
      console.log(
        `✅ [SEEDER] Added ${roleAdded} permissions to '${roleMapping.role_name}'`
      );
    }
  }

  if (totalAdded > 0) {
    console.log(`✅ [SEEDER] Total ${totalAdded} role-permission mappings added`);
  }
  if (totalSkipped > 0) {
    console.log(`⏭️  [SEEDER] Total ${totalSkipped} existing mappings skipped`);
  }
}

module.exports = { seedRolePermissions };
