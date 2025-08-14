// src/ai/flows/chat-with-syllabus.ts
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {MessageData} from 'genkit';

/**
 * @fileOverview An AI agent that can answer questions about a given syllabus context.
 *
 * - chatWithSyllabus - A function that handles the chat conversation.
 * - ChatWithSyllabusInput - The input type for the chatWithSyllabus function.
 * - ChatWithSyllabusOutput - The return type for the chatWithSyllabus function.
 */
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

// Define the schema for a single message in the chat history
const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string(),
});

// Define the input schema for the chat flow
const ChatWithSyllabusInputSchema = z.object({
  history: z.array(ChatMessageSchema).describe('The history of the conversation so far.'),
  message: z.string().describe('The latest message from the user.'),
});
export type ChatWithSyllabusInput = z.infer<typeof ChatWithSyllabusInputSchema>;

// Define the output schema for the chat flow
const ChatWithSyllabusOutputSchema = z.object({
  response: z.string().describe("The AI's response to the user's message."),
   suggestions: z.array(z.string()).optional().describe("A list of 3-4 short, engaging follow-up questions the user might ask next.")
});
export type ChatWithSyllabusOutput = z.infer<typeof ChatWithSyllabusOutputSchema>;

// The main function that will be called from the frontend
export async function chatWithSyllabus(input: ChatWithSyllabusInput): Promise<ChatWithSyllabusOutput> {
  return chatWithSyllabusFlow(input);
}


const prompt = ai.definePrompt(
  {
    name: 'chatTutorPrompt',
    input: { schema: ChatWithSyllabusInputSchema },
    output: { schema: ChatWithSyllabusOutputSchema },
    system: `You are a patient tutor. Follow this protocol strictly:
1) CALIBRATE: ask 2–3 questions to gauge level & goal.
2) PLAN: propose a short plan (3–5 steps).
3) TEACH: explain briefly, then ask a guiding question.
4) PRACTICE: generate 1 problem; wait for user answer; give hint if asked.
5) CHECK: verify; show reasoning; add 1 misconception tip.
6) REFLECT: ask the learner to restate the idea in their words.
Rules: prefer questions over answers; reveal steps gradually; keep outputs in the JSON schema.

You are an academic assistant dedicated solely to helping users study and understand the syllabus or module content, with a strict and unwavering adherence to the defined coursework scope. Your role is to provide precise explanations, clarifications, and answers exclusively based on topics that are explicitly part of the syllabus or module study material. You are allowed to explain or elaborate on terms and concepts only if they directly arise from your previous answers or are essential to fully understanding the syllabus content or its legitimate real-world applications. For instance, if your explanation includes data structures like “trees” and the user asks about related concepts such as “nodes” or “hierarchical structures,” you may answer because this stays within the educational context of the syllabus. Similarly, you can clarify syllabus-related algorithms or graph theory topics like “search,” “shortest path,” or “nodes” when these follow naturally in the discussion. However, under no circumstances should you provide explanations, definitions, or engage in discussions about any subject matter that is outside the defined syllabus or module content. This includes but is not limited to topics such as general trivia, unrelated technologies, music, brand full forms (e.g., "BMW"), history, cybersecurity not included in the syllabus, or any off-topic questions. If the user attempts to steer the conversation toward any unrelated topic, you must without exception refrain from answering or elaborating, and politely respond with a clear, consistent message such as: “That topic is beyond the scope of the current module/syllabus content. Please ask questions related to the study material.” Maintain a respectful and encouraging tone that keeps the user focused on studying, and firmly prevent any drift into non-academic or irrelevant areas. Additionally, carefully track the terminology and concepts you introduce during the conversation so that you can support natural and logical follow-up questions only if they remain strictly within the syllabus boundaries. This strict boundary ensures you serve as a dependable and focused academic companion, fully committed to syllabus-related learning, and that you never entertain or provide explanations on off-topic matters under any circumstances.

In addition to your response, you must ALWAYS provide a list of 3-4 short, engaging follow-up questions a user might ask next to continue the conversation.
`,
    prompt: `Based on the conversation history and the user's latest message, provide a response and a new set of suggestions.

Conversation History:
{{#each history}}
- {{role}}: {{{content}}}
{{/each}}

User's Message: "{{{message}}}"
`,
  },
);


// Define the Genkit flow for the chat functionality
const chatWithSyllabusFlow = ai.defineFlow(
  {
    name: 'chatWithSyllabusFlow',
    inputSchema: ChatWithSyllabusInputSchema,
    outputSchema: ChatWithSyllabusOutputSchema,
  },
  async (input) => {
    try {
      // Check if GOOGLE_GENAI_API_KEY is configured
      if (!process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_GENAI_API_KEY === 'test-key') {
        return { 
          response: "AI chat is currently unavailable. Please configure a valid Google Generative AI API key to enable this feature. Visit https://makersuite.google.com/app/apikey to get your API key and set it as the GOOGLE_GENAI_API_KEY environment variable.",
          suggestions: ["Configure API key", "Check documentation", "Try again later"]
        };
      }

      const { output } = await prompt(input);
      if (!output) {
        return { response: "I'm sorry, I couldn't generate a response. Please try again." };
      }
      return output;
    } catch(error: any) {
      console.error("Error in chat flow:", error);
      
      // Handle specific API key related errors
      if (error?.message?.includes('API key') || error?.message?.includes('401') || error?.message?.includes('authentication')) {
        return { 
          response: "AI chat requires a valid Google Generative AI API key. Please configure the GOOGLE_GENAI_API_KEY environment variable with a valid API key from https://makersuite.google.com/app/apikey",
          suggestions: ["Configure API key", "Check documentation", "Contact support"]
        };
      }
      
      // Handle rate limiting
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        return { 
          response: "AI service is temporarily unavailable due to rate limiting. Please try again in a few minutes.",
          suggestions: ["Try again later", "Check API quota", "Use manual study methods"]
        };
      }
      
      return { response: "I'm having trouble with that request. Could you try rephrasing it?" };
    }
  }
);
