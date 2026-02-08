/**
 * Migration: Create AI Copilot Logs Table
 * Rebranded from "AI Screen Analysis" to "AI Copilot"
 */

exports.up = (knex) =>
  knex.schema.createTable("ai_copilot_logs", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable();
    table.text("screen_context").notNullable();
    table.text("user_query").nullable();
    table.text("ai_response").notNullable();
    table.integer("model_id").unsigned().nullable();
    // Foreign key to ai_analysis_settings (global config)
    // Note: ai_copilot_logs stores AI Copilot usage logs
    // Global config (model, tokens, temp) is stored in ai_analysis_settings
    table.string("page_url", 500).nullable();
    table.integer("token_usage").unsigned().nullable();
    table.timestamps(true, true);

    // Indexes
    table.index("user_id");
    table.index("model_id");
    table.index("created_at");
  });

exports.down = (knex) => knex.schema.dropTableIfExists("ai_copilot_logs");
