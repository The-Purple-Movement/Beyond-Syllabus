/**
 * WikiSyllabus – Standardized AI Interaction Format
 *
 * This file defines the standardized format for all AI interactions in WikiSyllabus
 * to ensure consistency, quality, and reusability across all AI-generated content.
 */

// ==================== Core Format Components ====================

// 1. Persona - Who should the AI act as?
export interface AIPersona {
  // The role the AI should assume
  role: string;
  // Specific expertise or background the AI should demonstrate
  expertise?: string[];
  // Communication style (formal, casual, mentor-like, etc.)
  tone?: "formal" | "casual" | "mentor" | "peer" | "professor" | "tutor";
  // Target audience level
  audienceLevel?: "beginner" | "intermediate" | "advanced" | "mixed";
}

// 2. Task - What is the AI supposed to do?
export interface AITask {
  // Primary action the AI should perform
  action: string;
  // Specific objectives or goals
  objectives?: string[];
  // Expected deliverables
  deliverables?: string[];
  // Success criteria
  successCriteria?: string[];
}

// 3. Format - How should the output be structured?

export interface AIFormat {
  // Output structure type
  structure:
    | "bulleted-list"
    | "numbered-list"
    | "step-by-step"
    | "table"
    | "markdown"
    | "paragraph"
    | "dialogue"
    | "json"
    | "custom";
  // Specific formatting requirements
  requirements?: string[];
  // Length constraints
  length?: {
    min?: number;
    max?: number;
    target?: number;
    unit: "words" | "characters" | "sentences" | "paragraphs";
  };
  // Special formatting needs
  specialFormatting?: {
    useCodeBlocks?: boolean;
    includeTables?: boolean;
    includeHeaders?: boolean;
    useEmphasis?: boolean;
  };
}

// 4. Context - What background should the AI consider?

export interface AIContext {
  // Academic context
  academic?: {
    course?: string;
    semester?: string;
    university?: string;
    syllabus?: string;
    module?: string;
  };
  // Subject-specific context
  subject?: {
    area: string;
    level: string;
    prerequisites?: string[];
    focus?: string;
  };
  // Student context
  student?: {
    priorKnowledge?: string;
    learningStyle?: string;
    difficulties?: string[];
    goals?: string[];
  };
  // Additional context
  additional?: {
    timeConstraints?: string;
    resources?: string[];
    constraints?: string[];
  };
}

// 5. References - Allow the AI to include references or citations
export interface AIReferences {
  // Preferred reference sources
  preferredSources?: string[];
  // Reference style
  citationStyle?: "APA" | "MLA" | "IEEE" | "Chicago" | "Harvard" | "simple";
  // Whether to include references
  includeReferences: boolean;
  // Specific references to consider
  specificSources?: {
    name: string;
    type:
      | "textbook"
      | "research-paper"
      | "documentation"
      | "course-material"
      | "online-resource";
    url?: string;
    author?: string;
  }[];
}

// ==================== Complete Format Structure ====================

// Complete standardized AI interaction format

export interface WikiSyllabusAIFormat {
  persona: AIPersona;
  task: AITask;
  format: AIFormat;
  context: AIContext;
  references: AIReferences;
  // Optional metadata
  metadata?: {
    version: string;
    createdAt: Date;
    lastModified: Date;
    tags?: string[];
  };
}

// ==================== Pre-defined Templates ====================

/**
 * Common persona templates for quick use
 */
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

// ==================== Utility Types ====================

/**
 * Input for creating a standardized AI prompt
 */
export interface CreateStandardizedPromptInput {
  format: WikiSyllabusAIFormat;
  userMessage: string;
  systemMessage?: string;
}

/**
 * Output from the prompt builder
 */
export interface StandardizedPromptOutput {
  systemPrompt: string;
  userPrompt: string;
  metadata: {
    formatVersion: string;
    components: (keyof WikiSyllabusAIFormat)[];
    timestamp: Date;
  };
}
