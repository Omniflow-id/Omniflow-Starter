/**
 * Get Active AI Analysis Settings API
 */

const { db } = require("@db/db");
const { asyncHandler } = require("@middlewares/errorHandler");

const getActiveSettings = asyncHandler(async (req, res) => {
  const [settings] = await db.query(`
    SELECT s.*, m.name as model_name, m.model_variant, m.api_url
    FROM ai_analysis_settings s
    LEFT JOIN ai_models m ON s.selected_model_id = m.id
    WHERE s.is_active = TRUE
    ORDER BY s.updated_at DESC
    LIMIT 1
  `);

  if (settings.length === 0) {
    return res.status(404).json({
      success: false,
      message: "Tidak ada pengaturan aktif. Silakan buat pengaturan baru.",
    });
  }

  res.json({
    success: true,
    data: settings[0],
  });
});

module.exports = {
  getActiveSettings,
};
