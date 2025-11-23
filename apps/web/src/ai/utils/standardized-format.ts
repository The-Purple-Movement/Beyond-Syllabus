import { WikiSyllabusAIFormat } from "@/lib/types";

export const PersonaTemplates = {
  PROFESSOR: {
    role: "Explain like a professor of Computer Science",
    expertise: [
      "Deep subject knowledge",
      "Academic communication",
      "Curriculum design",
    ],
    tone: "professor" as const,
    audienceLevel: "intermediate" as const,
  },
  MENTOR: {
    role: "Act as a mentor guiding a beginner",
    expertise: ["Patient guidance", "Step-by-step teaching", "Encouragement"],
    tone: "mentor" as const,
    audienceLevel: "beginner" as const,
  },
  PEER: {
    role: "Be a peer student simplifying the content",
    expertise: ["Relatable explanations", "Peer-level communication"],
    tone: "peer" as const,
    audienceLevel: "intermediate" as const,
  },
  TUTOR: {
    role: "Act as an experienced tutor",
    expertise: [
      "Clear explanations",
      "Practice problems",
      "Concept reinforcement",
    ],
    tone: "tutor" as const,
    audienceLevel: "mixed" as const,
  },
} as const;

/**
 * Common task templates
 */
export const TaskTemplates = {
  SUMMARIZE: {
    action: "Summarize this module in simple terms",
    objectives: [
      "Extract key concepts",
      "Identify main learning goals",
      "Highlight important points",
    ],
    deliverables: ["Clear summary", "Key takeaways", "Learning objectives"],
  },
  GENERATE_QUESTIONS: {
    action: "Generate beyond syllabus questions",
    objectives: [
      "Create challenging questions",
      "Test deep understanding",
      "Encourage critical thinking",
    ],
    deliverables: ["Question set", "Answer guidelines", "Difficulty levels"],
  },
  COMPARE: {
    action: "Compare different curricula or concepts",
    objectives: [
      "Identify similarities",
      "Highlight differences",
      "Analyze strengths and weaknesses",
    ],
    deliverables: ["Comparison analysis", "Summary table", "Recommendations"],
  },
  EXPLAIN: {
    action: "Explain complex concepts clearly",
    objectives: [
      "Break down complexity",
      "Provide examples",
      "Ensure understanding",
    ],
    deliverables: ["Step-by-step explanation", "Examples", "Practice problems"],
  },
} as const;

/**
 * Common format templates
 */
export const FormatTemplates = {
  BULLETED_LIST: {
    structure: "bulleted-list" as const,
    requirements: [
      "Use clear bullet points",
      "Organize by importance",
      "Keep items concise",
    ],
    specialFormatting: { includeHeaders: true },
  },
  STEP_BY_STEP: {
    structure: "step-by-step" as const,
    requirements: [
      "Number each step clearly",
      "Provide detailed instructions",
      "Include examples",
    ],
    specialFormatting: { includeHeaders: true, useCodeBlocks: true },
  },
  TABLE_FORMAT: {
    structure: "table" as const,
    requirements: [
      "Clear column headers",
      "Consistent row formatting",
      "Easy to read",
    ],
    specialFormatting: { includeTables: true, includeHeaders: true },
  },
  MARKDOWN_COMPREHENSIVE: {
    structure: "markdown" as const,
    requirements: [
      "Use proper markdown syntax",
      "Include code blocks where needed",
      "Clear section headers",
    ],
    specialFormatting: {
      useCodeBlocks: true,
      includeTables: true,
      includeHeaders: true,
      useEmphasis: true,
    },
  },
} as const;
