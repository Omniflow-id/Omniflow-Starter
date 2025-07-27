/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) =>
  knex.schema.createTable("activity_logs", (table) => {
    table.increments("id").primary();
    table.integer("user_id").unsigned();
    table.text("activity").notNullable();
    table.string("ip_address", 45);
    table.string("device_type", 50);
    table.string("browser", 50);
    table.string("platform", 50);
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
  });

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = (knex) => knex.schema.dropTable("activity_logs");
