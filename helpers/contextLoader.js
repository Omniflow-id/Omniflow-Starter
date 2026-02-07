/**
 * Context Loader Helper (Enterprise Edition)
 * Resolves markdown knowledge base based on User Role and Page Context.
 */
const fs = require("node:fs/promises");
const path = require("node:path");

// Root for knowledge base
const KNOWLEDGE_ROOT = path.join(process.cwd(), "knowledge");

// Cache for file existence to reduce IO (Simple in-memory cache)
const existenceCache = new Map();

/**
 * Normalizes a string for file system usage.
 * @param {string} str
 * @returns {string}
 */
function normalizePath(str) {
  return str.toLowerCase().replace(/[^a-z0-9-_]/g, "");
}

/**
 * Resolves the knowledge context for a specific page, role, and language.
 *
 * Strategy:
 * 1. Look for specific context: `knowledge/{role}/{pageId}/{lang}.md`
 * 2. Return generic fallback or empty string.
 *
 * @param {string} roleName - The user role name (e.g., 'Admin', 'Manager', 'User').
 * @param {string} pageId - The ID of the current page.
 * @param {string} lang - Language code ('id' or 'en'), defaults to 'en'.
 * @returns {Promise<string>} - The content of the markdown file.
 */
async function getKnowledgeContext(roleName, pageId, lang = "en") {
  try {
    if (!roleName || !pageId) return "";

    const safeRole = normalizePath(roleName);
    const safePage = normalizePath(pageId);
    const safeLang = normalizePath(lang);

    // i18n structure: knowledge/admin/index/id.md
    const filePath = path.join(
      KNOWLEDGE_ROOT,
      safeRole,
      safePage,
      `${safeLang}.md`
    );

    // Security check: ensure the resolved path is still within KNOWLEDGE_ROOT
    if (!filePath.startsWith(KNOWLEDGE_ROOT)) {
      console.warn(
        `[ContextLoader] Potential path traversal attempt: ${filePath}`
      );
      return "";
    }

    // Check cache first
    const cacheKey = `${safeRole}:${safePage}:${safeLang}`;
    if (existenceCache.has(cacheKey) && !existenceCache.get(cacheKey)) {
      return ""; // Negative cache hit
    }

    // Check file existence
    try {
      await fs.access(filePath);
      existenceCache.set(cacheKey, true);
    } catch (error) {
      console.warn(`[ContextLoader] Knowledge not found: ${filePath}`);
      existenceCache.set(cacheKey, false);
      return "";
    }

    const content = await fs.readFile(filePath, "utf-8");
    return content;
  } catch (error) {
    console.error("[ContextLoader] Content loading error:", error);
    return "";
  }
}

module.exports = {
  getKnowledgeContext,
};
