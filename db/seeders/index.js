const { seedUsers } = require('./data/users.seeder.js');

/**
 * Master seeder file to control the order of data seeding.
 * This is the only seeder that should be run by Knex.
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async (knex) => {
  // --- 1. CLEANUP PHASE ---
  // Clean up existing data in the correct order to avoid foreign key constraints.
  // We use .del() instead of .truncate() because .del() respects foreign keys.
  console.log('Cleaning up database...');
  await knex('activity_logs').del();
  await knex('jobs').del();
  // Now we can safely delete from the users table.
  await knex('users').del();

  // --- 2. SEEDING PHASE ---
  // The order of execution is critical. Add new seeders here in the correct sequence.
  console.log('Seeding data...');
  // For example, if users have roles, seed roles before users.
  // await seedRoles(knex);
  await seedUsers(knex);
  // await seedProducts(knex);

  console.log('Database seeding completed successfully.');
};
