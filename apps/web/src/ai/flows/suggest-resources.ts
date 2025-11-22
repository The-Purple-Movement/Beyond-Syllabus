"use server";

import { ai } from "@/ai/ai";
import { SuggestResourcesInput, SuggestResourcesOutput } from "@/lib/types";

// ---------------------- Flow Logic ----------------------
const suggestResourcesFlow = async (
  input: SuggestResourcesInput
): Promise<SuggestResourcesOutput> => {
  const promptText = `
You are an expert curriculum assistant. Your goal is to find 3-5 high-quality online resources for a university student studying the following syllabus section.

Syllabus Section:
"${input.syllabusSection}"

Guidelines:
1. Provide a mix of resource types (e.g. article, tutorial).
2. Prioritize reputable sources like university websites, established educational platforms, and well-known technical blogs.
3. Ensure all URLs are valid and directly accessible.
4. Make sure the URLs are not behind paywalls.
5. Make sure the resources are up-to-date and relevant to the syllabus section.
6. Avoid duplicating resources.
7. The description should clearly explain the resource's relevance.
8. You MUST return the data in the following JSON format:

{
  "resources": [
    {
      "title": "Resource Title",
      "url": "https://...",
      "description": "Why this resource is useful for the syllabus section"
    }
  ]
}
`;

  try {
    const completion = await ai.chat.completions.create({
      messages: [{ role: "user", content: promptText }],
      model: input.model || "openai/gpt-oss-20b",
      temperature: 0.5,
      max_completion_tokens: 2048,
      top_p: 0.95,
    });

    const outputText = completion.choices?.[0]?.message?.content || "";

    // Safely parse JSON output
    try {
      const output = JSON.parse(outputText);

      if (!output || !output.resources || !Array.isArray(output.resources)) {
        return { resources: [] };
      }

      return output as SuggestResourcesOutput;
    } catch (parseError) {
      console.error("Failed to parse AI output as JSON:", parseError);
      return { resources: [] };
    }
  } catch (error) {
    console.error("Error in suggestResourcesFlow:", error);
    return { resources: [] };
  }
};

// Main function for frontend
export async function suggestResources(
  input: SuggestResourcesInput
): Promise<SuggestResourcesOutput> {
  return suggestResourcesFlow(input);
}
