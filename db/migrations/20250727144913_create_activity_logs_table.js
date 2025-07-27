/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('activity_logs', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned();
    table.string('activity', 255).notNullable();
    table.string('ip_address', 45);
    table.string('device_type', 50);
    table.string('browser', 50);
    table.string('platform', 50);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.foreign('user_id').references('id').inTable('users').onDelete('CASCADE');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('activity_logs');
};
