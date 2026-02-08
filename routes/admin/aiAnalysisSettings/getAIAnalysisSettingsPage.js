/**
 * Get AI Copilot Settings Page Controller
 */

const { db } = require("@db/db");
const { asyncHandler } = require("@middlewares/errorHandler");
const config = require("@config/ai-analysis-config");

const getAIAnalysisSettingsPage = asyncHandler(async (req, res) => {
  // Get all active AI models
  const [models] = await db.query(
    "SELECT * FROM ai_models WHERE is_active = TRUE ORDER BY created_at DESC"
  );

  // Get current active model from settings
  const [activeSettings] = await db.query(`
    SELECT s.*, m.name as model_name, m.model_variant, m.api_url
    FROM ai_analysis_settings s
    LEFT JOIN ai_models m ON s.selected_model_id = m.id
    WHERE s.is_active = TRUE
    ORDER BY s.updated_at DESC
    LIMIT 1
  `);

  res.render("pages/admin/aiAnalysisSettings/index", {
    models,
    activeSettings: activeSettings[0] || null,
    config,
    user: req.session.user,
  });
});

module.exports = {
  getAIAnalysisSettingsPage,
};
