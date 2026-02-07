/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) =>
  knex.schema.createTable("ai_request_logs", (table) => {
    table.increments("id").primary();
    table.integer("conversation_id").unsigned().notNullable();
    table.integer("message_id").unsigned().notNullable();
    table.integer("model_id").unsigned().notNullable();
    table.text("prompt_final"); // Final prompt sent to AI
    table.text("ai_response"); // AI response content
    table.integer("token_usage"); // Token usage statistics
    table.timestamp("created_at").defaultTo(knex.fn.now());

    // Foreign keys
    table
      .foreign("conversation_id")
      .references("id")
      .inTable("ai_conversations")
      .onDelete("CASCADE");
    table
      .foreign("message_id")
      .references("id")
      .inTable("ai_messages")
      .onDelete("CASCADE");
    table
      .foreign("model_id")
      .references("id")
      .inTable("ai_models")
      .onDelete("CASCADE");
  });

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = (knex) => knex.schema.dropTableIfExists("ai_request_logs");
