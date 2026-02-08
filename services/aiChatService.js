const config = require("../config");
const { db } = require("@db/db");
const { decrypt } = require("@helpers/encryption");

let langfuse;

// Initialize Langfuse (independent of AI model config)
try {
  const { Langfuse } = require("langfuse");

  if (process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY) {
    langfuse = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
    });
  }
} catch (_error) {
  console.warn("[AIService] Langfuse dependencies missing or failed to load.");
}

/**
 * Get OpenAI client configured with AI Analysis Settings
 * This uses the global AI Analysis Settings from database
 * @returns {Promise<{openai: OpenAI, modelConfig: Object}>}
 */
async function getOpenAIClient() {
  const OpenAI = require("openai");

  // Try to get from AI Analysis Settings first
  try {
    const [activeSettings] = await db.query(`
      SELECT m.*, s.max_tokens, s.temperature
      FROM ai_analysis_settings s
      LEFT JOIN ai_models m ON s.selected_model_id = m.id
      WHERE s.is_active = TRUE AND m.is_active = TRUE
      ORDER BY s.updated_at DESC
      LIMIT 1
    `);

    if (activeSettings.length > 0) {
      const modelConfig = activeSettings[0];
      const decryptedApiKey = decrypt(modelConfig.api_key);

      const openai = new OpenAI({
        apiKey: decryptedApiKey,
        baseURL: modelConfig.api_url?.replace("/chat/completions", ""),
      });

      return { openai, modelConfig };
    }
  } catch (error) {
    console.warn(
      "[AIService] Failed to load AI Analysis Settings:",
      error.message
    );
  }

  // Fallback to .env config
  if (config.llm.apiKey) {
    const openai = new OpenAI({
      apiKey: config.llm.apiKey,
      baseURL: config.llm.apiUrl,
    });

    return {
      openai,
      modelConfig: {
        model_variant: config.llm.modelName || "gpt-4o-mini",
        api_url: config.llm.apiUrl,
        api_key: config.llm.apiKey,
      },
    };
  }

  throw new Error(
    "No AI model configured. Please configure AI Analysis Settings or set LLM_API_KEY in .env"
  );
}

/**
 * Legacy OpenAI instance (for backward compatibility)
 * Prefer using getOpenAIClient() for new code
 */
let openai;
try {
  const OpenAI = require("openai");
  if (config.llm.apiKey) {
    openai = new OpenAI({
      apiKey: config.llm.apiKey,
      baseURL: config.llm.apiUrl,
    });
  }
} catch (_error) {
  console.warn(
    "[AIService] OpenAI dependencies missing or failed to load. Please run: npm install openai"
  );
}

module.exports = {
  openai,
  langfuse,
  getOpenAIClient,
};
