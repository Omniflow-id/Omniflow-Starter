/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) =>
  knex.schema.createTable("ai_models", (table) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable().unique();
    table.string("api_url", 500).notNullable();
    table.text("api_key").notNullable(); // Encrypted API key
    table.string("model_variant", 255).notNullable();
    table.boolean("is_active").notNullable().defaultTo(true);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table
      .timestamp("updated_at")
      .defaultTo(knex.raw("CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"));
  });

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = (knex) => knex.schema.dropTableIfExists("ai_models");
