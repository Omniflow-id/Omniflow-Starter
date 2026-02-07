/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) =>
  knex.schema.createTable("ai_messages", (table) => {
    table.increments("id").primary();
    table.integer("conversation_id").unsigned().notNullable();
    table.enum("role", ["user", "assistant", "system"]).notNullable();
    table.text("content").notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());

    // Foreign key
    table
      .foreign("conversation_id")
      .references("id")
      .inTable("ai_conversations")
      .onDelete("CASCADE");
  });

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = (knex) => knex.schema.dropTableIfExists("ai_messages");
