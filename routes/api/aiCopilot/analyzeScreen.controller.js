/**
 * AI Copilot - Screen Analysis Controller
 * Analyzes screen content with optional user question
 */

const { db } = require("@db/db");
const { decrypt } = require("@helpers/encryption");
const { Langfuse } = require("langfuse");
const OpenAI = require("openai");
const aiAnalysisService = require("@services/aiAnalysisService");
const { getOpenAIClient } = require("@services/aiChatService");

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_HOST,
});

/**
 * Log screen analysis to database
 */
const logScreenAnalysis = async (
  userId,
  screenContext,
  userQuery,
  aiResponse,
  modelId,
  pageUrl
) => {
  try {
    await db.query(
      `
			INSERT INTO ai_copilot_logs 
			(user_id, screen_context, user_query, ai_response, model_id, page_url)
			VALUES (?, ?, ?, ?, ?, ?)
		`,
      [
        userId,
        screenContext,
        userQuery || null,
        aiResponse,
        modelId,
        pageUrl || null,
      ]
    );
  } catch (error) {
    console.error("[AI Copilot] Failed to log screen analysis:", error);
  }
};

/**
 * Analyze screen content with AI
 * POST /api/ai-copilot/analyze
 */
const analyzeScreen = async (req, res) => {
  req.setMaxListeners(15);

  const { screenContext, userQuery } = req.body;
  const pageUrl = req.get("Referer") || "unknown";

  try {
    if (!screenContext) {
      return res.status(400).json({ error: "Screen context is required" });
    }

    const now = new Date();
    const nowFormatted = now.toISOString().slice(0, 19).replace("T", " ");

    // Get model configuration from global settings
    const modelConfig = await aiAnalysisService.getAIModelConfig();
    const systemSettings = await aiAnalysisService.getSystemAnalysisSettings();

    // Get contexts
    const userContext = await aiAnalysisService.getUserContext(
      req.session.user.id
    );
    const companyContext = systemSettings.enable_company_stats
      ? await aiAnalysisService.getCompanyContext()
      : {};
    const activityContext = systemSettings.enable_activity_tracking
      ? await aiAnalysisService.getActivityContext(req.session.user.id)
      : {};

    // Generate prompts
    const systemPrompt = aiAnalysisService.generateSystemPrompt(
      userContext,
      companyContext,
      activityContext
    );
    const userMessage = aiAnalysisService.generateUserMessage(
      screenContext,
      userQuery,
      pageUrl
    );

    const aiMessages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ];

    // Setup SSE response
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    const abortController = new AbortController();
    let clientAborted = false;

    const isResponseWritable = () => !res.writableEnded && !res.destroyed;

    req.on("close", () => {
      clientAborted = true;
      abortController.abort();
    });

    // Send start event
    if (isResponseWritable()) {
      res.write(
        `data: ${JSON.stringify({
          type: "start",
          model: modelConfig.model_variant,
          timestamp: nowFormatted,
        })}\n\n`
      );
    }

    // Get OpenAI client with decrypted key
    const clientData = await getOpenAIClient();
    const openai = clientData.openai;

    // Langfuse tracing
    const trace = langfuse.trace({
      name: "OMNI-AI-Copilot",
      sessionId: `omni-copilot-${req.session.user.id}-${Date.now()}`,
      userId: req.session.user.id.toString(),
      tags: ["omni", "copilot", "screen-analysis", modelConfig.model_variant],
      metadata: {
        user: req.session.user.username,
        userId: req.session.user.id,
        userEmail: req.session.user.email,
        userRole: req.session.user.role,
        modelId: modelConfig.id,
        contextLength: screenContext.length,
        hasUserQuery: !!userQuery,
        url: pageUrl,
      },
    });

    const generation = trace.generation({
      name: "omni-copilot-analysis",
      model: modelConfig.model_variant,
      input: {
        messages: aiMessages,
        model: modelConfig.model_variant,
        max_tokens: systemSettings.max_tokens,
        temperature: systemSettings.temperature,
        stream: true,
      },
      metadata: {
        analysisType: "screen-content",
        contextLength: screenContext.length,
        userQuery: userQuery || null,
      },
    });

    let fullResponse = "";
    let tokenCount = 0;

    try {
      const stream = await openai.chat.completions.create({
        model: modelConfig.model_variant,
        messages: aiMessages,
        temperature: systemSettings.temperature,
        max_tokens: systemSettings.max_tokens,
        stream: true,
      });

      for await (const chunk of stream) {
        if (clientAborted || abortController.signal.aborted) {
          break;
        }

        const delta = chunk.choices[0]?.delta;

        if (delta?.content) {
          fullResponse += delta.content;

          if (isResponseWritable()) {
            res.write(
              `data: ${JSON.stringify({
                type: "content",
                content: delta.content,
              })}\n\n`
            );
          }
        }

        if (chunk.usage) {
          tokenCount = chunk.usage.total_tokens;
        }
      }

      if (clientAborted || abortController.signal.aborted) {
        generation.end({
          level: "WARNING",
          statusMessage: "Streaming aborted by client",
        });
        await langfuse.flushAsync().catch(() => {});
        return;
      }

      generation.end({
        output: {
          content: fullResponse,
          role: "assistant",
        },
        usage: {
          totalTokens: tokenCount,
          promptTokens: tokenCount - Math.ceil(fullResponse.length / 4),
          completionTokens: Math.ceil(fullResponse.length / 4),
        },
      });

      await langfuse.flushAsync().catch(() => {});

      console.log(
        `[AI COPILOT] User: ${req.session.user.id}, Model: ${modelConfig.name}, Tokens: ${tokenCount}, Response: ${fullResponse.length} chars`
      );

      // Log to database
      await logScreenAnalysis(
        req.session.user.id,
        screenContext,
        userQuery,
        fullResponse,
        modelConfig.id,
        pageUrl
      );

      if (isResponseWritable()) {
        res.write(
          `data: ${JSON.stringify({
            type: "done",
            token_usage: tokenCount,
            analysis_length: fullResponse.length,
            timestamp: nowFormatted,
          })}\n\n`
        );
      }
    } catch (streamError) {
      if (clientAborted || streamError.name === "AbortError") {
        generation.end({
          level: "WARNING",
          statusMessage: "Streaming aborted by client",
        });
        await langfuse.flushAsync().catch(() => {});
        return;
      }

      generation.end({
        level: "ERROR",
        statusMessage: streamError.message,
      });

      if (isResponseWritable()) {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            error: "AI analysis service error: " + streamError.message,
          })}\n\n`
        );
      }

      await langfuse.flushAsync().catch(() => {});
      throw streamError;
    }

    if (isResponseWritable()) {
      res.end();
    }
  } catch (err) {
    console.error("[AI Copilot] Failed to analyze screen:", err);

    if (!res.headersSent) {
      res.status(500).json({ error: "Error analyzing screen content" });
    } else {
      const isWritable = !res.writableEnded && !res.destroyed;
      if (isWritable) {
        res.write(
          `data: ${JSON.stringify({
            type: "error",
            error: "Internal server error during analysis",
          })}\n\n`
        );
        res.end();
      }
    }
  }
};

module.exports = { analyzeScreen };
