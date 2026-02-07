const { db } = require("@db/db");

/**
 * Seed permissions data
 */
async function seedPermissions() {
  console.log("🌱 [SEEDER] Seeding permissions...");

  // Clear existing data
  await db.query("DELETE FROM permissions");

  // Reset auto increment
  await db.query("ALTER TABLE permissions AUTO_INCREMENT = 1");

  const permissions = [
    // User Management (sesuai routes/admin/user/)
    {
      permission_name: "view_users",
      description: "View user accounts and information",
    },
    {
      permission_name: "manage_users",
      description: "Create, edit, and delete user accounts",
    },

    // Permissions Management (sesuai routes/admin/permissions/)
    {
      permission_name: "manage_permissions",
      description: "Manage roles and permissions system",
    },

    // Cache Management (sesuai routes/admin/cache/)
    {
      permission_name: "manage_cache",
      description: "Manage system cache and performance",
    },

    // Queue Management (sesuai routes/admin/queue/)
    {
      permission_name: "manage_queue",
      description: "Manage job queues and background tasks",
    },

    // Activity Logs (sesuai routes/admin/log/)
    {
      permission_name: "view_logs",
      description: "View system activity logs and audit trail",
    },

    // User Profile (sesuai routes/admin/userProfile/)
    {
      permission_name: "view_profile",
      description: "View and edit own user profile",
    },

    // AI Management (sesuai routes/admin/aiModels/ dan routes/admin/aiUseCases/)
    {
      permission_name: "manage_ai_models",
      description: "Manage AI models and configurations",
    },
    {
      permission_name: "manage_ai_use_cases",
      description: "Manage AI use cases and personas",
    },
    {
      permission_name: "use_ai_chat",
      description: "Use AI chat functionality",
    },
    {
      permission_name: "view_ai_logs",
      description: "View AI request logs and analytics",
    },
  ];

  for (const permission of permissions) {
    await db.query(
      "INSERT INTO permissions (permission_name, description, created_at, updated_at) VALUES (?, ?, NOW(), NOW())",
      [permission.permission_name, permission.description]
    );
  }

  console.log(
    `✅ [SEEDER] Successfully seeded ${permissions.length} permissions`
  );
}

module.exports = { seedPermissions };
