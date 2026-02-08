const express = require("express");
const router = express.Router();
const { doubleCsrfProtection } = require("@middlewares/csrfProtection");
const { checkPermission } = require("@middlewares/checkPermission");
const { withLocale } = require("@helpers/i18n");

const aiChat = require("./aiChat.controller");
const messageActions = require("./messageActions.controller");
const sendMessageStream = require("./sendMessageStream.controller");

// Page routes
router.get(
  "/",
  withLocale("admin/ai"),
  checkPermission("use_ai_chat"),
  aiChat.getChatPage
);

// API routes for conversations
router.get(
  "/conversations",
  checkPermission("use_ai_chat"),
  aiChat.getUserConversations
);
router.get(
  "/conversations/:id",
  checkPermission("use_ai_chat"),
  aiChat.getConversation
);
router.post(
  "/conversations",
  withLocale("admin/ai"),
  checkPermission("use_ai_chat"),
  doubleCsrfProtection,
  aiChat.createConversation
);
router.post(
  "/conversations/:id/title",
  withLocale("admin/ai"),
  checkPermission("use_ai_chat"),
  doubleCsrfProtection,
  aiChat.updateConversationTitle
);
router.post(
  "/conversations/:id/delete",
  withLocale("admin/ai"),
  checkPermission("use_ai_chat"),
  doubleCsrfProtection,
  aiChat.deleteConversation
);
router.get(
  "/conversations/search",
  checkPermission("use_ai_chat"),
  aiChat.searchConversations
);

// Message routes
router.post(
  "/message/send-stream",
  withLocale("admin/ai"),
  checkPermission("use_ai_chat"),
  sendMessageStream.sendMessageStream
);
router.post(
  "/message/edit-only",
  withLocale("admin/ai"),
  checkPermission("use_ai_chat"),
  messageActions.editMessageOnly
);
router.post(
  "/message/edit-stream",
  withLocale("admin/ai"),
  checkPermission("use_ai_chat"),
  messageActions.editMessageStream
);
router.post(
  "/message/:id/delete",
  withLocale("admin/ai"),
  checkPermission("use_ai_chat"),
  doubleCsrfProtection,
  messageActions.deleteMessage
);

module.exports = router;
