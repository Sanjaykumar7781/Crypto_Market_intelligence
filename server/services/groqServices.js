import Groq from "groq-sdk";
import { env } from "../config/env.js";

const groq = new Groq({
  apiKey: env.groqApiKey,
});

export async function askGroq(messages, options = {}) {
  const { maxRetries = 2, timeoutMs = 30000 } = options;

  if (!env.groqApiKey) {
    throw new Error('Missing GROQ_API_KEY in server environment.');
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('Messages must be a non-empty array.');
  }

  // Validate message structure
  const validMessages = messages.every(msg =>
    msg && typeof msg === 'object' && msg.role && msg.content &&
    ['system', 'user', 'assistant'].includes(msg.role)
  );

  if (!validMessages) {
    throw new Error('Invalid message format.');
  }

  // Limit messages to prevent abuse
  if (messages.length > 100) {
    throw new Error('Too many messages in conversation history.');
  }

  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const completion = await groq.chat.completions.create({
          model: env.groqModel,
          messages: messages.map(msg => ({
            role: msg.role,
            content: String(msg.content).substring(0, 4000), // Limit content size
          })),
          temperature: 0.7,
          max_tokens: 1024,
        });

        clearTimeout(timeoutId);

        const response = completion.choices[0]?.message?.content;
        if (!response) {
          throw new Error('Empty response from AI service');
        }

        return response;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error;

      if (error.status === 429) {
        // Rate limited - wait longer
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 3000 * (attempt + 1)));
        }
      } else if (error.status === 401 || error.status === 403) {
        // Auth error - don't retry
        throw new Error('AI service authentication failed');
      } else if (attempt < maxRetries) {
        // Other errors - retry with backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }
  }

  throw new Error(`AI service failed after ${maxRetries + 1} attempts: ${lastError?.message || 'Unknown error'}`);
}
