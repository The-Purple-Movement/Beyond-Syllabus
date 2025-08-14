// src/ai/flows/generate-module-tasks.ts
'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

/**
 * @fileOverview An AI agent that generates learning tasks and real-world applications for a given module content.
 *
 * - generateModuleTasks - A function that handles the task and application generation process.
 * - GenerateModuleTasksInput - The input type for the generateModuleTasks function.
 * - GenerateModuleTasksOutput - The return type for the generateModuleTasks function.
 */

const GenerateModuleTasksInputSchema = z.object({
  moduleContent: z
    .string()
    .describe('The text content of the syllabus module to generate tasks and applications for.'),
  moduleTitle: z.string().describe('The title of the syllabus module.'),
});
export type GenerateModuleTasksInput = z.infer<typeof GenerateModuleTasksInputSchema>;

const GenerateModuleTasksOutputSchema = z.object({
  introductoryMessage: z.string().describe("A welcoming, introductory message that includes a brief overview of what the user can expect, including learning tasks and real-world applications."),
  suggestions: z.array(z.string()).describe("A list of 3-4 short, engaging follow-up questions a student might ask based on the module content."),
});
export type GenerateModuleTasksOutput = z.infer<typeof GenerateModuleTasksOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateModuleTasksPrompt',
  input: { schema: GenerateModuleTasksInputSchema },
  output: { schema: GenerateModuleTasksOutputSchema },
  prompt: `You are an expert curriculum assistant. Your task is to generate a welcoming, introductory message for a student about a specific syllabus module. This message should also include 2-4 distinct learning tasks and 2-3 real-world applications based on the provided content.

In addition, you must generate a list of 3-4 short, engaging follow-up questions that a student might ask after reading the introduction. These questions should be directly related to the key concepts in the module.

Syllabus Module Content:
"{{{moduleContent}}}"

Guidelines:
1.  Start the introductory message with a friendly greeting.
2.  In the message, create a section with 2 to 4 distinct learning tasks. Use markdown lists.
3.  In the message, create a section describing 2 to 3 real-world applications of the module's concepts. Use markdown lists.
4.  Combine all of this into a single, cohesive introductory message string.
5.  Generate a separate list of 3-4 short, distinct follow-up questions a user might have. These should be concise and designed to encourage exploration of the module's topics.

Example Output JSON:
{
  "introductoryMessage": "Hello! Welcome to the module on 'Sample Module Title'.\\n\\nHere are some learning tasks to get you started:\\n- Task 1\\n- Task 2\\n\\nHere are some real-world applications:\\n- Application 1\\n- Application 2",
  "suggestions": [
    "What is the core concept of 'Sample Topic'?",
    "How does 'Concept A' relate to 'Concept B'?",
    "Can you explain 'Key Term' in simple terms?",
    "What are the practical uses of 'Another Topic'?"
  ]
}
`,
});


const generateModuleTasksFlow = ai.defineFlow(
  {
    name: 'generateModuleTasks',
    inputSchema: GenerateModuleTasksInputSchema,
    outputSchema: GenerateModuleTasksOutputSchema,
  },
  async (input) => {
    try {
        // Check if GOOGLE_GENAI_API_KEY is configured
        if (!process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_GENAI_API_KEY === 'test-key') {
          return { 
              introductoryMessage: "AI-powered task generation is currently unavailable. Please configure a valid Google Generative AI API key to enable this feature.",
              suggestions: [
                  `What are the key topics in "${input.moduleTitle}"?`,
                  "Can you give me an overview?",
                  "What should I focus on studying?",
              ]
          };
        }

        const { output } = await prompt(input);
        if (!output) {
          throw new Error("AI did not return any output.");
        }
        return output;
    } catch (error: any) {
        console.error("Error generating tasks:", error);
        
        // Handle specific API key related errors
        if (error?.message?.includes('API key') || error?.message?.includes('401') || error?.message?.includes('authentication')) {
          return { 
              introductoryMessage: "AI task generation requires a valid Google Generative AI API key. Please configure the GOOGLE_GENAI_API_KEY environment variable.",
              suggestions: [
                  `What are the key topics in "${input.moduleTitle}"?`,
                  "How do I set up the API key?",
                  "What manual study methods can I use?",
              ]
          };
        }
        
        // Providing a fallback in case of parsing or generation failure
        return { 
            introductoryMessage: "Hello! I had a little trouble generating the introduction. Please paste the syllabus content again or ask me a question to get started!",
            suggestions: [
                `What are the key topics in "${input.moduleTitle}"?`,
                "Can you give me an overview?",
                "What are the real-world applications?",
            ]
        };
    }
  }
);


export async function generateModuleTasks(input: GenerateModuleTasksInput): Promise<GenerateModuleTasksOutput> {
    return generateModuleTasksFlow(input);
}
