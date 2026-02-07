const { db } = require("@db/db");

/**
 * Seed role_permissions mapping data
 */
async function seedRolePermissions() {
  console.log("🌱 [SEEDER] Seeding role_permissions mapping...");

  // Clear existing data
  await db.query("DELETE FROM role_permissions");

  // Define role-permission mappings based on instruction example:
  // Admin Marketing → manage_blog
  // Admin Finance → view_finance
  // Manager HR → approve_leave
  // User → view_blog
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
        // AI Management permissions
        "manage_ai_models",
        "manage_ai_use_cases",
        "use_ai_chat",
        "view_ai_logs",
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

  for (const roleMapping of roleMappings) {
    // Get role_id
    const [roles] = await db.query(
      "SELECT role_id FROM roles WHERE role_name = ?",
      [roleMapping.role_name]
    );

    if (roles.length === 0) {
      console.log(
        `⚠️  [SEEDER] Role '${roleMapping.role_name}' not found, skipping...`
      );
      continue;
    }

    const roleId = roles[0].role_id;

    for (const permissionName of roleMapping.permissions) {
      // Get permission_id
      const [permissions] = await db.query(
        "SELECT permission_id FROM permissions WHERE permission_name = ?",
        [permissionName]
      );

      if (permissions.length === 0) {
        console.log(
          `⚠️  [SEEDER] Permission '${permissionName}' not found, skipping...`
        );
        continue;
      }

      const permissionId = permissions[0].permission_id;

      // Insert role_permission mapping
      await db.query(
        "INSERT INTO role_permissions (role_id, permission_id, created_at) VALUES (?, ?, NOW())",
        [roleId, permissionId]
      );
    }

    console.log(
      `✅ [SEEDER] Mapped ${roleMapping.permissions.length} permissions to '${roleMapping.role_name}' role`
    );
  }

  console.log("✅ [SEEDER] Successfully seeded role_permissions mappings");
}

module.exports = { seedRolePermissions };
