/**
 * Langfuse Integration Helper
 * Provides structured tracing and observability for AI interactions
 */

let langfuse = null;
let langfuseEnabled = false;

/**
 * Initialize Langfuse client
 * @returns {Object} Langfuse client or null if not configured
 */
function getLangfuseClient() {
  if (langfuse) {
    return langfuse;
  }

  // Check if Langfuse is configured
  const secretKey = process.env.LANGFUSE_SECRET_KEY;
  const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
  const baseUrl = process.env.LANGFUSE_HOST;

  if (!secretKey || !publicKey || !baseUrl) {
    console.log("[Langfuse] Not configured - skipping initialization");
    return null;
  }

  try {
    const { Langfuse } = require("langfuse");
    langfuse = new Langfuse({
      secretKey,
      publicKey,
      baseUrl,
    });
    langfuseEnabled = true;
    console.log("[Langfuse] Client initialized successfully");
    return langfuse;
  } catch (error) {
    console.warn("[Langfuse] Failed to initialize:", error.message);
    return null;
  }
}

/**
 * Create a trace for AI interactions
 * @param {Object} options - Trace options
 * @returns {Object} Trace object with generation span
 */
async function createTrace(options) {
  const client = getLangfuseClient();
  if (!client) {
    return null;
  }

  const { name = "AI-Chat", sessionId, userId, input, metadata = {} } = options;

  try {
    const trace = client.trace({
      name,
      sessionId,
      userId: userId?.toString(),
      input: input || undefined,
      metadata: {
        source: "omniflow-starter",
        version: "1.0.0",
        ...metadata,
      },
    });

    return trace;
  } catch (error) {
    console.warn("[Langfuse] Failed to create trace:", error.message);
    return null;
  }
}

/**
 * Create a generation span for AI model calls
 * @param {Object} trace - Langfuse trace object
 * @param {Object} options - Generation options
 * @returns {Object} Generation span object
 */
function createGeneration(trace, options) {
  if (!trace) {
    return null;
  }

  const { name = "ai-generation", model, input, metadata = {} } = options;

  try {
    const generation = trace.generation({
      name,
      model,
      input,
      metadata: {
        ...metadata,
      },
    });

    return generation;
  } catch (error) {
    console.warn("[Langfuse] Failed to create generation:", error.message);
    return null;
  }
}

/**
 * End a generation span with output and usage
 * @param {Object} generation - Generation span object
 * @param {Object} options - End options
 */
function endGeneration(generation, options = {}) {
  if (!generation) {
    return;
  }

  const { output, usage, statusMessage, level } = options;

  try {
    generation.end({
      output,
      usage,
      statusMessage,
      level,
    });
  } catch (error) {
    console.warn("[Langfuse] Failed to end generation:", error.message);
  }
}

/**
 * End a trace
 * @param {Object} trace - Langfuse trace object
 */
async function endTrace(trace) {
  if (!trace) {
    return;
  }

  try {
    await trace.flush();
  } catch (error) {
    console.warn("[Langfuse] Failed to end trace:", error.message);
  }
}

/**
 * Flush all pending Langfuse events
 */
async function flushLangfuse() {
  if (!langfuseEnabled || !langfuse) {
    return;
  }

  try {
    await langfuse.flushAsync();
  } catch (error) {
    console.warn("[Langfuse] Failed to flush:", error.message);
  }
}

/**
 * Check if Langfuse is enabled
 * @returns {boolean}
 */
function isEnabled() {
  return langfuseEnabled;
}

module.exports = {
  getLangfuseClient,
  createTrace,
  createGeneration,
  endGeneration,
  endTrace,
  flushLangfuse,
  isEnabled,
};
