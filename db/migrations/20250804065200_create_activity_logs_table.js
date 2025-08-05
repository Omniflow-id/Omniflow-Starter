/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = (knex) =>
  knex.schema.dropTableIfExists("activity_logs").then(() =>
    knex.schema.createTable("activity_logs", (table) => {
      // Primary key
      table.increments("id").primary();

      // Activity type: 'user' or 'system'
      table
        .enum("activity_type", ["user", "system"])
        .notNullable()
        .defaultTo("user");

      // Core activity data
      table.text("activity").notNullable();
      table.string("action_type", 100).nullable(); // login, logout, create, update, delete, etc.
      table.string("resource_type", 100).nullable(); // user, role, file, cache, queue, etc.
      table.string("resource_id", 100).nullable(); // ID of the affected resource

      // User information (nullable for system activities)
      table.integer("user_id").unsigned().nullable();
      table.string("username", 100).nullable();
      table.string("user_email", 255).nullable();
      table.string("user_role", 50).nullable();

      // Request information (nullable for system activities)
      table.string("ip_address", 45).nullable();
      table.string("user_agent", 500).nullable();
      table.string("device_type", 50).nullable();
      table.string("browser", 50).nullable();
      table.string("platform", 50).nullable();
      table.string("request_method", 10).nullable(); // GET, POST, PUT, DELETE
      table.string("request_url", 500).nullable();
      table.string("request_id", 100).nullable(); // For request tracing

      // System/Application information
      table.string("application", 100).nullable().defaultTo("omniflow-starter");
      table.string("environment", 50).nullable(); // development, staging, production
      table.string("server_instance", 100).nullable(); // server/container ID
      table.string("process_id", 50).nullable();

      // Additional metadata (flexible JSON field)
      table.json("metadata").nullable();

      // Status and result
      table
        .enum("status", ["success", "failure", "warning", "info"])
        .defaultTo("success");
      table.text("error_message").nullable();
      table.string("error_code", 100).nullable();

      // Performance tracking
      table.integer("duration_ms").nullable(); // Operation duration in milliseconds
      table.bigInteger("memory_usage_mb").nullable(); // Memory usage in MB

      // Audit trail (activity logs are immutable, no updated_at needed)
      table.timestamp("created_at").defaultTo(knex.fn.now());

      // Indexes for performance
      table.index(["activity_type", "created_at"], "idx_activity_type_created");
      table.index(["user_id", "created_at"], "idx_user_created");
      table.index(["action_type", "resource_type"], "idx_action_resource");
      table.index(["status", "created_at"], "idx_status_created");
      table.index("ip_address", "idx_ip_address");
      table.index("created_at", "idx_created_at");

      // Foreign key (nullable for system activities)
      table
        .foreign("user_id")
        .references("id")
        .inTable("users")
        .onDelete("SET NULL"); // Use SET NULL instead of CASCADE
    })
  );

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = (knex) => knex.schema.dropTable("activity_logs");
