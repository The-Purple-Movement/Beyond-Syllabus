import Groq from "groq-sdk";

// Lazy singleton: fail with a clear message the first time AI is actually
// used without a key, instead of silently sending a garbage placeholder key.
let client: Groq | null = null;

function getClient(): Groq {
  if (!client) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GROQ_API_KEY is not set. Add it to your environment (see .env.example). AI features cannot run without it."
      );
    }
    client = new Groq({ apiKey });
  }
  return client;
}

export const ai = {
  get chat() {
    return getClient().chat;
  },
};
