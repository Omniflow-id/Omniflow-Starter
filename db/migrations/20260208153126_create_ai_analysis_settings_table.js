/**
 * Migration: Create ai_analysis_settings table
 * Global configuration for AI analysis functionality
 */

exports.up = async (knex) => {
  await knex.schema.createTable("ai_analysis_settings", (table) => {
    table.increments("id").primary();
    table
      .string("setting_name", 100)
      .notNullable()
      .defaultTo("Default Analysis Settings");
    table.text("description").nullable();

    // Foreign key to ai_models
    table.integer("selected_model_id").unsigned().notNullable();
    table
      .foreign("selected_model_id")
      .references("id")
      .inTable("ai_models")
      .onDelete("RESTRICT");

    // AI Parameters
    table.integer("max_tokens").unsigned().notNullable().defaultTo(4096);
    table.decimal("temperature", 3, 2).notNullable().defaultTo(0.1);

    // Feature flags
    table.boolean("enable_context").notNullable().defaultTo(true);
    table.boolean("enable_company_stats").notNullable().defaultTo(true);
    table.boolean("enable_activity_tracking").notNullable().defaultTo(true);
    table.string("analysis_language", 10).notNullable().defaultTo("id-ID");

    // Status
    table.boolean("is_active").notNullable().defaultTo(true);

    // Timestamps
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());

    // User tracking
    table.integer("created_by").unsigned().nullable();
    table.integer("updated_by").unsigned().nullable();
    table
      .foreign("created_by")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");
    table
      .foreign("updated_by")
      .references("id")
      .inTable("users")
      .onDelete("SET NULL");

    // Indexes
    table.index(["is_active"], "idx_ai_analysis_settings_active");
    table.index(["selected_model_id"], "idx_ai_analysis_settings_model");
  });

  console.log("✅ ai_analysis_settings table created successfully");
};

exports.down = async (knex) => {
  await knex.schema.dropTableIfExists("ai_analysis_settings");
  console.log("⬇️  ai_analysis_settings table dropped");
};
