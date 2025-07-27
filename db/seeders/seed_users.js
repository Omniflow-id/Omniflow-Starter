const bcrypt = require("bcrypt");

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  // Hash passwords
  const adminPassword = await bcrypt.hash("Admin12345.", 10);
  const managerPassword = await bcrypt.hash("Manager12345.", 10);
  const userPassword = await bcrypt.hash("User12345.", 10);
  
  await knex('users').insert([
    {
      username: 'admin',
      email: 'admin@omniflow.id',
      password_hash: adminPassword,
      full_name: 'Administrator',
      role: 'Admin'
    },
    {
      username: 'manager',
      email: 'manager@omniflow.id',
      password_hash: managerPassword,
      full_name: 'Manager',
      role: 'Manager'
    },
    {
      username: 'user',
      email: 'user@omniflow.id',
      password_hash: userPassword,
      full_name: 'User',
      role: 'User'
    }
  ]);
};
