/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) =>
  knex.schema.createTable("user_permissions", (table) => {
    // Use auto-increment ID as primary key to avoid constraint issues
    table.increments("id").primary();

    table.integer("user_id").unsigned().notNullable();
    table.integer("permission_id").unsigned().notNullable();
    table.boolean("is_revoked").notNullable().defaultTo(false); // false = granted, true = revoked
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // Foreign key constraints
    table
      .foreign("user_id")
      .references("id")
      .inTable("users")
      .onDelete("CASCADE");
    table
      .foreign("permission_id")
      .references("permission_id")
      .inTable("permissions")
      .onDelete("CASCADE");

    // Unique constraint to allow one grant and one revoke per user-permission pair
    table.unique(
      ["user_id", "permission_id", "is_revoked"],
      "uk_user_permission_revoked"
    );
  });

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = (knex) => knex.schema.dropTableIfExists("user_permissions");
