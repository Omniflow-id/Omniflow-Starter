const { seedUsers } = require("./data/users.seeder.js");
const { seedRoles } = require("./data/roles.js");
const { seedPermissions } = require("./data/permissions.js");
const { seedRolePermissions } = require("./data/rolePermissions.js");
const { seedAIAnalysisSettings } = require("./data/aiAnalysisSettings.js");
const { seedAIModels } = require("./data/aiModels.js");
const { seedAIUseCases } = require("./data/aiUseCases.js");

/**
 * Master seeder file - SMART & SAFE VERSION
 *
 * 🚨 PRODUCTION SAFETY:
 * - This seeder is IDEMPOTENT (safe to run multiple times)
 * - It will NOT delete existing data in production
 * - It only adds MISSING data
 * - For destructive reset in development, use: npm run db:reset
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async (knex) => {
  const isProduction = process.env.NODE_ENV === "production";
  const forceCleanup = process.env.FORCE_SEED_CLEANUP === "true";

  // --- SAFETY CHECK ---
  if (isProduction && forceCleanup) {
    console.log("🚨 [SEEDER] PRODUCTION WARNING:");
    console.log("   FORCE_SEED_CLEANUP=true detected!");
    console.log("   This will DELETE all existing data!");
    console.log(
      "   Aborting for safety. Use migrations for production data changes."
    );
    throw new Error(
      "Destructive seeding blocked in production. Use migrations instead."
    );
  }

  // Handle FORCE_SEED_CLEANUP for non-production environments
  if (forceCleanup && !isProduction) {
    console.log("🧹 [SEEDER] FORCE_SEED_CLEANUP=true - Cleaning all data...");

    // AI tables (clean up first due to foreign key constraints)
    await knex("ai_request_logs").del();
    await knex("ai_messages").del();
    await knex("ai_conversations").del();
    await knex("ai_request_logs").del();
    await knex("ai_assistant_logs").del();
    await knex("ai_copilot_logs").del();
    await knex("ai_analysis_settings").del();
    await knex("ai_use_cases").del();
    await knex("ai_models").del();

    await knex("activity_logs").del();
    await knex("jobs").del();
    await knex("user_permissions").del();
    await knex("role_permissions").del();
    await knex("users").del();
    await knex("permissions").del();
    await knex("roles").del();

    console.log("✅ [SEEDER] Cleanup completed. Proceeding with seeding...");
  }

  // Check if we have existing data
  const userCount = await knex("users").count("id as count").first();
  const hasExistingData = userCount && userCount.count > 0;

  if (hasExistingData) {
    console.log(
      "📊 [SEEDER] Existing data detected. Running in SAFE MODE (idempotent)..."
    );
    console.log("   - Will only add missing data");
    console.log("   - Will NOT delete existing data");
    console.log("   - To force reset in DEV: npm run db:reset");
  } else {
    console.log("🌱 [SEEDER] Fresh database detected. Seeding initial data...");
  }

  // --- SMART SEEDING PHASE ---
  // Each seeder checks if data exists before inserting (idempotent)

  try {
    // 1. Seed roles first (users depend on roles)
    await seedRoles(knex);

    // 2. Seed permissions
    await seedPermissions(knex);

    // 3. Seed role_permissions mapping
    await seedRolePermissions(knex);

    // 4. Seed users (depends on roles)
    await seedUsers(knex);

    // 5. Seed AI models (no dependencies)
    await seedAIModels(knex);

    // 6. Seed AI use cases (depends on roles for allowed_roles field)
    await seedAIUseCases(knex);

    // 7. Seed AI analysis settings (depends on AI models and users)
    await seedAIAnalysisSettings(knex);

    console.log("✅ [SEEDER] Database seeding completed successfully.");

    if (hasExistingData) {
      console.log(
        "   ℹ️  Existing data preserved. Only missing data was added."
      );
    }
  } catch (error) {
    console.error("❌ [SEEDER] Seeding failed:", error.message);
    throw error;
  }
};
