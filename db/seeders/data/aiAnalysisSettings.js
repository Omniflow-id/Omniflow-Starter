require("module-alias/register");

/**
 * Seed the ai_analysis_settings table with default settings.
 * IDEMPOTENT: Safe to run multiple times - will skip if already exists.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const seedAIAnalysisSettings = async (knex) => {
  console.log("🌱 [SEEDER] Checking AI Analysis Settings...");

  // Check if settings already exist
  const existingSettings = await knex("ai_analysis_settings")
    .where("is_active", true)
    .first();

  if (existingSettings) {
    console.log(
      "⏭️  [SEEDER] AI Analysis Settings already exist. Skipping..."
    );
    return;
  }

  // Get the first active AI model
  const firstModel = await knex("ai_models")
    .where("is_active", true)
    .orderBy("id", "asc")
    .first();

  if (!firstModel) {
    console.warn(
      "⚠️  [SEEDER] No active AI models found. Skipping AI Analysis Settings seeding."
    );
    return;
  }

  // Get first admin user (role_id = 1 is typically Admin)
  const adminUser = await knex("users")
    .where("role_id", 1)
    .first();

  const userId = adminUser ? adminUser.id : null;

  const settings = {
    setting_name: "Default Analysis Settings",
    description: "Pengaturan default untuk analisis AI",
    selected_model_id: firstModel.id,
    max_tokens: 4096,
    temperature: 0.1,
    enable_context: true,
    enable_company_stats: true,
    enable_activity_tracking: true,
    analysis_language: "id-ID",
    is_active: true,
    created_by: userId,
    updated_by: userId,
    created_at: knex.fn.now(),
    updated_at: knex.fn.now(),
  };

  await knex("ai_analysis_settings").insert(settings);

  console.log("✅ [SEEDER] Added AI Analysis Settings");
  console.log(`   - Model: ${firstModel.name} (ID: ${firstModel.id})`);
  console.log(`   - Max Tokens: ${settings.max_tokens}`);
  console.log(`   - Temperature: ${settings.temperature}`);
};

module.exports = { seedAIAnalysisSettings };
