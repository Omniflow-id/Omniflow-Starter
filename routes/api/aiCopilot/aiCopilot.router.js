/**
 * AI Copilot Router
 * Screen analysis with optional question - Floating Action Button interface
 */

const express = require("express");
const router = express.Router();

const { analyzeScreen } = require("./analyzeScreen.controller");

// POST /api/ai-copilot/analyze - Analyze screen content with optional question
router.post("/analyze", analyzeScreen);

module.exports = router;
