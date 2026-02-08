/**
 * AI Analysis Settings Router
 * Global configuration for AI features (AI Assistant & AI Copilot)
 */

const express = require("express");
const { withLocale } = require("@helpers/i18n");
const { getAIAnalysisSettingsPage } = require("./getAIAnalysisSettingsPage");
const { getActiveSettings } = require("./getActiveSettings");
const { updateSettings } = require("./updateSettings");

const router = express.Router();

// Page routes
router.get("/", withLocale("admin/ai"), getAIAnalysisSettingsPage);

// API routes
router.get("/active", getActiveSettings);
router.put("/", withLocale("admin/ai"), updateSettings);

module.exports = router;
