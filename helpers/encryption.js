const crypto = require("node:crypto");
const IV_LENGTH = 16;

function encrypt(text) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set in environment variables");
  }

  // Pastikan kunci hex valid dan panjangnya 64 karakter (32 byte)
  const keyHex = process.env.ENCRYPTION_KEY.trim();
  if (keyHex.length !== 64 || !/^[0-9a-fA-F]+$/.test(keyHex)) {
    throw new Error("ENCRYPTION_KEY must be 64 hex characters (32 bytes)");
  }

  const key = Buffer.from(keyHex, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function decrypt(text) {
  if (!process.env.ENCRYPTION_KEY) {
    throw new Error("ENCRYPTION_KEY is not set in environment variables");
  }

  const key = Buffer.from(process.env.ENCRYPTION_KEY.trim(), "hex");
  const [ivHex, encryptedHex] = text.split(":");

  if (!ivHex || !encryptedHex || ivHex.length !== 32) {
    throw new Error("Invalid encrypted text format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Mask API key for display purposes (shows first 4 and last 4 characters)
 * @param {string} apiKey - The API key to mask
 * @returns {string} Masked API key
 */
function maskApiKey(apiKey) {
  if (!apiKey || apiKey.length < 8) {
    return "****";
  }
  return `${apiKey.substring(0, 4)}****${apiKey.substring(apiKey.length - 4)}`;
}

module.exports = { encrypt, decrypt, maskApiKey };
