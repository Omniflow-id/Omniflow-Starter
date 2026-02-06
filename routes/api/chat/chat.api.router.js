const express = require("express");
const router = express.Router();
const {
  getChatContext,
  getChatContextStream,
} = require("./chat.api.controller");

/**
 * POST /api/chat/context
 * Context-aware chat endpoint.
 * Expects: { currentPageId, userRole, message }
 */
router.post("/context", getChatContext);

/**
 * POST /api/chat/stream
 * Streaming chat endpoint with Server-Sent Events.
 * Expects: { currentPageId, userRole, message }
 */
router.post("/stream", getChatContextStream);

module.exports = router;
