// === Side-effect imports (HARUS PALING ATAS) ===
require("dotenv").config();

// === Core modules ===

// === Third-party modules ===

// === Absolute / alias imports ===
const { db } = require("@db/db");

// === Relative imports ===

/**
 * Soft delete - menandai record sebagai terhapus dengan mengisi deleted_at
 * @param {string} tableName - Nama tabel
 * @param {number|string} id - ID record yang akan dihapus
 * @param {string} idColumn - Nama kolom ID (default: "id")
 * @returns {Promise<boolean>} True jika berhasil dihapus
 */
async function softDelete(tableName, id, idColumn = "id") {
  const [result] = await db.query(
    `UPDATE ${tableName} SET deleted_at = NOW() WHERE ${idColumn} = ? AND deleted_at IS NULL`,
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Soft delete multiple - menandai banyak record sebagai terhapus
 * @param {string} tableName - Nama tabel
 * @param {Array<number|string>} ids - Array ID yang akan dihapus
 * @param {string} idColumn - Nama kolom ID (default: "id")
 * @returns {Promise<number>} Jumlah record yang dihapus
 */
async function softDeleteMultiple(tableName, ids, idColumn = "id") {
  if (!ids || ids.length === 0) return 0;

  const placeholders = ids.map(() => "?").join(",");
  const [result] = await db.query(
    `UPDATE ${tableName} SET deleted_at = NOW() WHERE ${idColumn} IN (${placeholders}) AND deleted_at IS NULL`,
    ids
  );
  return result.affectedRows;
}

/**
 * Restore - mengembalikan record yang sudah dihapus
 * @param {string} tableName - Nama tabel
 * @param {number|string} id - ID record yang akan dipulihkan
 * @param {string} idColumn - Nama kolom ID (default: "id")
 * @returns {Promise<boolean>} True jika berhasil dipulihkan
 */
async function restore(tableName, id, idColumn = "id") {
  const [result] = await db.query(
    `UPDATE ${tableName} SET deleted_at = NULL WHERE ${idColumn} = ? AND deleted_at IS NOT NULL`,
    [id]
  );
  return result.affectedRows > 0;
}

/**
 * Exists - cek apakah record ada dan tidak dihapus
 * @param {string} tableName - Nama tabel
 * @param {number|string} id - ID record
 * @param {string} idColumn - Nama kolom ID (default: "id")
 * @returns {Promise<boolean>} True jika record ada
 */
async function exists(tableName, id, idColumn = "id") {
  const [rows] = await db.query(
    `SELECT 1 FROM ${tableName} WHERE ${idColumn} = ? AND deleted_at IS NULL LIMIT 1`,
    [id]
  );
  return rows.length > 0;
}

/**
 * WithDeleted - cek apakah record ada (termasuk yang sudah dihapus)
 * @param {string} tableName - Nama tabel
 * @param {number|string} id - ID record
 * @param {string} idColumn - Nama kolom ID (default: "id")
 * @returns {Promise<boolean>} True jika record ada
 */
async function withDeleted(tableName, id, idColumn = "id") {
  const [rows] = await db.query(
    `SELECT 1 FROM ${tableName} WHERE ${idColumn} = ? LIMIT 1`,
    [id]
  );
  return rows.length > 0;
}

module.exports = {
  softDelete,
  softDeleteMultiple,
  restore,
  exists,
  withDeleted,
};
