/**
 * Update AI Analysis Settings Controller
 */

const { db } = require("@db/db");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("@helpers/log");

const updateSettings = asyncHandler(async (req, res) => {
  const { selected_model_id, description, max_tokens, temperature } = req.body;

  // Validate required fields
  if (!selected_model_id) {
    throw new ValidationError("Model AI harus dipilih", "selected_model_id");
  }

  // Check if model exists and is active
  const [model] = await db.query(
    "SELECT id FROM ai_models WHERE id = ? AND is_active = TRUE",
    [selected_model_id]
  );

  if (model.length === 0) {
    throw new ValidationError(
      "Model AI yang dipilih tidak tersedia",
      "selected_model_id"
    );
  }

  // Validate temperature range
  const tempValue = parseFloat(temperature);
  if (isNaN(tempValue) || tempValue < 0 || tempValue > 2) {
    throw new ValidationError(
      "Temperature harus antara 0.0 dan 2.0",
      "temperature"
    );
  }

  // Validate max_tokens
  const tokensValue = parseInt(max_tokens);
  if (isNaN(tokensValue) || tokensValue < 1 || tokensValue > 32768) {
    throw new ValidationError(
      "Max tokens harus antara 1 dan 32768",
      "max_tokens"
    );
  }

  // Check if settings exist
  const [existing] = await db.query(
    "SELECT id FROM ai_analysis_settings WHERE is_active = TRUE"
  );

  const userId = req.session.user.id;

  if (existing.length > 0) {
    // Update existing settings
    await db.query(
      `
      UPDATE ai_analysis_settings SET
        selected_model_id = ?,
        description = ?,
        max_tokens = ?,
        temperature = ?,
        updated_at = NOW(),
        updated_by = ?
      WHERE is_active = TRUE
    `,
      [
        selected_model_id,
        description || null,
        tokensValue,
        tempValue,
        userId,
      ]
    );
  } else {
    // Create new settings
    await db.query(
      `
      INSERT INTO ai_analysis_settings (
        setting_name, description, selected_model_id, max_tokens, temperature,
        is_active, created_at, updated_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, TRUE, NOW(), NOW(), ?, ?)
    `,
      [
        "Default Analysis Settings",
        description || null,
        selected_model_id,
        tokensValue,
        tempValue,
        userId,
        userId,
      ]
    );
  }

  // Log activity
  await logUserActivity(
    {
      activity: "Updated AI Analysis Settings",
      actionType: ACTION_TYPES.UPDATE,
      resourceType: RESOURCE_TYPES.SYSTEM,
      metadata: {
        selected_model_id,
        max_tokens: tokensValue,
        temperature: tempValue,
      },
    },
    req
  );

  res.json({
    success: true,
    message: "Pengaturan berhasil diperbarui!",
  });
});

module.exports = {
  updateSettings,
};
