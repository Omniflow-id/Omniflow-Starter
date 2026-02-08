require("module-alias/register");
const { encrypt } = require("@helpers/encryption");

/**
 * Seed the ai_models table with default AI model configurations.
 * IDEMPOTENT: Safe to run multiple times - will skip existing models.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
const seedAIModels = async (knex) => {
  console.log("🌱 [SEEDER] Checking AI models...");

  // Check if ENCRYPTION_KEY is set
  if (!process.env.ENCRYPTION_KEY) {
    console.warn(
      "⚠️ [SEEDER] ENCRYPTION_KEY not set. Skipping AI models seeding."
    );
    return;
  }

  try {
    // Encrypt placeholder API keys (user should update these)
    const placeholderKey = "sk-placeholder-update-in-production";
    const encryptedKey = encrypt(placeholderKey);

    const models = [
      {
        name: "OpenAI GPT-4o",
        api_url: "https://api.openai.com/v1/chat/completions",
        api_key: encryptedKey,
        model_variant: "gpt-4o",
        is_active: true,
      },
      {
        name: "OpenAI GPT-4o Mini",
        api_url: "https://api.openai.com/v1/chat/completions",
        api_key: encryptedKey,
        model_variant: "gpt-4o-mini",
        is_active: true,
      },
      {
        name: "OpenAI GPT-3.5 Turbo",
        api_url: "https://api.openai.com/v1/chat/completions",
        api_key: encryptedKey,
        model_variant: "gpt-3.5-turbo",
        is_active: false,
      },
    ];

    let added = 0;
    let skipped = 0;

    for (const model of models) {
      const exists = await knex("ai_models").where("name", model.name).first();

      if (!exists) {
        await knex("ai_models").insert({
          ...model,
          created_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        });
        added++;
      } else {
        skipped++;
      }
    }

    if (added > 0) {
      console.log(`✅ [SEEDER] Added ${added} AI models`);
      console.log(
        "⚠️  [SEEDER] Note: Please update the API keys in production with real values"
      );
    }
    if (skipped > 0) {
      console.log(`⏭️  [SEEDER] Skipped ${skipped} existing AI models`);
    }
  } catch (error) {
    console.error("❌ [SEEDER] Failed to seed AI models:", error.message);
    throw error;
  }
};

module.exports = { seedAIModels };
