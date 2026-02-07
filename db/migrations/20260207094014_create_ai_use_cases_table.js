/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) =>
  knex.schema.createTable("ai_use_cases", (table) => {
    table.increments("id").primary();
    table.string("name", 255).notNullable().unique();
    table.text("description");
    table.text("base_knowledge"); // Context/knowledge base for the use case
    table.text("prompt"); // System prompt template
    table.json("allowed_roles"); // JSON array of allowed role names
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
exports.down = (knex) => knex.schema.dropTableIfExists("ai_use_cases");
