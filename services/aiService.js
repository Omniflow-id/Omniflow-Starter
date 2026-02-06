const config = require("../config");

let openai;
let langfuse;

try {
    const OpenAI = require("openai");
    const { Langfuse } = require("langfuse");

    if (config.llm.apiKey) {
        openai = new OpenAI({
            apiKey: config.llm.apiKey,
            baseURL: config.llm.apiUrl, // Optional: defaults to OpenAI if undefined
        });
    }

    if (process.env.LANGFUSE_PUBLIC_KEY && process.env.LANGFUSE_SECRET_KEY) {
        langfuse = new Langfuse({
            publicKey: process.env.LANGFUSE_PUBLIC_KEY,
            secretKey: process.env.LANGFUSE_SECRET_KEY,
            baseUrl: process.env.LANGFUSE_HOST || "https://cloud.langfuse.com",
        });
    }
} catch (error) {
    console.warn(
        "[AIService] OpenAI or Langfuse dependencies missing or failed to load. Please run: npm install openai langfuse"
    );
}

module.exports = {
    openai,
    langfuse,
};
