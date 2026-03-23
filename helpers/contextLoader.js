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
 * Normalizes a language code to a base language.
 * Examples: "id-ID" -> "id", "en_US" -> "en"
 * @param {string} lang
 * @returns {string}
 */
function normalizeLang(lang) {
  if (!lang) {
    return "en";
  }

  return String(lang)
    .toLowerCase()
    .split(/[-_]/)[0]
    .replace(/[^a-z]/g, "") || "en";
}

function buildKnowledgeLanguageFallbacks(lang) {
  const requested = normalizeLang(lang);
  const ordered = [requested, "id", "en"];
  return [...new Set(ordered.filter(Boolean))];
}

/**
 * Resolves the knowledge context for a specific page, role, and language.
 *
 * Strategy:
 * 1. Look for specific context: `knowledge/{role}/{pageId}/{lang}.md`
 * 2. Fallback to role-level context: `knowledge/{role}/{lang}.md`
 * 3. Return empty string when nothing is found.
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

    for (const candidateLang of buildKnowledgeLanguageFallbacks(lang)) {
      const safeLang = normalizePath(candidateLang);
      const candidatePaths = [
        path.join(KNOWLEDGE_ROOT, safeRole, safePage, `${safeLang}.md`),
        path.join(KNOWLEDGE_ROOT, safeRole, `${safeLang}.md`),
      ];

      for (const filePath of candidatePaths) {
        // Security check: ensure the resolved path is still within KNOWLEDGE_ROOT
        if (!filePath.startsWith(KNOWLEDGE_ROOT)) {
          console.warn(
            `[ContextLoader] Potential path traversal attempt: ${filePath}`
          );
          continue;
        }

        const cacheKey = `${safeRole}:${safePage}:${safeLang}:${filePath}`;
        if (existenceCache.has(cacheKey) && !existenceCache.get(cacheKey)) {
          continue;
        }

        try {
          await fs.access(filePath);
          existenceCache.set(cacheKey, true);
          return await fs.readFile(filePath, "utf-8");
        } catch (_error) {
          existenceCache.set(cacheKey, false);
        }
      }
    }

    console.warn(
      `[ContextLoader] Knowledge not found for role="${safeRole}", page="${safePage}", lang="${lang}"`
    );
    return "";
  } catch (error) {
    console.error("[ContextLoader] Content loading error:", error);
    return "";
  }
}

module.exports = {
  getKnowledgeContext,
  normalizeLang,
};
