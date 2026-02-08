const express = require("express");
const router = express.Router();
const {
  getChatContext,
  getChatContextStream,
} = require("./aiAssistant.controller");

/**
 * POST /api/ai-assistant/context
 * AI Assistant context-aware endpoint.
 * Expects: { currentPageId, userRole, message }
 */
router.post("/context", getChatContext);

/**
 * POST /api/ai-assistant/stream
 * AI Assistant streaming endpoint with Server-Sent Events.
 * Expects: { currentPageId, userRole, message }
 */
router.post("/stream", getChatContextStream);

module.exports = router;
