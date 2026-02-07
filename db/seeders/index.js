const { seedUsers } = require("./data/users.seeder.js");
const { seedRoles } = require("./data/roles.js");
const { seedPermissions } = require("./data/permissions.js");
const { seedRolePermissions } = require("./data/rolePermissions.js");
const { seedAIModels } = require("./data/aiModels.js");
const { seedAIUseCases } = require("./data/aiUseCases.js");

/**
 * Master seeder file to control the order of data seeding.
 * This is the only seeder that should be run by Knex.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async (knex) => {
  // --- 1. CLEANUP PHASE ---
  // Clean up existing data in the correct order to avoid foreign key constraints.
  // We use .del() instead of .truncate() because .del() respects foreign keys.
  console.log("Cleaning up database...");

  // AI tables (clean up first due to foreign key constraints)
  await knex("ai_request_logs").del();
  await knex("ai_messages").del();
  await knex("ai_conversations").del();
  await knex("ai_use_cases").del();
  await knex("ai_models").del();

  await knex("activity_logs").del();
  await knex("jobs").del();
  await knex("user_permissions").del();
  await knex("role_permissions").del();
  await knex("users").del();
  await knex("permissions").del();
  await knex("roles").del();

  // --- 2. SEEDING PHASE ---
  // The order of execution is critical. Add new seeders here in the correct sequence.
  console.log("Seeding data...");

  // 1. Seed roles first (users depend on roles)
  await seedRoles();

  // 2. Seed permissions
  await seedPermissions();

  // 3. Seed role_permissions mapping
  await seedRolePermissions();

  // 4. Seed users (depends on roles)
  await seedUsers(knex);

  // 5. Seed AI models (no dependencies)
  await seedAIModels(knex);

  // 6. Seed AI use cases (depends on roles for allowed_roles field)
  await seedAIUseCases(knex);

  console.log("Database seeding completed successfully.");
};
