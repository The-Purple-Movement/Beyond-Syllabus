'use server';

/**
 * @fileOverview An AI agent that summarizes a syllabus into key learning objectives.
 *
 * - summarizeSyllabus - A function that handles the syllabus summarization process.
 * - SummarizeSyllabusInput - The input type for the summarizeSyllabus function.
 * - SummarizeSyllabusOutput - The return type for the summarizeSyllabus function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeSyllabusInputSchema = z.object({
  syllabusText: z
    .string()
    .describe('The text content of the syllabus to be summarized.'),
});
export type SummarizeSyllabusInput = z.infer<typeof SummarizeSyllabusInputSchema>;

const SummarizeSyllabusOutputSchema = z.object({
  summary: z.string().describe('A summary of the key learning objectives of the syllabus.'),
});
export type SummarizeSyllabusOutput = z.infer<typeof SummarizeSyllabusOutputSchema>;

export async function summarizeSyllabus(input: SummarizeSyllabusInput): Promise<SummarizeSyllabusOutput> {
  return summarizeSyllabusFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeSyllabusPrompt',
  input: {schema: SummarizeSyllabusInputSchema},
  output: {schema: SummarizeSyllabusOutputSchema},
  prompt: `You are an expert academic assistant. Your task is to summarize the key learning objectives of a given syllabus. Focus on extracting the core knowledge and skills that students are expected to gain.

Syllabus Text: {{{syllabusText}}}`,
});

const summarizeSyllabusFlow = ai.defineFlow(
  {
    name: 'summarizeSyllabusFlow',
    inputSchema: SummarizeSyllabusInputSchema,
    outputSchema: SummarizeSyllabusOutputSchema,
  },
  async input => {
    try {
      // Check if GOOGLE_GENAI_API_KEY is configured
      if (!process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_GENAI_API_KEY === 'test-key') {
        return {
          summary: "AI summarization is currently unavailable. Please configure a valid Google Generative AI API key to enable this feature. Visit https://makersuite.google.com/app/apikey to get your API key and set it as the GOOGLE_GENAI_API_KEY environment variable."
        };
      }

      const {output} = await prompt(input);
      if (!output) {
        return {
          summary: "Unable to generate summary at this time. Please try again later."
        };
      }
      return output;
    } catch (error: any) {
      console.error("Error in summarizeSyllabusFlow:", error);
      
      // Handle specific API key related errors
      if (error?.message?.includes('API key') || error?.message?.includes('401') || error?.message?.includes('authentication')) {
        return {
          summary: "AI summarization requires a valid Google Generative AI API key. Please configure the GOOGLE_GENAI_API_KEY environment variable with a valid API key from https://makersuite.google.com/app/apikey"
        };
      }
      
      // Handle rate limiting
      if (error?.message?.includes('429') || error?.message?.includes('quota')) {
        return {
          summary: "AI service is temporarily unavailable due to rate limiting. Please try again in a few minutes."
        };
      }
      
      // Generic error fallback
      return {
        summary: "Unable to generate AI summary at this time. Please check your internet connection and try again later."
      };
    }
  }
);
