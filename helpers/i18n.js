/**
 * i18n - Internationalization module for Omniflow Starter
 * Supports Indonesian (id) and English (en)
 * Features:
 * - JSON-based locale files
 * - Cookie-based language persistence
 * - Query parameter language override
 * - Automatic fallback to default language
 * - Server-side and template translation support
 */

const fs = require("node:fs");
const path = require("node:path");

// Language configuration
const LANGUAGE_OPTIONS = {
  en: {
    code: "en",
    shortLabel: "EN",
    name: "English",
    ariaLabel: "Switch site language to English",
    flag: "🇺🇸",
  },
  id: {
    code: "id",
    shortLabel: "ID",
    name: "Bahasa Indonesia",
    ariaLabel: "Ganti bahasa situs ke Bahasa Indonesia",
    flag: "🇮🇩",
  },
};

const DEFAULT_LANG = "id"; // Default to Indonesian
const LANGUAGE_COOKIE = "omniflow_lang";
const SUPPORTED_LANGS = new Set(Object.keys(LANGUAGE_OPTIONS));

// Cache for locale files (hot-reload friendly in development)
const localeCache = new Map();

const localesRoot = path.join(process.cwd(), "locales");

/**
 * Reads and caches locale file for a specific page and language
 * @param {string} page - Page identifier (e.g., 'admin/dashboard', 'client/home')
 * @param {string} lang - Language code
 * @returns {Object} Parsed locale data
 */
function readLocaleFile(page, lang) {
  const cacheKey = `${page}:${lang}`;

  // Skip cache in development for hot-reload
  if (process.env.NODE_ENV !== "development" && localeCache.has(cacheKey)) {
    return localeCache.get(cacheKey);
  }

  const filePath = path.join(localesRoot, page, `${lang}.json`);
  let data;

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    data = JSON.parse(raw);
  } catch (error) {
    // If requested language file not found, fallback to default language
    if (lang !== DEFAULT_LANG) {
      console.warn(
        `[i18n] Locale file not found for ${page}:${lang}, falling back to ${DEFAULT_LANG}`
      );
      return readLocaleFile(page, DEFAULT_LANG);
    }

    // If even default language file doesn't exist, return empty object
    console.error(
      `[i18n] Failed to load locale data for page "${page}", lang "${lang}". Path: ${filePath}. Error: ${error.message}`
    );
    return {};
  }

  // console.log(`[i18n] Loaded locale for ${page}:${lang} from ${filePath}`);
  localeCache.set(cacheKey, data);
  return data;
}

/**
 * Validates and normalizes language code
 * @param {string} lang - Language code to validate
 * @returns {string|null} Normalized language code or null
 */
function coerceLang(lang) {
  if (!lang) {
    return null;
  }
  const lower = String(lang).toLowerCase();
  return SUPPORTED_LANGS.has(lower) ? lower : null;
}

/**
 * Normalizes language code with fallback to default
 * @param {string} lang - Language code
 * @returns {string} Valid language code
 */
function normalizeLang(lang) {
  return coerceLang(lang) ?? DEFAULT_LANG;
}

/**
 * Gets locale data for a specific page and language
 * @param {string} page - Page identifier
 * @param {string} lang - Language code
 * @returns {Object} Object containing locale data and resolved language
 */
function getPageLocale(page, lang) {
  const normalized = normalizeLang(lang);
  const data = readLocaleFile(page, normalized);
  return { data, lang: normalized };
}

/**
 * Returns array of available language codes
 * @returns {Array<string>} Array of language codes
 */
function availableLanguages() {
  return Array.from(SUPPORTED_LANGS);
}

/**
 * Clears the locale cache (useful for development hot-reload)
 */
function invalidateLocaleCache() {
  localeCache.clear();
}

/**
 * Gets language definition by code
 * @param {string} code - Language code
 * @returns {Object} Language definition object
 */
function getLanguageDefinition(code) {
  return {
    code,
    shortLabel: code.toUpperCase(),
    name: code.toUpperCase(),
    ariaLabel: `Switch site language to ${code.toUpperCase()}`,
    flag: "🏳️",
    ...LANGUAGE_OPTIONS[code],
  };
}

/**
 * Builds URL with language query parameter
 * @param {Object} req - Express request object
 * @param {string} code - Language code
 * @returns {string} URL with language parameter
 */
function buildLangHref(req, code) {
  const params = new URLSearchParams(req.query);
  params.set("lang", code);
  const queryString = params.toString();

  // Use req.baseUrl + req.path for nested routes, fallback to req.path
  const currentPath =
    req.baseUrl && req.baseUrl !== "" ? req.baseUrl + req.path : req.path;

  return queryString ? `${currentPath}?${queryString}` : currentPath;
}

/**
 * Builds language options with active state and URLs
 * @param {Object} params - Parameters object
 * @param {string} params.lang - Current language
 * @param {Object} params.req - Express request object
 * @returns {Array<Object>} Array of language option objects
 */
function buildLanguageOptions({ lang, req }) {
  return availableLanguages().map((code) => {
    const definition = getLanguageDefinition(code);
    const href = buildLangHref(req, code);
    return {
      ...definition,
      href: code === lang ? null : href,
      isActive: code === lang,
    };
  });
}

/**
 * Resolves the language for the current request
 * Priority: query parameter > cookie > default
 *
 * @param {Object} req - Express request object
 * @returns {Object} Object with lang and source properties
 */
function resolveRequestLanguage(req) {
  // 1. Check query parameter (?lang=id or ?lang=en)
  const queryLang = coerceLang(req.query?.lang);

  if (queryLang) {
    return { lang: queryLang, source: "query" };
  }

  // 2. Check cookie
  const cookieLang = coerceLang(req.cookies?.[LANGUAGE_COOKIE]);

  if (cookieLang) {
    return { lang: cookieLang, source: "cookie" };
  }

  // 3. Fallback to default language
  return { lang: DEFAULT_LANG, source: "default" };
}

/**
 * Parses cookie header into object
 * @param {string} header - Cookie header string
 * @returns {Object} Parsed cookies
 */
function _readCookie(header = "") {
  if (!header) {
    return {};
  }

  return header.split(";").reduce((acc, pair) => {
    const [rawKey, ...rest] = pair.split("=");
    const key = rawKey?.trim();
    if (!key) {
      return acc;
    }
    acc[key] = rest.join("=").trim();
    return acc;
  }, {});
}

/**
 * Sets language cookie in response
 * @param {Object} res - Express response object
 * @param {string} lang - Language code
 */
function setLanguageCookie(res, lang) {
  if (!res || typeof res.cookie !== "function") {
    return;
  }

  res.cookie(LANGUAGE_COOKIE, lang, {
    maxAge: 1000 * 60 * 60 * 24 * 365, // 1 year
    httpOnly: false, // Accessible from JavaScript for client-side sync
    sameSite: "lax",
  });
}

/**
 * Creates a middleware that injects locale data into res.locals
 * Use this in route handlers that need i18n support
 *
 * @param {string} page - Locale page identifier (e.g., 'admin/dashboard', 'client/home')
 * @param {Object} options - Configuration options
 * @param {boolean} options.loadCommon - Load common/admin locale for shared translations (default: true for admin pages)
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get('/', withLocale('client/home'), controller.getHome);
 */
function withLocale(page, _options = {}) {
  if (!page) {
    throw new Error("withLocale requires a page identifier.");
  }

  return async (req, res, next) => {
    try {
      const { lang } = resolveRequestLanguage(req);
      const { data: locale } = getPageLocale(page, lang);

      setLanguageCookie(res, lang);

      // Build language options for language switcher
      const languageOptions = buildLanguageOptions({ lang, req });
      const currentLanguage =
        languageOptions.find((option) => option.isActive) ||
        getLanguageDefinition(lang);

      // For admin pages, also load admin common locale for shared translations (sidebar, etc.)
      let adminCommonLocale = {};
      if (page.startsWith("admin/")) {
        try {
          const result = getPageLocale("admin/common", lang);
          adminCommonLocale = result.data || {};
        } catch (_err) {
          // Admin common locale might not exist, that's ok
        }
      }

      // Merge admin common locale with page locale (page locale takes precedence)
      const mergedLocale = deepMerge(adminCommonLocale, locale);

      // Inject locale data into res.locals
      res.locals.locale = mergedLocale;
      res.locals.currentLang = lang;
      res.locals.languages = languageOptions;
      res.locals.currentLanguage = currentLanguage;

      // Create a 't' (translate) function for template usage
      const pageT = (key, params = {}) => {
        if (!key) return "";
        let result = key
          .split(".")
          .reduce((o, i) => (o ? o[i] : undefined), mergedLocale);

        if (result === undefined) return key;

        if (params && typeof params === "object") {
          Object.keys(params).forEach((param) => {
            result = result.replace(new RegExp(`{${param}}`, "g"), params[param]);
          });
        }
        return result;
      };
      res.locals.t = pageT;

      // Inject page-specific locale into res.locals (available to all templates)
      res.locals.locale = mergedLocale;

      // Store the original render function BEFORE any wrappers
      // Use __original to chain multiple wrappers properly
      const originalRender = res.render.__original || res.render;

      // Mark this render as having been wrapped by withLocale
      res.render.__wrappedByWithLocale = true;

      // Wrap res.render to merge page-specific locale data
      res.render = function (view, context = {}) {
        const mergedContext = {
          ...res.locals, // Includes locale, t, currentLang, etc.
          ...mergedLocale, // Spread merged locale properties at root level
          ...context,
          currentLang: lang,
          languages: languageOptions,
          currentLanguage,
          t: pageT, // Use pageT directly, not res.locals.t (which is global t)
          locale: mergedLocale,
        };
        return originalRender.call(this, view, mergedContext);
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Creates a localized renderer for Express routes
 * This is an alternative to withLocale that directly renders
 *
 * @param {Object} options - Configuration options
 * @param {string} options.view - Nunjucks view path (e.g., 'pages/admin/index/index')
 * @param {string} options.page - Locale page identifier (e.g., 'admin/dashboard')
 * @param {Function} [options.mapContext] - Function to map/transform context data
 * @param {boolean} [options.loadCommon] - Load common/admin locale for shared translations
 * @returns {Function} Express middleware function
 *
 * @example
 * router.get('/dashboard', createLocalizedRenderer({
 *   view: 'pages/admin/index/index',
 *   page: 'admin/dashboard',
 *   mapContext: ({ locale, lang }) => ({ stats: getStats() })
 * }));
 */
function createLocalizedRenderer({
  view,
  page,
  mapContext,
  loadCommon = true,
} = {}) {
  if (!view) {
    throw new Error("createLocalizedRenderer requires a view name.");
  }

  if (!page) {
    throw new Error("createLocalizedRenderer requires a page key.");
  }

  return async (req, res, next) => {
    try {
      const { lang } = resolveRequestLanguage(req);
      const { data: locale, lang: resolvedLang } = getPageLocale(page, lang);

      // Set language cookie for persistence
      setLanguageCookie(res, resolvedLang);

      // Build language options
      const languageOptions = buildLanguageOptions({ lang: resolvedLang, req });
      const currentLanguage =
        languageOptions.find((option) => option.isActive) ||
        getLanguageDefinition(resolvedLang);

      // For admin pages, also load admin common locale for shared translations
      let adminCommonLocale = {};
      if (loadCommon && page.startsWith("admin/")) {
        try {
          const result = getPageLocale("admin/common", resolvedLang);
          adminCommonLocale = result.data || {};
        } catch (_err) {
          // Admin common locale might not exist, that's ok
        }
      }

      // Merge admin common locale with page locale (page locale takes precedence)
      const mergedLocale = deepMerge(adminCommonLocale, locale);

      // Create translate function
      const t = (key, params = {}) => {
        if (!key) return "";
        let result = key
          .split(".")
          .reduce((o, i) => (o ? o[i] : undefined), mergedLocale);

        if (result === undefined) return key;

        if (params && typeof params === "object") {
          Object.keys(params).forEach((param) => {
            result = result.replace(new RegExp(`{${param}}`, "g"), params[param]);
          });
        }
        return result;
      };

      // Build base context
      const baseContext = {
        ...mergedLocale,
        currentLang: resolvedLang,
        languages: languageOptions,
        currentLanguage,
        t,
      };

      // Apply custom context mapping if provided
      let context = baseContext;
      if (mapContext) {
        const mapped = await mapContext({
          locale: mergedLocale,
          lang: resolvedLang,
          req,
          res,
          languages: languageOptions,
          currentLanguage,
        });
        if (mapped && typeof mapped === "object") {
          context = { ...baseContext, ...mapped };
        }
      }

      // Render the view with localized context
      res.render(view, context);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Deep merges two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  if (typeof target !== "object" || target === null) return source;
  if (typeof source !== "object" || source === null) return target;

  const result = { ...target };
  for (const key of Object.keys(source)) {
    if (
      source[key] instanceof Object &&
      key in target &&
      target[key] instanceof Object &&
      !Array.isArray(source[key]) &&
      !Array.isArray(target[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

module.exports = {
  availableLanguages,
  getPageLocale,
  createLocalizedRenderer,
  invalidateLocaleCache,
  resolveRequestLanguage,
  setLanguageCookie,
  withLocale,
  buildLanguageOptions,
  buildLangHref,
  getLanguageDefinition,
  DEFAULT_LANG,
  LANGUAGE_COOKIE,
  LANGUAGE_OPTIONS,
};
