"use server";

import { ai } from "@/ai/ai";
import {
  SummarizeSyllabusInput,
  SummarizeSyllabusOutput,
} from "@/lib/types";

/**
 * One tight, human overview of a course. No section skeletons, no
 * "Not specified" filler, no keyword blocklists (Phase 0 principle:
 * we do not guess at intent with word lists; the input here is always
 * syllabus text the app itself supplied).
 */
export async function summarizeSyllabus(
  input: SummarizeSyllabusInput
): Promise<SummarizeSyllabusOutput> {
  if (!input.syllabusText || input.syllabusText.trim().length < 10) {
    return {
      summary:
        "This subject's syllabus text is still empty on WikiSyllabus, so there is nothing to summarize yet.",
    };
  }

  try {
    const chatCompletion = await ai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: [
            "You summarize university course syllabi for the students taking them.",
            "Write at most 120 words total:",
            "1. Two or three plain sentences: what the course is about and why it matters in practice.",
            "2. Then exactly three short bullets starting with a verb: what the student will be able to do afterward.",
            "Rules: no headings, no bold section labels, no academic boilerplate.",
            "Never write 'not specified' or mention missing information; if something is absent from the syllabus, leave it out entirely.",
            "Ground every claim in the syllabus text you are given.",
          ].join("\n"),
        },
        {
          role: "user",
          content: input.syllabusText,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.3,
      max_completion_tokens: 300,
    });

    const summary = chatCompletion.choices?.[0]?.message?.content?.trim();
    if (!summary || summary.length < 40) {
      throw new Error("AI response too short or empty");
    }
    return { summary };
  } catch (error) {
    console.error("Error in syllabus summarization:", error);
    return {
      summary:
        "The overview could not be generated right now (the AI service may be busy). The full module list below is the source of truth; try again in a moment.",
    };
  }
}
