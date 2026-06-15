// Server-only Groq provider (Vercel AI SDK). The API key is read from the
// GROQ_API_KEY environment variable and is NEVER sent to the client.
import { createGroq } from "@ai-sdk/groq";

// createGroq() loads GROQ_API_KEY from the environment by default.
export const groq = createGroq();

/** Whether a Groq API key is configured (server-side check for admin UI/status). */
export function isGroqConfigured(): boolean {
  return Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY.length > 0);
}
