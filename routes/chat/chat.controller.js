// === Absolute / alias imports ===
const { db } = require("@db/db");
const { handleCache, invalidateCache } = require("@helpers/cache");
const { decrypt } = require("@helpers/encryption");
const {
  logUserActivity,
  ACTION_TYPES,
  RESOURCE_TYPES,
} = require("@helpers/log");
const { asyncHandler, ValidationError } = require("@middlewares/errorHandler");

/**
 * Get AI Chat page with user's conversations
 * Route: GET /admin/chat
 */
const getChatPage = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;

  // Get user's conversations with use case and model info
  const [conversations] = await db.query(
    `SELECT 
      c.*,
      uc.name as usecase_name,
      uc.description as usecase_description,
      m.name as model_name,
      m.model_variant
     FROM ai_conversations c
     LEFT JOIN ai_use_cases uc ON c.usecase_id = uc.id
     LEFT JOIN ai_models m ON c.model_id = m.id
     WHERE c.user_id = ?
     ORDER BY c.updated_at DESC`,
    [userId]
  );

  // Get available use cases for this user
  const userRole = req.session.user.role_name || req.session.user.role;
  const [useCases] = await db.query(
    `SELECT id, name, description, base_knowledge, prompt, allowed_roles
     FROM ai_use_cases
     WHERE is_active = TRUE
     ORDER BY name`
  );

  // Filter use cases based on user's role
  const accessibleUseCases = useCases.filter((useCase) => {
    let allowedRoles = [];
    try {
      allowedRoles =
        typeof useCase.allowed_roles === "string"
          ? JSON.parse(useCase.allowed_roles)
          : useCase.allowed_roles || [];
    } catch {
      allowedRoles = [];
    }
    return allowedRoles.includes(userRole) || allowedRoles.length === 0;
  });

  // Get active AI models
  const [models] = await db.query(
    `SELECT id, name, model_variant
     FROM ai_models
     WHERE is_active = TRUE
     ORDER BY name`
  );

  res.render("pages/chat/index", {
    conversations,
    useCases: accessibleUseCases,
    models,
    user: req.session.user,
  });
});

/**
 * Create new conversation
 * Route: POST /chat/conversations
 */
const createConversation = asyncHandler(async (req, res) => {
  const { usecase_id, model_id, title } = req.body;
  const userId = req.session.user.id;

  if (!usecase_id || !model_id) {
    throw new ValidationError("Use case and model are required");
  }

  // Verify use case exists and is active
  const [useCase] = await db.query(
    "SELECT id FROM ai_use_cases WHERE id = ? AND is_active = TRUE",
    [usecase_id]
  );

  if (useCase.length === 0) {
    throw new ValidationError("Use case not found or inactive");
  }

  // Verify model exists and is active
  const [model] = await db.query(
    "SELECT id FROM ai_models WHERE id = ? AND is_active = TRUE",
    [model_id]
  );

  if (model.length === 0) {
    throw new ValidationError("AI model not found or inactive");
  }

  const conversationTitle = title || "New Conversation";

  const [result] = await db.query(
    `INSERT INTO ai_conversations (user_id, usecase_id, model_id, title, created_at, updated_at)
     VALUES (?, ?, ?, ?, NOW(), NOW())`,
    [userId, usecase_id, model_id, conversationTitle]
  );

  // Invalidate cache
  await invalidateCache(`chat:user:${userId}:*`, true);

  await logUserActivity(
    {
      activity: `Created new conversation: ${conversationTitle}`,
      actionType: ACTION_TYPES.CREATE,
      resourceType: RESOURCE_TYPES.SYSTEM,
      resourceId: result.insertId.toString(),
      userId: userId,
    },
    req
  );

  res.json({
    success: true,
    conversation_id: result.insertId,
    title: conversationTitle,
  });
});

/**
 * Get conversation with messages
 * Route: GET /chat/conversations/:id
 */
const getConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.session.user.id;

  const result = await handleCache({
    key: `chat:conversation:${id}:user:${userId}`,
    ttl: 60, // 1 minute
    dbQueryFn: async () => {
      // Get conversation
      const [conversations] = await db.query(
        `SELECT 
          c.*,
          uc.name as usecase_name,
          uc.base_knowledge,
          uc.prompt,
          m.name as model_name,
          m.api_url,
          m.model_variant,
          m.api_key
         FROM ai_conversations c
         LEFT JOIN ai_use_cases uc ON c.usecase_id = uc.id
         LEFT JOIN ai_models m ON c.model_id = m.id
         WHERE c.id = ? AND c.user_id = ?`,
        [id, userId]
      );

      if (conversations.length === 0) {
        return null;
      }

      // Get messages
      const [messages] = await db.query(
        `SELECT id, role, content, created_at
         FROM ai_messages
         WHERE conversation_id = ?
         ORDER BY created_at ASC`,
        [id]
      );

      return {
        conversation: conversations[0],
        messages,
      };
    },
  });

  if (!result.data) {
    return res.status(404).json({
      success: false,
      message: "Conversation not found",
    });
  }

  res.json({
    success: true,
    data: result.data,
    cache: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});

/**
 * Get user's conversations
 * Route: GET /chat/conversations
 */
const getUserConversations = asyncHandler(async (req, res) => {
  const userId = req.session.user.id;

  const result = await handleCache({
    key: `chat:user:${userId}:conversations`,
    ttl: 120, // 2 minutes
    dbQueryFn: async () => {
      const [conversations] = await db.query(
        `SELECT 
          c.id,
          c.title,
          c.created_at,
          c.updated_at,
          uc.name as usecase_name,
          m.name as model_name
         FROM ai_conversations c
         LEFT JOIN ai_use_cases uc ON c.usecase_id = uc.id
         LEFT JOIN ai_models m ON c.model_id = m.id
         WHERE c.user_id = ?
         ORDER BY c.updated_at DESC`,
        [userId]
      );

      return { conversations };
    },
  });

  res.json({
    success: true,
    data: result.data.conversations,
    cache: {
      source: result.source,
      duration_ms: result.duration_ms,
    },
  });
});

/**
 * Update conversation title
 * Route: POST /chat/conversations/:id/title
 */
const updateConversationTitle = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title } = req.body;
  const userId = req.session.user.id;

  if (!title) {
    throw new ValidationError("Title is required");
  }

  // Verify conversation belongs to user
  const [conversation] = await db.query(
    "SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?",
    [id, userId]
  );

  if (conversation.length === 0) {
    throw new ValidationError("Conversation not found");
  }

  await db.query(
    "UPDATE ai_conversations SET title = ?, updated_at = NOW() WHERE id = ?",
    [title, id]
  );

  // Invalidate cache
  await invalidateCache(`chat:conversation:${id}:*`, true);
  await invalidateCache(`chat:user:${userId}:*`, true);

  await logUserActivity(
    {
      activity: `Updated conversation title: ${title}`,
      actionType: ACTION_TYPES.UPDATE,
      resourceType: RESOURCE_TYPES.SYSTEM,
      resourceId: id,
      userId: userId,
    },
    req
  );

  res.json({
    success: true,
    message: "Title updated successfully",
  });
});

/**
 * Delete conversation
 * Route: POST /chat/conversations/:id/delete
 */
const deleteConversation = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.session.user.id;

  // Verify conversation belongs to user
  const [conversation] = await db.query(
    "SELECT title FROM ai_conversations WHERE id = ? AND user_id = ?",
    [id, userId]
  );

  if (conversation.length === 0) {
    throw new ValidationError("Conversation not found");
  }

  await db.query("DELETE FROM ai_conversations WHERE id = ?", [id]);

  // Invalidate cache
  await invalidateCache(`chat:conversation:${id}:*`, true);
  await invalidateCache(`chat:user:${userId}:*`, true);

  await logUserActivity(
    {
      activity: `Deleted conversation: ${conversation[0].title}`,
      actionType: ACTION_TYPES.DELETE,
      resourceType: RESOURCE_TYPES.SYSTEM,
      resourceId: id,
      userId: userId,
    },
    req
  );

  req.flash("success", "Conversation deleted successfully");
  res.redirect("/admin/chat");
});

/**
 * Search conversations
 * Route: GET /chat/conversations/search?q=query
 */
const searchConversations = asyncHandler(async (req, res) => {
  const { q } = req.query;
  const userId = req.session.user.id;

  if (!q) {
    return res.json({
      success: true,
      data: [],
    });
  }

  const searchTerm = `%${q}%`;

  const [conversations] = await db.query(
    `SELECT DISTINCT c.id, c.title, c.updated_at
     FROM ai_conversations c
     LEFT JOIN ai_messages m ON c.id = m.conversation_id
     WHERE c.user_id = ?
       AND (c.title LIKE ? OR m.content LIKE ?)
     ORDER BY c.updated_at DESC
     LIMIT 20`,
    [userId, searchTerm, searchTerm]
  );

  res.json({
    success: true,
    data: conversations,
  });
});

module.exports = {
  getChatPage,
  createConversation,
  getConversation,
  getUserConversations,
  updateConversationTitle,
  deleteConversation,
  searchConversations,
};
