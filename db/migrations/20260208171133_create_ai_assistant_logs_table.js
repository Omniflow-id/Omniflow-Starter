/**
 * Migration: Create AI Assistant Logs Table
 * Logging for AI Assistant (sidebar) - for admin monitoring
 */

exports.up = (knex) =>
  knex.schema.createTable("ai_assistant_logs", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable();
    table.string("page_id", 100).nullable(); // Current page context
    table.text("user_message").notNullable();
    table.text("ai_response").notNullable();
    table.integer("model_id").unsigned().nullable();
    table.integer("token_usage").unsigned().nullable();
    table.string("session_id", 255).nullable(); // For grouping conversations
    table.timestamps(true, true);

    // Indexes for monitoring
    table.index("user_id");
    table.index("model_id");
    table.index("page_id");
    table.index("created_at");
  });

exports.down = (knex) => knex.schema.dropTableIfExists("ai_assistant_logs");
