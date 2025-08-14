// src/ai/flows/suggest-resources.ts
'use server';

/**
 * @fileOverview A flow that suggests relevant online resources for a given syllabus section.
 *
 * - suggestResources - A function that suggests relevant online resources.
 * - SuggestResourcesInput - The input type for the suggestResources function.
 * - SuggestResourcesOutput - The return type for the suggestResources function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestResourcesInputSchema = z.object({
  syllabusSection: z.string().describe('The syllabus section to find resources for.'),
});
export type SuggestResourcesInput = z.infer<typeof SuggestResourcesInputSchema>;

const SuggestResourcesOutputSchema = z.object({
  resources: z.array(
    z.object({
      title: z.string().describe('The title of the resource.'),
      url: z.string().url().describe('The URL of the resource.'),
      description: z.string().describe('A brief description of the resource and its relevance to the syllabus section.'),
    })
  ).describe('A list of 3 to 5 relevant online resources.'),
});
export type SuggestResourcesOutput = z.infer<typeof SuggestResourcesOutputSchema>;

export async function suggestResources(input: SuggestResourcesInput): Promise<SuggestResourcesOutput> {
  return suggestResourcesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestResourcesPrompt',
  input: {schema: SuggestResourcesInputSchema},
  output: {schema: SuggestResourcesOutputSchema},
  prompt: `
    You are an expert curriculum assistant. Your goal is to find 3-5 high-quality online resources for a university student studying the following syllabus section.

    Syllabus Section:
    "{{{syllabusSection}}}"

    Guidelines:
    1.  Provide a mix of resource types (e.g., video, article, tutorial).
    2.  Prioritize reputable sources like university websites, established educational platforms, and well-known technical blogs.
    3.  Ensure all URLs are valid and directly accessible.
    4.  The description should clearly explain the resource's relevance.
    5.  You MUST return the data in the specified JSON format.
  `,
});

const suggestResourcesFlow = ai.defineFlow(
  {
    name: 'suggestResourcesFlow',
    inputSchema: SuggestResourcesInputSchema,
    outputSchema: SuggestResourcesOutputSchema,
  },
  async input => {
    try {
      // Check if GOOGLE_GENAI_API_KEY is configured
      if (!process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_GENAI_API_KEY === 'test-key') {
        return { resources: [] };
      }

      const {output} = await prompt(input);
      if (!output || !output.resources || output.resources.length === 0) {
        // If the model returns no output, return an empty list of resources.
        return { resources: [] };
      }
      return output;
    } catch (error: any) {
      console.error('Error in suggestResourcesFlow:', error);
      
      // Handle specific API key related errors
      if (error?.message?.includes('API key') || error?.message?.includes('401') || error?.message?.includes('authentication')) {
        return { resources: [] };
      }
      
      // In case of an error, return an empty list of resources to prevent crashing.
      return { resources: [] };
    }
  }
);
