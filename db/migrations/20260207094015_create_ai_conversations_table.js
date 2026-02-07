/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) =>
  knex.schema.createTable("ai_conversations", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned().notNullable();
    table.integer("usecase_id").unsigned().notNullable();
    table.integer("model_id").unsigned().notNullable();
    table.string("title", 255).notNullable().defaultTo("New Conversation");
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));

    // Foreign keys
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .foreign("usecase_id")
      .references("id")
      .inTable("ai_use_cases")
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
exports.down = (knex) => knex.schema.dropTableIfExists("ai_conversations");
