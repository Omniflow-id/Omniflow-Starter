const config = require("../../../config");
const { getKnowledgeContext } = require("../../../helpers/contextLoader");
const { openai, langfuse } = require("../../../services/aiService");

/**
 * Handle updated chat context request (Non-streaming)
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
const getChatContext = async (req, res) => {
  const { currentPageId, userRole, message } = req.body;

  if (!openai) {
    return res.status(503).json({
      error:
        "AI service logic is not fully configured (missing keys or dependencies).",
    });
  }

  try {
    // 1. Determine User Role (Securely from Session)
    const roleName = req.session.user?.role_name || userRole || "User";

    // 2. Resolve Context from Knowledge Base
    const contextContent = await getKnowledgeContext(
      roleName,
      currentPageId || "index",
      req.query.lang || "en"
    );

    // 3. User Info for Personalization
    const currentUser = req.session.user || {
      username: "Guest",
      full_name: "Guest User",
      email: "unknown",
    };

    const greeting = req.query.lang === "id" ? "Hai" : "Hi";

    const systemPrompt = `${greeting} ${currentUser.full_name}! 👋

You are Omni, a friendly and helpful AI assistant for Omniflow ERP. You're here to assist users with a warm, conversational approach.

USER INFORMATION:
- Name: ${currentUser.full_name}
- Username: ${currentUser.username}
- Role: ${roleName}
- Email: ${currentUser.email}

CURRENT PAGE CONTEXT:
- Page: '${currentPageId}'
- Language: '${req.query.lang || "en"}'

KNOWLEDGE BASE:
${contextContent ? contextContent : "No specific documentation available for this page."}

YOUR PERSONALITY:
- Friendly, warm, and conversational
- Address the user by name naturally (e.g., "Hai Eric!" or "Hi Eric!")
- Be helpful and patient
- Use appropriate language (${req.query.lang === "id" ? "Indonesian with natural, warm tone" : "English with friendly, casual tone"})
- Keep responses concise but friendly

When responding:
1. Greet or acknowledge the user by name at the start if it's a new conversation
2. Use knowledge base documentation to answer questions
3. Include relevant markdown links from the knowledge base when mentioning pages or features
4. If you don't know something, be honest and helpful
5. For technical topics, explain in simple terms
6. End with an open question to continue the conversation if appropriate
`;

    const modelName = config.llm.modelName || "gpt-4o-mini";

    // 2. Setup Langfuse Trace (if configured)
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

    // 3. Call OpenAI (or compatible)
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message || "Hello" },
      ],
      temperature: 0.7,
    });

    const reply = completion.choices[0].message.content;

    // 4. End Trace
    if (generation) {
      generation.end({
        output: reply,
      });
    }

    res.json({
      reply,
      contextFound: !!contextContent,
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

  if (!openai) {
    return res.status(503).json({
      error:
        "AI service logic is not fully configured (missing keys or dependencies).",
    });
  }

  try {
    // 1. Determine User Role (Securely from Session)
    const roleName = req.session.user?.role_name || userRole || "User";

    // 2. Resolve Context from Knowledge Base
    const contextContent = await getKnowledgeContext(
      roleName,
      currentPageId || "index",
      req.query.lang || "en"
    );

    // 3. User Info for Personalization
    const currentUser = req.session.user || {
      username: "Guest",
      full_name: "Guest User",
      email: "unknown",
    };

    const greeting = req.query.lang === "id" ? "Hai" : "Hi";
    const currentDate = new Date().toLocaleDateString(req.query.lang === "id" ? "id-ID" : "en-US", {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString(req.query.lang === "id" ? "id-ID" : "en-US");

    const systemPrompt = `${greeting} ${currentUser.full_name}! 👋

You are Omni, the intelligent AI assistant for the Omniflow ERP system. Your goal is to provide helpful, accurate, and context-aware assistance to users.

USER CONTEXT:
- Name: ${currentUser.full_name} (${currentUser.username})
- Role: ${roleName}
- Email: ${currentUser.email}

CURRENT CONTEXT:
- Active Page: '${currentPageId}'
- Language: '${req.query.lang || "en"}'
- Date: ${currentDate}
- Time: ${currentTime}

KNOWLEDGE DISPLAY:
${contextContent ? contextContent : "No specific documentation is currently available for this active page."}

YOUR PERSONALITY:
- Professional yet warm and conversational.
- Patient, helpful, and concise.
- Adaptive to the user's technical level (simplify for non-admins, strict for sensitive actions).

RESPONSE GUIDELINES:
1. **Language**: Respond STRICTLY in '${req.query.lang === "id" ? "Indonesian" : "English"}'.
2. **Context**: Use the provided "KNOWLEDGE DISPLAY" to answer questions about the current page.
3. **Markdown**: Use Markdown formatting (bold, lists, code blocks) to make your responses easy to read.
4. **Honesty**: If you don't know something or if the context doesn't cover it, admit it gracefully and offer general advice.
5. **Formatting**: 
   - Use bold for key terms or UI elements (e.g., **Settings**, **Save**).
   - Use lists for steps or multiple points.
   - Use code blocks for any technical identifiers, error codes, or snippets.
`;

    const modelName = config.llm.modelName || "gpt-4o-mini";

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
      `data: ${JSON.stringify({ type: "metadata", contextFound: !!contextContent })}\n\n`
    );

    // Call OpenAI with streaming
    const stream = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message || "Hello" },
      ],
      temperature: 0.7,
      stream: true,
    });

    let fullResponse = "";

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        fullResponse += content;
        // Send chunk to client
        res.write(`data: ${JSON.stringify({ type: "chunk", content })}\n\n`);
      }
    }

    // End Trace
    if (generation) {
      generation.end({
        output: fullResponse,
      });
    }

    // Send completion signal
    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch (error) {
    console.error(
      "[ChatController] Error processing streaming request:",
      error
    );
    // Send error event
    res.write(
      `data: ${JSON.stringify({ type: "error", message: error.message })}\n\n`
    );
    res.end();
  }
};

module.exports = {
  getChatContext,
  getChatContextStream,
};
