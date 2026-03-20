// === Absolute / alias imports ===
const { db } = require("@db/db");
const { handleCache, invalidateCache } = require("@helpers/cache");
const { encrypt, decrypt, maskApiKey } = require("@helpers/encryption");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("@helpers/log");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

/**
 * Get AI Models management page
 * Route: GET /admin/ai_models
 */
const getAIModelsPage = asyncHandler(async (req, res) => {
  const result = await handleCache({
    key: "admin:ai_models:list",
    ttl: 300, // 5 minutes
    dbQueryFn: async () => {
      const [models] = await db.query(
        "SELECT * FROM ai_models WHERE deleted_at IS NULL ORDER BY created_at DESC"
      );

      // Process models to decrypt API keys and add masked version for display
      const processedModels = models.map((model) => {
        try {
          const decryptedApiKey = decrypt(model.api_key);
          return {
            ...model,
            api_key_decrypted: decryptedApiKey,
            api_key_masked: maskApiKey(decryptedApiKey),
          };
        } catch (error) {
          console.error(
            `Failed to decrypt API key for model ${model.id}:`,
            error
          );
          return {
            ...model,
            api_key_decrypted: null,
            api_key_masked: "***ERROR***",
          };
        }
      });

      return { models: processedModels };
    },
  });

  res.render("pages/admin/aiModels/index", {
    models: result.data.models,
    permissions: req.session.permissions || [],
    cacheInfo: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});

/**
 * Get all active AI models (API endpoint)
 * Route: GET /api/ai_models
 */
const getAllAIModels = asyncHandler(async (_req, res) => {
  const result = await handleCache({
    key: "api:ai_models:active",
    ttl: 600, // 10 minutes
    dbQueryFn: async () => {
      const [models] = await db.query(
        `SELECT id, name, api_url, model_variant, is_active, created_at, updated_at
         FROM ai_models
         WHERE is_active = TRUE AND deleted_at IS NULL
         ORDER BY id`
      );
      return { models };
    },
  });

  if (result.data.models.length === 0) {
    return res.status(404).json({
      success: false,
      message: res.locals.t("common.messages.aiModelsNotFound"),
    });
  }

  res.json({
    success: true,
    data: result.data.models,
    cache: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});

/**
 * Create new AI model
 * Route: POST /admin/ai_models/create
 */
const createNewAIModel = asyncHandler(async (req, res) => {
  const { name, api_url, api_key, model_variant, is_active } = req.body;

  // Validate required fields
  if (
    !name ||
    !api_url ||
    !api_key ||
    !model_variant ||
    is_active === undefined
  ) {
    throw new ValidationError(res.locals.t("common.errors.allFieldsRequired"));
  }

  // Validate URL format
  try {
    new URL(api_url);
  } catch {
    throw new ValidationError(res.locals.t("common.errors.invalidApiUrl"));
  }

  // Check if model name already exists
  const [existingModel] = await db.query(
    "SELECT id FROM ai_models WHERE name = ? AND deleted_at IS NULL",
    [name]
  );

  if (existingModel.length > 0) {
    throw new ValidationError(res.locals.t("common.errors.modelNameExists"));
  }

  // Encrypt API key before storing
  const encryptedApiKey = encrypt(api_key);
  const isActive = is_active === "1" || is_active === true;

  // Insert new AI model
  const [result] = await db.query(
    `INSERT INTO ai_models (name, api_url, api_key, model_variant, is_active, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
    [name, api_url, encryptedApiKey, model_variant, isActive]
  );

  // Invalidate caches
  await invalidateCache("admin:ai_models:*", true);
  await invalidateCache("api:ai_models:*", true);

  // Log activity
  await logUserActivity(
    {
      activity: `Created new AI model: ${name}`,
      actionType: ACTION_TYPES.CREATE,
      resourceType: RESOURCE_TYPES.SYSTEM,
      resourceId: result.insertId.toString(),
      userId: req.session.user.id,
      dataChanges: {
        after: {
          name,
          api_url,
          model_variant,
          is_active: isActive,
        },
      },
    },
    req
  );

  req.flash("success", "common.messages.aiModelCreated");
  res.redirect("/admin/ai_models");
});

/**
 * Update AI model
 * Route: POST /admin/ai_models/update/:id
 */
const updateAIModel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, api_url, api_key, model_variant, is_active } = req.body;

  // Validate required fields
  if (
    !name ||
    !api_url ||
    !api_key ||
    !model_variant ||
    is_active === undefined
  ) {
    throw new ValidationError(res.locals.t("common.errors.allFieldsRequired"));
  }

  // Validate URL format
  try {
    new URL(api_url);
  } catch {
    throw new ValidationError(res.locals.t("common.errors.invalidApiUrl"));
  }

  // Check if model exists
  const [existingModel] = await db.query(
    "SELECT id FROM ai_models WHERE id = ? AND deleted_at IS NULL",
    [id]
  );

  if (existingModel.length === 0) {
    throw new ValidationError(res.locals.t("common.errors.aiModelNotFound"));
  }

  // Check if model name already exists (excluding current model)
  const [duplicateModel] = await db.query(
    "SELECT id FROM ai_models WHERE name = ? AND id != ? AND deleted_at IS NULL",
    [name, id]
  );

  if (duplicateModel.length > 0) {
    throw new ValidationError(res.locals.t("common.errors.modelNameExists"));
  }

  const isActive = is_active === "1" || is_active === true;
  const encryptedApiKey = encrypt(api_key);

  // Update AI model
  await db.query(
    `UPDATE ai_models
     SET name = ?, api_url = ?, api_key = ?, model_variant = ?, is_active = ?, updated_at = NOW()
     WHERE id = ?`,
    [name, api_url, encryptedApiKey, model_variant, isActive, id]
  );

  // Invalidate caches
  await invalidateCache("admin:ai_models:*", true);
  await invalidateCache("api:ai_models:*", true);

  // Log activity
  await logUserActivity(
    {
      activity: `Updated AI model: ${name}`,
      actionType: ACTION_TYPES.UPDATE,
      resourceType: RESOURCE_TYPES.SYSTEM,
      resourceId: id,
      userId: req.session.user.id,
    },
    req
  );

  req.flash("success", "common.messages.aiModelUpdated");
  res.redirect("/admin/ai_models");
});

/**
 * Delete AI model
 * Route: POST /admin/ai_models/delete/:id
 */
const deleteAIModel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if model exists
  const [existingModel] = await db.query(
    "SELECT name FROM ai_models WHERE id = ? AND deleted_at IS NULL",
    [id]
  );

  if (existingModel.length === 0) {
    throw new ValidationError(res.locals.t("common.errors.aiModelNotFound"));
  }

  const modelName = existingModel[0].name;

  // Soft delete AI model
  await db.query("UPDATE ai_models SET deleted_at = NOW() WHERE id = ?", [id]);

  // Invalidate caches
  await invalidateCache("admin:ai_models:*", true);
  await invalidateCache("api:ai_models:*", true);

  // Log activity
  await logUserActivity(
    {
      activity: `Deleted AI model: ${modelName}`,
      actionType: ACTION_TYPES.DELETE,
      resourceType: RESOURCE_TYPES.SYSTEM,
      resourceId: id,
      userId: req.session.user.id,
    },
    req
  );

  req.flash("success", "common.messages.aiModelDeleted");
  res.redirect("/admin/ai_models");
});

/**
 * Get all AI models for dropdown (API endpoint)
 * Route: GET /admin/ai_models/all
 */
const getAllAIModelsAPI = asyncHandler(async (_req, res) => {
  const result = await handleCache({
    key: "api:ai_models:all",
    ttl: 300, // 5 minutes
    dbQueryFn: async () => {
      const [models] = await db.query(
        `SELECT id, name, api_url, model_variant, is_active, created_at, updated_at
         FROM ai_models
         WHERE is_active = TRUE AND deleted_at IS NULL
         ORDER BY name`
      );
      return { models };
    },
  });

  res.json({
    success: true,
    data: result.data.models,
  });
});

module.exports = {
  getAIModelsPage,
  getAllAIModels,
  getAllAIModelsAPI,
  createNewAIModel,
  updateAIModel,
  deleteAIModel,
};
