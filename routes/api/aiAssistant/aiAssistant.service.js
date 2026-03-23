const {
  langfuse,
  getOpenAIClient,
} = require("../../../services/aiChatService");
const aiAnalysisService = require("../../../services/aiAnalysisService");
const { db } = require("../../../db/db");
const {
  getKnowledgeContext,
  normalizeLang,
} = require("../../../helpers/contextLoader");

const ASSISTANT_BUNDLES = {
  id: {
    greeting: "Hai",
    languageName: "Bahasa Indonesia",
    respondInstruction:
      "Gunakan Bahasa Indonesia yang natural, hangat, dan profesional.",
    pageLabel: "Halaman",
    languageLabel: "Bahasa",
    knowledgeLabel: "Basis Pengetahuan",
    noKnowledge: "Tidak ada dokumentasi spesifik untuk halaman ini.",
    userInfoTitle: "INFORMASI PENGGUNA",
    pageContextTitle: "KONTEKS HALAMAN",
    knowledgeTitle: "BASIS PENGETAHUAN",
    personalityTitle: "KEPRIBADIAN",
    responseTitle: "PETUNJUK RESPON",
    greetInstruction:
      "Sapa pengguna dengan nama secara natural pada awal percakapan baru.",
    openQuestion: "Akhiri jawaban dengan pertanyaan terbuka bila relevan.",
    pageUnknown: "Halaman tidak diketahui",
  },
  en: {
    greeting: "Hi",
    languageName: "English",
    respondInstruction:
      "Use natural, warm, and professional English.",
    pageLabel: "Page",
    languageLabel: "Language",
    knowledgeLabel: "Knowledge Base",
    noKnowledge: "No specific documentation is available for this page.",
    userInfoTitle: "USER INFORMATION",
    pageContextTitle: "PAGE CONTEXT",
    knowledgeTitle: "KNOWLEDGE BASE",
    personalityTitle: "PERSONALITY",
    responseTitle: "RESPONSE GUIDELINES",
    greetInstruction:
      "Greet the user by name naturally at the start of a new conversation.",
    openQuestion: "End with an open question when appropriate.",
    pageUnknown: "Unknown page",
  },
  zh: {
    greeting: "你好",
    languageName: "中文",
    respondInstruction: "请使用自然、友好且专业的中文回答。",
    pageLabel: "页面",
    languageLabel: "语言",
    knowledgeLabel: "知识库",
    noKnowledge: "此页面没有可用的特定文档。",
    userInfoTitle: "用户信息",
    pageContextTitle: "页面上下文",
    knowledgeTitle: "知识库",
    personalityTitle: "个性",
    responseTitle: "回复指引",
    greetInstruction: "在新对话开始时自然地用用户姓名打招呼。",
    openQuestion: "在合适时用开放式问题结束回答。",
    pageUnknown: "未知页面",
  },
};

function getAssistantBundle(lang) {
  return ASSISTANT_BUNDLES[normalizeLang(lang)] || ASSISTANT_BUNDLES.en;
}

function resolveAssistantLang(req) {
  return normalizeLang(
    req.query?.lang ||
      req.body?.lang ||
      req.headers?.["accept-language"] ||
      req.cookies?.omniflow_lang ||
      "en"
  );
}

function buildAssistantPrompt({
  bundle,
  currentUser,
  roleName,
  currentPageId,
  lang,
  contextContent,
}) {
  const dateLocale =
    lang === "id" ? "id-ID" : lang === "zh" ? "zh-CN" : "en-US";
  const currentDate = new Date().toLocaleDateString(dateLocale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const currentTime = new Date().toLocaleTimeString(dateLocale, {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${bundle.greeting} ${currentUser.full_name}! 👋

You are Omni, a context-aware AI assistant for the Omniflow ERP system.

${bundle.respondInstruction}

${bundle.userInfoTitle}
- Name: ${currentUser.full_name}
- Username: ${currentUser.username}
- Role: ${roleName}
- Email: ${currentUser.email}

${bundle.pageContextTitle}
- ${bundle.pageLabel}: ${currentPageId || "index"}
- ${bundle.languageLabel}: ${bundle.languageName}
- Date: ${currentDate}
- Time: ${currentTime}

${bundle.knowledgeTitle}
${contextContent || bundle.noKnowledge}

${bundle.personalityTitle}
- Friendly and helpful
- Patient and concise
- Adapt answers to the user context and current page

${bundle.responseTitle}
1. ${bundle.greetInstruction}
2. Use the knowledge base to answer page-related questions
3. Use markdown links when mentioning pages or features
4. Be honest if something is not covered in the knowledge base
5. Explain technical topics in simple terms
6. ${bundle.openQuestion}`;
}

/**
 * Log AI Assistant interaction to database
 * @param {Object} params
 */
const logAssistantInteraction = async ({
  userId,
  pageId,
  userMessage,
  aiResponse,
  modelId,
  tokenUsage,
  sessionId,
}) => {
  try {
    await db.query(
      `INSERT INTO ai_assistant_logs 
			(user_id, page_id, user_message, ai_response, model_id, token_usage, session_id) 
			VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, pageId, userMessage, aiResponse, modelId, tokenUsage, sessionId]
    );
  } catch (error) {
    console.error("[AI Assistant] Failed to log interaction:", error);
  }
};

/**
 * Handle updated chat context request (Non-streaming)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getChatContext = async (req, res) => {
  const { currentPageId, userRole, message } = req.body;
  const currentLang = resolveAssistantLang(req);

  try {
    // 1. Get AI Model Config and OpenAI Client from AI Analysis Settings
    let modelConfig;
    let openai;
    try {
      const clientData = await getOpenAIClient();
      openai = clientData.openai;
      modelConfig = clientData.modelConfig;
    } catch (_error) {
      return res.status(503).json({
        error: "No AI model available. Please configure AI Analysis Settings.",
      });
    }

    // Get completion config for temperature and max_tokens
    const completionConfig = await aiAnalysisService.getAICompletionConfig();

    // 2. Determine User Role (Securely from Session)
    const roleName = req.session.user?.role_name || userRole || "User";

    // 3. Resolve Context from Knowledge Base
    const contextContent = await getKnowledgeContext(
      roleName,
      currentPageId || "index",
      currentLang
    );

    // 4. User Info for Personalization
    const currentUser = req.session.user || {
      username: "Guest",
      full_name: "Guest User",
      email: "unknown",
    };

    const bundle = getAssistantBundle(currentLang);
    const systemPrompt = buildAssistantPrompt({
      bundle,
      currentUser,
      roleName,
      currentPageId: currentPageId || "index",
      lang: currentLang,
      contextContent,
    });

    const modelName = modelConfig.model_variant;

    // 5. Setup Langfuse Trace (if configured)
    let trace;
    let generation;

    if (langfuse) {
      trace = langfuse.trace({
        name: "chat-context-aware",
        sessionId: req.sessionID || "unknown-session",
        userId: req.user ? req.user.id : "anonymous",
        metadata: {
          currentPageId,
          userRole,
          model: modelName,
          language: currentLang,
          source: "ai_analysis_settings",
        },
      });

      generation = trace.generation({
        name: "llm-completion",
        model: modelName,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      });
    }

    // 6. Call OpenAI (or compatible)
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message || "Hello" },
      ],
      temperature: completionConfig.temperature,
      max_tokens: completionConfig.max_tokens,
    });

    const reply = completion.choices[0].message.content;
    const tokenUsage = completion.usage?.total_tokens || 0;

    // 7. Log to database (fire and forget)
    logAssistantInteraction({
      userId: req.session.user?.id,
      pageId: currentPageId,
      userMessage: message,
      aiResponse: reply,
      modelId: modelConfig.id,
      tokenUsage: tokenUsage,
      sessionId: req.sessionID,
    });

    // 8. End Trace
    if (generation) {
      generation.end({
        output: reply,
      });
    }

    res.json({
      reply,
      contextFound: !!contextContent,
      model: modelName,
      source: "ai_analysis_settings",
    });
  } catch (error) {
    console.error("[ChatController] Error processing request:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Handle streaming chat context request with SSE
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getChatContextStream = async (req, res) => {
  const { currentPageId, userRole, message } = req.body;
  const currentLang = resolveAssistantLang(req);

  try {
    // 1. Get AI Model Config and OpenAI Client from AI Analysis Settings
    let modelConfig;
    let openai;
    try {
      const clientData = await getOpenAIClient();
      openai = clientData.openai;
      modelConfig = clientData.modelConfig;
    } catch (_error) {
      return res.status(503).json({
        error: "No AI model available. Please configure AI Analysis Settings.",
      });
    }

    // Get completion config for temperature and max_tokens
    const completionConfig = await aiAnalysisService.getAICompletionConfig();

    // 2. Determine User Role (Securely from Session)
    const roleName = req.session.user?.role_name || userRole || "User";

    // 3. Resolve Context from Knowledge Base
    const contextContent = await getKnowledgeContext(
      roleName,
      currentPageId || "index",
      currentLang
    );

    // 4. User Info for Personalization
    const currentUser = req.session.user || {
      username: "Guest",
      full_name: "Guest User",
      email: "unknown",
    };

    const bundle = getAssistantBundle(currentLang);
    const systemPrompt = buildAssistantPrompt({
      bundle,
      currentUser,
      roleName,
      currentPageId: currentPageId || "index",
      lang: currentLang,
      contextContent,
    });

    const modelName = modelConfig.model_variant;

    // Setup SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // Disable nginx buffering

    // Setup Langfuse Trace (if configured)
    let trace;
    let generation;

    if (langfuse) {
      trace = langfuse.trace({
        name: "chat-context-aware-stream",
        sessionId: req.sessionID || "unknown-session",
        userId: req.user ? req.user.id : "anonymous",
        metadata: {
          currentPageId,
          userRole,
          model: modelName,
          language: currentLang,
          source: "ai_analysis_settings",
        },
      });

      generation = trace.generation({
        name: "llm-completion-stream",
        model: modelName,
        input: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      });
    }

    // Send initial metadata
    res.write(
      `data: ${JSON.stringify({ type: "metadata", contextFound: !!contextContent, model: modelName })}

`
    );

    // Call OpenAI with streaming
    const stream = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message || "Hello" },
      ],
      temperature: completionConfig.temperature,
      max_tokens: completionConfig.max_tokens,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        // Send chunk to client
        res.write(`data: ${JSON.stringify({ type: "chunk", content })}

`);
      }
    }

    // End Trace
    if (generation) {
      generation.end({
        output: fullResponse,
      });
    }

    // Log to database (fire and forget)
    logAssistantInteraction({
      userId: req.session.user?.id,
      pageId: currentPageId,
      userMessage: message,
      aiResponse: fullResponse,
      modelId: modelConfig.id,
      tokenUsage: null, // Streaming doesn't provide token count easily
      sessionId: req.sessionID,
    });

    // Send completion signal
    res.write(`data: ${JSON.stringify({ type: "done" })}

`);
    res.end();
  } catch (error) {
    console.error(
      "[ChatController] Error processing streaming request:",
      error
    );
    // Send error event
    res.write(
      `data: ${JSON.stringify({ type: "error", message: error.message })}

`
    );
    res.end();
  }
};

module.exports = {
  getChatContext,
  getChatContextStream,
};
