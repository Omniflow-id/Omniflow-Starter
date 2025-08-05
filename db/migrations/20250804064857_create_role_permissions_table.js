/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) =>
  knex.schema.createTable("role_permissions", (table) => {
    table.integer("role_id").unsigned().notNullable();
    table.integer("permission_id").unsigned().notNullable();
    table.timestamp("created_at").defaultTo(knex.fn.now());

    // Foreign key constraints
    table
      .foreign("role_id")
      .references("role_id")
      .inTable("roles")
      .onDelete("CASCADE");
    table
      .foreign("permission_id")
      .references("permission_id")
      .inTable("permissions")
      .onDelete("CASCADE");

    // Composite primary key
    table.primary(["role_id", "permission_id"]);
  });

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = (knex) => knex.schema.dropTableIfExists("role_permissions");
